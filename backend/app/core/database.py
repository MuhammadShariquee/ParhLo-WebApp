"""
DB Layer — Supabase abstraction.
All database operations go through this module.
"""
from supabase import create_client, Client
from app.core.config import settings
from loguru import logger
from typing import Optional, Any, Dict, List
import functools


_client: Optional[Client] = None


def get_client() -> Client:
    global _client
    if _client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
            raise ValueError("Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env")
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return _client


class DBLayer:
    """Abstracted database operations."""

    def __init__(self):
        self.client = get_client()

    # ──────────────── PDFs ────────────────

    async def create_pdf_record(self, user_id: str, file_name: str, file_url: str) -> Dict:
        try:
            result = self.client.table("pdfs").insert({
                "user_id": user_id,
                "file_name": file_name,
                "file_url": file_url,
                "chunk_status": "pending"
            }).execute()
            return result.data[0] if result.data else {}
        except Exception as e:
            logger.error(f"create_pdf_record error: {e}")
            raise

    async def get_user_pdfs(self, user_id: str) -> List[Dict]:
        try:
            result = self.client.table("pdfs")\
                .select("*")\
                .eq("user_id", user_id)\
                .order("uploaded_at", desc=True)\
                .execute()
            return result.data or []
        except Exception as e:
            logger.error(f"get_user_pdfs error: {e}")
            raise

    async def get_pdf(self, pdf_id: str, user_id: str) -> Optional[Dict]:
        try:
            result = self.client.table("pdfs")\
                .select("*")\
                .eq("id", pdf_id)\
                .eq("user_id", user_id)\
                .single()\
                .execute()
            return result.data
        except Exception as e:
            logger.error(f"get_pdf error: {e}")
            return None

    async def update_pdf_status(self, pdf_id: str, status: str) -> None:
        try:
            self.client.table("pdfs")\
                .update({"chunk_status": status})\
                .eq("id", pdf_id)\
                .execute()
        except Exception as e:
            logger.error(f"update_pdf_status error: {e}")
            raise

    async def rename_pdf(self, pdf_id: str, user_id: str, new_name: str) -> Dict:
        try:
            result = self.client.table("pdfs")\
                .update({"file_name": new_name})\
                .eq("id", pdf_id)\
                .eq("user_id", user_id)\
                .execute()
            return result.data[0] if result.data else {}
        except Exception as e:
            logger.error(f"rename_pdf error: {e}")
            raise

    async def delete_pdf(self, pdf_id: str, user_id: str) -> bool:
        try:
            self.client.table("pdfs")\
                .delete()\
                .eq("id", pdf_id)\
                .eq("user_id", user_id)\
                .execute()
            return True
        except Exception as e:
            logger.error(f"delete_pdf error: {e}")
            return False

    # ──────────────── Chats ────────────────

    async def save_chat(self, user_id: str, pdf_id: str, question: str,
                        answer: str, source_pages: List[int], language: str) -> Dict:
        try:
            result = self.client.table("chats").insert({
                "user_id": user_id,
                "pdf_id": pdf_id,
                "question": question,
                "answer": answer,
                "source_pages": source_pages,
                "language": language
            }).execute()
            return result.data[0] if result.data else {}
        except Exception as e:
            logger.error(f"save_chat error: {e}")
            raise

    async def get_chat_history(self, user_id: str, pdf_id: str) -> List[Dict]:
        try:
            result = self.client.table("chats")\
                .select("*")\
                .eq("user_id", user_id)\
                .eq("pdf_id", pdf_id)\
                .order("created_at", desc=False)\
                .execute()
            return result.data or []
        except Exception as e:
            logger.error(f"get_chat_history error: {e}")
            raise

    # ──────────────── Notes ────────────────

    async def save_notes(self, user_id: str, pdf_id: str, content: str) -> Dict:
        try:
            # Upsert notes for this pdf
            existing = self.client.table("notes")\
                .select("id")\
                .eq("user_id", user_id)\
                .eq("pdf_id", pdf_id)\
                .execute()

            if existing.data:
                result = self.client.table("notes")\
                    .update({"content": content})\
                    .eq("id", existing.data[0]["id"])\
                    .execute()
            else:
                result = self.client.table("notes").insert({
                    "user_id": user_id,
                    "pdf_id": pdf_id,
                    "content": content
                }).execute()
            return result.data[0] if result.data else {}
        except Exception as e:
            logger.error(f"save_notes error: {e}")
            raise

    async def get_notes(self, user_id: str, pdf_id: str) -> Optional[Dict]:
        try:
            result = self.client.table("notes")\
                .select("*")\
                .eq("user_id", user_id)\
                .eq("pdf_id", pdf_id)\
                .execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"get_notes error: {e}")
            return None

    # ──────────────── Quizzes ────────────────

    async def save_quiz(self, user_id: str, pdf_id: str, questions: list, score: Optional[int] = None) -> Dict:
        try:
            result = self.client.table("quizzes").insert({
                "user_id": user_id,
                "pdf_id": pdf_id,
                "questions": questions,
                "score": score
            }).execute()
            return result.data[0] if result.data else {}
        except Exception as e:
            logger.error(f"save_quiz error: {e}")
            raise

    async def update_quiz_score(self, quiz_id: str, score: int) -> None:
        try:
            self.client.table("quizzes")\
                .update({"score": score})\
                .eq("id", quiz_id)\
                .execute()
        except Exception as e:
            logger.error(f"update_quiz_score error: {e}")
            raise

    async def get_user_quizzes(self, user_id: str, pdf_id: str) -> List[Dict]:
        try:
            result = self.client.table("quizzes")\
                .select("*")\
                .eq("user_id", user_id)\
                .eq("pdf_id", pdf_id)\
                .order("created_at", desc=True)\
                .execute()
            return result.data or []
        except Exception as e:
            logger.error(f"get_user_quizzes error: {e}")
            raise

    # ──────────────── Users ────────────────

    async def upsert_user(self, user_id: str, name: str, email: str) -> Dict:
        try:
            result = self.client.table("users").upsert({
                "id": user_id,
                "name": name,
                "email": email,
            }).execute()
            return result.data[0] if result.data else {}
        except Exception as e:
            logger.error(f"upsert_user error: {e}")
            raise

    async def get_user(self, user_id: str) -> Optional[Dict]:
        try:
            result = self.client.table("users")\
                .select("*")\
                .eq("id", user_id)\
                .single()\
                .execute()
            return result.data
        except Exception:
            return None

    async def update_user_preferences(self, user_id: str, language: Optional[str] = None, theme: Optional[str] = None) -> None:
        try:
            update_data = {}
            if language:
                update_data["preferred_language"] = language
            if theme:
                update_data["theme_preference"] = theme
            if update_data:
                self.client.table("users").update(update_data).eq("id", user_id).execute()
        except Exception as e:
            logger.error(f"update_user_preferences error: {e}")
            raise


# Singleton instance
db = DBLayer()
