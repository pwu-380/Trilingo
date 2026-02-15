# Session Context — 2026-02-15 (session 5)

## What Was Done This Session

### HSK Reference Library Implementation (Trilingo-aip) — COMPLETE
Built out the HSK curriculum reference library at `backend/chinese/hsk/`:
- **`__init__.py`** — Thin Python API with lazy-loaded, cached JSON data: `get_level()`, `get_vocab()`, `get_grammar()`, `get_topics()`, `LEVELS`
- **`data/hsk1.json` through `hsk6.json`** — Starter curriculum data:
  - HSK1: 50 vocab, 8 grammar, 5 topics
  - HSK2: 50 vocab, 10 grammar, 6 topics (includes all original seed words + 20 more)
  - HSK3-6: 20 vocab, 6-8 grammar, 5-6 topics each (starter entries, can be expanded)
- **Migrated `flashcard_service.py`** — Replaced hardcoded `_HSK2_SEED` tuple with `get_vocab(2)` from the library. Seed now inserts 50 HSK2 words instead of the original 30.

## What Was Tried and Didn't Work
- Nothing reverted; all changes were clean.

## Outstanding Issues
1. **Beads repo ID mismatch** — Still present from prior sessions. `bd ready` works but warns.
2. **Debug print in main.py** — `Auth enabled (token: xxxx...)` diagnostic print still in lifespan (`Trilingo-40m`).
3. **Phase 2C (asset worker)** — Not started yet (`Trilingo-wle`).

## Current State

### Phases
- Phase 0 (infrastructure): COMPLETE
- Phase 1 (chatbot): COMPLETE
- Phase 2A (flashcard backend): COMPLETE
- Phase 2B (flashcard frontend): COMPLETE
- Phase 2C (asset worker): NOT STARTED
- Phase 3 (chat↔flashcard integration): COMPLETE

## What to Do Next
1. **Remove debug print** (`Trilingo-40m`) — Quick cleanup
2. **Phase 2C** — Asset worker (`Trilingo-wle`)
3. **Expand HSK data** — The hsk3-6.json files have only 20 vocab entries each as starters; these can be expanded to full standard HSK word lists over time

## Key Decisions Made by User
- Phase 3 was done before Phase 2C (asset worker).
- Card generation must not disrupt chat flow.
- HSK reference library: set up structure and schema first, populate data later.

## Key Files Modified This Session
- `backend/chinese/hsk/__init__.py` — NEW: HSK library public API
- `backend/chinese/hsk/data/hsk1.json` through `hsk6.json` — NEW: curriculum data
- `backend/services/flashcard_service.py` — migrated seed data to use HSK library

## Note on Seed Data Change
The seed now inserts 50 HSK2 words (up from 30). Existing databases with data are unaffected since `seed_cards()` skips seeding when the table is non-empty. Only fresh databases will get the expanded seed set.
