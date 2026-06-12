from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "ParhLo"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "dev-secret-key-change-in-production-32chars"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    # AI
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    AI_PROVIDER: str = "gemini"  # gemini | openai

    # ChromaDB
    CHROMA_PERSIST_DIR: str = "./chroma_db"

    # File uploads
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 50

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 20

    # RAG / Chunking
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    TOP_K_CHUNKS: int = 5
    MAX_CHUNKS_FOR_CONTEXT: int = 5

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip().strip('"').strip("'") for o in self.ALLOWED_ORIGINS.split(",") if o.strip().strip('"').strip("'")]

    def ensure_dirs(self):
        os.makedirs(self.UPLOAD_DIR, exist_ok=True)
        os.makedirs(self.CHROMA_PERSIST_DIR, exist_ok=True)
        os.makedirs("./logs", exist_ok=True)

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
settings.ensure_dirs()
