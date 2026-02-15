import jieba


def segment_text(text: str) -> list[str]:
    """Return jieba word list; concatenation == original text."""
    return list(jieba.cut(text, cut_all=False))


def segment_to_word_boundaries(text: str) -> list[tuple[int, int, str]]:
    """Return (start, end, word) tuples with char offsets into the text.

    Offsets index into the character-level PinyinPair array stored with each
    message, so the frontend can do `pairs.slice(start, end)` to get the
    pairs for one word.
    """
    words = segment_text(text)
    boundaries: list[tuple[int, int, str]] = []
    pos = 0
    for word in words:
        end = pos + len(word)
        boundaries.append((pos, end, word))
        pos = end
    return boundaries
