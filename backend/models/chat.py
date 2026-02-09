from pydantic import BaseModel


class ChatSessionCreate(BaseModel):
    pass


class PinyinPair(BaseModel):
    char: str
    pinyin: str


class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    pinyin: list[PinyinPair] | None = None
    translation: str | None = None
    feedback: str | None = None
    emotion: str | None = None
    created_at: str


class ChatSessionResponse(BaseModel):
    id: int
    created_at: str
    title: str | None = None


class ChatSessionDetail(ChatSessionResponse):
    messages: list[ChatMessageResponse] = []
