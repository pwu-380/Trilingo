from pydantic import BaseModel


class FlashcardCreate(BaseModel):
    chinese: str
    pinyin: str = ""  # auto-generated if blank
    english: str
    notes: str | None = None
    source: str = "manual"


class FlashcardUpdate(BaseModel):
    chinese: str | None = None
    pinyin: str | None = None
    english: str | None = None
    notes: str | None = None
    active: bool | None = None


class FlashcardResponse(BaseModel):
    id: int
    chinese: str
    pinyin: str
    english: str
    notes: str | None = None
    audio_path: str | None = None
    image_path: str | None = None
    active: bool
    created_at: str
    source: str


class QuizQuestion(BaseModel):
    card_id: int
    quiz_type: str  # 'en_to_zh' or 'zh_to_en'
    prompt: str  # the visible side
    pinyin: str | None = None  # included for zh_to_en (hidden by default in UI)
    options: list[str]  # 4 choices (one correct)
    audio_path: str | None = None
    image_path: str | None = None


class QuizAnswerRequest(BaseModel):
    card_id: int
    answer: str
    quiz_type: str


class QuizAnswerResponse(BaseModel):
    correct: bool
    correct_answer: str


class SeedRequest(BaseModel):
    level: int = 2
    count: int = 10


class FlashcardFromWordRequest(BaseModel):
    word: str
    source: str = "chat"


class FlashcardFromWordResponse(BaseModel):
    card: FlashcardResponse
    duplicate: bool = False
