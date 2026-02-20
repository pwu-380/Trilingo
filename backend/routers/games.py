from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import APIKeyHeader

from backend.models.game import MatchingRound, MadLibsRound, ScramblerRound, SentenceCount
from backend.services import game_service

_token_header = APIKeyHeader(name="x-trilingo-token", auto_error=False)

router = APIRouter(
    prefix="/api/games",
    tags=["games"],
    dependencies=[Depends(_token_header)],
)


@router.get("/matching", response_model=MatchingRound)
async def get_matching(level: int = Query(1, ge=1, le=3)):
    return await game_service.get_matching_round(level)


@router.get("/madlibs", response_model=MadLibsRound)
async def get_madlibs(level: int = Query(1, ge=1, le=3)):
    try:
        return await game_service.get_madlibs_round(level)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate round: {e}")


@router.get("/sentence-count", response_model=SentenceCount)
async def get_sentence_count(level: int = Query(1, ge=1, le=3)):
    return await game_service.get_sentence_count(level)


@router.get("/scrambler", response_model=ScramblerRound)
async def get_scrambler(level: int = Query(1, ge=1, le=3)):
    try:
        return await game_service.get_scrambler_round(level)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
