"""
Application configuration.

All settings are loaded from environment variables (see .env.example).
Never hardcode secrets, DB credentials, or API keys here.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ---- App ----
    app_name: str = "Smart Telemedicine Platform"
    app_env: str = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"

    # ---- Database ----
    database_url: str

    # ---- Security (used starting Phase 2) ----
    secret_key: str = "change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # ---- CORS ----
    frontend_origin: str = "http://localhost:5173"

        # ---- AI (Phase 9) ----
    groq_api_key: str = ""
    ai_chat_model: str = "openai/gpt-oss-120b"
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dim: int = 384


    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings accessor.

    Using lru_cache means the .env file is parsed once per process,
    not on every request. Import and call get_settings() wherever
    config values are needed instead of instantiating Settings() directly.
    """
    return Settings()
