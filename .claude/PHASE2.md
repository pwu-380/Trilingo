# Phase 2 — Flash Cards Implementation Plan

## Context

Phase 1 (Chatbot) is complete. Phase 2 adds the second core feature: flash cards for vocabulary building. Users can create, browse, quiz, and manage cards. The architecture mirrors Phase 1's patterns exactly — same service/router/hook/component structure.

---

## Sub-Phase 2A: Database + Backend Service

**Goal:** Flashcard CRUD and quiz logic, testable via Swagger.

### Database (`backend/database.py`)
Add two tables to `_SCHEMA`:

```sql
CREATE TABLE IF NOT EXISTS flashcards (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    chinese     TEXT NOT NULL,
    pinyin      TEXT NOT NULL,
    english     TEXT NOT NULL,
    notes       TEXT,
    audio_path  TEXT,
    image_path  TEXT,
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    source      TEXT DEFAULT 'manual'
);

CREATE TABLE IF NOT EXISTS flashcard_attempts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id      INTEGER NOT NULL REFERENCES flashcards(id),
    correct      INTEGER NOT NULL CHECK(correct IN (0, 1)),
    quiz_type    TEXT NOT NULL CHECK(quiz_type IN ('en_to_zh', 'zh_to_en')),
    attempted_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### Pydantic Models (`backend/models/flashcard.py`)
- `FlashcardCreate` — chinese, pinyin, english, notes (optional)
- `FlashcardUpdate` — all fields optional (PATCH semantics)
- `FlashcardResponse` — full card with id, timestamps, active status
- `QuizQuestion` — card (with one field hidden), options (4 strings), quiz_type
- `QuizAnswerRequest` — card_id, answer, quiz_type
- `QuizAnswerResponse` — correct (bool), correct_answer (str)

### Service (`backend/services/flashcard_service.py`)
Following `chat_service.py` pattern (pure async functions, no class):

- `create_card(chinese, pinyin, english, notes?, source?)` → FlashcardResponse
- `list_cards(active_only: bool | None)` → list[FlashcardResponse]
- `get_card(id)` → FlashcardResponse | None
- `update_card(id, **fields)` → FlashcardResponse | None
- `delete_card(id)` → bool
- `get_quiz_question(quiz_type?)` → QuizQuestion | None
  - Picks random active card
  - Generates 3 wrong options from other active cards
  - If quiz_type not specified, randomly picks en_to_zh or zh_to_en
- `submit_answer(card_id, answer, quiz_type)` → QuizAnswerResponse
  - Checks correctness, records attempt in flashcard_attempts

### Router (`backend/routers/flashcards.py`)
Following `chat.py` pattern:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/flashcards` | List cards (optional `?active=true/false` filter) |
| `POST` | `/api/flashcards` | Create a card |
| `GET` | `/api/flashcards/{id}` | Get single card |
| `PATCH` | `/api/flashcards/{id}` | Update card fields |
| `DELETE` | `/api/flashcards/{id}` | Delete card (204) |
| `GET` | `/api/flashcards/quiz` | Get a quiz question |
| `POST` | `/api/flashcards/quiz/answer` | Submit quiz answer |

Mount in `backend/main.py` via `app.include_router(flashcards.router)`.

### AI-Generated Notes
On card creation, optionally call Gemini (same `gemini-2.5-flash` model) in the background to generate a brief usage note (e.g. "More casual than 您好; common in everyday greetings"). Card is returned immediately — the `notes` field populates async. Uses the existing provider abstraction via a simple prompt, no new provider needed.

### Temporary Validation UI
To validate 2A without waiting for the full 2B frontend, include a minimal Flash Cards tab:
- Enable the tab in `TabShell.tsx`
- Simple card grid showing chinese, pinyin, english, notes
- "Add Card" form (chinese + english fields, pinyin auto-generated via pypinyin)
- X button to delete cards
- No quiz UI yet — just CRUD validation in-browser

### Gate 2A
Test via Swagger + temp UI: create cards, verify notes generate async, list, delete.

---

## Sub-Phase 2B: Frontend Flash Cards UI

**Goal:** Working Flash Cards tab with card management and quiz game.

### Game Design

#### Review Sessions
- User selects session length: **10 cards**, **20 cards**, or **Endless**
- Each round: either the English or Chinese component of a card is shown; user picks the matching counterpart from 4 multiple-choice options
- When the Chinese component is shown, **pinyin is hidden by default** — user can click the word to reveal pinyin (and, when implemented, play TTS audio)

#### Card Selection & Weighting
- Cards are drawn randomly from the **active pool**
- Weighted towards cards the user gets wrong more often — maintain a **windowed correctness average** (e.g. last 10 attempts per card) in the database
- Cards with lower correctness scores appear more frequently

#### Active / Inactive Pools
- During a review session, any card can be **moved to the inactive pool** (e.g. "I know this one")
- Cards in the inactive pool do not appear in review sessions
- Cards can be **reactivated** from the inactive pool back to active
- Cards can **only be deleted from the inactive pool** (prevents accidental deletion of study material)
- UI must surface controls for managing active/inactive status and deletion

#### Seed Data
- Pre-populate the database with ~30 words from **HSK Level 2** so there's a playable game before Phase 3 (chatbot-driven card creation) is complete
- Seed runs on first startup if the flashcards table is empty
- Source field = `'seed'` for seeded cards

### Types (`frontend/src/types/flashcard.ts`)
Interfaces matching backend models: `Flashcard`, `QuizQuestion`, `QuizAnswer`, `QuizResult`.

### API (`frontend/src/api/flashcards.ts`)
One function per endpoint, using `apiFetch()` from `client.ts`.

### Hook (`frontend/src/hooks/useFlashcards.ts`)
Following `useChat.ts` pattern:
- State: cards list, current quiz question, session progress, loading/sending flags, error
- Actions: refreshCards, createCard, updateCard, deleteCard, toggleActive, startReview, loadQuiz, submitAnswer

### Components (`frontend/src/components/flashcards/`)

| Component | Purpose |
|-----------|---------|
| `FlashcardPanel.tsx` | Main layout — toggle between card manager and quiz mode |
| `CardManager.tsx` | Browse cards in active/inactive pools; activate, deactivate, delete controls |
| `CardView.tsx` | Single card display — chinese (click to reveal pinyin), english, notes |
| `QuizView.tsx` | Review session — session length selector, question display, 4 MC options, result feedback, progress counter |

### Tab Shell
Replace the temp 2A UI. Enable the Flash Cards tab in `TabShell.tsx` (`enabled: true`). Wire `FlashcardPanel` in `App.tsx`.

### Backend Changes for 2B
- Add `correctness_weight` computation to quiz endpoint (windowed average of last N attempts per card)
- Add `PATCH /api/flashcards/{id}` support for `active` field toggle
- Add seed data endpoint or startup hook for HSK Level 2 words
- Enforce delete-only-from-inactive rule in `DELETE /api/flashcards/{id}`

### Gate 2B
Full browser walkthrough: browse active/inactive pools, move cards between pools, delete from inactive, start 10/20/endless review, answer questions with weighted selection, click Chinese to reveal pinyin, refresh persists.

---

## Sub-Phase 2C: Asset Worker (Stretch — Deferred)

The asset worker (`backend/services/asset_worker.py`) for TTS audio and sprite image generation is a stretch goal. Cards work fully without assets. **Recommend deferring this until after Phase 2B is stable**, then revisiting if desired.

---

## Files Summary

### New files
| File | Layer |
|------|-------|
| `backend/models/flashcard.py` | Pydantic models |
| `backend/services/flashcard_service.py` | Business logic |
| `backend/routers/flashcards.py` | REST endpoints |
| `frontend/src/types/flashcard.ts` | TypeScript interfaces |
| `frontend/src/api/flashcards.ts` | API functions |
| `frontend/src/hooks/useFlashcards.ts` | State management |
| `frontend/src/components/flashcards/FlashcardPanel.tsx` | Main layout |
| `frontend/src/components/flashcards/FlashcardPanel.css` | Styles |
| `frontend/src/components/flashcards/CardManager.tsx` | Browse/manage cards |
| `frontend/src/components/flashcards/CardManager.css` | Styles |
| `frontend/src/components/flashcards/CardView.tsx` | Single card display |
| `frontend/src/components/flashcards/CardView.css` | Styles |
| `frontend/src/components/flashcards/QuizView.tsx` | Quiz interface |
| `frontend/src/components/flashcards/QuizView.css` | Styles |

### Modified files
| File | Change |
|------|--------|
| `backend/database.py` | Add flashcards + flashcard_attempts tables |
| `backend/main.py` | Mount flashcards router |
| `frontend/src/components/shared/TabShell.tsx` | Enable Flash Cards tab |
| `frontend/src/App.tsx` | Add useFlashcards hook + FlashcardPanel |

### Reused shared code
- `frontend/src/components/shared/ChineseText.tsx` — pinyin display on cards
- `frontend/src/components/shared/SpoilerBlock.tsx` — hide answer in quiz
- `frontend/src/api/client.ts` — API fetch wrapper with auth
- `backend/chinese/pinyin.py` — could auto-generate pinyin if user only provides chinese + english

---

## Verification

1. **Backend**: Start server, open Swagger (`/docs`), test all 7 endpoints. Verify seed data populates on first run.
2. **Card Management**: Browse active/inactive pools, move cards between pools, delete only from inactive
3. **Review Session**: Start 10/20/endless review, verify weighted card selection, answer questions, see progress
4. **Pinyin Reveal**: Chinese cards hide pinyin by default, click to reveal
5. **Persistence**: Refresh page, verify cards, pool assignments, and quiz history survive
6. **Edge cases**: Quiz with < 4 active cards, empty active pool, move card to inactive during review, delete last inactive card
