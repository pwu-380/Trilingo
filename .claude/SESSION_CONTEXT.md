# Session Context — 2026-02-16 (session 7)

## What Was Done This Session

### Autoseed refactor — removed startup auto-seed, added manual UI
- **`backend/main.py`** — Removed `seed_cards()` call from lifespan startup and its import. No cards are ever auto-seeded without user action.
- **`backend/services/flashcard_service.py`** — `seed_cards()` now accepts `level` and `count` params, shuffles vocab for variety, skips duplicates by checking existing Chinese text
- **`backend/models/flashcard.py`** — Added `SeedRequest` model (level, count)
- **`backend/routers/flashcards.py`** — Added `POST /api/flashcards/seed` endpoint (validates level 1-3, count 1-50)
- **`frontend/src/api/flashcards.ts`** — Added `seedCards()` API function
- **`frontend/src/hooks/useFlashcards.ts`** — Added `seedCards` callback (calls API, refreshes card list)
- **`frontend/src/components/flashcards/CardManager.tsx`** — Added autoseed UI on right side of toolbar: "Autoseed 10 Cards" button + HSK Level dropdown (1-3)
- **`frontend/src/components/flashcards/CardManager.css`** — New `.cm-toolbar` wrapper, seed button/label/select styles
- **`frontend/src/components/flashcards/FlashcardPanel.tsx`** + **`App.tsx`** — Wired `onSeedCards` prop through

## What Was Tried and Didn't Work
- Nothing reverted; all changes were clean.

## Outstanding Issues
1. **Beads repo ID mismatch** — Still present from prior sessions.
2. **Debug print in main.py** — `Auth enabled (token: xxxx...)` diagnostic print still in lifespan.

## Current State

### Phases
- Phase 0 (infrastructure): COMPLETE
- Phase 1 (chatbot): COMPLETE
- Phase 2A (flashcard backend): COMPLETE
- Phase 2B (flashcard frontend): COMPLETE
- Phase 2C (asset worker): COMPLETE
- Phase 3 (chat↔flashcard integration): COMPLETE
- Phase 4 (games): NOT STARTED

## What to Do Next
1. **Phase 4** — Games tab implementation
2. **Expand HSK data** — hsk3-6.json files have only 20 vocab entries each

## Key Decisions Made by User
- Phase 2C images are an "English component" — displayed between pinyin and English on cards, and above English prompt in quiz
- en_to_zh answer clicks play audio for pronunciation reinforcement
- "Regen" button on every card for manual asset regeneration
- All English text normalized to lowercase for consistency
- Auto-seed removed from startup — seeding is now manual-only via UI button
