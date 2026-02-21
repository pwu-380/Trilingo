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


class TuneInRound(BaseModel):
    audio_path: str
    correct: str
    correct_pinyin: str
    correct_english: str
    options: list[str]


class AudioCardCount(BaseModel):
    count: int


class DededeRound(BaseModel):
    sentence: str              # sentence with ____ blank
    english: str
    pinyin: str
    answer: str                # correct: 的, 得, or 地
    audio_path: str | None = None  # TTS audio for the correct particle


class ScrambleHarderRound(BaseModel):
    direction: str               # "zh" or "en" — language to unscramble
    prompt: str                  # the other language shown as the clue
    words: list[str]             # all tiles (correct + distractors), shuffled
    correct_order: list[str]     # correct sequence of words to place
    num_correct: int             # how many tiles belong to the answer
    full_sentence_zh: str
    full_sentence_en: str
    pinyin_sentence: str
