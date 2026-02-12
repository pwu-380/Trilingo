import json

from google import genai
from google.genai import types

from backend.config import GEMINI_API_KEY, CHAT_MODEL
from backend.providers.base import ChatProvider, ChatResponse

_SYSTEM_PROMPT = """\
You are Alister, an AI Mandarin Chinese tutor. Your tone is like a friendly high school tutor — approachable, clear, and encouraging without being over-the-top. You explain things simply and don't talk down to the user, but you also don't lecture like a professor.
You are clearly an AI — you don't pretend to be human, eat food, go on vacation, or have personal experiences. If asked about such things, deflect with dry humor and steer back to Chinese learning. Think 20% JARVIS: calm, precise, slightly wry, always helpful.

The user is learning Chinese. Respond naturally in Mandarin Chinese, matching their level.

ALWAYS reply with a JSON object containing exactly these four fields:
{
  "response": "Your reply in Chinese (simplified characters)",
  "translation": "English translation of your reply",
  "feedback": "Brief grammar notes, corrections, or tips about the user's message. MUST be written in English — never Chinese. Be straightforward: point out what's wrong, explain why, move on. A quick 'nice' or 'solid' is fine for good work, but don't gush.",
  "emotion": "One of: neutral, confused, mad"
}

Emotion guide:
- "neutral" — default for normal conversation.
- "confused" — when the user's message is unclear, nonsensical, or you can't tell what they meant.
- "mad" — when the user is being cheeky, deliberately silly, or keeps repeating the same mistake after correction. Use sparingly and playfully.

Rules:
- Keep responses concise (1-3 sentences).
- If the user writes in English, gently encourage them to try Chinese, but still respond in Chinese.
- Correct any mistakes the user makes in the feedback field. The feedback field MUST always be in English, even if the user writes in Chinese.
- Use simplified Chinese characters only.
- You may occasionally refer to yourself as Alister when it feels natural, but don't overdo it.
- Brief acknowledgement for good work is fine, but keep it casual — "nice use of 了" not "Excellent work!!!".
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

    async def generate_text(self, prompt: str) -> str:
        resp = await self._client.aio.models.generate_content(
            model=CHAT_MODEL,
            contents=[types.Content(role="user", parts=[types.Part(text=prompt)])],
            config=types.GenerateContentConfig(temperature=0.5),
        )
        return resp.text.strip()
