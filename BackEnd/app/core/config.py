import json
import os
from typing import Annotated, List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    # =====================================================
    # 1. PROJECT INFO
    # =====================================================
    PROJECT_NAME: str = "AgroMarket AI"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # =====================================================
    # 2. SECURITY & JWT
    # =====================================================
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # =====================================================
    # 3. DATABASE (BUILT FROM .env)
    # =====================================================
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432

    DATABASE_URL: str | None = None

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_database_url(cls, v, info):
        if v:
            return v
        return (
            f"postgresql://{info.data['DB_USER']}:"
            f"{info.data['DB_PASSWORD']}@"
            f"{info.data['DB_HOST']}:"
            f"{info.data['DB_PORT']}/"
            f"{info.data['DB_NAME']}"
        )

    # =====================================================
    # 4. CORS
    # =====================================================
    BACKEND_CORS_ORIGINS: Annotated[List[str], NoDecode] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(
        cls, v: Union[str, List[str]]
    ) -> List[str]:
        if isinstance(v, str):
            value = v.strip()
            if value.startswith("["):
                return json.loads(value)
            return [i.strip() for i in value.split(",") if i.strip()]
        return v

    # =====================================================
    # 5. AI MODELS & DATASETS
    # =====================================================
    PRICE_MODEL_PATH: str = "app/ai/price_model.pkl"
    DEMAND_MODEL_PATH: str = "app/ai/demand_model.pkl"

    ENCODER_PATH: str = "app/ai/encoders.pkl"

    DEMAND_HISTORY_PATH: str = (
        "app/ai/datasets/processed/demand_history.csv"
    )

    # =====================================================
    # 6. SMS / TWILIO
    # =====================================================
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""
    TWILIO_MESSAGING_SERVICE_SID: str = ""

    SMS_ENABLED: bool = os.getenv("SMS_ENABLED", "true").lower() == "true"

    # =====================================================
    # 7. Pydantic Config
    # =====================================================
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        enable_decoding=False,
        extra="ignore",
    )


# ✅ Singleton
settings = Settings()
