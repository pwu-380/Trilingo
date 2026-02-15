# HSK Curriculum Reference Library — Implementation Plan

## Context
The project needs a structured, reusable HSK curriculum dataset that future features can query — e.g. scoping chatbot conversations to a specific HSK level, generating level-appropriate flashcards, or building games around level-specific vocabulary and grammar. Currently, HSK data is limited to 30 hardcoded HSK2 seed words in `flashcard_service.py`. This library replaces that with a proper shared resource.

## Location: `backend/chinese/hsk/`

This fits naturally under the existing `backend/chinese/` shared NLP package (alongside `pinyin.py` and `segmentation.py`). It's not a "service" — it's reference data with a thin Python API, so it belongs with the other Chinese language utilities.

## File Structure

```
backend/chinese/hsk/
├── __init__.py          # Public API: get_level(), get_vocab(), get_topics(), etc.
├── data/
│   ├── hsk1.json        # HSK Level 1 curriculum
│   ├── hsk2.json        # HSK Level 2 curriculum
│   ├── hsk3.json        # HSK Level 3 curriculum
│   ├── hsk4.json        # HSK Level 4 curriculum
│   ├── hsk5.json        # HSK Level 5 curriculum
│   └── hsk6.json        # HSK Level 6 curriculum
```

## JSON Schema (per level file)

Each `hskN.json` contains three sections:

```json
{
  "level": 2,
  "vocab": [
    {
      "chinese": "因为",
      "pinyin": "yīn wèi",
      "english": "because"
    }
  ],
  "grammar": [
    {
      "pattern": "因为 A 所以 B",
      "english": "because A, therefore B",
      "example": "因为下雨，所以我没去。"
    }
  ],
  "topics": [
    {
      "id": "shopping",
      "label": "Shopping & prices",
      "description": "Buying things, asking prices, bargaining, using 多少钱"
    }
  ]
}
```

**Why these three sections:**
- **vocab** — word lists for flashcard seeding, level-scoped word selection, difficulty gating
- **grammar** — patterns the chatbot can teach, quiz, or reference in feedback
- **topics** — conversation starters scoped to a level; each topic gives the chatbot enough context to stay in-scope

## Python API (`__init__.py`)

Thin, lazy-loaded accessors:

```python
from backend.chinese.hsk import get_vocab, get_grammar, get_topics, get_level, LEVELS

get_level(2)          # Full dict for HSK2 (vocab + grammar + topics)
get_vocab(2)          # List of vocab entries for HSK2
get_vocab(2, 3)       # Combined vocab for HSK2 + HSK3 (cumulative)
get_grammar(3)        # Grammar patterns for HSK3
get_topics(2)         # Conversation topics for HSK2
LEVELS                # [1, 2, 3, 4, 5, 6]
```

Data is loaded once on first access and cached in module-level dicts. JSON files are read via `importlib.resources` for clean path resolution.

## Migration: Replace Hardcoded Seed Data

The existing `_HSK2_SEED` tuple in `flashcard_service.py` (lines 358-389) gets replaced with:

```python
from backend.chinese.hsk import get_vocab

async def seed_cards() -> int:
    vocab = get_vocab(2)
    # ... insert loop using vocab entries
```

This keeps the seed behavior identical but sources from the reference library.

## Data Sourcing

HSK 1-6 word lists are well-established and publicly available. JSON files will be populated with the standard HSK vocabulary (approximately 150/300/600/1200/2500/5000 words per level). Grammar patterns and topics will be curated to a reasonable starter set per level (10-20 grammar points, 5-10 topics each) — these can be expanded over time.

## Example Future Usage: Level-Scoped Chat

For the feature of starting a conversation within an HSK level's scope, the chat service would:

1. Accept an optional `hsk_level` parameter when creating a session
2. Pull topics from `get_topics(level)` to offer the user conversation starters
3. Inject level context into the system prompt: vocab scope, grammar patterns to practice, topic focus

This plan does **not** implement that feature — just builds the data layer it would depend on.

## Files Modified
- `backend/chinese/hsk/__init__.py` — NEW: public API
- `backend/chinese/hsk/data/hsk1.json` through `hsk6.json` — NEW: curriculum data
- `backend/services/flashcard_service.py` — replace `_HSK2_SEED` with library import

## Verification
1. `python -c "from backend.chinese.hsk import get_vocab; print(len(get_vocab(2)))"` — should print word count
2. `python -c "from backend.chinese.hsk import get_topics; print(get_topics(2))"` — should list topics
3. Start backend, verify seed cards still populate on empty DB
4. Existing flashcard and chat features unchanged
