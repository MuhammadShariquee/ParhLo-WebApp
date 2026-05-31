"""
Cache Service — In-memory cache with Redis-ready architecture.
Simple dict cache for MVP. Replace with Redis in V2.
"""
from typing import Any, Optional
from loguru import logger
import time
import hashlib
import json


class CacheService:
    """Simple in-memory cache. Redis-ready interface."""

    def __init__(self, default_ttl: int = 3600):
        self._store: dict = {}
        self.default_ttl = default_ttl

    def _make_key(self, *args) -> str:
        """Generate a cache key from arguments."""
        key_str = json.dumps(args, sort_keys=True, default=str)
        return hashlib.md5(key_str.encode()).hexdigest()

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if key in self._store:
            value, expires_at = self._store[key]
            if expires_at is None or time.time() < expires_at:
                return value
            else:
                del self._store[key]
        return None

    def set(self, key: str, value: Any, ttl: int = None) -> None:
        """Set value in cache."""
        expire = time.time() + (ttl or self.default_ttl)
        self._store[key] = (value, expire)

    def delete(self, key: str) -> None:
        """Delete a key."""
        self._store.pop(key, None)

    def clear_prefix(self, prefix: str) -> None:
        """Clear all keys with a prefix."""
        keys_to_delete = [k for k in self._store.keys() if k.startswith(prefix)]
        for k in keys_to_delete:
            del self._store[k]

    def make_rag_key(self, pdf_id: str, question: str, detail_level: str, language: str) -> str:
        return self._make_key("rag", pdf_id, question.lower().strip(), detail_level, language)

    def make_notes_key(self, pdf_id: str, language: str) -> str:
        return self._make_key("notes", pdf_id, language)

    def make_quiz_key(self, pdf_id: str, count: int) -> str:
        return self._make_key("quiz", pdf_id, count)

    def make_exam_key(self, pdf_id: str, question_type: str, language: str) -> str:
        return self._make_key("exam", pdf_id, question_type, language)


# Singleton
cache = CacheService()
