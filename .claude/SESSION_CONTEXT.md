# Session Context — 2026-02-22 (session 14)

## What Was Done This Session

### Added example sentence generation on flash cards
- New backend endpoint `GET /api/flashcards/{card_id}/example-sentence` generates a Chinese sentence using the card's word via LLM
- When the card originated from Mad Libs (source like `madlibs-hsk1`), uses the known HSK level for grammar patterns and stores the generated sentence in the Mad Libs question bank (`game_sentences` table)
- Cards without a known level get a simpler prompt with no HSK level reference
- Falls back to "我喜欢{word}。" if LLM fails or word not in generated sentence

### Flash card UI overhaul — hamburger menu
- Replaced the stacked Shelve/Regen/Example action buttons with a ⋮ hamburger menu
- Dropdown contains: "Shelve" (or "Activate"), "Regenerate Assets", "Make Example Sentence", and "Delete" (only for inactive cards, styled red)
- Dropdown closes on outside click
- Pinyin moved above the Chinese word on each card

### Example sentence display
- Clicking "Make Example Sentence" in the menu generates and shows a sentence inline on the card
- Shows Chinese, pinyin, and English translation
- × close button to dismiss
- Annotated "(Added to Mad Libs question bank)" at the bottom

### Mad Libs → flash card source tracking
- Cards added from Mad Libs now tagged with source `madlibs-hsk{level}` (e.g. `madlibs-hsk1`) instead of generic `chat`
- Source displayed as "Source: Mad Libs - HSK 1" format on cards; "Source: Chat" for chat-origin cards, "Source: Seed" for seeded cards
- Source text bottom-aligned on each card (pushed to bottom via `margin-top: auto` in flex column layout)

### Files changed
- `backend/services/flashcard_service.py` — added `get_example_sentence()`, `_hsk_level_from_source()`
- `backend/routers/flashcards.py` — added `GET /{card_id}/example-sentence` endpoint
- `frontend/src/types/flashcard.ts` — added `ExampleSentence` interface
- `frontend/src/api/flashcards.ts` — added `getExampleSentence()`, updated `createCardFromWord()` to accept optional source
- `frontend/src/components/flashcards/CardManager.tsx` — hamburger menu, example sentence display, source formatting, pinyin-above-chinese layout
- `frontend/src/components/flashcards/CardManager.css` — menu styles, flex card layout, bottom-aligned source
- `frontend/src/App.tsx` — `handleAddCardFromWord` accepts optional source
- `frontend/src/components/games/MadLibsGame.tsx` — passes `madlibs-hsk{level}` source when adding cards
- `frontend/src/components/games/GameSession.tsx` — passes `hskLevel` to MadLibsGame
- `frontend/src/components/games/GamesPanel.tsx` — updated `onAddCardFromWord` type signature

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
- Phase 5 (games): COMPLETE (Matching, Mad Libs, Dedede, Scrambler, Tune In, Scramble Harder)

## What to Do Next
1. Continue with any remaining backlog items

## Key Decisions Made by User
- Login input should be `type="text"` (visible), NOT `type="password"` (masked)
- Space→dash conversion must work on mobile (use `onChange`, not `onKeyDown`)
- Scrambler: no need to show English in completion result (already visible as prompt)
- Scramble Harder: uses half the correct word count as number of distractor words; locked at 20 sentences
- Lobby button order: unlocked games first, then lockable games, then Random
- Flash card action buttons should be a hamburger menu, not stacked buttons
- Do NOT annotate flash cards with inferred HSK levels — only use known levels from source
- Example sentence button label should be short ("Example" in menu form)
- Source text should be bottom-aligned on cards, not line-broken from tip
