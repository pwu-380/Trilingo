import random

from backend.chinese.hsk import get_vocab
from backend.chinese.pinyin import pinyin_for_text
from backend.database import get_db
from backend.models.game import MatchingPair, MatchingRound, MadLibsRound


# ---------------------------------------------------------------------------
# Matching
# ---------------------------------------------------------------------------

async def get_matching_round(hsk_level: int) -> MatchingRound:
    """Return 4 random word pairs for a matching round.

    Prefers active flashcards; supplements from HSK reference data if needed.
    """
    pairs: list[MatchingPair] = []

    # Try flashcards first
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT chinese, pinyin, english, audio_path FROM flashcards WHERE active = 1"
        )
        if rows:
            sampled = random.sample(rows, min(4, len(rows)))
            for r in sampled:
                pairs.append(MatchingPair(
                    chinese=r[0], pinyin=r[1], english=r[2], audio_path=r[3]
                ))

    # Supplement from HSK data if fewer than 4
    if len(pairs) < 4:
        existing_zh = {p.chinese for p in pairs}
        vocab = get_vocab(hsk_level)
        random.shuffle(vocab)
        for entry in vocab:
            if entry["chinese"] not in existing_zh:
                pairs.append(MatchingPair(
                    chinese=entry["chinese"],
                    pinyin=entry["pinyin"],
                    english=entry["english"],
                ))
                existing_zh.add(entry["chinese"])
            if len(pairs) >= 4:
                break

    return MatchingRound(pairs=pairs[:4])


# ---------------------------------------------------------------------------
# MadLibs
# ---------------------------------------------------------------------------

_SENTENCE_PROMPT = """\
You are a Mandarin Chinese teaching assistant.

Generate a natural Chinese sentence using the word "{word}" (HSK {level}).
The sentence should be simple and appropriate for HSK {level} learners.

Reply in EXACTLY this format (two lines, nothing else):
Chinese: <full Chinese sentence>
English: <English translation>"""


async def _generate_sentence(hsk_level: int) -> dict:
    """Pick a random HSK vocab word, generate a sentence via LLM, store it."""
    vocab = get_vocab(hsk_level)
    entry = random.choice(vocab)
    word = entry["chinese"]

    from backend.providers.registry import get_chat_provider
    provider = get_chat_provider()
    prompt = _SENTENCE_PROMPT.format(word=word, level=hsk_level)
    response = await provider.generate_text(prompt)

    # Parse response
    sentence_zh = ""
    sentence_en = ""
    for line in response.strip().split("\n"):
        line = line.strip()
        if line.lower().startswith("chinese:"):
            sentence_zh = line.split(":", 1)[1].strip()
        elif line.lower().startswith("english:"):
            sentence_en = line.split(":", 1)[1].strip()

    if not sentence_zh or not sentence_en:
        # Fallback if parsing fails
        sentence_zh = f"我喜欢{word}。"
        sentence_en = f"I like {entry['english']}."

    # Store in DB
    async with get_db() as db:
        await db.execute(
            "INSERT INTO game_sentences (hsk_level, vocab_word, sentence_zh, sentence_en) "
            "VALUES (?, ?, ?, ?)",
            (hsk_level, word, sentence_zh, sentence_en),
        )
        await db.commit()

    return {"vocab_word": word, "sentence_zh": sentence_zh, "sentence_en": sentence_en}


async def _pick_stored_sentence(hsk_level: int) -> dict | None:
    """Pick a random stored sentence for this level."""
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT vocab_word, sentence_zh, sentence_en FROM game_sentences "
            "WHERE hsk_level = ? ORDER BY RANDOM() LIMIT 1",
            (hsk_level,),
        )
        if not rows:
            return None
        r = rows[0]
        return {"vocab_word": r[0], "sentence_zh": r[1], "sentence_en": r[2]}


def _build_madlibs_options(vocab_word: str, hsk_level: int) -> list[str]:
    """Build 4 options: correct word + 3 distractors from the same HSK level."""
    vocab = get_vocab(hsk_level)
    distractors = [e["chinese"] for e in vocab if e["chinese"] != vocab_word]
    random.shuffle(distractors)
    options = distractors[:3] + [vocab_word]
    random.shuffle(options)
    return options


async def get_madlibs_round(hsk_level: int) -> MadLibsRound:
    """Get a MadLibs round: 50/50 generate new or reuse stored sentence."""
    # 50/50 chance: try stored first, or generate
    use_stored = random.random() < 0.5
    data = None

    if use_stored:
        data = await _pick_stored_sentence(hsk_level)

    if data is None:
        data = await _generate_sentence(hsk_level)

    vocab_word = data["vocab_word"]
    sentence_zh = data["sentence_zh"]
    sentence_en = data["sentence_en"]

    # Create the blank version
    blanked = sentence_zh.replace(vocab_word, "____")

    # Generate pinyin for the full sentence
    pinyin_sentence = pinyin_for_text(sentence_zh)

    # Build options
    options = _build_madlibs_options(vocab_word, hsk_level)

    return MadLibsRound(
        sentence_zh=blanked,
        sentence_en=sentence_en,
        pinyin_sentence=pinyin_sentence,
        vocab_word=vocab_word,
        options=options,
    )
