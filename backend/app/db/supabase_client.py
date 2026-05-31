from supabase import create_client, Client
from app.core.config import settings
from loguru import logger
from typing import Optional, Dict, Any, List
import uuid


class SupabaseDB:
    """Abstracted DB layer for Supabase operations."""

    def __init__(self):
        self._client: Optional[Client] = None

    @property
    def client(self) -> Client:
        if not self._client:
            if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
                raise ValueError("Supabase credentials not configured")
            self._client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        return self._client

    # ── PDF operations ────────────────────────────────────────────────────────

    async def create_pdf_record(self, user_id: str, file_name: str, file_url: str) -> Dict:
        data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "file_name": file_name,
            "file_url": file_url,
            "chunk_status": "pending",
        }
        result = self.client.table("pdfs").insert(data).execute()
        return result.data[0] if result.data else data

    async def update_pdf_status(self, pdf_id: str, status: str) -> None:
        self.client.table("pdfs").update({"chunk_status": status}).eq("id", pdf_id).execute()

    async def get_user_pdfs(self, user_id: str) -> List[Dict]:
        result = (
            self.client.table("pdfs")
            .select("*")
            .eq("user_id", user_id)
            .order("uploaded_at", desc=True)
            .execute()
        )
        return result.data or []

    async def get_pdf_by_id(self, pdf_id: str, user_id: str) -> Optional[Dict]:
        result = (
            self.client.table("pdfs")
            .select("*")
            .eq("id", pdf_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None

    async def rename_pdf(self, pdf_id: str, user_id: str, new_name: str) -> Dict:
        result = (
            self.client.table("pdfs")
            .update({"file_name": new_name})
            .eq("id", pdf_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else {}

    async def delete_pdf(self, pdf_id: str, user_id: str) -> bool:
        self.client.table("pdfs").delete().eq("id", pdf_id).eq("user_id", user_id).execute()
        return True

    # ── Chat operations ───────────────────────────────────────────────────────

    async def save_chat(
        self,
        user_id: str,
        pdf_id: str,
        question: str,
        answer: str,
        source_pages: List[int],
        language: str,
    ) -> Dict:
        data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "pdf_id": pdf_id,
            "question": question,
            "answer": answer,
            "source_pages": source_pages,
            "language": language,
        }
        result = self.client.table("chats").insert(data).execute()
        return result.data[0] if result.data else data

    async def get_chat_history(self, user_id: str, pdf_id: str, limit: int = 50) -> List[Dict]:
        result = (
            self.client.table("chats")
            .select("*")
            .eq("user_id", user_id)
            .eq("pdf_id", pdf_id)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return result.data or []

    # ── Notes operations ──────────────────────────────────────────────────────

    async def save_notes(self, user_id: str, pdf_id: str, content: str) -> Dict:
        existing = (
            self.client.table("notes")
            .select("id")
            .eq("user_id", user_id)
            .eq("pdf_id", pdf_id)
            .execute()
        )
        if existing.data:
            result = (
                self.client.table("notes")
                .update({"content": content})
                .eq("id", existing.data[0]["id"])
                .execute()
            )
        else:
            data = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "pdf_id": pdf_id,
                "content": content,
            }
            result = self.client.table("notes").insert(data).execute()
        return result.data[0] if result.data else {}

    async def get_notes(self, user_id: str, pdf_id: str) -> Optional[Dict]:
        result = (
            self.client.table("notes")
            .select("*")
            .eq("user_id", user_id)
            .eq("pdf_id", pdf_id)
            .execute()
        )
        return result.data[0] if result.data else None

    # ── Quiz operations ───────────────────────────────────────────────────────

    async def save_quiz(
        self,
        user_id: str,
        pdf_id: str,
        questions: List[Dict],
        score: Optional[int] = None,
    ) -> Dict:
        data = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "pdf_id": pdf_id,
            "questions": questions,
            "score": score,
        }
        result = self.client.table("quizzes").insert(data).execute()
        return result.data[0] if result.data else data

    async def get_quiz_history(self, user_id: str, pdf_id: str) -> List[Dict]:
        result = (
            self.client.table("quizzes")
            .select("*")
            .eq("user_id", user_id)
            .eq("pdf_id", pdf_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data or []

    async def update_quiz_score(self, quiz_id: str, user_id: str, score: int) -> Dict:
        result = (
            self.client.table("quizzes")
            .update({"score": score})
            .eq("id", quiz_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else {}

    # ── User operations ───────────────────────────────────────────────────────

    async def get_or_create_user_profile(
        self, user_id: str, email: str, name: str = ""
    ) -> Dict:
        result = self.client.table("users").select("*").eq("id", user_id).execute()
        if result.data:
            return result.data[0]
        data = {
            "id": user_id,
            "email": email,
            "name": name or email.split("@")[0],
            "preferred_language": "english",
            "theme_preference": "dark",
        }
        insert_result = self.client.table("users").insert(data).execute()
        return insert_result.data[0] if insert_result.data else data

    async def update_user_preferences(
        self,
        user_id: str,
        language: Optional[str] = None,
        theme: Optional[str] = None,
    ) -> Dict:
        update_data = {}
        if language:
            update_data["preferred_language"] = language
        if theme:
            update_data["theme_preference"] = theme
        if update_data:
            result = (
                self.client.table("users")
                .update(update_data)
                .eq("id", user_id)
                .execute()
            )
            return result.data[0] if result.data else {}
        return {}


db = SupabaseDB()
