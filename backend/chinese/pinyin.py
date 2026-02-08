from pypinyin import pinyin, Style


def annotate_pinyin(text: str) -> list[tuple[str, str]]:
    """Return (character, pinyin) pairs. Non-Chinese chars get empty pinyin.

    pypinyin groups consecutive non-Chinese characters into a single reading,
    so we match readings back to the original text by position.
    """
    readings = pinyin(text, style=Style.TONE, heteronym=False)
    result: list[tuple[str, str]] = []
    pos = 0
    for reading in readings:
        segment = reading[0]
        if text[pos : pos + len(segment)] == segment:
            # Non-Chinese group — split back into individual characters
            for char in segment:
                result.append((char, ""))
            pos += len(segment)
        else:
            # Chinese character — segment is its pinyin
            result.append((text[pos], segment))
            pos += 1
    return result


def pinyin_for_text(text: str) -> str:
    """Return space-separated pinyin for all Chinese characters in text."""
    readings = pinyin(text, style=Style.TONE, heteronym=False)
    parts: list[str] = []
    pos = 0
    for reading in readings:
        segment = reading[0]
        if text[pos : pos + len(segment)] == segment:
            pos += len(segment)
        else:
            parts.append(segment)
            pos += 1
    return " ".join(parts)
