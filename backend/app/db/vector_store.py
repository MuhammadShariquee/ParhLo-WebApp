import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings
from loguru import logger
from typing import List, Dict, Optional, Tuple
import hashlib


class VectorStore:
    """Abstracted vector storage layer using ChromaDB."""

    def __init__(self):
        self._client: Optional[chromadb.PersistentClient] = None

    @property
    def client(self) -> chromadb.PersistentClient:
        if not self._client:
            self._client = chromadb.PersistentClient(
                path=settings.CHROMA_PERSIST_DIR,
                settings=ChromaSettings(anonymized_telemetry=False),
            )
        return self._client

    def _collection_name(self, pdf_id: str) -> str:
        """Each PDF gets its own collection."""
        # ChromaDB collection names must be alphanumeric + underscores/hyphens
        safe = pdf_id.replace("-", "_")
        return f"pdf_{safe}"

    def get_or_create_collection(self, pdf_id: str):
        return self.client.get_or_create_collection(
            name=self._collection_name(pdf_id),
            metadata={"hnsw:space": "cosine"},
        )

    def add_chunks(
        self,
        pdf_id: str,
        chunks: List[Dict],  # [{"text": str, "page": int, "chunk_index": int}]
        embeddings: List[List[float]],
    ) -> None:
        """Store text chunks with their embeddings."""
        collection = self.get_or_create_collection(pdf_id)

        ids = [f"{pdf_id}_{c['chunk_index']}" for c in chunks]
        documents = [c["text"] for c in chunks]
        metadatas = [{"page": c["page"], "chunk_index": c["chunk_index"]} for c in chunks]

        collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
        )
        logger.info(f"Stored {len(chunks)} chunks for PDF {pdf_id}")

    def query(
        self,
        pdf_id: str,
        query_embedding: List[float],
        n_results: int = 5,
    ) -> List[Dict]:
        """Retrieve most relevant chunks for a query."""
        try:
            collection = self.client.get_collection(name=self._collection_name(pdf_id))
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=min(n_results, collection.count()),
                include=["documents", "metadatas", "distances"],
            )
            chunks = []
            for i, doc in enumerate(results["documents"][0]):
                chunks.append(
                    {
                        "text": doc,
                        "page": results["metadatas"][0][i]["page"],
                        "chunk_index": results["metadatas"][0][i]["chunk_index"],
                        "relevance_score": 1 - results["distances"][0][i],
                    }
                )
            return chunks
        except Exception as e:
            logger.error(f"VectorStore query error for pdf {pdf_id}: {e}")
            return []

    def delete_pdf_vectors(self, pdf_id: str) -> None:
        """Remove all vectors for a deleted PDF."""
        try:
            self.client.delete_collection(name=self._collection_name(pdf_id))
            logger.info(f"Deleted vector collection for PDF {pdf_id}")
        except Exception as e:
            logger.warning(f"Could not delete collection for pdf {pdf_id}: {e}")

    def collection_exists(self, pdf_id: str) -> bool:
        try:
            self.client.get_collection(name=self._collection_name(pdf_id))
            return True
        except Exception:
            return False

    def get_chunk_count(self, pdf_id: str) -> int:
        try:
            collection = self.client.get_collection(name=self._collection_name(pdf_id))
            return collection.count()
        except Exception:
            return 0


vector_store = VectorStore()
