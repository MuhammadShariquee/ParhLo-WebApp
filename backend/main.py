from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from loguru import logger
import sys

from app.core.config import settings
from app.api.endpoints import auth, pdf, chat, notes, quiz, exam

# Configure logging
logger.remove()
logger.add(sys.stdout, format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {module}:{function}:{line} | {message}", level="INFO")
logger.add("logs/parhlo.log", rotation="10 MB", retention="7 days", level="DEBUG")

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="ParhLo API",
    description="AI-powered study assistant for Pakistani students",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(pdf.router, prefix="/api/pdf", tags=["PDF Management"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(notes.router, prefix="/api/notes", tags=["Notes"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["Quiz"])
app.include_router(exam.router, prefix="/api/exam", tags=["Exam Mode"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "ParhLo API is running 🚀"}


@app.on_event("startup")
async def startup_event():
    logger.info("ParhLo API starting up...")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("ParhLo API shutting down...")
