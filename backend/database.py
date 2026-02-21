from contextlib import asynccontextmanager
import json
import logging
from pathlib import Path

import aiosqlite

from backend.config import DB_PATH, ASSETS_DIR, TTS_VOICE, TTS_RATE

logger = logging.getLogger(__name__)

_SCHEMA = """\
CREATE TABLE IF NOT EXISTS chat_sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    title       TEXT
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  INTEGER NOT NULL REFERENCES chat_sessions(id),
    role        TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content     TEXT NOT NULL,
    pinyin      TEXT,
    translation TEXT,
    feedback    TEXT,
    emotion     TEXT DEFAULT 'neutral',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS flashcards (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    chinese     TEXT NOT NULL,
    pinyin      TEXT NOT NULL,
    english     TEXT NOT NULL,
    notes       TEXT,
    audio_path  TEXT,
    image_path  TEXT,
    active      INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    source      TEXT DEFAULT 'manual'
);

CREATE TABLE IF NOT EXISTS flashcard_attempts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id      INTEGER NOT NULL REFERENCES flashcards(id),
    correct      INTEGER NOT NULL CHECK(correct IN (0, 1)),
    quiz_type    TEXT NOT NULL CHECK(quiz_type IN ('en_to_zh', 'zh_to_en')),
    attempted_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS game_sentences (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    hsk_level   INTEGER NOT NULL,
    vocab_word  TEXT NOT NULL,
    sentence_zh TEXT NOT NULL,
    sentence_en TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS dedede_questions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    sentence    TEXT NOT NULL,
    answer      TEXT NOT NULL CHECK(answer IN ('的', '得', '地')),
    english     TEXT NOT NULL,
    pinyin      TEXT NOT NULL
);
"""

_DEDEDE_DATA = Path(__file__).parent / "chinese" / "hsk" / "data" / "dedede.json"


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(_SCHEMA)
        await db.commit()

        # Seed dedede questions if the table is empty
        row = await db.execute_fetchall("SELECT COUNT(*) FROM dedede_questions")
        if row[0][0] == 0:
            questions = json.loads(_DEDEDE_DATA.read_text(encoding="utf-8"))
            await db.executemany(
                "INSERT INTO dedede_questions (sentence, answer, english, pinyin) "
                "VALUES (?, ?, ?, ?)",
                [(q["sentence"], q["answer"], q["english"], q["pinyin"]) for q in questions],
            )
            await db.commit()

    # Generate dedede audio files if missing
    await _ensure_dedede_audio()


_DEDEDE_AUDIO = {
    "的": "audio/dedede_de1.mp3",
    "得": "audio/dedede_de2.mp3",
    "地": "audio/dedede_de3.mp3",
}


async def _ensure_dedede_audio() -> None:
    """Generate TTS audio for 的/得/地 if the files don't exist."""
    audio_dir = ASSETS_DIR / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    missing = [(word, path) for word, path in _DEDEDE_AUDIO.items()
               if not (ASSETS_DIR / path).exists()]
    if not missing:
        return
    try:
        import edge_tts
        for word, rel_path in missing:
            out = ASSETS_DIR / rel_path
            comm = edge_tts.Communicate(text=word, voice=TTS_VOICE, rate=TTS_RATE)
            await comm.save(str(out))
            logger.info("Generated dedede audio: %s", rel_path)
    except Exception:
        logger.warning("Failed to generate dedede audio", exc_info=True)


def get_dedede_audio_path(answer: str) -> str | None:
    """Return the asset-relative audio path for a dedede answer."""
    return _DEDEDE_AUDIO.get(answer)


@asynccontextmanager
async def get_db():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()
