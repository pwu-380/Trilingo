# Trilingo — Agent Guide

## Quick Start
1. Read this file
2. Read `PLAN.md` for architecture context
3. Run `bd ready` to see available tasks
4. Claim a task with `bd update <id> --claim`
5. Do the work
6. Mark complete with `bd update <id> --status closed`

## Project Overview
Personal Mandarin Chinese learning app. Three tabs: Chatbot, Flash Cards, Games.
See `Description.md` for product vision, `PLAN.md` for architecture and phasing.

## Environment Setup
This project uses a local conda environment at `./venv/` containing Python 3.12, Node.js, and npm.
All commands must use the local environment — do NOT use system Python or Node.

### Activating the environment
Prefix PATH in every shell command:
```bash
cd "D:/Documents/2026-01 to 12/Trilingo" && VENV="$(pwd)/venv" && export PATH="$VENV/Scripts:$VENV:$PATH"
```

### Running the App
- Backend: `uvicorn backend.main:app --reload --port 8731` (from project root, with venv on PATH)
- Frontend: `cd frontend && npm run dev` (with venv on PATH)
- Backend serves API on :8731, frontend on :8732 with proxy to backend

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
- Find work: `bd ready`
- Claim a task: `bd update <id> --claim`
- Finish a task: `bd update <id> --status closed`
- If you discover a bug or sub-task, create an issue: `bd create "title" -p <priority>`
- Link related issues with `--deps discovered-from:<id>` when relevant
- Do not work on tasks that are blocked by incomplete dependencies

## Do NOT
- Modify state on the user's computer outside of this project folder (under no circumstances)
- Embed AI SDK imports outside of `backend/providers/`
- Modify another feature's files without explicit cross-feature task
- Commit .env, venv/, node_modules/, or *.db files
- Block the chatbot or UI with synchronous asset generation
- Add features, refactoring, or "improvements" beyond the task scope

## README
After every commit, review `README.md` and update it if any user-facing behaviour changed (new features, changed commands, new setup steps, etc.). The README is written for end users, not developers.

## Session Completion
See `AGENTS.md` for mandatory end-of-session workflow (including git push).
