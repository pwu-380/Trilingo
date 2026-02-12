from abc import ABC, abstractmethod

from pydantic import BaseModel


class ChatResponse(BaseModel):
    response: str
    translation: str
    feedback: str
    emotion: str = "neutral"


class ChatProvider(ABC):
    @abstractmethod
    async def chat(
        self,
        messages: list[dict[str, str]],
        system_prompt: str | None = None,
    ) -> ChatResponse:
        """Send message history to the AI and get a structured response."""
        ...

    async def generate_text(self, prompt: str) -> str:
        """Generate plain text from a prompt. Override for provider-specific impl."""
        resp = await self.chat(
            [{"role": "user", "content": prompt}],
            system_prompt="Reply with only the requested text, nothing else.",
        )
        return resp.response
