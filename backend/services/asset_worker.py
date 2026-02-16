"""Background asset generation for flashcards — TTS audio and CC images."""

import asyncio
import logging

import edge_tts
import httpx

from backend.config import ASSETS_DIR, TTS_RATE, TTS_VOICE
from backend.database import get_db

logger = logging.getLogger(__name__)

AUDIO_DIR = ASSETS_DIR / "audio"
IMAGE_DIR = ASSETS_DIR / "images"

OPENVERSE_SEARCH_URL = "https://api.openverse.org/v1/images/"


async def generate_audio(card_id: int, chinese: str) -> None:
    """Generate TTS audio for a flashcard's Chinese text."""
    try:
        out_path = AUDIO_DIR / f"{card_id}.mp3"
        communicate = edge_tts.Communicate(text=chinese, voice=TTS_VOICE, rate=TTS_RATE)
        await communicate.save(str(out_path))

        async with get_db() as db:
            await db.execute(
                "UPDATE flashcards SET audio_path = ? WHERE id = ?",
                (f"audio/{card_id}.mp3", card_id),
            )
            await db.commit()
        logger.info("Generated audio for card %d", card_id)
    except Exception:
        logger.warning("Failed to generate audio for card %d", card_id, exc_info=True)


async def fetch_image(card_id: int, english: str) -> None:
    """Fetch a Creative Commons image from Openverse for the card's English term."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                OPENVERSE_SEARCH_URL,
                params={"q": english, "page_size": 1},
            )
            resp.raise_for_status()
            data = resp.json()
            results = data.get("results", [])
            if not results:
                logger.info("No Openverse image found for card %d (%s)", card_id, english)
                return

            hit = results[0]
            image_url = hit.get("url", "")
            if not image_url:
                return

            img_resp = await client.get(image_url)
            img_resp.raise_for_status()

        out_path = IMAGE_DIR / f"{card_id}.jpg"
        out_path.write_bytes(img_resp.content)

        # Store path with attribution metadata
        creator = hit.get("creator", "Unknown")
        license_name = hit.get("license", "CC")
        image_value = f"images/{card_id}.jpg|{creator}|{license_name}"

        async with get_db() as db:
            await db.execute(
                "UPDATE flashcards SET image_path = ? WHERE id = ?",
                (image_value, card_id),
            )
            await db.commit()
        logger.info("Fetched image for card %d", card_id)
    except Exception:
        logger.warning("Failed to fetch image for card %d", card_id, exc_info=True)


async def process_card_assets(card_id: int, chinese: str, english: str) -> None:
    """Generate audio and fetch image concurrently for a flashcard."""
    await asyncio.gather(
        generate_audio(card_id, chinese),
        fetch_image(card_id, english),
        return_exceptions=True,
    )


async def backfill_assets(batch_size: int = 5) -> int:
    """Queue asset generation for all cards missing audio, in batches."""
    async with get_db() as db:
        rows = await db.execute_fetchall(
            "SELECT id, chinese, english FROM flashcards WHERE audio_path IS NULL"
        )
    if not rows:
        return 0
    total = len(rows)

    async def _process_batches():
        for i in range(0, len(rows), batch_size):
            batch = rows[i : i + batch_size]
            await asyncio.gather(
                *(process_card_assets(r[0], r[1], r[2]) for r in batch)
            )

    asyncio.create_task(_process_batches())
    return total
