"""HSK Curriculum Reference Library.

Provides structured access to HSK 1-6 vocabulary, grammar patterns,
and conversation topics. Data is lazy-loaded from JSON files and cached.

Usage:
    from backend.chinese.hsk import get_vocab, get_grammar, get_topics, get_level, LEVELS

    get_level(2)          # Full dict for HSK2
    get_vocab(2)          # Vocab entries for HSK2
    get_vocab(2, 3)       # Combined vocab for HSK2 + HSK3
    get_grammar(3)        # Grammar patterns for HSK3
    get_topics(2)         # Conversation topics for HSK2
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

LEVELS: list[int] = [1, 2, 3, 4, 5, 6]

_DATA_DIR = Path(__file__).parent / "data"
_cache: dict[int, dict[str, Any]] = {}


def _load(level: int) -> dict[str, Any]:
    if level not in LEVELS:
        raise ValueError(f"Invalid HSK level: {level}. Must be one of {LEVELS}")
    if level not in _cache:
        path = _DATA_DIR / f"hsk{level}.json"
        with open(path, encoding="utf-8") as f:
            _cache[level] = json.load(f)
    return _cache[level]


def get_level(level: int) -> dict[str, Any]:
    """Return the full curriculum dict for a single HSK level."""
    return _load(level)


def get_vocab(*levels: int) -> list[dict[str, str]]:
    """Return vocab entries for one or more HSK levels (combined)."""
    if not levels:
        raise ValueError("At least one level is required")
    result: list[dict[str, str]] = []
    for lvl in levels:
        result.extend(_load(lvl)["vocab"])
    return result


def get_grammar(level: int) -> list[dict[str, str]]:
    """Return grammar patterns for a single HSK level."""
    return _load(level)["grammar"]


def get_topics(level: int) -> list[dict[str, str]]:
    """Return conversation topics for a single HSK level."""
    return _load(level)["topics"]
