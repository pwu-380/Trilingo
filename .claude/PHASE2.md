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

**Goal:** Working Flash Cards tab in the browser.

### Types (`frontend/src/types/flashcard.ts`)
Interfaces matching backend models: `Flashcard`, `QuizQuestion`, `QuizAnswer`, `QuizResult`.

### API (`frontend/src/api/flashcards.ts`)
One function per endpoint, using `apiFetch()` from `client.ts`.

### Hook (`frontend/src/hooks/useFlashcards.ts`)
Following `useChat.ts` pattern:
- State: cards list, current quiz question, loading/sending flags, error
- Actions: refreshCards, createCard, updateCard, deleteCard, loadQuiz, submitAnswer

### Components (`frontend/src/components/flashcards/`)

| Component | Purpose |
|-----------|---------|
| `FlashcardPanel.tsx` | Main layout — toggle between card manager and quiz mode |
| `CardManager.tsx` | Browse cards, create new, activate/deactivate, delete |
| `CardView.tsx` | Single card display (chinese + pinyin via `ChineseText`, english, notes) |
| `QuizView.tsx` | Quiz interface — question, 4 multiple-choice options, result feedback |

### Tab Shell
Enable the Flash Cards tab in `TabShell.tsx` (`enabled: true`). Wire `FlashcardPanel` in `App.tsx`.

### Gate 2B
Full browser walkthrough: create cards, browse, quiz both directions, refresh persists.

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

1. **Backend**: Start server, open Swagger (`/docs`), test all 7 endpoints
2. **Frontend**: Open app, click Flash Cards tab, create a card, browse it, start a quiz, answer questions
3. **Persistence**: Refresh page, verify cards and quiz history survive
4. **Edge cases**: Quiz with < 4 cards, empty card list, delete last card while in quiz
