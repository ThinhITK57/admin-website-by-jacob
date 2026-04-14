"""Application configuration using Pydantic Settings."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[3] / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "admin-crm-platform"
    app_env: str = "development"
    app_debug: bool = False
    grpc_host: str = "0.0.0.0"
    grpc_port: int = 50051

    # Database
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "admin_crm"
    db_user: str = "postgres"
    db_password: str = "postgres"
    db_echo: bool = False

    # JWT
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0

    @property
    def database_url(self) -> str:
        """Build async database URL for SQLAlchemy."""
        db_path = Path(__file__).resolve().parents[3] / "local.db"
        return f"sqlite+aiosqlite:///{db_path}"

    @property
    def sync_database_url(self) -> str:
        """Build sync database URL for Alembic migrations."""
        db_path = Path(__file__).resolve().parents[3] / "local.db"
        return f"sqlite:///{db_path}"

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
