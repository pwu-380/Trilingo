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


async def delete_card(card_id: int) -> bool | str:
    """Delete a card. Only inactive cards can be deleted.

    Returns True on success, False if not found, or an error string
    if the card is still active.
    """
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT id, active FROM flashcards WHERE id = ?", (card_id,)
        )
        if not rows:
            return False
        if rows[0][1] == 1:
            return "Cannot delete an active card. Deactivate it first."
        await db.execute(
            "DELETE FROM flashcard_attempts WHERE card_id = ?", (card_id,)
        )
        await db.execute(
            "DELETE FROM flashcards WHERE id = ?", (card_id,)
        )
        await db.commit()
        return True


# ---------------------------------------------------------------------------
# Quiz — weighted card selection
# ---------------------------------------------------------------------------

_WINDOW_SIZE = 10  # look at last N attempts per card for weighting


async def _get_card_weights(db) -> dict[int, float]:
    """Compute selection weights for active cards based on correctness history.

    Cards with lower correctness get higher weight (appear more often).
    Cards with no history get weight 1.0 (same as 0% correct).
    """
    rows = await db.execute_fetchall(
        "SELECT id FROM flashcards WHERE active = 1"
    )
    card_ids = [r[0] for r in rows]
    if not card_ids:
        return {}

    weights: dict[int, float] = {}
    for card_id in card_ids:
        attempts = await db.execute_fetchall(
            "SELECT correct FROM flashcard_attempts WHERE card_id = ? "
            "ORDER BY id DESC LIMIT ?",
            (card_id, _WINDOW_SIZE),
        )
        if not attempts:
            weights[card_id] = 1.0  # no history — full weight
        else:
            correctness = sum(a[0] for a in attempts) / len(attempts)
            # Invert: 100% correct → 0.1 weight, 0% correct → 1.0 weight
            weights[card_id] = max(0.1, 1.0 - correctness * 0.9)
    return weights


async def get_quiz_question(
    quiz_type: str | None = None,
    exclude_ids: list[int] | None = None,
    last_quiz_type: str | None = None,
) -> QuizQuestion | None:
    if quiz_type is None:
        if last_quiz_type == "en_to_zh":
            quiz_type = "zh_to_en"
        elif last_quiz_type == "zh_to_en":
            quiz_type = "en_to_zh"
        else:
            quiz_type = random.choice(["en_to_zh", "zh_to_en"])

    async with get_db() as db:
        rows = await db.execute_fetchall(
            f"SELECT {_CARD_COLS} FROM flashcards WHERE active = 1"
        )
        if not rows:
            return None

        cards = [_row_to_card(r) for r in rows]

        # Filter out already-seen cards in this session
        available = [c for c in cards if c.id not in (exclude_ids or [])]
        if not available:
            return None  # session exhausted

        # Weighted random selection
        weights = await _get_card_weights(db)
        pool = available
        w = [weights.get(c.id, 1.0) for c in pool]
        target = random.choices(pool, weights=w, k=1)[0]

        if quiz_type == "en_to_zh":
            prompt = target.english
            correct = target.chinese
            wrong_pool = [c.chinese for c in cards if c.id != target.id]
        else:
            prompt = target.chinese
            correct = target.english
            wrong_pool = [c.english for c in cards if c.id != target.id]

        # Deduplicate wrong options and pick up to 3
        wrong_pool = list(set(wrong_pool) - {correct})
        wrong = random.sample(wrong_pool, min(3, len(wrong_pool)))
        options = wrong + [correct]
        random.shuffle(options)

        return QuizQuestion(
            card_id=target.id,
            quiz_type=quiz_type,
            prompt=prompt,
            pinyin=target.pinyin if quiz_type == "zh_to_en" else None,
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


# ---------------------------------------------------------------------------
# Seed data — HSK Level 2
# ---------------------------------------------------------------------------

_HSK2_SEED = [
    ("因为", "yīn wèi", "because"),
    ("所以", "suǒ yǐ", "so / therefore"),
    ("但是", "dàn shì", "but / however"),
    ("已经", "yǐ jīng", "already"),
    ("一起", "yī qǐ", "together"),
    ("准备", "zhǔn bèi", "to prepare"),
    ("知道", "zhī dào", "to know"),
    ("介绍", "jiè shào", "to introduce"),
    ("希望", "xī wàng", "to hope / wish"),
    ("觉得", "jué de", "to feel / think"),
    ("生日", "shēng rì", "birthday"),
    ("考试", "kǎo shì", "exam / test"),
    ("问题", "wèn tí", "question / problem"),
    ("旁边", "páng biān", "beside / next to"),
    ("眼睛", "yǎn jīng", "eyes"),
    ("身体", "shēn tǐ", "body / health"),
    ("哥哥", "gē ge", "older brother"),
    ("姐姐", "jiě jie", "older sister"),
    ("弟弟", "dì di", "younger brother"),
    ("妹妹", "mèi mei", "younger sister"),
    ("丈夫", "zhàng fu", "husband"),
    ("妻子", "qī zi", "wife"),
    ("游泳", "yóu yǒng", "to swim"),
    ("跑步", "pǎo bù", "to run / jog"),
    ("唱歌", "chàng gē", "to sing"),
    ("跳舞", "tiào wǔ", "to dance"),
    ("公司", "gōng sī", "company"),
    ("教室", "jiào shì", "classroom"),
    ("机场", "jī chǎng", "airport"),
    ("牛奶", "niú nǎi", "milk"),
]


async def seed_cards() -> int:
    """Insert HSK Level 2 seed data if the flashcards table is empty.

    Returns the number of cards seeded (0 if table already has data).
    """
    async with get_db() as db:
        rows = await db.execute_fetchall("SELECT COUNT(*) FROM flashcards")
        if rows[0][0] > 0:
            return 0

        for chinese, pinyin, english in _HSK2_SEED:
            await db.execute(
                "INSERT INTO flashcards (chinese, pinyin, english, source) "
                "VALUES (?, ?, ?, 'seed')",
                (chinese, pinyin, english),
            )
        await db.commit()
        return len(_HSK2_SEED)
