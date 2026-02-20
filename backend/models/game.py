from pydantic import BaseModel


class MatchingPair(BaseModel):
    chinese: str
    pinyin: str
    english: str
    audio_path: str | None = None


class MatchingRound(BaseModel):
    pairs: list[MatchingPair]


class MadLibsRound(BaseModel):
    sentence_zh: str  # sentence with ____ blank
    sentence_en: str
    pinyin_sentence: str
    vocab_word: str  # correct answer
    options: list[str]  # 4 choices including correct
    rate_limited: bool = False


class MadLibsGenerateReq(BaseModel):
    hsk_level: int


class ScramblerRound(BaseModel):
    sentence_en: str
    words: list[str]           # Scrambled Chinese word tiles (no punctuation)
    correct_order: list[str]   # Correct sequence of words
    full_sentence_zh: str      # Original sentence with punctuation (shown after)
    pinyin_sentence: str


class SentenceCount(BaseModel):
    hsk_level: int
    count: int
