# Session Context — 2026-02-18 (session 10)

## What Was Done This Session

### Flashcard Quiz — Auto-play audio on correct answer
- In `zh_to_en` mode (Chinese prompt, English choices), Chinese audio now auto-plays when the user picks the correct answer (if audio is available)
- Manual speaker button still available for on-demand playback
- Fix: `playAudio` useCallback had to be moved above the useEffect that references it (was causing a crash due to use-before-define)

### MadLibs — Grammar-aware sentence generation
- Updated `_SENTENCE_PROMPT` in `game_service.py` to include HSK grammar patterns for the target level
- The LLM is now instructed to demonstrate one of the grammar patterns in the generated sentence if possible
- Imported `get_grammar` from `backend.chinese.hsk` and formats patterns as a bullet list in the prompt

### Mobile chat header pinning — still broken (CSS changes attempted)
- Replaced `position: fixed; inset: 0` diagnostic hack on `.chat-panel` with `flex: 1; min-height: 0; height: auto; overflow: hidden`
- Added `flex: 1` to `.chat-main` in mobile query
- Moved `display: flex; flex-direction: column; overflow: hidden` from TabShell.css mobile-only query to base `.tab-content` rule
- **Still not working** — header still scrolls away on mobile. The height chain fix didn't resolve it.

## What Was Tried and Didn't Work

### Mobile chat header pinning (STILL UNRESOLVED — multiple sessions)
Previous session tried: flex chain with min-height:0, position:sticky, position:fixed on header, position:fixed on chat-panel.

This session tried: proper flex-based height chain (`flex: 1; min-height: 0` all the way down from `.tab-content` to `.chat-panel` to `.chat-main`). Still broken.

**Current CSS state** (mobile media query in ChatPanel.css):
```css
.chat-panel {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  height: auto;
}

.chat-main {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
```

TabShell.css base `.tab-content` now has:
```css
.tab-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

**Possible next steps**: Use browser devtools on the actual mobile device to inspect which element is the scroll container. The theory is `.messages-area` should be the only scrolling element, but something in the chain is still growing with content. Could also try an entirely different approach — e.g., making `.chat-main` use `position: absolute; inset: 0` within a `position: relative` parent.

## Outstanding Issues
1. **Chat header pinning on mobile** — Still broken across two sessions
2. **Beads repo ID mismatch** — Still present from prior sessions
3. **Debug print in main.py** — `Auth enabled (token: xxxx...)` diagnostic print still in lifespan
4. **HSK data gaps** — hsk3-6.json files have only 20 vocab entries each

## Current State

### Phases
- Phase 0 (infrastructure): COMPLETE
- Phase 1 (chatbot): COMPLETE
- Phase 2A (flashcard backend): COMPLETE
- Phase 2B (flashcard frontend): COMPLETE
- Phase 2C (asset worker): COMPLETE
- Phase 3 (chat↔flashcard integration): COMPLETE
- Phase 4 (mobile compatibility & polish): IN PROGRESS — login page done, responsive CSS done, chat header pinning broken
- Phase 5 (games): COMPLETE

## What to Do Next
1. **Fix chat header pinning** — Inspect with mobile devtools to find which element is actually scrolling. Try absolute positioning approach as alternative.
2. **Test all responsive views** — Verify all tabs render properly at 375px width
3. **Commit Phase 4 implementation** — Once chat header is fixed

## Key Decisions Made by User
- Login input should be `type="text"` (visible), NOT `type="password"` (masked)
- Space→dash conversion must work on mobile (use `onChange`, not `onKeyDown`)
