# Session Context — 2026-02-17 (session 9)

## What Was Done This Session

### Phase 4 — Mobile Compatibility & Login Page (partial)
- **Plan committed**: `.claude/PHASE4.md` pushed to main with full implementation plan
- **Login page**: Created `LoginPage.tsx` + `LoginPage.css`, replaced 403 page in `App.tsx`, added `loginWithToken()` to `client.ts`
  - Visible text input (not password type — user preference)
  - Space→dash conversion via `onChange` handler (not `onKeyDown`, which doesn't fire reliably on mobile keyboards)
  - Enter submits, error message on wrong passphrase, clears input on failure
- **Responsive CSS**: Added `@media (max-width: 768px)` queries to 12 CSS files (TabShell, ChatPanel, ChatInput, FlashcardPanel, CardManager, QuizView, GamesPanel, MatchingGame, MadLibsGame, GameSession, Toast, WordPopup)
- **Chat sidebar toggle**: Added hamburger menu button + mobile sidebar overlay with close button in `ChatPanel.tsx`

## What Was Tried and Didn't Work

### Mobile chat header pinning (UNRESOLVED)
The hamburger menu header in the chat tab scrolls away with the messages on mobile instead of staying pinned at the top. Multiple approaches were tried:

1. **Flex chain with `min-height: 0` and `overflow: hidden`** — Added to `.chat-panel`, `.chat-main`, `.tab-content`. Didn't work.
2. **`position: sticky; top: 0`** on the header — Partially worked: header was invisible until you scrolled to the top, then it pinned correctly when scrolling down. The `scrollIntoView()` on new messages scrolls past the sticky header initially.
3. **`position: fixed`** on the header with padding offset — Didn't work either.
4. **`position: fixed; inset: 0`** on `.chat-panel` as a diagnostic test — Still didn't work, suggesting either the CSS wasn't being served or the issue is deeper.

**Root cause theory (from user's coworker)**: The height chain from viewport to `.chat-main` is broken. `.tab-content` gets its height from flex layout (not an explicit `height` property), so `height: 100%` on `.chat-panel` resolves to `auto`. This means `.chat-main` grows with content, making it the scroll container instead of `.messages-area`.

**Key discovery**: The frontend dev server was stale — an old instance was running on port 8732 serving outdated code. A new dev server started on port 8733 but the user reported the same behavior, though it's possible the proxy to backend (port 8731) wasn't working correctly or the browser was still hitting the old server. **User is restarting their computer to kill all stale processes.**

### Current state of the CSS (may need cleanup)
The mobile media query in `ChatPanel.css` currently has these experimental overrides that should be reviewed:
```css
.chat-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.chat-main {
  min-height: 0;
  overflow: hidden;
}
```
The `position: fixed` on `.chat-panel` was meant as a diagnostic — it should either be confirmed working or reverted.

`TabShell.css` mobile query also has:
```css
.tab-content {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

## Outstanding Issues
1. **Chat header pinning on mobile** — Still broken. Need to confirm with fresh dev server after reboot.
2. **Beads repo ID mismatch** — Still present from prior sessions.
3. **Debug print in main.py** — `Auth enabled (token: xxxx...)` diagnostic print still in lifespan.
4. **HSK data gaps** — hsk3-6.json files have only 20 vocab entries each.
5. **Stale dev server** — After reboot, make sure only ONE frontend dev server is running (port 8732) and ONE backend (port 8731).

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
1. **Fix chat header pinning** — After reboot, start fresh dev servers and test. If `position: fixed; inset: 0` on `.chat-panel` works, the fix is to properly constrain the height chain. If it still doesn't work, investigate further (maybe the mobile browser is hitting a cached service worker or similar).
2. **Clean up diagnostic CSS** — Remove `position: fixed` from `.chat-panel` once proper fix is found
3. **Test all responsive views** — Verify all tabs render properly at 375px width
4. **Commit Phase 4 implementation** — Once chat header is fixed

## Key Decisions Made by User
- Login input should be `type="text"` (visible), NOT `type="password"` (masked)
- Space→dash conversion must work on mobile (use `onChange`, not `onKeyDown`)
