
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    # --- Security ---
    # Default to insecure key for dev/demo if not set, but warn in production
    SECRET_KEY: str = os.getenv("APP_SECRET_KEY", "insecure_dev_secret_key_please_change")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # --- Database ---
    # Using relative path for SQLite by default
    _default_db_path = Path(__file__).resolve().parent.parent / "analytics.db"
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"{_default_db_path}")

    # --- AI Configuration ---
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o")

    GROQ_API_KEY: str | None = os.getenv("GROQ_API_KEY")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")

    # --- Feature Flags ---
    # Demo mode allows running the app without AI keys
    DEMO_MODE: bool = False

    @property
    def has_ai_keys(self) -> bool:
        return bool(self.OPENAI_API_KEY or self.GROQ_API_KEY)

settings = Settings()
