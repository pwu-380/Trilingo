# Session Context — 2026-02-23 (session 17)

## What Was Done This Session

### Sentence Browser: search/filter
- Added a search input to the Sentence Browser header
- Filters client-side across Chinese sentences, English sentences, and vocab words
- Chinese matches are exact (case-insensitive by nature), English is case-insensitive
- Pagination and count update to reflect filtered results (e.g., "42 / 200 sentences")
- Shows "No sentences match '...'" when search has no results
- Works in combination with the HSK level dropdown filter

## Outstanding Issues
1. **Beads repo ID mismatch** — Still present from prior sessions
2. **Debug print in main.py** — `Auth enabled (token: xxxx...)` diagnostic print still in lifespan
3. **HSK data gaps** — hsk4-6.json files have only 20 vocab entries each (hsk3 now confirmed OK with 1012 vocab)
4. **Gemini JSON parse errors** — Handled gracefully but root cause is in the Gemini SDK; may recur

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
1. Continue user testing games (especially Random mode)
2. Continue with any remaining backlog items

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
- Sentence Browser: plain text HSK level numbers (no colored badges/emojis), table layout, paginated
- Hide HSK level badge for games that don't meaningfully depend on it (matching, dedede)
