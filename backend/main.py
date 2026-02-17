from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from fastapi.staticfiles import StaticFiles
from starlette.responses import JSONResponse

from backend.config import ASSETS_DIR, TRILINGO_TOKEN
from backend.database import init_db
from backend.routers import chat, flashcards, games
from backend.services.asset_worker import backfill_assets

PUBLIC_PATHS = {"/api/health", "/docs", "/openapi.json", "/redoc"}

_token_scheme = APIKeyHeader(name="x-trilingo-token", auto_error=False)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Preload jieba dictionary to avoid cold-start delay
    import jieba
    jieba.initialize()
    print("jieba dictionary loaded")
    # Normalize existing English to lowercase
    from backend.database import get_db
    async with get_db() as db:
        await db.execute("UPDATE flashcards SET english = LOWER(english) WHERE english != LOWER(english)")
        await db.commit()
    # Backfill assets for cards missing audio/images
    queued = await backfill_assets(batch_size=5)
    if queued:
        print(f"Queued asset generation for {queued} cards")
    if TRILINGO_TOKEN:
        print(f"Auth enabled (token: {TRILINGO_TOKEN[:4]}...)")
    else:
        print("Auth DISABLED — no TRILINGO_TOKEN set")
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
    if not TRILINGO_TOKEN or request.url.path in PUBLIC_PATHS or request.url.path.startswith("/assets/"):
        return await call_next(request)

    token = (
        request.query_params.get("token")
        or request.headers.get("x-trilingo-token")
        or request.cookies.get("trilingo_token")
    )
    if token != TRILINGO_TOKEN:
        return JSONResponse({"detail": "Forbidden"}, status_code=403)
    return await call_next(request)


app.include_router(chat.router)
app.include_router(flashcards.router)
app.include_router(games.router)
app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/auth/check")
async def auth_check():
    return {"ok": True}
