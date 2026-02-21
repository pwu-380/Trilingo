# Session Context — 2026-02-20 (session 13)

## What Was Done This Session

### Renamed "MadLibs" → "Mad Libs" (user-facing text)
- Updated display label in GamesPanel.tsx, README.md, PLAN.md, PHASE5.md, SESSION_CONTEXT.md, and game_service.py comments/docstrings
- Internal identifiers (MadLibsRound, madlibsData, CSS classes, API routes) left unchanged

### Added "Tune In" game (listening comprehension)
- Backend: `TuneInRound` + `AudioCardCount` models, `get_tunein_round()` + `get_audio_card_count()` service functions, `GET /api/games/tunein` + `GET /api/games/audio-card-count` routes
- Frontend: types, API, hook update, GamesPanel button with audio-card lock (10 minimum), GameSession wiring, `TuneInGame.tsx` component + CSS
- Player hears a word's audio, picks correct Chinese from 4 options; auto-plays on load, replay button, pinyin hint, correct/wrong feedback with sounds

### Added "Scramble Harder" game
- Like Scrambler but harder: randomly asks to unscramble either the Chinese or English translation
- Decoy words from 2 other random sentences are mixed into the tile pool — forces translation, not just unscrambling
- Locked until 20 generated sentences at the HSK level
- Backend: `ScrambleHarderRound` model, `get_scramble_harder_round()` service (fetches 3 sentences, picks direction, segments, adds distractors), `GET /api/games/scramble-harder` route
- Frontend: types, API, hook update, GamesPanel button with sentences20 lock, GameSession wiring, `ScrambleHarderGame.tsx` component + CSS

### Fixed Mad Libs blank bug
- Bug: LLM sometimes generated sentences that didn't contain the vocab word as an exact substring; `replace(vocab_word, "____")` did nothing, so the full sentence was shown with no blank and no correct answer
- Fix 1 (generation time): added `word not in sentence_zh` check in `_generate_sentence()` — bad sentences now fall back to safe template instead of being stored
- Fix 2 (serve time): `_pick_stored_sentence()` gained `require_word_in_sentence` param — fetches up to 10 candidates and filters; Mad Libs passes `True`
- Cleaned 1 bad sentence from the database

## Outstanding Issues
1. **Beads repo ID mismatch** — Still present from prior sessions
2. **Debug print in main.py** — `Auth enabled (token: xxxx...)` diagnostic print still in lifespan
3. **HSK data gaps** — hsk3-6.json files have only 20 vocab entries each

## Current State

### Phases
- Phase 0 (infrastructure): COMPLETE
- Phase 1 (chatbot): COMPLETE
- Phase 2A (flashcard backend): COMPLETE
- Phase 2B (flashcard frontend): COMPLETE
- Phase 2C (asset worker): COMPLETE
- Phase 3 (chat↔flashcard integration): COMPLETE
- Phase 4 (mobile compatibility & polish): COMPLETE
- Phase 5 (games): COMPLETE (Matching, Mad Libs, Scrambler, Tune In, Scramble Harder)

## What to Do Next
1. Continue with any remaining backlog items

## Key Decisions Made by User
- Login input should be `type="text"` (visible), NOT `type="password"` (masked)
- Space→dash conversion must work on mobile (use `onChange`, not `onKeyDown`)
- Scrambler: no need to show English in completion result (already visible as prompt)
- Scramble Harder: uses half the correct word count as number of distractor words; locked at 20 sentences
