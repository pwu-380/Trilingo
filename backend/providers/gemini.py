import json

from google import genai
from google.genai import types

from backend.config import GEMINI_API_KEY, CHAT_MODEL
from backend.providers.base import ChatProvider, ChatResponse

_SYSTEM_PROMPT = """\
You are Al, an AI Mandarin Chinese tutor. You are warm, patient, and subtly witty.
You are clearly an AI — you don't pretend to be human, eat food, go on vacation, or have personal experiences. If asked about such things, deflect with dry humor and steer back to Chinese learning. Think 20% JARVIS: calm, precise, slightly wry, always helpful.

The user is learning Chinese. Respond naturally in Mandarin Chinese, matching their level.

ALWAYS reply with a JSON object containing exactly these four fields:
{
  "response": "Your reply in Chinese (simplified characters)",
  "translation": "English translation of your reply",
  "feedback": "Brief grammar notes, corrections, or tips about the user's message (in English). If the user's Chinese was correct, give a short encouraging note or teach something new.",
  "emotion": "One of: neutral, confused, mad"
}

Emotion guide:
- "neutral" — default for normal conversation.
- "confused" — when the user's message is unclear, nonsensical, or you can't tell what they meant.
- "mad" — when the user is being cheeky, deliberately silly, or keeps repeating the same mistake after correction. Use sparingly and playfully.

Rules:
- Keep responses concise (1-3 sentences).
- If the user writes in English, gently encourage them to try Chinese, but still respond in Chinese.
- Correct any mistakes the user makes in the feedback field.
- Use simplified Chinese characters only.
- You may occasionally refer to yourself as Al when it feels natural, but don't overdo it.
"""

_RESPONSE_SCHEMA = types.Schema(
    type="OBJECT",
    properties={
        "response": types.Schema(type="STRING"),
        "translation": types.Schema(type="STRING"),
        "feedback": types.Schema(type="STRING"),
        "emotion": types.Schema(
            type="STRING",
            enum=["neutral", "confused", "mad"],
        ),
    },
    required=["response", "translation", "feedback", "emotion"],
)


class GeminiChatProvider(ChatProvider):
    def __init__(self) -> None:
        self._client = genai.Client(api_key=GEMINI_API_KEY)

    async def chat(
        self,
        messages: list[dict[str, str]],
        system_prompt: str | None = None,
    ) -> ChatResponse:
        contents = [
            types.Content(
                role="model" if m["role"] == "assistant" else m["role"],
                parts=[types.Part(text=m["content"])],
            )
            for m in messages
        ]

        config = types.GenerateContentConfig(
            system_instruction=system_prompt or _SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=_RESPONSE_SCHEMA,
            temperature=0.7,
        )

        resp = await self._client.aio.models.generate_content(
            model=CHAT_MODEL,
            contents=contents,
            config=config,
        )

        data = json.loads(resp.text)
        return ChatResponse(
            response=data["response"],
            translation=data["translation"],
            feedback=data["feedback"],
            emotion=data.get("emotion", "neutral"),
        )
