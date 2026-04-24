from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: str = "chrome-extension://*,http://localhost:3000"

    # Database
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379/0"

    # Flight APIs
    DUFFEL_API_KEY: str = ""
    KIWI_API_KEY: str = ""
    AMADEUS_API_KEY: str = ""
    AMADEUS_API_SECRET: str = ""

    # Security
    JWT_SECRET_KEY: str = Field(default="change_me", min_length=8)
    AES_ENCRYPTION_KEY: str = ""

    # Kakao (Phase 2)
    KAKAO_CLIENT_ID: str = ""
    KAKAO_CLIENT_SECRET: str = ""
    KAKAO_REDIRECT_URI: str = ""
    KAKAO_ALIMTALK_API_KEY: str = ""

    # Cache
    SEARCH_CACHE_TTL_SECONDS: int = 300


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
