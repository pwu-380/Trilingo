# Phase 4 — Mobile Compatibility & Login Page

## Context

The app currently has no responsive CSS — all layouts use fixed widths (240px sidebar, 480-560px game panels) and there are zero `@media` queries. On mobile, the chat sidebar takes up most of the screen, game grids overflow, and controls are too small for touch. Additionally, the auth flow shows an unhelpful "403 Forbidden" page when no token is present — instead we need a proper login page with passphrase input.

## Part A: Login Page (replaces 403)

### Files to modify
- `frontend/src/App.tsx` — replace the 403 block with a `<LoginPage>` component
- `frontend/src/api/client.ts` — add `login(passphrase)` function that stores token and calls auth check

### New files
- `frontend/src/components/shared/LoginPage.tsx` — login form component
- `frontend/src/components/shared/LoginPage.css` — login page styles

### LoginPage behavior
- Single password input field (type="password"), no username
- Placeholder text: "Enter passphrase" (no hints about word count or format)
- **Space key types a dash** (`-`) instead of a space character
- **Space immediately after a dash does nothing** (prevents double-dash from spacebar)
- "Login" button below the input
- **Enter key** submits (same as clicking Login)
- On failure: show a brief error message ("Incorrect passphrase"), clear the input
- On success: store the passphrase as the token in localStorage, set authState to "ok"
- Dark themed, centered on screen, matches app aesthetic (uses CSS variables)

### Implementation detail for space→dash
In the `onKeyDown` handler of the input:
```ts
if (e.key === " ") {
  e.preventDefault();
  // Only add dash if last char is not already a dash
  if (!value.endsWith("-")) {
    setValue(prev => prev + "-");
  }
}
```

### client.ts changes
- Add `export async function loginWithToken(token: string): Promise<boolean>` that stores the token in localStorage and calls `/api/auth/check`
- No backend changes needed — existing auth middleware already validates the token

## Part B: Responsive CSS (mobile-friendly)

### Guiding principle
**Zero changes to the desktop experience.** Every responsive change lives inside `@media (max-width: 768px)` queries appended to the bottom of existing CSS files. No existing CSS rules are modified — only new mobile-scoped rules are added. The one exception is `ChatPanel.tsx` which needs a small JS addition for the sidebar toggle (but the toggle button is hidden on desktop via CSS).

### Breakpoint strategy
Single breakpoint at `max-width: 768px` for mobile. All changes are CSS-only via `@media` queries appended to existing CSS files.

### File-by-file changes

**`frontend/src/components/shared/TabShell.css`**
- Tab buttons: slightly larger padding for touch targets (12px 8px)
- Font size bump for readability on small screens

**`frontend/src/components/chat/ChatPanel.css`**
- Hide `.session-sidebar` on mobile (`display: none`)
- Need a hamburger/toggle button to show sidebar as an overlay on mobile
- `.message-bubble` max-width → 95%

**`frontend/src/components/chat/ChatPanel.tsx`** (minor JS change)
- Add a state `sidebarOpen` for mobile sidebar toggle
- Add a small button in the chat header to toggle sidebar visibility
- Sidebar renders as a full-screen overlay on mobile when open

**`frontend/src/components/chat/ChatInput.css`**
- Send button: keep compact but touch-friendly (min 44px tap target)

**`frontend/src/components/flashcards/FlashcardPanel.css`**
- Reduce padding (20px → 12px)
- Header: stack vertically on mobile

**`frontend/src/components/flashcards/CardManager.css`**
- `.cm-grid`: change to `grid-template-columns: repeat(auto-fill, minmax(150px, 1fr))` on mobile
- `.cm-toolbar`: wrap flex items
- `.cm-seed`: wrap onto its own line
- `.cm-add-form`: stack vertically (input full width, button below)

**`frontend/src/components/flashcards/QuizView.css`**
- Reduce padding (24px → 12px)
- `.qv-congrats-img` and `.qv-prompt` scale down
- Options: full width, comfortable tap targets (already good at 14px padding)

**`frontend/src/components/games/GamesPanel.css`**
- `.games-grid`: 2 columns instead of 3 on mobile
- `.games-config`: wrap vertically
- Reduce lobby gap (32px → 20px)

**`frontend/src/components/games/MatchingGame.css`**
- `.matching-columns`: reduce gap (40px → 16px)
- Cards: slightly smaller padding but maintain min-height for touch

**`frontend/src/components/games/MadLibsGame.css`**
- `.madlibs-options`: single column instead of 2-column grid on mobile
- Sentence font size: 1.5em → 1.3em on mobile

**`frontend/src/components/games/GameSession.css`**
- `.game-summary-card`: reduce padding (40px → 20px)
- `.game-summary-img`: max-width 100% on mobile

**`frontend/src/components/shared/Toast.css`**
- Ensure toasts don't overflow on narrow screens

**`frontend/src/components/chat/WordPopup.css`**
- Ensure popup doesn't overflow viewport edges on mobile

## Implementation Order

1. **Login page** — LoginPage component + CSS, update App.tsx auth flow, update client.ts
2. **Core responsive CSS** — TabShell, ChatPanel (including sidebar toggle), FlashcardPanel
3. **Game responsive CSS** — GamesPanel, MatchingGame, MadLibsGame, GameSession
4. **Polish** — test all views, adjust tap targets, fix any overflow issues

## Verification

1. Start backend and frontend dev servers
2. Open in desktop browser — verify login page appears, passphrase space→dash works, enter submits, wrong passphrase shows error, correct passphrase logs in
3. Open browser DevTools mobile simulator (iPhone SE / 375px width) — verify all tabs render properly:
   - Chat: sidebar hidden, toggle button works, messages readable
   - Flashcards: cards grid adapts, add form stacks, quiz options tappable
   - Games: lobby grid 2-col, matching/madlibs fit screen
4. Test on actual phone browser over LAN
