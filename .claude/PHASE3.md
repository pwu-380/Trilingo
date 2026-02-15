# Phase 3 — Chatbot ↔ Flashcard Integration

## Context

Phases 0–2B are complete. Phase 3 adds the first cross-feature integration: users can click Chinese words in chatbot messages and add them as flash cards. This requires jieba-based word segmentation on the backend, a new endpoint for creating cards from a single Chinese word (with auto-generated pinyin + English), and a clickable-word UX on the frontend.

---

## Sub-Phase 3A: Backend — Segmentation + from-word Endpoint ✓ COMPLETE

**Goal:** jieba word segmentation for chat messages, plus a new endpoint to create a flashcard from a single Chinese word with auto-generated pinyin and English.

### Files Changed

| File | Action | What Changed |
|------|--------|-------------|
| `backend/chinese/segmentation.py` | CREATE | `segment_text()`, `segment_to_word_boundaries()` using jieba |
| `backend/models/chat.py` | MODIFY | Added `WordBoundary`, `SegmentedMessageResponse` models |
| `backend/models/flashcard.py` | MODIFY | Added `FlashcardFromWordRequest`, `FlashcardFromWordResponse` models |
| `backend/services/chat_service.py` | MODIFY | Added `segment_message(message_id)` function |
| `backend/services/flashcard_service.py` | MODIFY | Added `create_card_from_word(word, source)` function |
| `backend/routers/chat.py` | MODIFY | Added `POST /api/chat/messages/{id}/segment` |
| `backend/routers/flashcards.py` | MODIFY | Added `POST /api/flashcards/from-word` (before `/{card_id}` routes) |
| `backend/main.py` | MODIFY | Added `jieba.initialize()` to lifespan for preloading |

### Segmentation Module (`backend/chinese/segmentation.py`)

```python
segment_text(text: str) -> list[str]
    # Returns jieba word list; concatenation == original text

segment_to_word_boundaries(text: str) -> list[tuple[int, int, str]]
    # Returns (start, end, word) char offsets indexing into the PinyinPair array
```

### New Endpoints

**`POST /api/chat/messages/{message_id}/segment`**

Response:
```json
{
  "message_id": 42,
  "words": [
    {"start": 0, "end": 2, "word": "你好"},
    {"start": 2, "end": 3, "word": "，"},
    {"start": 3, "end": 5, "word": "今天"}
  ]
}
```

**`POST /api/flashcards/from-word`**

Request: `{"word": "今天", "source": "chat"}`

Response:
```json
{
  "card": {"id": 31, "chinese": "今天", "pinyin": "jīn tiān", "english": "today", ...},
  "duplicate": false
}
```

### from-word Logic

1. Check for duplicate — exact match on `chinese` column → return existing card with `duplicate: true`
2. Auto-generate pinyin via `pinyin_for_text()` (local, fast)
3. Auto-generate English via `provider.generate_text()` (Gemini call)
4. Call existing `create_card()` which handles notes generation in background
5. Return `(card, duplicate_flag)`

---

## Sub-Phase 3B: Frontend — Clickable Words + Card Creation Popup ✓ COMPLETE

**Goal:** Users can click any Chinese word in an assistant message, see a popup, and add it as a flash card with one click.

### Files Changed

| File | Action | What Changed |
|------|--------|-------------|
| `frontend/src/types/chat.ts` | MODIFY | Added `WordBoundary`, `SegmentedMessageResponse` types |
| `frontend/src/types/flashcard.ts` | MODIFY | Added `FromWordResponse` type |
| `frontend/src/api/chat.ts` | MODIFY | Added `segmentMessage(messageId)` function |
| `frontend/src/api/flashcards.ts` | MODIFY | Added `createCardFromWord(word)` function |
| `frontend/src/components/shared/ChineseText.tsx` | MODIFY | Added optional `words` + `onWordClick` props; segmented render mode |
| `frontend/src/components/shared/ChineseText.css` | MODIFY | Added `.clickable` word hover styles |
| `frontend/src/components/chat/WordPopup.tsx` | CREATE | Popup showing word/pinyin + "Add to Flash Cards" button |
| `frontend/src/components/chat/WordPopup.css` | CREATE | Popup styles |
| `frontend/src/components/chat/MessageBubble.tsx` | MODIFY | Fetches segmentation on mount, handles word click, renders popup |
| `frontend/src/components/chat/ChatPanel.tsx` | MODIFY | Accepts + passes `onAddCardFromWord` prop |
| `frontend/src/App.tsx` | MODIFY | Wires `createCardFromWord` API → ChatPanel callback, refreshes fc list on add |

### Data Flow

1. `MessageBubble` mounts → calls `POST /segment` for assistant messages with pinyin → caches `words` in state
2. `ChineseText` receives `words` + `onWordClick` → renders word-grouped pairs as clickable `<span>` elements
3. User clicks word → `WordPopup` appears with word text, pinyin, "Add to Flash Cards" button
4. User clicks "Add" → `App.tsx` callback calls `POST /from-word` → popup shows "Card added!" or "Already in your cards"
5. `fc.refreshCards()` is called so the card appears when user switches to Flash Cards tab

### Cross-Feature Wiring (App.tsx)

Chat components never import flashcard code directly. The callback is injected from `App.tsx`:

```
AuthenticatedApp
├── useChat()
├── useFlashcards()
├── handleAddCardFromWord(word) ← calls createCardFromWord API + fc.refreshCards()
└── TabShell
    ├── ChatPanel ← receives onAddCardFromWord={handleAddCardFromWord}
    └── FlashcardPanel ← unchanged
```

### ChineseText Backward Compatibility

When `words`/`onWordClick` props are absent, renders exactly as before (flat character-by-character). When present, groups `pairs.slice(start, end)` per word, wraps each in a clickable span. Only Chinese words (those with pinyin) are clickable; punctuation is not.

### WordPopup States

`idle` → `adding` → `added`/`duplicate`/`error`. Clicking outside the popup dismisses it via an overlay.

---

## Outstanding Issue — Non-blocking Card Creation (Trilingo-90k, P1)

**Problem**: The `POST /from-word` endpoint calls Gemini synchronously for English translation before returning. The WordPopup overlay blocks chat interaction while the user waits (~1-3s). This violates the key design principle: *card creation must not disrupt chat flow*.

**Symptoms**:
- WordPopup shows "Adding..." with an overlay that prevents clicking/typing in chat
- User cannot continue chatting until the Gemini translation call completes

**Fix approach** (to be implemented):
1. **Frontend**: Remove the blocking overlay from WordPopup. Replace with a non-modal toast notification that auto-dismisses. The popup should close immediately on "Add" click, and a small toast ("Card added!" / "Already in your cards") should appear without blocking interaction.
2. **Backend** (optional): Could also make the endpoint fire-and-forget — return immediately with optimistic response and generate English translation in background. But frontend-only fix may be sufficient if the popup is simply made non-blocking.

**Acceptance criteria**:
- Clicking "Add to Flash Cards" does not prevent the user from continuing to chat
- A non-modal notification confirms success/duplicate/error
- Card still appears in Flash Cards tab after creation

---

## Verification Checklist

1. Segmentation returns correct jieba word boundaries for assistant messages
2. from-word creates cards with auto pinyin + Gemini English + `source='chat'`
3. Duplicate detection works (same word not added twice)
4. Clickable words render with hover highlight in chat
5. Popup UX works (add, duplicate, dismiss)
6. Cards appear in Flash Cards tab after creation
7. No regressions in chat, flashcard CRUD, or quiz
8. ChineseText backward-compatible (flashcard components unchanged)
9. jieba preloads at startup (no cold-start delay)
10. **Card creation does not block chat interaction** (Trilingo-90k)
