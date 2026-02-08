from contextlib import asynccontextmanager

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from backend.chinese.pinyin import annotate_pinyin
from backend.database import init_db


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


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/debug/pinyin")
async def debug_pinyin(text: str = Query(...)):
    pairs = annotate_pinyin(text)
    return {"pairs": [{"char": c, "pinyin": p} for c, p in pairs]}
