from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import APIKeyHeader

from backend.models.chat import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatSessionDetail,
    ChatSessionResponse,
    SegmentedMessageResponse,
)
from backend.services import chat_service

_token_header = APIKeyHeader(name="x-trilingo-token", auto_error=False)

router = APIRouter(
    prefix="/api/chat",
    tags=["chat"],
    dependencies=[Depends(_token_header)],
)


@router.post("/sessions", response_model=ChatSessionResponse)
async def create_session():
    return await chat_service.create_session()


@router.get("/sessions", response_model=list[ChatSessionResponse])
async def list_sessions():
    return await chat_service.list_sessions()


@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
async def get_session(session_id: int):
    session = await chat_service.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(session_id: int):
    deleted = await chat_service.delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")


@router.post("/sessions/{session_id}/messages")
async def send_message(session_id: int, body: ChatMessageCreate):
    result = await chat_service.send_message(session_id, body.content)
    if result is None:
        raise HTTPException(status_code=404, detail="Session not found")
    user_msg, assistant_msg = result
    return {"user_message": user_msg, "assistant_message": assistant_msg}


@router.post(
    "/messages/{message_id}/segment",
    response_model=SegmentedMessageResponse,
)
async def segment_message(message_id: int):
    result = await chat_service.segment_message(message_id)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Message not found or not an assistant message",
        )
    return result
