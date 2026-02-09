# Phase 1 — Chatbot Implementation

## Context

Phase 0 bootstrapped the project infrastructure. Phase 1 builds the chatbot — the primary learning interface where the user converses in Mandarin with Gemini, sees pinyin annotations, reveals English translations, and receives grammar feedback.

Phase 1 is split into 4 sub-phases. Each ends with runnable, testable code. A beads gate task between each sub-phase requires user confirmation before proceeding.

---

## Sub-Phase 1A: Backend Foundation

Build config, database, pinyin utility, and provider abstraction. Testable without a Gemini API key.

**Files:**

| File | Action |
|------|--------|
| `backend/config.py` | Populate — load `.env`, expose `GEMINI_API_KEY`, `CHAT_PROVIDER`, `DB_PATH` |
| `backend/database.py` | Populate — `init_db()` creates chat tables, `get_db()` async context manager |
| `backend/chinese/pinyin.py` | Create — `annotate_pinyin(text)`, `pinyin_for_text(text)` using pypinyin |
| `backend/providers/base.py` | Create — Abstract `ChatProvider`, `ChatResponse` model |
| `backend/providers/registry.py` | Create — `get_chat_provider()` factory |
| `backend/models/chat.py` | Create — Pydantic request/response models |
| `backend/main.py` | Modify — Lifespan hook for DB init, temp pinyin debug endpoint |

**Test:** Start backend → `GET /api/debug/pinyin?text=你好` returns pinyin pairs → DB file created with correct tables.

**Gate:** `P1-gate-A` — User tests endpoints and prepares `.env` with Gemini API key.

---

## Sub-Phase 1B: Gemini Provider + Chat API

Wire up Gemini and build the complete chat backend. Testable via curl.

**Files:**

| File | Action |
|------|--------|
| `backend/providers/gemini.py` | Create — `GeminiChatProvider` using `google.genai` async API |
| `backend/services/chat_service.py` | Create — Session CRUD, message persistence, provider + pinyin orchestration |
| `backend/routers/chat.py` | Create — REST endpoints for sessions and messages |
| `backend/main.py` | Modify — Mount chat router, remove debug endpoint |

**Key details:**
- System prompt requests JSON: `{response, translation, feedback}`
- `responseMimeType="application/json"` for structured output
- Full conversation history sent for context
- Pinyin annotation server-side via pypinyin

**Test:** Create session → send Chinese message → get AI response with pinyin/translation/feedback → restart server → history persists.

**Gate:** `P1-gate-B` — User runs curl commands, verifies AI quality and persistence.

---

## Sub-Phase 1C: Frontend Chat UI

Build the browser chat interface with shared components.

**Available assets** (see `frontend/src/assets/MANIFEST.md`):
- Al portrait icons for chat bubbles: neutral, confused, mad (mapped via `emotion` field on assistant messages)
- Large Al profile pic for welcome/about screens

**Files to create:**

| File | Purpose |
|------|---------|
| `frontend/src/types/chat.ts` | TypeScript interfaces (includes `emotion` field) |
| `frontend/src/api/client.ts` | Shared fetch wrapper |
| `frontend/src/api/chat.ts` | Chat API functions |
| `frontend/src/hooks/useChat.ts` | Chat state management |
| `frontend/src/components/shared/ChineseText.tsx` | `<ruby>` pinyin annotations |
| `frontend/src/components/shared/SpoilerBlock.tsx` | Click-to-reveal translation |
| `frontend/src/components/chat/ChatPanel.tsx` | Main layout |
| `frontend/src/components/chat/MessageBubble.tsx` | Message display (shows Al icon matching `emotion`) |
| `frontend/src/components/chat/FeedbackPanel.tsx` | Grammar notes |
| `frontend/src/components/chat/ChatInput.tsx` | Text input |

**Files to modify:** `App.tsx`, `index.css`, `App.css`

**Test:** Open browser → create session → send Chinese → see pinyin above characters → click spoiler for translation → feedback visible → Al icon matches emotion → refresh preserves state.

**Gate:** `P1-gate-C` — User does full browser walkthrough.

---

## Sub-Phase 1D: Tab Shell + Polish

Add tab navigation and polish the experience. Completes Phase 1.

**Files:**

| File | Action |
|------|--------|
| `frontend/src/components/shared/TabShell.tsx` | Create — Tab bar with Chat active, others disabled |
| `frontend/src/App.tsx` | Modify — Wrap in TabShell |

**Polish:** Loading spinner, error states, empty/welcome state, auto-title sessions, backend error responses (404, 400).

**Test (Phase 1 acceptance criteria):**
- Tab bar with Chat active, Flash Cards and Games disabled
- User can start a chat and send Chinese text
- Gemini responds with pinyin above characters
- English translation behind spoiler click
- Grammar feedback visible
- History persists across refreshes

**Gate:** `P1-gate-D` — User confirms all Phase 1 acceptance criteria met.
