# Phase 0 — Environment & Project Infrastructure

## Context

Before any feature work begins, the project folder must be fully self-contained and set up so that any agent can start a fresh session, read `CLAUDE.md`, and immediately begin productive work. This phase uses system-installed Python and Node only to bootstrap — after setup, everything runs from local `venv/` and `node_modules/`.

---

## Steps

### 0.1 — Git & Gitignore

1. `git init`
2. Create `.gitignore`:
   ```
   # Python
   venv/
   __pycache__/
   *.pyc

   # Node
   frontend/node_modules/

   # Database
   *.db

   # Generated assets
   backend/assets/audio/
   backend/assets/images/

   # Environment
   .env

   # OS
   .DS_Store
   Thumbs.db

   # Beads local cache
   .beads/.cache/
   ```

### 0.2 — Python Backend Environment

1. Create venv: `python -m venv venv`
2. Create `requirements.txt`:
   ```
   fastapi>=0.115
   uvicorn[standard]>=0.34
   aiosqlite>=0.20
   pypinyin>=0.53
   jieba>=0.42
   httpx>=0.28
   google-genai>=1.0
   python-dotenv>=1.0
   pydantic>=2.10
   ```
3. Install: `venv\Scripts\pip install -r requirements.txt`
4. Create `backend/__init__.py` (empty) and directory structure:
   ```
   backend/
   ├── __init__.py
   ├── main.py
   ├── config.py
   ├── database.py
   ├── routers/
   │   └── __init__.py
   ├── providers/
   │   └── __init__.py
   ├── services/
   │   └── __init__.py
   ├── chinese/
   │   └── __init__.py
   ├── models/
   │   └── __init__.py
   └── assets/
       ├── audio/
       └── images/
   ```
5. Create minimal `backend/main.py`:
   ```python
   from fastapi import FastAPI
   from fastapi.middleware.cors import CORSMiddleware

   app = FastAPI(title="Trilingo")

   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],
       allow_methods=["*"],
       allow_headers=["*"],
   )

   @app.get("/api/health")
   async def health():
       return {"status": "ok"}
   ```
6. Verify: `venv\Scripts\uvicorn backend.main:app --reload` → `GET /api/health` returns `{"status": "ok"}`

### 0.3 — Frontend Environment

1. Scaffold from project root: `npm create vite@latest frontend -- --template react-ts`
2. Install deps: `cd frontend && npm install`
3. Configure `frontend/vite.config.ts` with API proxy to backend:
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     server: {
       proxy: {
         '/api': 'http://localhost:8000'
       }
     }
   })
   ```
4. Replace the default Vite boilerplate in `App.tsx` with a minimal placeholder that confirms the app loads.
5. Verify: `npm run dev` → browser shows the placeholder page, and fetching `/api/health` through the proxy succeeds.

### 0.4 — Environment Variables

1. Create `.env.example`:
   ```
   # Required: Gemini API key for chatbot
   GEMINI_API_KEY=your-api-key-here

   # Provider selection (per feature)
   CHAT_PROVIDER=gemini

   # Future providers (uncomment when needed)
   # TTS_PROVIDER=google
   # IMAGE_PROVIDER=gemini
   # OPENAI_API_KEY=your-key-here
   ```
2. User copies to `.env` and fills in real keys (not automated — requires user action).

### 0.5 — Install & Initialize Beads

1. Install beads CLI (check https://github.com/steveyegge/beads for current install method)
2. Initialize in project root: `bd init`
3. Verify: `bd list` runs without error

### 0.6 — Seed the Beads Backlog

Create issues with dependencies so agents can see what's ready to work on. The structure:

**Phase 1 — Chatbot** (all block on Phase 0 completion):
- `P1-pinyin`: Implement pinyin annotation utility (`backend/chinese/pinyin.py`)
- `P1-providers`: Implement provider abstraction layer (`backend/providers/`)
- `P1-gemini`: Implement Gemini chat provider (`backend/providers/gemini.py`) — blocked by `P1-providers`
- `P1-db`: Set up SQLite schema and connection for chat tables (`backend/database.py`)
- `P1-chat-service`: Implement chat service (`backend/services/chat_service.py`) — blocked by `P1-pinyin`, `P1-gemini`, `P1-db`
- `P1-chat-router`: Implement chat API endpoints (`backend/routers/chat.py`) — blocked by `P1-chat-service`
- `P1-shared-components`: Implement ChineseText and SpoilerBlock shared components
- `P1-chat-ui`: Implement chat frontend (ChatPanel, MessageBubble, FeedbackPanel, ChatInput) — blocked by `P1-chat-router`, `P1-shared-components`
- `P1-tab-shell`: Wire up tab navigation shell — blocked by `P1-chat-ui`

**Phase 2 — Flash Cards** (all block on Phase 1 completion):
- `P2-db`: Add flashcard and attempt tables to schema
- `P2-flashcard-service`: Implement flashcard service — blocked by `P2-db`
- `P2-asset-worker`: Implement background asset generation worker — blocked by `P2-flashcard-service`
- `P2-flashcard-router`: Implement flashcard API endpoints — blocked by `P2-flashcard-service`
- `P2-flashcard-ui`: Implement flashcard frontend (FlashcardPanel, CardView, QuizView, CardManager) — blocked by `P2-flashcard-router`

**Phase 3 — Chat ↔ Flashcard Integration** (blocks on Phase 2):
- `P3-segmentation`: Implement jieba word segmentation utility
- `P3-word-to-card`: Implement auto-card-creation endpoint — blocked by `P3-segmentation`
- `P3-highlight-ui`: Implement highlight-to-add-card UX in chat — blocked by `P3-word-to-card`

**Phase 4 — Phone Compatibility** (blocks on Phase 3):
- `P4-responsive`: Responsive CSS for all existing components
- `P4-touch`: Touch-friendly interactions
- `P4-lan`: Bind server to 0.0.0.0, document LAN access

**Phase 5 — Other Games** (blocks on Phase 4):
- Scope TBD — create issues when Phase 4 is complete

### 0.7 — Create CLAUDE.md

Write the agent bylaws file. Contents should cover:

```markdown
# Trilingo — Agent Guide

## Quick Start
1. Read this file
2. Read `PLAN.md` for architecture context
3. Run `bd list --ready` to see available tasks
4. Claim a task with `bd update <id> --status in_progress --assignee agent`
5. Do the work
6. Mark complete with `bd update <id> --status done`

## Project Overview
Personal Mandarin Chinese learning app. Three tabs: Chatbot, Flash Cards, Games.
See `description.md` for product vision, `PLAN.md` for architecture and phasing.

## Running the App
- Backend: `venv\Scripts\uvicorn backend.main:app --reload` (from project root)
- Frontend: `cd frontend && npm run dev`
- Backend serves API on :8000, frontend on :5173 with proxy to backend

## Conventions
- Python: snake_case, type hints, async where possible
- TypeScript: camelCase for variables, PascalCase for components
- All AI provider calls go through `backend/providers/` — never import an AI SDK directly in a service or router
- Pydantic models for all API request/response shapes
- Each feature area (chat, flashcards, games) is fully isolated — see Encapsulation Rules

## Encapsulation Rules
Each feature owns its own files across every layer. Do NOT modify files belonging to another feature unless the task explicitly requires cross-feature integration.

| Feature    | Backend files                              | Frontend files                     |
|------------|--------------------------------------------|------------------------------------|
| Chat       | routers/chat.py, services/chat_service.py, models/chat.py | components/chat/, api/chat.ts, hooks/useChat.ts, types/chat.ts |
| Flashcards | routers/flashcards.py, services/flashcard_service.py, models/flashcard.py | components/flashcards/, api/flashcards.ts, hooks/useFlashcards.ts, types/flashcard.ts |
| Games      | routers/games.py, services/game_service.py, models/game.py | components/games/, api/games.ts, types/game.ts |
| Shared     | chinese/, providers/, database.py, config.py | components/shared/, api/client.ts |

## Beads Workflow
- Find work: `bd list --ready`
- Claim a task: `bd update <id> --status in_progress`
- Finish a task: `bd update <id> --status done`
- If you discover a bug or sub-task, create an issue: `bd create --title "..." --priority <p>`
- Link related issues with `--discovered-from <id>` when relevant
- Do not work on tasks that are blocked by incomplete dependencies

## Do NOT
- Embed AI SDK imports outside of `backend/providers/`
- Modify another feature's files without explicit cross-feature task
- Commit .env, venv/, node_modules/, or *.db files
- Block the chatbot or UI with synchronous asset generation
- Add features, refactoring, or "improvements" beyond the task scope
```

### 0.8 — Verify Everything

1. `git status` — shows clean repo with expected tracked files
2. `venv\Scripts\uvicorn backend.main:app --reload` — backend starts, `/api/health` returns ok
3. `cd frontend && npm run dev` — frontend starts, page loads
4. `bd list` — shows seeded backlog with correct dependencies
5. An agent reading `CLAUDE.md` can follow the Quick Start to find and claim work

---

## Completion

Phase 0 is complete when all acceptance criteria from `PLAN.md` are met and the next session can begin with: "Read `CLAUDE.md`, find available work, and start."
