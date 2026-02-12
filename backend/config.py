from pathlib import Path
import os

from dotenv import load_dotenv

_project_root = Path(__file__).resolve().parent.parent
load_dotenv(_project_root / ".env")

GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
CHAT_PROVIDER: str = os.getenv("CHAT_PROVIDER", "gemini")
CHAT_MODEL: str = os.getenv("CHAT_MODEL", "gemini-2.5-flash")
TRILINGO_TOKEN: str = os.getenv("TRILINGO_TOKEN", "")
if not TRILINGO_TOKEN:
    _token_file = _project_root / ".trilingo.token"
    if _token_file.exists():
        TRILINGO_TOKEN = _token_file.read_text(encoding="utf-8").strip()
DB_PATH: str = os.getenv("DB_PATH", str(_project_root / "trilingo.db"))
