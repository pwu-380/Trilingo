from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import APIKeyHeader

from backend.models.flashcard import (
    FlashcardCreate,
    FlashcardFromWordRequest,
    FlashcardFromWordResponse,
    FlashcardResponse,
    FlashcardUpdate,
    QuizAnswerRequest,
    QuizAnswerResponse,
    QuizQuestion,
)
from backend.services import flashcard_service

_token_header = APIKeyHeader(name="x-trilingo-token", auto_error=False)

router = APIRouter(
    prefix="/api/flashcards",
    tags=["flashcards"],
    dependencies=[Depends(_token_header)],
)


@router.get("", response_model=list[FlashcardResponse])
async def list_cards(active: bool | None = Query(None)):
    return await flashcard_service.list_cards(active_only=active)


@router.post("", response_model=FlashcardResponse)
async def create_card(body: FlashcardCreate):
    return await flashcard_service.create_card(
        chinese=body.chinese,
        pinyin=body.pinyin,
        english=body.english,
        notes=body.notes,
        source=body.source,
    )


@router.get("/quiz", response_model=QuizQuestion)
async def get_quiz(
    quiz_type: str | None = Query(None),
    exclude: str | None = Query(None, description="Comma-separated card IDs to exclude"),
):
    exclude_ids = [int(x) for x in exclude.split(",") if x.strip()] if exclude else None
    question = await flashcard_service.get_quiz_question(quiz_type, exclude_ids=exclude_ids)
    if question is None:
        raise HTTPException(status_code=404, detail="No active cards available")
    return question


@router.post("/from-word", response_model=FlashcardFromWordResponse)
async def create_from_word(body: FlashcardFromWordRequest):
    return await flashcard_service.create_card_from_word(
        word=body.word, source=body.source
    )


@router.post("/quiz/answer", response_model=QuizAnswerResponse)
async def submit_answer(body: QuizAnswerRequest):
    result = await flashcard_service.submit_answer(
        card_id=body.card_id, answer=body.answer, quiz_type=body.quiz_type
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Card not found")
    return result


@router.get("/{card_id}", response_model=FlashcardResponse)
async def get_card(card_id: int):
    card = await flashcard_service.get_card(card_id)
    if card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@router.patch("/{card_id}", response_model=FlashcardResponse)
async def update_card(card_id: int, body: FlashcardUpdate):
    card = await flashcard_service.update_card(card_id, **body.model_dump(exclude_unset=True))
    if card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@router.delete("/{card_id}", status_code=204)
async def delete_card(card_id: int):
    result = await flashcard_service.delete_card(card_id)
    if result is False:
        raise HTTPException(status_code=404, detail="Card not found")
    if isinstance(result, str):
        raise HTTPException(status_code=400, detail=result)
