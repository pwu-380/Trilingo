import asyncio
import json
import random

from backend.chinese.pinyin import pinyin_for_text
from backend.database import get_db
from backend.models.flashcard import (
    FlashcardResponse,
    QuizAnswerResponse,
    QuizQuestion,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _row_to_card(row) -> FlashcardResponse:
    return FlashcardResponse(
        id=row[0],
        chinese=row[1],
        pinyin=row[2],
        english=row[3],
        notes=row[4],
        audio_path=row[5],
        image_path=row[6],
        active=bool(row[7]),
        created_at=row[8],
        source=row[9],
    )


_CARD_COLS = (
    "id, chinese, pinyin, english, notes, audio_path, image_path, "
    "active, created_at, source"
)


# ---------------------------------------------------------------------------
# AI Notes (background)
# ---------------------------------------------------------------------------

_NOTES_PROMPT = """\
You are a concise Mandarin Chinese study-aid. Given a vocabulary card, \
write ONE short English sentence (max 20 words) with a helpful usage note. \
Examples: "More casual than 您好; common in everyday greetings." \
"Often paired with 一起 when suggesting doing something together."

Card:
  Chinese: {chinese}
  Pinyin: {pinyin}
  English: {english}

Reply with ONLY the note sentence, nothing else."""


async def _generate_notes(card_id: int, chinese: str, pinyin: str, english: str) -> None:
    """Call AI in the background to populate the notes field."""
    try:
        from backend.providers.registry import get_chat_provider

        provider = get_chat_provider()
        prompt = _NOTES_PROMPT.format(chinese=chinese, pinyin=pinyin, english=english)
        notes = await provider.generate_text(prompt)
        notes = notes.strip().strip('"')
        if notes:
            async with get_db() as db:
                await db.execute(
                    "UPDATE flashcards SET notes = ? WHERE id = ?",
                    (notes, card_id),
                )
                await db.commit()
    except Exception:
        pass  # non-critical — card works without notes


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

async def create_card(
    chinese: str,
    pinyin: str,
    english: str,
    notes: str | None = None,
    source: str = "manual",
) -> FlashcardResponse:
    # Auto-generate pinyin if not provided
    if not pinyin.strip():
        pinyin = pinyin_for_text(chinese)

    async with get_db() as db:
        cursor = await db.execute(
            "INSERT INTO flashcards (chinese, pinyin, english, notes, source) "
            "VALUES (?, ?, ?, ?, ?)",
            (chinese, pinyin, english, notes, source),
        )
        await db.commit()
        card_id = cursor.lastrowid
        rows = await db.execute_fetchall(
            f"SELECT {_CARD_COLS} FROM flashcards WHERE id = ?",
            (card_id,),
        )
        card = _row_to_card(rows[0])

    # Fire-and-forget AI notes generation (only if no notes provided)
    if not notes:
        asyncio.create_task(_generate_notes(card_id, chinese, pinyin, english))

    return card


async def list_cards(active_only: bool | None = None) -> list[FlashcardResponse]:
    async with get_db() as db:
        if active_only is True:
            rows = await db.execute_fetchall(
                f"SELECT {_CARD_COLS} FROM flashcards WHERE active = 1 ORDER BY id"
            )
        elif active_only is False:
            rows = await db.execute_fetchall(
                f"SELECT {_CARD_COLS} FROM flashcards WHERE active = 0 ORDER BY id"
            )
        else:
            rows = await db.execute_fetchall(
                f"SELECT {_CARD_COLS} FROM flashcards ORDER BY id"
            )
        return [_row_to_card(r) for r in rows]


async def get_card(card_id: int) -> FlashcardResponse | None:
    async with get_db() as db:
        rows = await db.execute_fetchall(
            f"SELECT {_CARD_COLS} FROM flashcards WHERE id = ?",
            (card_id,),
        )
        if not rows:
            return None
        return _row_to_card(rows[0])


async def update_card(card_id: int, **fields) -> FlashcardResponse | None:
    allowed = {"chinese", "pinyin", "english", "notes", "active"}
    updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
    if not updates:
        return await get_card(card_id)

    # Convert bool active to int for SQLite
    if "active" in updates:
        updates["active"] = int(updates["active"])

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [card_id]

    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT id FROM flashcards WHERE id = ?", (card_id,)
        )
        if not rows:
            return None
        await db.execute(
            f"UPDATE flashcards SET {set_clause} WHERE id = ?",
            values,
        )
        await db.commit()

    return await get_card(card_id)


async def delete_card(card_id: int) -> bool:
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT id FROM flashcards WHERE id = ?", (card_id,)
        )
        if not rows:
            return False
        await db.execute(
            "DELETE FROM flashcard_attempts WHERE card_id = ?", (card_id,)
        )
        await db.execute(
            "DELETE FROM flashcards WHERE id = ?", (card_id,)
        )
        await db.commit()
        return True


# ---------------------------------------------------------------------------
# Quiz
# ---------------------------------------------------------------------------

async def get_quiz_question(quiz_type: str | None = None) -> QuizQuestion | None:
    if quiz_type is None:
        quiz_type = random.choice(["en_to_zh", "zh_to_en"])

    async with get_db() as db:
        # Get all active cards
        rows = await db.execute_fetchall(
            f"SELECT {_CARD_COLS} FROM flashcards WHERE active = 1"
        )
        if not rows:
            return None

        cards = [_row_to_card(r) for r in rows]
        target = random.choice(cards)

        if quiz_type == "en_to_zh":
            prompt = target.english
            correct = target.chinese
            wrong_pool = [c.chinese for c in cards if c.id != target.id]
        else:
            prompt = target.chinese
            correct = target.english
            wrong_pool = [c.english for c in cards if c.id != target.id]

        # Pick up to 3 wrong answers
        wrong = random.sample(wrong_pool, min(3, len(wrong_pool)))
        options = wrong + [correct]
        random.shuffle(options)

        return QuizQuestion(
            card_id=target.id,
            quiz_type=quiz_type,
            prompt=prompt,
            options=options,
        )


async def submit_answer(
    card_id: int, answer: str, quiz_type: str
) -> QuizAnswerResponse | None:
    card = await get_card(card_id)
    if card is None:
        return None

    if quiz_type == "en_to_zh":
        correct_answer = card.chinese
    else:
        correct_answer = card.english

    is_correct = answer.strip() == correct_answer.strip()

    async with get_db() as db:
        await db.execute(
            "INSERT INTO flashcard_attempts (card_id, correct, quiz_type) "
            "VALUES (?, ?, ?)",
            (card_id, int(is_correct), quiz_type),
        )
        await db.commit()

    return QuizAnswerResponse(correct=is_correct, correct_answer=correct_answer)
