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


class MadLibsGenerateReq(BaseModel):
    hsk_level: int
