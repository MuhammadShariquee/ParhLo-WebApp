"""Chat endpoints — RAG-powered Q&A."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.core.auth import get_current_user
from app.core.database import db
from app.services.ai_service import ai_service
from app.services.vector_store import vector_store
from app.services.cache_service import cache
from loguru import logger

router = APIRouter()


class AskRequest(BaseModel):
    pdf_id: str
    question: str
    detail_level: str = "medium"  # simple, medium, detailed
    language: str = "english"  # english, urdu, roman_urdu


class QuickActionRequest(BaseModel):
    pdf_id: str
    action: str  # explain_simply, make_shorter, generate_mcqs
    original_question: str
    current_answer: str


@router.post("/ask")
async def ask_question(
    body: AskRequest,
    current_user: dict = Depends(get_current_user)
):
    """Ask a question about a PDF using RAG."""
    # Verify PDF access
    pdf = await db.get_pdf(body.pdf_id, current_user["id"])
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")

    if pdf["chunk_status"] == "pending":
        raise HTTPException(status_code=202, detail="PDF is still being processed. Please wait...")

    if pdf["chunk_status"] == "processing":
        raise HTTPException(status_code=202, detail="PDF is still processing. Should be ready in a moment...")

    if pdf["chunk_status"] == "failed":
        raise HTTPException(status_code=422, detail="PDF processing failed. Please try re-uploading.")

    # Check cache
    cache_key = cache.make_rag_key(body.pdf_id, body.question, body.detail_level, body.language)
    cached = cache.get(cache_key)
    if cached:
        logger.info("Cache hit for RAG query")
        # Save to chat history even for cached results
        await db.save_chat(
            user_id=current_user["id"],
            pdf_id=body.pdf_id,
            question=body.question,
            answer=cached["answer"],
            source_pages=cached["source_pages"],
            language=body.language
        )
        return cached

    # Retrieve relevant chunks
    chunks = vector_store.search(body.pdf_id, body.question)

    if not chunks:
        no_context_response = {
            "answer": "Yeh information aapki uploaded material mein available nahi hai. Please ask a question related to your uploaded PDF.",
            "source_pages": [],
            "used_context": False,
            "question": body.question
        }
        return no_context_response

    # Generate answer
    try:
        result = await ai_service.answer_question(
            question=body.question,
            context_chunks=chunks,
            detail_level=body.detail_level,
            language=body.language
        )
    except Exception as e:
        logger.error(f"AI generation error: {e}")
        raise HTTPException(status_code=503, detail="AI service temporarily unavailable. Please try again.")

    response = {
        "answer": result["answer"],
        "source_pages": result["source_pages"],
        "used_context": result["used_context"],
        "question": body.question,
        "detail_level": body.detail_level,
        "language": body.language
    }

    # Cache result
    cache.set(cache_key, response, ttl=1800)  # 30 min

    # Save to chat history
    try:
        chat_record = await db.save_chat(
            user_id=current_user["id"],
            pdf_id=body.pdf_id,
            question=body.question,
            answer=result["answer"],
            source_pages=result["source_pages"],
            language=body.language
        )
        response["chat_id"] = chat_record.get("id")
    except Exception as e:
        logger.warning(f"Could not save chat: {e}")

    return response


@router.post("/quick-action")
async def quick_action(
    body: QuickActionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Apply quick actions to an existing answer."""
    pdf = await db.get_pdf(body.pdf_id, current_user["id"])
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")

    # Get context for MCQ generation
    chunks = []
    if body.action == "generate_mcqs":
        chunks = vector_store.search(body.pdf_id, body.original_question)

    try:
        result = await ai_service.apply_quick_action(
            action=body.action,
            original_question=body.original_question,
            answer=body.current_answer,
            context_chunks=chunks
        )
        return {"answer": result, "action": body.action}
    except Exception as e:
        logger.error(f"Quick action error: {e}")
        raise HTTPException(status_code=503, detail="AI service error. Please try again.")


@router.get("/history/{pdf_id}")
async def get_chat_history(
    pdf_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get chat history for a PDF."""
    pdf = await db.get_pdf(pdf_id, current_user["id"])
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")

    try:
        history = await db.get_chat_history(current_user["id"], pdf_id)
        return {"history": history, "pdf_id": pdf_id}
    except Exception as e:
        logger.error(f"Get chat history error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get chat history")
