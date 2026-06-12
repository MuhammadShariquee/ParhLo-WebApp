"""PDF management endpoints."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from app.core.auth import get_current_user
from app.db.supabase_client import db
from app.core.config import settings
from app.services.pdf_service import process_pdf_background
from app.services.vector_store import vector_store
from loguru import logger
import os
import aiofiles
import uuid

router = APIRouter()


@router.post("/upload")
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a PDF file. Processing happens in background."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB}MB"
        )

    file_id = str(uuid.uuid4())
    safe_name = f"{file_id}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_name)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    try:
        pdf_record = await db.create_pdf_record(
            user_id=current_user["id"],
            file_name=file.filename,
            file_url=file_path
        )
    except Exception as e:
        logger.error(f"DB record creation error: {e}")
        os.remove(file_path)
        raise HTTPException(status_code=500, detail="Failed to create PDF record")

    background_tasks.add_task(
        process_pdf_background,
        pdf_id=pdf_record["id"],
        file_path=file_path
    )

    return {
        "success": True,
        "pdf": pdf_record,
        "message": "PDF uploaded! Processing started in background..."
    }


@router.get("/list")
async def list_pdfs(current_user: dict = Depends(get_current_user)):
    """Get all PDFs for current user."""
    try:
        pdfs = await db.get_user_pdfs(current_user["id"])
        return {"pdfs": pdfs}
    except Exception as e:
        logger.error(f"List PDFs error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get PDFs")


@router.get("/{pdf_id}/status")
async def get_pdf_status(pdf_id: str, current_user: dict = Depends(get_current_user)):
    """Get PDF processing status."""
    pdf = await db.get_pdf_by_id(pdf_id, current_user["id"])
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    chunk_count = vector_store.count_chunks(pdf_id)
    return {
        "status": pdf["chunk_status"],
        "chunk_count": chunk_count
    }


@router.get("/{pdf_id}/serve")
async def serve_pdf(pdf_id: str, current_user: dict = Depends(get_current_user)):
    """Serve the PDF file directly for the viewer."""
    try:
        pdf = await db.get_pdf_by_id(pdf_id, current_user["id"])
        if not pdf:
            raise HTTPException(status_code=404, detail="PDF not found")

        upload_dir = settings.UPLOAD_DIR

        # Search uploads folder for file containing this pdf_id
        if os.path.exists(upload_dir):
            for filename in os.listdir(upload_dir):
                if pdf_id in filename:
                    file_path = os.path.join(upload_dir, filename)
                    if os.path.exists(file_path):
                        return FileResponse(
                            file_path,
                            media_type="application/pdf",
                            headers={
                                "Content-Disposition": f"inline; filename={pdf['file_name']}",
                                "Access-Control-Allow-Origin": "*"
                            }
                        )

        # Fallback: try file_url directly
        file_url = pdf.get("file_url", "")
        if file_url and os.path.exists(file_url):
            return FileResponse(
                file_url,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f"inline; filename={pdf['file_name']}",
                    "Access-Control-Allow-Origin": "*"
                }
            )

        raise HTTPException(status_code=404, detail="PDF file not found on disk")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Serve PDF error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{pdf_id}")
async def get_pdf(pdf_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific PDF."""
    pdf = await db.get_pdf_by_id(pdf_id, current_user["id"])
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    return pdf


class RenameRequest(BaseModel):
    new_name: str


@router.put("/{pdf_id}/rename")
async def rename_pdf(
    pdf_id: str,
    body: RenameRequest,
    current_user: dict = Depends(get_current_user)
):
    """Rename a PDF."""
    try:
        updated = await db.rename_pdf(pdf_id, current_user["id"], body.new_name)
        return {"success": True, "pdf": updated}
    except Exception as e:
        logger.error(f"Rename PDF error: {e}")
        raise HTTPException(status_code=500, detail="Failed to rename PDF")


@router.delete("/{pdf_id}")
async def delete_pdf(pdf_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a PDF and all its data."""
    pdf = await db.get_pdf_by_id(pdf_id, current_user["id"])
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")

    vector_store.delete_pdf_chunks(pdf_id)

    try:
        if pdf.get("file_url") and os.path.exists(pdf["file_url"]):
            os.remove(pdf["file_url"])
    except Exception as e:
        logger.warning(f"Could not delete file: {e}")

    success = await db.delete_pdf(pdf_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete PDF")

    return {"success": True, "message": "PDF deleted successfully"}