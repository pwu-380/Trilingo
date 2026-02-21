import random
import re

from backend.chinese.hsk import get_vocab, get_grammar
from backend.chinese.pinyin import pinyin_for_text
from backend.chinese.segmentation import segment_text
from backend.database import get_db
from backend.models.game import MatchingPair, MatchingRound, MadLibsRound, ScramblerRound, SentenceCount, TuneInRound, AudioCardCount, ScrambleHarderRound
from backend.providers.base import RateLimitError

_ZH_PUNCT = re.compile(r'[，。！？、；：""''《》（）…—\s]+')


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
# Mad Libs
# ---------------------------------------------------------------------------

_SENTENCE_PROMPT = """\
You are a Mandarin Chinese teaching assistant.

Generate a natural Chinese sentence using the word "{word}" (HSK {level}).
The sentence should be simple and appropriate for HSK {level} learners.

Here are the grammar patterns for HSK {level}. If possible, demonstrate one of these patterns in your sentence:
{grammar_patterns}

Reply in EXACTLY this format (two lines, nothing else):
Chinese: <full Chinese sentence>
English: <English translation>"""


async def _generate_sentence(hsk_level: int) -> dict:
    """Pick a random HSK vocab word, generate a sentence via LLM, store it."""
    vocab = get_vocab(hsk_level)
    entry = random.choice(vocab)
    word = entry["chinese"]

    grammar = get_grammar(hsk_level)
    grammar_patterns = "\n".join(
        f"- {g['pattern']} ({g['english']}), e.g. {g['example']}"
        for g in grammar
    )

    from backend.providers.registry import get_chat_provider
    provider = get_chat_provider()
    prompt = _SENTENCE_PROMPT.format(word=word, level=hsk_level, grammar_patterns=grammar_patterns)
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

    if not sentence_zh or not sentence_en or word not in sentence_zh:
        # Fallback if parsing fails or word not present in sentence
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


async def _pick_stored_sentence(hsk_level: int, *, require_word_in_sentence: bool = False) -> dict | None:
    """Pick a random stored sentence for this level.

    If require_word_in_sentence is True, only return sentences where the
    vocab_word actually appears as a substring of sentence_zh (needed for
    Mad Libs blanking).
    """
    async with get_db() as db:
        limit = 10 if require_word_in_sentence else 1
        rows = await db.execute_fetchall(
            "SELECT vocab_word, sentence_zh, sentence_en FROM game_sentences "
            "WHERE hsk_level = ? ORDER BY RANDOM() LIMIT ?",
            (hsk_level, limit),
        )
        if not rows:
            return None
        for r in rows:
            result = {"vocab_word": r[0], "sentence_zh": r[1], "sentence_en": r[2]}
            if not require_word_in_sentence or r[0] in r[1]:
                return result
        return None


def _build_madlibs_options(vocab_word: str, hsk_level: int) -> list[str]:
    """Build 4 options: correct word + 3 distractors from the same HSK level."""
    vocab = get_vocab(hsk_level)
    distractors = [e["chinese"] for e in vocab if e["chinese"] != vocab_word]
    random.shuffle(distractors)
    options = distractors[:3] + [vocab_word]
    random.shuffle(options)
    return options


async def get_madlibs_round(hsk_level: int) -> MadLibsRound:
    """Get a Mad Libs round: 70% reuse stored, 30% generate new."""
    use_stored = random.random() < 0.7
    data = None
    rate_limited = False

    if use_stored:
        data = await _pick_stored_sentence(hsk_level, require_word_in_sentence=True)

    if data is None:
        try:
            data = await _generate_sentence(hsk_level)
        except RateLimitError:
            rate_limited = True
            data = await _pick_stored_sentence(hsk_level, require_word_in_sentence=True)

    # If still no data (empty DB + rate limited), build a simple fallback
    if data is None:
        vocab = get_vocab(hsk_level)
        entry = random.choice(vocab)
        word = entry["chinese"]
        data = {
            "vocab_word": word,
            "sentence_zh": f"我喜欢{word}。",
            "sentence_en": f"I like {entry['english']}.",
        }

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
        rate_limited=rate_limited,
    )


# ---------------------------------------------------------------------------
# Scrambler
# ---------------------------------------------------------------------------

async def get_sentence_count(hsk_level: int) -> SentenceCount:
    """Return how many sentences exist for a given HSK level."""
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT COUNT(*) FROM game_sentences WHERE hsk_level = ?",
            (hsk_level,),
        )
        count = rows[0][0] if rows else 0
    return SentenceCount(hsk_level=hsk_level, count=count)


async def get_scrambler_round(hsk_level: int) -> ScramblerRound:
    """Pick a stored sentence and turn it into a word-ordering puzzle."""
    data = await _pick_stored_sentence(hsk_level)
    if data is None:
        raise ValueError("Not enough sentences")

    sentence_zh: str = data["sentence_zh"]
    sentence_en: str = data["sentence_en"]

    # Segment and strip punctuation
    segments = segment_text(sentence_zh)
    correct_order = [seg for seg in segments if not _ZH_PUNCT.fullmatch(seg)]

    if not correct_order:
        raise ValueError("Sentence produced no word segments")

    # Shuffle until different from correct (up to 10 attempts)
    words = list(correct_order)
    if len(words) > 1:
        for _ in range(10):
            random.shuffle(words)
            if words != correct_order:
                break

    pinyin_sentence = pinyin_for_text(sentence_zh)

    return ScramblerRound(
        sentence_en=sentence_en,
        words=words,
        correct_order=correct_order,
        full_sentence_zh=sentence_zh,
        pinyin_sentence=pinyin_sentence,
    )


# ---------------------------------------------------------------------------
# Tune In
# ---------------------------------------------------------------------------

async def get_audio_card_count() -> AudioCardCount:
    """Return how many active flashcards have audio."""
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT COUNT(*) FROM flashcards WHERE active = 1 AND audio_path IS NOT NULL"
        )
        count = rows[0][0] if rows else 0
    return AudioCardCount(count=count)


async def get_tunein_round(hsk_level: int) -> TuneInRound:
    """Pick a random flashcard with audio and build a 4-option listening round."""
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT chinese, pinyin, english, audio_path "
            "FROM flashcards WHERE active = 1 AND audio_path IS NOT NULL"
        )

    if not rows:
        raise ValueError("Not enough audio cards")

    # Pick one correct answer
    correct_row = random.choice(rows)
    correct_zh = correct_row[0]
    correct_pinyin = correct_row[1]
    correct_english = correct_row[2]
    audio_path = correct_row[3]

    # Build distractors from remaining flashcards
    other = [r[0] for r in rows if r[0] != correct_zh]
    random.shuffle(other)
    distractors = other[:3]

    # Supplement from HSK data if not enough distractors
    if len(distractors) < 3:
        existing = {correct_zh} | set(distractors)
        vocab = get_vocab(hsk_level)
        random.shuffle(vocab)
        for entry in vocab:
            if entry["chinese"] not in existing:
                distractors.append(entry["chinese"])
                existing.add(entry["chinese"])
            if len(distractors) >= 3:
                break

    options = distractors[:3] + [correct_zh]
    random.shuffle(options)

    return TuneInRound(
        audio_path=audio_path,
        correct=correct_zh,
        correct_pinyin=correct_pinyin,
        correct_english=correct_english,
        options=options,
    )


# ---------------------------------------------------------------------------
# Scramble Harder
# ---------------------------------------------------------------------------

_EN_PUNCT = re.compile(r'[.,!?;:"\'\-—…()\s]+')

SCRAMBLE_HARDER_MIN = 20


async def _pick_stored_sentences(hsk_level: int, count: int) -> list[dict]:
    """Pick multiple distinct random stored sentences for this level."""
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT vocab_word, sentence_zh, sentence_en FROM game_sentences "
            "WHERE hsk_level = ? ORDER BY RANDOM() LIMIT ?",
            (hsk_level, count),
        )
    return [{"vocab_word": r[0], "sentence_zh": r[1], "sentence_en": r[2]} for r in rows]


def _segment_english(text: str) -> list[str]:
    """Split English sentence into words, stripping punctuation."""
    return [w for w in _EN_PUNCT.split(text) if w]


async def get_scramble_harder_round(hsk_level: int) -> ScrambleHarderRound:
    """Build a scramble round with distractor words from other sentences."""
    sentences = await _pick_stored_sentences(hsk_level, 3)
    if len(sentences) < 3:
        raise ValueError("Not enough sentences")

    main = sentences[0]
    distractors_src = sentences[1:3]

    sentence_zh: str = main["sentence_zh"]
    sentence_en: str = main["sentence_en"]

    # Randomly pick direction
    direction = random.choice(["zh", "en"])

    if direction == "zh":
        # Unscramble Chinese; prompt is English
        prompt = sentence_en
        segments = segment_text(sentence_zh)
        correct_order = [seg for seg in segments if not _ZH_PUNCT.fullmatch(seg)]
        # Distractor words from the other sentences (Chinese)
        distractor_words: list[str] = []
        for ds in distractors_src:
            segs = segment_text(ds["sentence_zh"])
            filtered = [s for s in segs if not _ZH_PUNCT.fullmatch(s)]
            distractor_words.extend(filtered)
    else:
        # Unscramble English; prompt is Chinese
        prompt = sentence_zh
        correct_order = _segment_english(sentence_en)
        # Distractor words from the other sentences (English)
        distractor_words = []
        for ds in distractors_src:
            distractor_words.extend(_segment_english(ds["sentence_en"]))

    if not correct_order:
        raise ValueError("Sentence produced no word segments")

    # Pick roughly half the correct word count as distractors
    num_distractors = max(1, len(correct_order) // 2)
    # Remove duplicates of correct words from distractors
    correct_set = set(correct_order)
    unique_distractors = [w for w in distractor_words if w not in correct_set]
    random.shuffle(unique_distractors)
    chosen_distractors = unique_distractors[:num_distractors]

    # Combine and shuffle all words
    words = list(correct_order) + chosen_distractors
    random.shuffle(words)

    pinyin_sentence = pinyin_for_text(sentence_zh)

    return ScrambleHarderRound(
        direction=direction,
        prompt=prompt,
        words=words,
        correct_order=correct_order,
        num_correct=len(correct_order),
        full_sentence_zh=sentence_zh,
        full_sentence_en=sentence_en,
        pinyin_sentence=pinyin_sentence,
    )
