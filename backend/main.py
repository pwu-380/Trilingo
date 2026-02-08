from contextlib import asynccontextmanager

from fastapi import FastAPI, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

from backend.chinese.pinyin import annotate_pinyin
from backend.config import TRILINGO_TOKEN
from backend.database import init_db

PUBLIC_PATHS = {"/api/health"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Trilingo", lifespan=lifespan)

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


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/debug/pinyin")
async def debug_pinyin(text: str = Query(...)):
    pairs = annotate_pinyin(text)
    return {"pairs": [{"char": c, "pinyin": p} for c, p in pairs]}
