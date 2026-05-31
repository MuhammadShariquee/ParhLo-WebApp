"""
VectorStore Layer — ChromaDB abstraction.
All vector operations go through this module.
Easily swappable to Pinecone, Weaviate, etc.
"""
import chromadb
from chromadb.config import Settings as ChromaSettings
import google.generativeai as genai
from app.core.config import settings
from loguru import logger
from typing import List, Dict, Optional, Tuple
import uuid


class VectorStore:
    """Abstracted vector store using ChromaDB."""

    def __init__(self):
        self._client: Optional[chromadb.PersistentClient] = None
        self._collection = None

    def _get_client(self) -> chromadb.PersistentClient:
        if self._client is None:
            self._client = chromadb.PersistentClient(
                path=settings.CHROMA_PERSIST_DIR,
                settings=ChromaSettings(anonymized_telemetry=False)
            )
        return self._client



    def _get_collection(self, pdf_id: str):
        """Get or create a collection per PDF."""
        client = self._get_client()
        collection_name = f"pdf_{pdf_id.replace('-', '_')}"
        return client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts using Gemini."""
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=texts,
            task_type="retrieval_document"
        )
        return result['embedding']

    def add_chunks(self, pdf_id: str, chunks: List[Dict]) -> None:
        """
        Add text chunks to the vector store.
        chunks: [{"text": str, "page": int, "chunk_index": int}]
        """
        collection = self._get_collection(pdf_id)

        texts = [c["text"] for c in chunks]
        embeddings = self.embed_texts(texts)
        ids = [f"{pdf_id}_{c['chunk_index']}" for c in chunks]
        metadatas = [{"page": c["page"], "chunk_index": c["chunk_index"], "pdf_id": pdf_id} for c in chunks]

        collection.add(
            documents=texts,
            embeddings=embeddings,
            ids=ids,
            metadatas=metadatas
        )
        logger.info(f"Added {len(chunks)} chunks for PDF {pdf_id}")

    def search(self, pdf_id: str, query: str, top_k: int = None) -> List[Dict]:
        """
        Search for relevant chunks.
        Returns: [{"text": str, "page": int, "score": float}]
        """
        k = top_k or settings.TOP_K_CHUNKS
        try:
            collection = self._get_collection(pdf_id)
            query_embedding = self.embed_texts([query])[0]

            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=min(k, collection.count()),
                include=["documents", "metadatas", "distances"]
            )

            chunks = []
            if results["documents"] and results["documents"][0]:
                for doc, meta, dist in zip(
                    results["documents"][0],
                    results["metadatas"][0],
                    results["distances"][0]
                ):
                    chunks.append({
                        "text": doc,
                        "page": meta.get("page", 0),
                        "score": 1 - dist  # cosine similarity
                    })

            return chunks
        except Exception as e:
            logger.error(f"VectorStore search error: {e}")
            return []

    def delete_pdf_chunks(self, pdf_id: str) -> None:
        """Delete all chunks for a PDF."""
        try:
            client = self._get_client()
            collection_name = f"pdf_{pdf_id.replace('-', '_')}"
            client.delete_collection(collection_name)
            logger.info(f"Deleted vector collection for PDF {pdf_id}")
        except Exception as e:
            logger.warning(f"Could not delete collection for {pdf_id}: {e}")

    def count_chunks(self, pdf_id: str) -> int:
        """Count chunks in a PDF's collection."""
        try:
            collection = self._get_collection(pdf_id)
            return collection.count()
        except Exception:
            return 0


# Singleton
vector_store = VectorStore()
