from contextlib import asynccontextmanager

import aiosqlite

from backend.config import DB_PATH

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
"""


async def init_db() -> None:
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(_SCHEMA)
        await db.commit()


@asynccontextmanager
async def get_db():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()
