"""Exam mode endpoints — Pakistani exam pattern questions."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.auth import get_current_user
from app.db.supabase_client import db
from app.services.ai_service import ai_service
from app.services.vector_store import vector_store
from app.services.cache_service import cache
from loguru import logger

router = APIRouter()


class ExamRequest(BaseModel):
    pdf_id: str
    question_type: str = "important"  # important, short, long
    language: str = "english"


@router.post("/generate")
async def generate_exam_questions(
    body: ExamRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate exam questions in Pakistani exam style."""
    pdf = await db.get_pdf_by_id(body.pdf_id, current_user["id"])
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")

    if pdf["chunk_status"] != "ready":
        raise HTTPException(status_code=202, detail="PDF is still processing")

    if body.question_type not in ["important", "short", "long"]:
        raise HTTPException(status_code=400, detail="question_type must be: important, short, or long")

    # Check cache
    cache_key = cache.make_exam_key(body.pdf_id, body.question_type, body.language)
    cached = cache.get(cache_key)
    if cached:
        return {"questions": cached, "question_type": body.question_type, "cached": True}

    # Get comprehensive chunks
    chunks = vector_store.search(
        body.pdf_id,
        "main topics concepts definitions important facts",
        top_k=20
    )

    try:
        questions = await ai_service.generate_exam_questions(
            context_chunks=chunks,
            question_type=body.question_type,
            language=body.language
        )
    except Exception as e:
        logger.error(f"Exam generation error: {e}")
        raise HTTPException(status_code=503, detail="AI service error")

    # Cache for 1 hour
    cache.set(cache_key, questions, ttl=3600)

    return {
        "questions": questions,
        "question_type": body.question_type,
        "language": body.language,
        "cached": False
    }
