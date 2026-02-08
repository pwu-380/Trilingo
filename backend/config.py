from pathlib import Path
import os

from dotenv import load_dotenv

_project_root = Path(__file__).resolve().parent.parent
load_dotenv(_project_root / ".env")

GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
CHAT_PROVIDER: str = os.getenv("CHAT_PROVIDER", "gemini")
CHAT_MODEL: str = os.getenv("CHAT_MODEL", "gemini-2.0-flash-lite")
DB_PATH: str = os.getenv("DB_PATH", str(_project_root / "trilingo.db"))
