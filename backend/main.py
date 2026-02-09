from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from starlette.responses import JSONResponse

from backend.config import TRILINGO_TOKEN
from backend.database import init_db
from backend.routers import chat

PUBLIC_PATHS = {"/api/health", "/docs", "/openapi.json", "/redoc"}

_token_scheme = APIKeyHeader(name="x-trilingo-token", auto_error=False)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Trilingo",
    lifespan=lifespan,
    swagger_ui_init_oauth={},
    swagger_ui_parameters={"persistAuthorization": True},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def check_token(request: Request, call_next):
    if not TRILINGO_TOKEN or request.url.path in PUBLIC_PATHS:
        return await call_next(request)

    token = (
        request.query_params.get("token")
        or request.headers.get("x-trilingo-token")
        or request.cookies.get("trilingo_token")
    )
    if token != TRILINGO_TOKEN:
        return JSONResponse({"detail": "Unauthorized"}, status_code=401)
    return await call_next(request)


app.include_router(chat.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
