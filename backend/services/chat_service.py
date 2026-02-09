import json

from backend.chinese.pinyin import annotate_pinyin
from backend.database import get_db
from backend.models.chat import (
    ChatMessageResponse,
    ChatSessionDetail,
    ChatSessionResponse,
    PinyinPair,
)
from backend.providers.base import ChatResponse
from backend.providers.registry import get_chat_provider


async def create_session() -> ChatSessionResponse:
    async with get_db() as db:
        cursor = await db.execute(
            "INSERT INTO chat_sessions (title) VALUES (NULL)"
        )
        await db.commit()
        row = await db.execute_fetchall(
            "SELECT id, created_at, title FROM chat_sessions WHERE id = ?",
            (cursor.lastrowid,),
        )
        r = row[0]
        return ChatSessionResponse(id=r[0], created_at=r[1], title=r[2])


async def list_sessions() -> list[ChatSessionResponse]:
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT id, created_at, title FROM chat_sessions ORDER BY id DESC"
        )
        return [
            ChatSessionResponse(id=r[0], created_at=r[1], title=r[2])
            for r in rows
        ]


async def get_session(session_id: int) -> ChatSessionDetail | None:
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT id, created_at, title FROM chat_sessions WHERE id = ?",
            (session_id,),
        )
        if not rows:
            return None
        r = rows[0]
        msg_rows = await db.execute_fetchall(
            "SELECT id, session_id, role, content, pinyin, translation, feedback, created_at "
            "FROM chat_messages WHERE session_id = ? ORDER BY id",
            (session_id,),
        )
        messages = [_row_to_message(m) for m in msg_rows]
        return ChatSessionDetail(
            id=r[0], created_at=r[1], title=r[2], messages=messages
        )


async def send_message(
    session_id: int, content: str
) -> tuple[ChatMessageResponse, ChatMessageResponse] | None:
    """Send a user message and get an AI response.

    Returns (user_msg, assistant_msg) or None if session not found.
    """
    async with get_db() as db:
        # Verify session exists
        rows = await db.execute_fetchall(
            "SELECT id FROM chat_sessions WHERE id = ?", (session_id,)
        )
        if not rows:
            return None

        # Save user message
        cursor = await db.execute(
            "INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'user', ?)",
            (session_id, content),
        )
        await db.commit()
        user_msg_id = cursor.lastrowid

        # Build conversation history for the provider
        history_rows = await db.execute_fetchall(
            "SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY id",
            (session_id,),
        )
        messages = [{"role": r[0], "content": r[1]} for r in history_rows]

        # Call AI provider
        provider = get_chat_provider()
        ai_response: ChatResponse = await provider.chat(messages)

        # Generate pinyin annotation
        pinyin_pairs = annotate_pinyin(ai_response.response)
        pinyin_json = json.dumps(
            [{"char": c, "pinyin": p} for c, p in pinyin_pairs],
            ensure_ascii=False,
        )

        # Save assistant message
        cursor = await db.execute(
            "INSERT INTO chat_messages (session_id, role, content, pinyin, translation, feedback) "
            "VALUES (?, 'assistant', ?, ?, ?, ?)",
            (
                session_id,
                ai_response.response,
                pinyin_json,
                ai_response.translation,
                ai_response.feedback,
            ),
        )
        await db.commit()
        assistant_msg_id = cursor.lastrowid

        # Auto-title the session on the first exchange
        title_rows = await db.execute_fetchall(
            "SELECT title FROM chat_sessions WHERE id = ?", (session_id,)
        )
        if title_rows and title_rows[0][0] is None:
            # Use first ~20 chars of user's message as title
            title = content[:20].strip()
            if len(content) > 20:
                title += "..."
            await db.execute(
                "UPDATE chat_sessions SET title = ? WHERE id = ?",
                (title, session_id),
            )
            await db.commit()

        # Fetch the saved rows to return
        user_row = await db.execute_fetchall(
            "SELECT id, session_id, role, content, pinyin, translation, feedback, created_at "
            "FROM chat_messages WHERE id = ?",
            (user_msg_id,),
        )
        assistant_row = await db.execute_fetchall(
            "SELECT id, session_id, role, content, pinyin, translation, feedback, created_at "
            "FROM chat_messages WHERE id = ?",
            (assistant_msg_id,),
        )
        return _row_to_message(user_row[0]), _row_to_message(assistant_row[0])


def _row_to_message(row) -> ChatMessageResponse:
    pinyin_data = None
    if row[4]:
        pinyin_data = [PinyinPair(**p) for p in json.loads(row[4])]
    return ChatMessageResponse(
        id=row[0],
        session_id=row[1],
        role=row[2],
        content=row[3],
        pinyin=pinyin_data,
        translation=row[5],
        feedback=row[6],
        created_at=row[7],
    )
