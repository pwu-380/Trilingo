# Session Context — 2026-02-16 (session 6)

## What Was Done This Session

### Phase 2C — Asset Worker Implementation — COMPLETE
Built the background asset worker that generates TTS audio and fetches CC images for flashcards:

- **`backend/services/asset_worker.py`** (NEW) — `generate_audio()` (edge-tts), `fetch_image()` (Openverse API), `process_card_assets()` (concurrent via asyncio.gather), `backfill_assets()` (processes all missing cards in batches on startup)
- **`backend/config.py`** — Added `ASSETS_DIR`, `TTS_VOICE` (zh-CN-XiaoxiaoNeural), `TTS_RATE` (-15%)
- **`backend/main.py`** — Static file mount at `/assets/`, backfill on startup, lowercase normalization migration, `/assets/` paths bypass auth
- **`backend/routers/flashcards.py`** — `GET /{id}/audio` endpoint (serves MP3), `POST /{id}/regenerate` endpoint (clears + re-queues assets and notes)
- **`backend/services/flashcard_service.py`** — `process_card_assets()` fire-and-forget after card creation, `regenerate_card_assets()` for manual regen, English normalized to lowercase
- **`backend/models/flashcard.py`** — Added `audio_path` and `image_path` to `QuizQuestion`

### Frontend Changes
- **CardManager** — Speaker button on cards with audio, CC image thumbnails with attribution between pinyin and English, "Regen" button to regenerate assets/tip, vertical action button layout, Chinese text bumped to 1.6em
- **QuizView** — Speaker button for zh_to_en Chinese prompts, image displayed above English prompt for en_to_zh questions, audio plays on answer click for en_to_zh
- **useFlashcards** — `pollForNotes` → `pollForAssets` (polls for notes + audio), `regenerateAssets()` method
- **api/client.ts** — `authedUrl()` helper for token-authenticated media URLs
- **api/flashcards.ts** — `regenerateAssets()` API function
- **vite.config.ts** — Added `/assets` to dev proxy

### Bug Fixes
- Audio 403 — `new Audio()` didn't attach auth token; fixed with `authedUrl()` query param
- Images not loading — `/assets/` not proxied through Vite dev server
- Backfill only processing 5 cards — changed to process all missing cards in batches
- Removed unused `onRefresh` prop threading (pre-existing build error)

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
1. **Remove debug print** — Quick cleanup
2. **Phase 4** — Games tab implementation
3. **Expand HSK data** — hsk3-6.json files have only 20 vocab entries each

## Key Decisions Made by User
- Phase 2C images are an "English component" — displayed between pinyin and English on cards, and above English prompt in quiz
- en_to_zh answer clicks play audio for pronunciation reinforcement
- "Regen" button on every card for manual asset regeneration
- All English text normalized to lowercase for consistency
