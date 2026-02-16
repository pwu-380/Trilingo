from pathlib import Path
import os

from dotenv import load_dotenv

_project_root = Path(__file__).resolve().parent.parent
load_dotenv(_project_root / ".env")

GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
CHAT_PROVIDER: str = os.getenv("CHAT_PROVIDER", "gemini")
CHAT_MODEL: str = os.getenv("CHAT_MODEL", "gemini-2.5-flash")
TRILINGO_TOKEN: str = os.getenv("TRILINGO_TOKEN", "")
DB_PATH: str = os.getenv("DB_PATH", str(_project_root / "trilingo.db"))

# Asset generation
ASSETS_DIR: Path = Path(__file__).resolve().parent / "assets"
TTS_VOICE: str = os.getenv("TTS_VOICE", "zh-CN-XiaoxiaoNeural")
TTS_RATE: str = os.getenv("TTS_RATE", "-15%")
