"""Notes generation endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.auth import get_current_user
from app.db.supabase_client import db
from app.services.ai_service import ai_service
from app.services.vector_store import vector_store
from app.services.cache_service import cache
from loguru import logger

router = APIRouter()


class NotesRequest(BaseModel):
    pdf_id: str
    language: str = "english"


@router.post("/generate")
async def generate_notes(
    body: NotesRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate structured notes from a PDF."""
    pdf = await db.get_pdf_by_id(body.pdf_id, current_user["id"])
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")

    if pdf["chunk_status"] != "ready":
        raise HTTPException(status_code=202, detail="PDF is still processing")

    # Check cache
    cache_key = cache.make_notes_key(body.pdf_id, body.language)
    cached = cache.get(cache_key)
    if cached:
        return {"notes": cached, "cached": True}

    # Get all chunks for comprehensive notes
    chunks = vector_store.search(body.pdf_id, "main topics key concepts important points summary", top_k=20)

    try:
        notes_content = await ai_service.generate_notes(chunks, body.language)
    except Exception as e:
        logger.error(f"Notes generation error: {e}")
        raise HTTPException(status_code=503, detail="AI service error")

    # Save notes to DB
    try:
        await db.save_notes(current_user["id"], body.pdf_id, notes_content)
    except Exception as e:
        logger.warning(f"Could not save notes: {e}")

    # Cache
    cache.set(cache_key, notes_content, ttl=3600)

    return {"notes": notes_content, "cached": False}


@router.get("/{pdf_id}")
async def get_notes(pdf_id: str, current_user: dict = Depends(get_current_user)):
    """Get saved notes for a PDF."""
    pdf = await db.get_pdf_by_id(pdf_id, current_user["id"])
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")

    notes = await db.get_notes(current_user["id"], pdf_id)
    if not notes:
        return {"notes": None}
    return {"notes": notes["content"]}
