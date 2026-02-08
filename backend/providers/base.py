from abc import ABC, abstractmethod

from pydantic import BaseModel


class ChatResponse(BaseModel):
    response: str
    translation: str
    feedback: str


class ChatProvider(ABC):
    @abstractmethod
    async def chat(
        self,
        messages: list[dict[str, str]],
        system_prompt: str | None = None,
    ) -> ChatResponse:
        """Send message history to the AI and get a structured response."""
        ...
