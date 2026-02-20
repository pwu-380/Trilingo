# Session Context — 2026-02-19 (session 11)

## What Was Done This Session

### Sentence Builder game — full implementation
- New game in Games tab: user arranges jumbled Chinese words into correct sentence order given an English prompt
- **Backend**: `SentenceBuilderRound` and `SentenceCount` models, `get_sentence_count()` and `get_sentence_builder_round()` service functions, `/sentence-builder` and `/sentence-count` API endpoints
- Reuses existing `game_sentences` table (populated by MadLibs play); segments sentences with jieba, strips punctuation, shuffles words
- **Frontend**: `SentenceBuilderGame.tsx` component with tap-to-place interaction (no drag-and-drop), pinyin hint toggle, clear/check buttons, retry scoring
- **Lobby lock**: Button locked until 10+ sentences exist for selected HSK level; Random mode excludes locked games via `excludeFromRandom` parameter
- Grid changed from 3-column to 2x2 layout for 4 game buttons

### Pinyin hint positioning fix
- Moved pinyin hint from above the English prompt to above the Chinese answer tiles (where it belongs)

### CSS scrolling bug resolved
- User fixed the mobile scrolling/header pinning issue that was broken across multiple sessions
- Changes in: `index.css` (html/body `height:100%; overflow:hidden; position:fixed`; #root `height:100%`), `TabShell.css` (`height:100%`), `LoginPage.css` (`height:100%`), `ChatPanel.css` (`height:100%`), `ChatPanel.tsx` (scrollTo instead of scrollIntoView), `ChatInput.tsx` (removed autoFocus to prevent mobile keyboard viewport issues)

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
- Phase 5 (games): COMPLETE (Matching, MadLibs, Sentence Builder)

## What to Do Next
1. **Editable flash card English translations** — Allow user to manually edit the English translation text on flash cards
2. Continue with any remaining backlog items

## Key Decisions Made by User
- Login input should be `type="text"` (visible), NOT `type="password"` (masked)
- Space→dash conversion must work on mobile (use `onChange`, not `onKeyDown`)
