# Trilingo — Architecture & Implementation Plan

## Context

A personal Mandarin Chinese learning app to replace Duolingo. Hosted on a local webserver. Three interconnected learning components: a Gemini-powered chatbot, flash cards, and language games. This plan prioritizes primary features and phases delivery so that each component is stable before the next begins. The architecture is designed for encapsulation — independent agents can work on different components without breaking each other.

**Task management**: [Beads](https://github.com/steveyegge/beads) (`bd`) — a git-backed issue tracker for coding agents. The feature backlog lives in `.beads/` and is the source of truth for what to work on. See `CLAUDE.md` for agent workflow.

---

## Tech Stack

| Layer       | Technology                | Rationale                                              |
|-------------|---------------------------|--------------------------------------------------------|
| Backend     | Python 3.12+, FastAPI     | Async, lightweight, excellent Chinese NLP libraries    |
| Frontend    | React 18+, TypeScript     | Component model fits tab layout, strong ecosystem      |
| Build       | Vite                      | Fast dev server, HMR, clean React/TS support           |
| Database    | SQLite (via aiosqlite)    | Zero-config, local-only, perfect for single-user app   |
| AI          | Google Gemini Flash 2 (default, swappable) | Behind a provider abstraction layer  |
| Chinese NLP | pypinyin, jieba           | Pinyin annotation, word segmentation                   |
| HTTP Client | httpx                     | Async HTTP for AI provider API calls                   |
| Task Queue  | asyncio background tasks  | Lazy/async asset generation without blocking UI        |
| Task Mgmt   | Beads (`bd`)              | Git-backed issue tracker for multi-agent coordination  |

---

## Project Structure

```
Trilingo/
├── backend/
│   ├── main.py                     # FastAPI app entry, mounts routers
│   ├── config.py                   # Settings (API keys, DB path, etc.)
│   ├── database.py                 # SQLite connection & schema init
│   ├── routers/
│   │   ├── chat.py                 # /api/chat/* endpoints
│   │   ├── flashcards.py           # /api/flashcards/* endpoints
│   │   └── games.py                # /api/games/* endpoints (Phase 5)
│   ├── providers/
│   │   ├── base.py                 # Abstract interfaces (ChatProvider, TTSProvider, ImageProvider)
│   │   ├── gemini.py               # Gemini implementation of ChatProvider
│   │   └── registry.py             # Maps feature→provider from config, returns concrete instances
│   ├── services/
│   │   ├── chat_service.py         # Chat session logic, uses ChatProvider via registry
│   │   ├── flashcard_service.py    # Card CRUD, quiz logic
│   │   ├── asset_worker.py         # Background async worker for lazy asset generation
│   │   └── game_service.py         # Game logic (Phase 5)
│   ├── chinese/
│   │   ├── pinyin.py               # Pinyin annotation utilities
│   │   └── segmentation.py         # Word segmentation via jieba
│   ├── models/
│   │   ├── chat.py                 # Pydantic models for chat API
│   │   ├── flashcard.py            # Pydantic models for flashcard API
│   │   └── game.py                 # Pydantic models for game API (Phase 5)
│   └── assets/                     # Locally saved generated assets
│       ├── audio/                  # TTS audio files (.mp3, via edge-tts)
│       └── images/                 # CC images (.jpg, via Openverse API)
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.tsx                # App entry
│   │   ├── App.tsx                 # Tab router / layout shell
│   │   ├── api/
│   │   │   ├── client.ts           # Shared fetch wrapper
│   │   │   ├── chat.ts             # Chat API calls
│   │   │   ├── flashcards.ts       # Flashcard API calls
│   │   │   └── games.ts            # Game API calls (Phase 5)
│   │   ├── components/
│   │   │   ├── shared/
│   │   │   │   ├── ChineseText.tsx       # Renders characters + pinyin
│   │   │   │   ├── SpoilerBlock.tsx      # Click-to-reveal translation
│   │   │   │   └── TabShell.tsx          # Top-level tab navigation
│   │   │   ├── chat/
│   │   │   │   ├── ChatPanel.tsx         # Main chat interface
│   │   │   │   ├── MessageBubble.tsx     # Single message display
│   │   │   │   ├── FeedbackPanel.tsx     # Grammar notes & tips
│   │   │   │   └── ChatInput.tsx         # User text input
│   │   │   ├── flashcards/
│   │   │   │   ├── FlashcardPanel.tsx    # Main flashcard interface
│   │   │   │   ├── CardView.tsx          # Single card display
│   │   │   │   ├── QuizView.tsx          # Multiple-choice quiz
│   │   │   │   └── CardManager.tsx       # Browse/activate/deactivate
│   │   │   └── games/
│   │   │       ├── GamesPanel.tsx         # Lobby + session wrapper
│   │   │       ├── GameSession.tsx        # Round orchestrator
│   │   │       ├── GameSummary.tsx        # End-of-session score screen
│   │   │       ├── MatchingGame.tsx       # Matching game component
│   │   │       └── MadLibsGame.tsx        # Mad Libs game component
│   │   ├── hooks/
│   │   │   ├── useChat.ts               # Chat state & actions
│   │   │   ├── useFlashcards.ts         # Flashcard state & actions
│   │   │   ├── useGames.ts             # Game session state & actions
│   │   │   └── useSounds.ts            # Shared correct/incorrect sound effects
│   │   └── types/
│   │       ├── chat.ts                  # Chat TypeScript types
│   │       ├── flashcard.ts             # Flashcard TypeScript types
│   │       └── game.ts                  # Game TypeScript types (Phase 5)
├── .beads/                         # Beads issue tracker (git-backed task database)
├── venv/                           # Python virtual environment (self-contained)
├── requirements.txt
├── .env                            # API keys (not committed)
├── .env.example                    # Template showing required env vars
├── .gitignore
├── CLAUDE.md                       # Agent bylaws — read this first in any new session
├── PLAN.md                         # This file — architecture & phasing overview
└── description.md                  # Original product vision
```

### Encapsulation Boundaries

Each feature area is isolated across every layer of the stack:

- **Backend**: Separate router, service, and model files per feature. Shared utilities live in `chinese/` and `providers/`. An agent working on `routers/chat.py` + `services/chat_service.py` will not touch flashcard files.
- **Frontend**: Each tab is a self-contained directory under `components/`. Shared UI primitives (`ChineseText`, `SpoilerBlock`) live in `shared/`. Each feature has its own API module and hook. An agent working in `components/chat/` will not touch `components/flashcards/`.
- **Database**: Tables are namespaced by feature (see schema below). No cross-feature foreign keys in early phases.

---

## Database Schema

```sql
-- Chat history
CREATE TABLE chat_sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    title       TEXT
);

CREATE TABLE chat_messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  INTEGER NOT NULL REFERENCES chat_sessions(id),
    role        TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content     TEXT NOT NULL,          -- raw Chinese text
    pinyin      TEXT,                   -- pinyin-annotated form (assistant only)
    translation TEXT,                   -- English translation (assistant only)
    feedback    TEXT,                   -- grammar notes & tips (assistant only)
    emotion     TEXT DEFAULT 'neutral', -- AI emotion for avatar (neutral/confused/mad)
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Flash cards
CREATE TABLE flashcards (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    chinese     TEXT NOT NULL,           -- simplified characters
    pinyin      TEXT NOT NULL,
    english     TEXT NOT NULL,
    notes       TEXT,                    -- usage tips (stretch, <=140 chars)
    audio_path  TEXT,                    -- local path to TTS file (stretch)
    image_path  TEXT,                    -- local path to sprite (stretch)
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    source      TEXT DEFAULT 'manual'    -- 'manual', 'chat', 'import'
);

-- Quiz performance tracking (supports stretch goal: dynamic difficulty)
CREATE TABLE flashcard_attempts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id     INTEGER NOT NULL REFERENCES flashcards(id),
    correct     INTEGER NOT NULL CHECK(correct IN (0, 1)),
    quiz_type   TEXT NOT NULL CHECK(quiz_type IN ('en_to_zh', 'zh_to_en')),
    attempted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Stored sentences for Mad Libs (and future sentence-based games)
CREATE TABLE game_sentences (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    hsk_level   INTEGER NOT NULL,
    vocab_word  TEXT NOT NULL,
    sentence_zh TEXT NOT NULL,
    sentence_en TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## Implementation Phases

### Phase 0 — Environment & Project Infrastructure

**Goal**: A fully bootstrapped, self-contained project folder with tooling, conventions, and a seeded backlog. Any agent can start a new session, read `CLAUDE.md`, and immediately know what to work on.

**Detailed subplan**: See `.claude/PHASE0.md`

**Acceptance criteria**:
- `git init` done, `.gitignore` in place
- Python venv created inside project folder with all backend deps installed
- Vite + React + TypeScript frontend scaffolded with `node_modules` local to `frontend/`
- Beads initialized (`bd init`), backlog seeded with Phase 1–5 tasks and dependencies
- `CLAUDE.md` written with agent bylaws (project orientation, conventions, encapsulation rules, beads workflow)
- `.env.example` created documenting required environment variables
- Both servers start without errors (even if they serve empty/placeholder content)

---

### Phase 1 — Chatbot

**Goal**: Working chatbot where the user can converse in Mandarin with Gemini, see pinyin annotations, reveal English translations, and receive grammar feedback.

**Steps**:
1. Set up SQLite database with `chat_sessions` and `chat_messages` tables
3. Implement `backend/chinese/pinyin.py` — wrapper around `pypinyin` to annotate a Chinese string
4. Implement provider abstraction:
   - `backend/providers/base.py` — abstract `ChatProvider` interface with a `chat()` method that accepts message history and returns structured output (response, translation, feedback)
   - `backend/providers/gemini.py` — Gemini Flash 2 implementation of `ChatProvider`, with system prompt instructing structured JSON output
   - `backend/providers/registry.py` — reads config, returns the configured provider instance per feature
   - `backend/config.py` — includes `CHAT_PROVIDER` setting and provider-specific API keys
5. Implement `backend/services/chat_service.py` — manages session history, calls `ChatProvider` via registry, annotates response with pinyin, persists messages
6. Implement `backend/routers/chat.py`:
   - `POST /api/chat/sessions` — create new session
   - `GET /api/chat/sessions` — list sessions
   - `GET /api/chat/sessions/{id}` — get session with messages
   - `POST /api/chat/sessions/{id}/messages` — send message, get AI response
7. Implement frontend shared components: `ChineseText` (renders characters with pinyin ruby text above), `SpoilerBlock` (click to reveal)
8. Implement frontend `ChatPanel`, `MessageBubble`, `FeedbackPanel`, `ChatInput`
9. Wire up the tab shell (with only one active tab for now)

**Acceptance criteria**:
- User can start a chat session and send Chinese text
- Gemini responds in Chinese with pinyin displayed above characters
- English translation is hidden behind a spoiler click
- Grammar feedback displays alongside or below the conversation
- Chat history persists across page refreshes

---

### Phase 2 — Flash Cards

**Goal**: Users can create, browse, quiz, and manage flash cards.

**Steps**:
1. Create `flashcards` and `flashcard_attempts` tables
2. Implement `backend/services/flashcard_service.py` — CRUD for cards, quiz card selection (random from active pool), answer checking
3. Implement `backend/services/asset_worker.py` — background async worker that picks up newly created cards and generates assets (audio, images) without blocking. Cards are usable immediately with text-only; assets populate later. Failed generation is non-fatal.
4. Implement `backend/routers/flashcards.py`:
   - `GET /api/flashcards` — list cards (filterable by active/inactive), includes asset readiness status
   - `POST /api/flashcards` — create card (returns immediately, enqueues asset generation in background)
   - `PATCH /api/flashcards/{id}` — update card (edit, activate/deactivate)
   - `DELETE /api/flashcards/{id}` — delete card
   - `GET /api/flashcards/quiz` — get a quiz question (random card + multiple-choice options)
   - `POST /api/flashcards/quiz/answer` — submit answer, record attempt
5. Implement frontend `FlashcardPanel`, `CardView`, `QuizView`, `CardManager`
6. Add the Flash Cards tab to the tab shell

**Acceptance criteria**:
- User can create cards with Chinese and English (pinyin auto-generated via pypinyin)
- Card creation returns instantly — AI notes generation happens in the background
- User can browse cards in active and inactive pools, move cards between them
- Cards can only be deleted from the inactive pool
- Quiz mode supports review sessions of 10, 20, or endless cards
- Quiz shows a card with one component hidden and 4 multiple-choice options
- Quiz supports both directions (Chinese→English, English→Chinese)
- When showing Chinese, pinyin is hidden by default — click to reveal
- Card selection is weighted: cards answered incorrectly more often appear more frequently
- Users can bulk-add HSK vocabulary (levels 1-3) via the "Autoseed" button in the card manager
- Cards without assets still function correctly (assets are optional enhancements)
- TTS audio (edge-tts) and CC images (Openverse) are generated in the background for each card
- Audio plays via speaker button on cards and when clicking answers during en_to_zh quiz
- Images display on cards and as visual hints during en_to_zh quiz questions
- Users can regenerate assets (audio, image, tip) for any card via a "Regen" button
- English text is normalized to lowercase for consistency
- Missing assets are backfilled on startup

---

### Phase 3 — Chatbot ↔ Flashcard Integration (1 issue remaining)

**Goal**: Users can click Chinese words in the chatbot and add them as flash cards without disrupting chat flow.

**What was built**:
1. `backend/chinese/segmentation.py` — jieba-based word segmentation
2. `POST /api/chat/messages/{id}/segment` — returns word boundaries for a message's Chinese content
3. `POST /api/flashcards/from-word` — accepts a Chinese word, auto-generates pinyin (pypinyin) and English (Gemini), creates a card with duplicate detection
4. Clickable-word UX: assistant messages are segmented into words, each word is clickable with hover highlight, popup offers "Add to Flash Cards"
5. Cards created this way are tagged with `source='chat'`
6. Cross-feature wiring via callback injection in `App.tsx` — chat components never import flashcard code

**Detailed subplan**: See `.claude/PHASE3.md`

**Acceptance criteria**:
- User can click any Chinese word in assistant messages
- A popup shows word + pinyin + "Add to Flash Cards" button
- The card is auto-populated with pinyin and English
- Duplicate detection prevents adding the same word twice
- The card appears in the Flash Cards tab after creation
- Card creation must not block or disrupt the chat flow

---

### Phase 4 — Phone Compatibility & Polish

**Goal**: Responsive layout works well on phone browsers over LAN.

> Scope to be defined after Phases 1–3 are stable. Key considerations:
> - Responsive CSS for all existing components (chat, flashcards)
> - Touch-friendly interactions (larger tap targets, swipe gestures for cards)
> - Bind server to `0.0.0.0` so phone can connect via LAN IP
> - Test on actual mobile browsers

---

### Phase 5 — Games ✅

**Goal**: Duolingo-style language games using the flash card corpus and HSK reference data.

**What was built**:
1. **Database**: `game_sentences` table for caching AI-generated Mad Libs sentences
2. **Backend**: `game_service.py` with matching (flashcard-sourced + HSK fallback) and Mad Libs (LLM sentence generation with 70/30 reuse/generate ratio, stored in DB). `RateLimitError` in provider layer with graceful fallback.
3. **Frontend**: Games lobby with HSK level/rounds config and game-type button grid (Matching, Mad Libs, Random). `GameSession` orchestrator with progress bar, score tracking, and round routing. `GameSummary` end screen with congratulations image on perfect score.
4. **Matching game**: Two-column matching with randomized Chinese/English sides, shake animation on wrong match, fade on correct, audio playback on correct match, single "Show Pinyin" toggle button
5. **Mad Libs game**: Fill-in-the-blank with 4 options, 2-level hints (pinyin → English), checkbox-based "Add to Flash Cards" UI, English shown on correct answer, 1.3s delay with sound effects
6. **Sound effects**: Correct/incorrect sounds across all games and flashcard review
7. **Rate limit handling**: Gemini 429 caught and raised as `RateLimitError`; Mad Libs falls back to stored sentences with toast notification; chat returns 429 with user-friendly message

**Detailed subplan**: See `.claude/PHASE5.md`

---

## Verification

After each phase, verify by:

1. **Backend**: Run the FastAPI dev server (`uvicorn backend.main:app --reload`), test endpoints manually via browser or curl
2. **Frontend**: Run Vite dev server (`npm run dev`), interact with the UI
3. **Integration**: Confirm data flows correctly end-to-end (e.g., send a chat message → see annotated response → reveal translation → check DB has the message persisted)
4. **Persistence**: Refresh the page, confirm state is preserved from SQLite

---

## Key Design Decisions

- **Provider abstraction layer**: AI capabilities are accessed through abstract interfaces (`ChatProvider`, `TTSProvider`, `ImageProvider` in `backend/providers/base.py`). Concrete implementations (e.g., `GeminiChatProvider`) live in their own files. A registry (`backend/providers/registry.py`) reads `config.py` to map each feature to its configured provider. This means:
  - Swapping Gemini for another chat model = write a new provider class + change one config line
  - Different features can use different providers simultaneously (e.g., Gemini for chat, OpenAI for TTS)
  - No AI SDK imports leak outside the `providers/` directory
  - Config specifies provider per-feature: `CHAT_PROVIDER=gemini`, `TTS_PROVIDER=google`, etc.
- **Structured AI output**: The chat provider prompt requests JSON responses with separate fields for `response`, `translation`, and `feedback`. This keeps parsing simple and reliable. The structured format is part of the provider interface, not tied to Gemini specifics.
- **Lazy/async asset generation**: Flash card assets (audio, images) are generated by a background worker (`backend/services/asset_worker.py`) using FastAPI's `BackgroundTasks` or an `asyncio` task queue. The flow:
  1. Card is created immediately with just text fields (chinese, pinyin, english)
  2. A background job is enqueued for asset generation (TTS audio, sprite image)
  3. The frontend polls or receives a status update when assets are ready
  4. The chatbot and quiz remain fully responsive — asset generation never blocks any user-facing request
  - Assets that fail to generate are silently skipped (the card still works without them). Failed jobs can be retried later.
- **Pinyin as server-side annotation**: `pypinyin` runs on the backend so the frontend receives pre-annotated text. The frontend just renders it — no Chinese NLP in the browser.
- **SQLite for everything**: No need for Redis, Postgres, or any external service. The app is single-user and local. SQLite handles the load trivially.
- **Optional token auth**: A session token can be set via `TRILINGO_TOKEN` env var. The startup script auto-generates one and passes it via URL query param. When unset, auth is disabled. Tokens are checked via middleware (header, query param, or cookie).
- **Assets stored on disk, paths in DB**: Generated audio/images go in `backend/assets/` and the DB stores relative paths. This keeps the DB lean and assets easy to manage.
- **Non-blocking card creation from chat**: When a user adds a flashcard from a chat word, the process must not disrupt the chat flow. A notification can pop up to show status, but it must not prevent the user from continuing to type and send messages. Card creation (including AI translation and notes generation) should feel instant or happen in the background.
- **Self-contained project folder**: All runtime dependencies live inside the project directory. The system-installed Python and Node are used only to bootstrap (create the venv, run `npm install`). After setup, the project runs entirely from its local `venv/` and `frontend/node_modules/`. A `.gitignore` excludes these bulky directories, the SQLite database, generated assets, and environment files.
