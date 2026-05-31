"""Quiz generation endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.auth import get_current_user
from app.core.database import db
from app.services.ai_service import ai_service
from app.services.vector_store import vector_store
from app.services.cache_service import cache
from loguru import logger

router = APIRouter()


class QuizRequest(BaseModel):
    pdf_id: str
    count: int = 5  # 5-10 MCQs


class ScoreRequest(BaseModel):
    quiz_id: str
    score: int


@router.post("/generate")
async def generate_quiz(
    body: QuizRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate MCQs from a PDF."""
    pdf = await db.get_pdf(body.pdf_id, current_user["id"])
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")

    if pdf["chunk_status"] != "ready":
        raise HTTPException(status_code=202, detail="PDF is still processing")

    count = min(max(body.count, 3), 10)  # Clamp between 3-10

    # Get relevant chunks
    chunks = vector_store.search(body.pdf_id, "concepts definitions facts terms examples", top_k=15)

    try:
        mcqs = await ai_service.generate_mcqs(chunks, count)
    except Exception as e:
        logger.error(f"Quiz generation error: {e}")
        raise HTTPException(status_code=503, detail="AI service error")

    if not mcqs:
        raise HTTPException(status_code=422, detail="Could not generate questions from this PDF")

    # Save quiz to DB
    quiz_record = None
    try:
        quiz_record = await db.save_quiz(current_user["id"], body.pdf_id, mcqs)
    except Exception as e:
        logger.warning(f"Could not save quiz: {e}")

    return {
        "quiz_id": quiz_record["id"] if quiz_record else None,
        "questions": mcqs,
        "total": len(mcqs)
    }


@router.post("/score")
async def submit_score(
    body: ScoreRequest,
    current_user: dict = Depends(get_current_user)
):
    """Submit quiz score."""
    try:
        await db.update_quiz_score(body.quiz_id, body.score)
        return {"success": True}
    except Exception as e:
        logger.error(f"Score submission error: {e}")
        raise HTTPException(status_code=500, detail="Failed to save score")


@router.get("/history/{pdf_id}")
async def get_quiz_history(
    pdf_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get quiz history for a PDF."""
    pdf = await db.get_pdf(pdf_id, current_user["id"])
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")

    try:
        quizzes = await db.get_user_quizzes(current_user["id"], pdf_id)
        return {"quizzes": quizzes}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get quiz history")
