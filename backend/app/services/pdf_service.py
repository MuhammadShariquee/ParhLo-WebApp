"""
PDF Service — handles upload, text extraction, and chunking.
Uses PyMuPDF for extraction.
"""
import fitz  # PyMuPDF
import pdfplumber
from app.core.config import settings
from app.db.supabase_client import db
from app.services.vector_store import vector_store
from loguru import logger
from typing import List, Dict, Tuple, Optional
import os
import re
import asyncio


class PDFService:
    """Handles all PDF operations."""

    def extract_text_by_page(self, file_path: str) -> List[Dict]:
        """
        Extract text from PDF, returning list of {page, text}.
        Uses PyMuPDF as primary, pdfplumber as fallback for tables.
        """
        pages_data = []
        try:
            doc = fitz.open(file_path)
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text("text")

                # Clean text
                text = self._clean_text(text)

                if text.strip():
                    pages_data.append({
                        "page": page_num + 1,
                        "text": text
                    })

            doc.close()
            logger.info(f"Extracted {len(pages_data)} pages from {file_path}")
        except Exception as e:
            logger.error(f"PyMuPDF extraction error: {e}")
            # Fallback to pdfplumber
            pages_data = self._extract_with_pdfplumber(file_path)

        return pages_data

    def _extract_with_pdfplumber(self, file_path: str) -> List[Dict]:
        """Fallback extraction using pdfplumber."""
        pages_data = []
        try:
            with pdfplumber.open(file_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    text = page.extract_text() or ""
                    text = self._clean_text(text)
                    if text.strip():
                        pages_data.append({
                            "page": page_num + 1,
                            "text": text
                        })
        except Exception as e:
            logger.error(f"pdfplumber extraction error: {e}")
        return pages_data

    def _clean_text(self, text: str) -> str:
        """Clean extracted text."""
        # Remove excessive whitespace
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = re.sub(r' {2,}', ' ', text)
        # Remove null bytes
        text = text.replace('\x00', '')
        return text.strip()

    def chunk_pages(self, pages_data: List[Dict]) -> List[Dict]:
        """
        Split pages into overlapping chunks for better retrieval.
        Returns: [{"text": str, "page": int, "chunk_index": int}]
        """
        chunks = []
        chunk_index = 0

        for page_data in pages_data:
            page_text = page_data["text"]
            page_num = page_data["page"]

            # Split page text into chunks
            page_chunks = self._split_text(page_text, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP)

            for chunk_text in page_chunks:
                if chunk_text.strip():
                    chunks.append({
                        "text": chunk_text,
                        "page": page_num,
                        "chunk_index": chunk_index
                    })
                    chunk_index += 1

        logger.info(f"Created {len(chunks)} chunks from {len(pages_data)} pages")
        return chunks

    def _split_text(self, text: str, chunk_size: int, overlap: int) -> List[str]:
        """Split text into overlapping chunks."""
        if len(text) <= chunk_size:
            return [text]

        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size

            # Try to split at a sentence boundary
            if end < len(text):
                # Look for sentence end
                sentence_end = text.rfind('.', start, end)
                if sentence_end > start + chunk_size // 2:
                    end = sentence_end + 1

            chunks.append(text[start:end].strip())
            start = end - overlap

        return chunks

    def get_page_count(self, file_path: str) -> int:
        """Get total page count of PDF."""
        try:
            doc = fitz.open(file_path)
            count = len(doc)
            doc.close()
            return count
        except Exception:
            return 0

    def get_pdf_info(self, file_path: str) -> Dict:
        """Get basic PDF metadata."""
        try:
            doc = fitz.open(file_path)
            info = {
                "page_count": len(doc),
                "title": doc.metadata.get("title", ""),
                "author": doc.metadata.get("author", ""),
            }
            doc.close()
            return info
        except Exception:
            return {"page_count": 0, "title": "", "author": ""}

    def get_all_text_chunks(self, file_path: str) -> List[Dict]:
        """Get all text chunks from a PDF file (for notes/exam generation)."""
        pages_data = self.extract_text_by_page(file_path)
        return self.chunk_pages(pages_data)


async def process_pdf_background(pdf_id: str, file_path: str):
    """
    Background task: extract text, create chunks, store in vector DB.
    Called by FastAPI BackgroundTasks.
    """
    logger.info(f"Starting background processing for PDF {pdf_id}")
    try:
        await db.update_pdf_status(pdf_id, "processing")

        pdf_service = PDFService()

        # Extract text
        pages_data = await asyncio.to_thread(pdf_service.extract_text_by_page, file_path)
        if not pages_data:
            await db.update_pdf_status(pdf_id, "failed")
            logger.error(f"No text extracted from PDF {pdf_id}")
            return

        # Create chunks
        chunks = await asyncio.to_thread(pdf_service.chunk_pages, pages_data)
        if not chunks:
            await db.update_pdf_status(pdf_id, "failed")
            logger.error(f"No chunks created for PDF {pdf_id}")
            return

        # Store in vector DB
        await asyncio.to_thread(vector_store.add_chunks, pdf_id, chunks)

        await db.update_pdf_status(pdf_id, "ready")
        logger.info(f"PDF {pdf_id} processing complete. {len(chunks)} chunks stored.")

    except Exception as e:
        logger.error(f"Background processing error for PDF {pdf_id}: {e}")
        try:
            await db.update_pdf_status(pdf_id, "failed")
        except Exception:
            pass


# Singleton
pdf_service = PDFService()
