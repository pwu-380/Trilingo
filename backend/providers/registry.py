from backend.config import CHAT_PROVIDER
from backend.providers.base import ChatProvider


def get_chat_provider() -> ChatProvider:
    if CHAT_PROVIDER == "gemini":
        from backend.providers.gemini import GeminiChatProvider

        return GeminiChatProvider()
    raise ValueError(f"Unknown chat provider: {CHAT_PROVIDER}")
