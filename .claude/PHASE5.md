# Phase 5 — Games

## Overview

A games tab with a lobby/homepage and a round-based play system. The user selects an HSK level, number of rounds, and which game types to include. Each round is one question-and-answer interaction from a selected game type. Game types are fully encapsulated from each other so new games can be added without touching existing game code.

---

## Games Lobby (Homepage)

The top of the games tab is a configuration bar:

| Control         | Options              | Notes                                              |
|-----------------|----------------------|----------------------------------------------------|
| HSK Level       | 1, 2, 3             | Dropdown. Filters vocab for games that use it.     |
| Rounds          | 10, 20, 30          | Dropdown. Total rounds per play session.           |
| Game Type       | Single select        | Dropdown: each game type + "Random".               |

Below the config bar, a **Play** button starts the session. During play, a progress bar shows `round X / N` and a running score.

**"Random" selection**: Each round picks uniformly at random from all available game types.

---

## Round System

A "session" is N rounds. Each round:
1. Pick a game type (the selected type, or random from all if "Random").
2. Render that game's component with appropriate props.
3. User completes the round (correct/incorrect).
4. Show brief feedback, then advance to next round.
5. After all rounds: show summary screen (score, accuracy).

The round orchestrator (`GameSession` component) manages this loop. Individual game components receive a callback (`onComplete(correct: boolean)`) and are otherwise self-contained.

---

## Database Schema

```sql
-- Stored sentences for MadLibs (and future sentence-based games)
CREATE TABLE game_sentences (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    hsk_level   INTEGER NOT NULL,
    vocab_word  TEXT NOT NULL,          -- the word used as the blank
    sentence_zh TEXT NOT NULL,          -- full Chinese sentence
    sentence_en TEXT NOT NULL,          -- English translation
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

No session/score tracking table for now — scores are ephemeral, shown at end of session and not persisted. This keeps it simple; persistence can be added later if wanted.

---

## Backend

### Models (`backend/models/game.py`)

```
MatchingRound       — 4 pairs of {chinese, pinyin, english, audio_path}
MadLibsRound        — sentence_zh (with blank), sentence_en, pinyin_sentence, vocab_word, options[]
MadLibsGenerateReq  — hsk_level: int
GameConfig          — hsk_level, rounds, game_types[]
```

### Service (`backend/services/game_service.py`)

| Function                          | Purpose                                                        |
|-----------------------------------|----------------------------------------------------------------|
| `get_matching_round(hsk_level)`   | Pull 4 random words from flashcard pool (active, filtered by HSK level via hsk data). Return pairs. |
| `get_madlibs_round(hsk_level)`    | 50/50: generate new sentence or pull stored one. Build options. |
| `_generate_sentence(hsk_level)`   | Pick random HSK vocab word, call LLM to generate sentence, store in DB, return. |
| `_pick_stored_sentence(hsk_level)`| Random row from game_sentences for this level. Falls back to generate if none exist. |
| `_build_madlibs_options(vocab_word, hsk_level)` | Pick 3 distractor words from same HSK level, shuffle with correct answer. |

**Matching word source**: Query flashcards table for active cards. If fewer than 4 active cards exist, supplement from HSK reference data directly. This means matching works even with an empty flashcard pool.

**MadLibs sentence generation prompt** (via `get_chat_provider().generate_text()`):
- Input: a vocab word + HSK level
- Ask LLM to produce a natural Chinese sentence using that word, plus English translation
- Parse response, store in `game_sentences`
- Generate pinyin at runtime via `pypinyin` (not stored)

### Router (`backend/routers/games.py`)

| Endpoint                          | Method | Purpose                                    |
|-----------------------------------|--------|--------------------------------------------|
| `/api/games/matching`             | GET    | Get a matching round. Query param: `level` |
| `/api/games/madlibs`              | GET    | Get a madlibs round. Query param: `level`  |

Kept minimal — the frontend orchestrates rounds, the backend just serves individual questions.

---

## Frontend

### Files

| File                                           | Purpose                                      |
|------------------------------------------------|----------------------------------------------|
| `frontend/src/types/game.ts`                   | TypeScript interfaces for all game data      |
| `frontend/src/api/games.ts`                    | API client functions                         |
| `frontend/src/hooks/useGames.ts`               | Session state, round progression, scoring    |
| `frontend/src/components/games/GamesPanel.tsx`  | Lobby + session wrapper (top-level tab content) |
| `frontend/src/components/games/GameSession.tsx` | Round orchestrator (progress, score, routing)|
| `frontend/src/components/games/MatchingGame.tsx`| Matching game component                      |
| `frontend/src/components/games/MadLibsGame.tsx` | MadLibs game component                      |
| `frontend/src/components/games/GameSummary.tsx` | End-of-session score screen                  |
| `frontend/src/components/games/GamesPanel.css`  | Styles for lobby                             |
| `frontend/src/components/games/GameSession.css` | Styles for session frame                     |
| `frontend/src/components/games/MatchingGame.css`| Styles for matching                          |
| `frontend/src/components/games/MadLibsGame.css` | Styles for madlibs                           |

### Wiring

- Enable the "Games" tab in `TabShell.tsx`
- Add `gamesContent` prop to `TabShell`, render in tab panel
- In `App.tsx`, create `useGames()` hook instance, pass `onAddCardFromWord` callback (same pattern as chat→flashcard integration) for the MadLibs "add to flashcards" button
- Games components never import from `components/chat/` or `components/flashcards/`

### Component Details

**GamesPanel** (lobby):
- Config bar: HSK level dropdown, rounds dropdown, game type dropdown
- Play button → starts GameSession
- Back button during session → confirm abandon, return to lobby

**GameSession** (orchestrator):
- Holds session state: current round index, score, game type sequence
- Pre-generates the game type sequence on session start (random or fixed)
- Fetches round data from API, renders the appropriate game component
- Passes `onComplete(correct)` to game, advances on completion
- Shows progress bar and score
- After final round → renders GameSummary

**MatchingGame**:
- Displays two columns: English words (left), Chinese words (right)
- User clicks one from each side to attempt a match
- Correct match: both items fade out / disappear with brief animation
- Wrong match: brief shake animation, items reset
- Clicking a Chinese word plays its audio (if `audio_path` exists)
- Round completes when all 4 pairs matched; calls `onComplete(true)` — matching is always "correct" since user keeps going until done
- No timer pressure for now

**MadLibsGame**:
- Displays Chinese sentence with `____` where vocab word was
- 4 multiple-choice buttons below
- Selecting correct answer: highlight green, fill in blank, brief pause, `onComplete(true)`
- Selecting wrong answer: highlight red, mark that option disabled, let user try again (but mark round as incorrect on first wrong attempt)
- **Hint button** (toggle, 2 levels):
  - First click: show pinyin above the sentence + pinyin for all answer options
  - Second click: show English translation of the full sentence below
- **"Add to Flash Cards" button**: visible after answering, calls `onAddCardFromWord(vocab_word)` — reuses the same cross-feature callback as chat, including toast notification and duplicate detection
- Pinyin for the sentence and options is returned by the backend in the round data

---

## Implementation Order

### Step 1: Database & Backend Foundation
1. Add `game_sentences` table to `backend/database.py`
2. Create `backend/models/game.py` with Pydantic models
3. Create `backend/services/game_service.py` with matching + madlibs logic
4. Create `backend/routers/games.py` with endpoints
5. Register router in `backend/main.py`

### Step 2: Frontend Foundation
1. Create `frontend/src/types/game.ts`
2. Create `frontend/src/api/games.ts`
3. Create `frontend/src/hooks/useGames.ts`
4. Create `GamesPanel.tsx` (lobby only, no games yet)
5. Wire into `TabShell.tsx` and `App.tsx`

### Step 3: Matching Game
1. Build `MatchingGame.tsx` + CSS
2. Test end-to-end with lobby → session → matching → summary

### Step 4: MadLibs Game
1. Build `MadLibsGame.tsx` + CSS
2. Wire hint toggle and add-to-flashcards button
3. Test sentence generation, stored sentence reuse, and full round flow

### Step 5: Polish
1. Animations and transitions
2. Error handling (LLM failure, empty card pool, etc.)
3. Loading states while fetching round data
4. Verify encapsulation — no cross-feature imports

---

## Future Games (Ideas Backlog)

New games follow the same pattern: one backend function returning round data, one frontend component accepting `onComplete`. Add the game type to the lobby dropdown and the session orchestrator's type map.

### Sentence Builder
- Given English sentence + jumbled Chinese words, drag/tap to arrange in correct order
- Could reuse `game_sentences` table
- Variant: given Chinese audio, arrange characters

### Classifier Game
- Show a noun, pick the correct measure word (量词) from options
- Uses HSK measure word data

### Speed Round
- Any game type but with a countdown timer
- Bonus points for fast correct answers
