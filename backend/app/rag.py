"""Lightweight FAISS-backed retrieval layer for fast context lookup."""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from threading import Lock
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

import numpy as np

logger = logging.getLogger(__name__)

try:
    import faiss  # type: ignore
except ImportError:  # pragma: no cover - handled at runtime
    faiss = None  # type: ignore


DEFAULT_DIMENSION = int(os.getenv("RAG_EMBED_DIMENSION", "384"))
_base_dir = Path(__file__).resolve().parent.parent
_store_dir_setting = os.getenv("RAG_INDEX_DIR")
DEFAULT_STORE_DIR = Path(_store_dir_setting) if _store_dir_setting else _base_dir / "faiss_store"
DEFAULT_STORE_DIR.mkdir(parents=True, exist_ok=True)
INDEX_PATH = DEFAULT_STORE_DIR / "index.faiss"
EMBED_PATH = DEFAULT_STORE_DIR / "embeddings.npy"
META_PATH = DEFAULT_STORE_DIR / "metadata.json"


class RAGIndex:
    """Thread-safe retrieval index that uses FAISS when available and falls back to NumPy search."""

    def __init__(self, dimension: int = DEFAULT_DIMENSION) -> None:
        self.dimension = dimension
        self._lock = Lock()
        self._index = self._create_index()
        self._embeddings: Optional[np.ndarray] = None
        self._metadatas: List[Dict[str, Any]] = []
        self._texts: List[str] = []
        self._load_from_disk()

    def _create_index(self):
        if faiss is None:
            logger.warning("FAISS not installed; falling back to in-memory cosine search.")
            return None
        return faiss.IndexFlatIP(self.dimension)

    def _load_from_disk(self) -> None:
        if faiss is not None and INDEX_PATH.exists():
            try:
                self._index = faiss.read_index(str(INDEX_PATH))
            except Exception as exc:  # pragma: no cover - resilience only
                logger.warning("Failed to read FAISS index; starting fresh. Error: %s", exc)
                self._index = self._create_index()

        if EMBED_PATH.exists():
            try:
                self._embeddings = np.load(EMBED_PATH)
            except Exception as exc:  # pragma: no cover
                logger.warning("Failed to load cached embeddings; rebuilding. Error: %s", exc)
                self._embeddings = None

        if META_PATH.exists():
            try:
                with META_PATH.open("r", encoding="utf-8") as fh:
                    payload = json.load(fh)
                self._texts = payload.get("texts", [])
                self._metadatas = payload.get("metadatas", [])
            except Exception as exc:  # pragma: no cover
                logger.warning("Failed to load metadata cache; starting empty. Error: %s", exc)
                self._texts = []
                self._metadatas = []

        if self._index is None and self._embeddings is None and self._texts:
            # ensure embeddings array matches metadata length when FAISS unavailable
            self._embeddings = np.zeros((0, self.dimension), dtype="float32")

    def _persist(self) -> None:
        if self._index is not None:
            try:
                faiss.write_index(self._index, str(INDEX_PATH))  # type: ignore[arg-type]
            except Exception as exc:  # pragma: no cover
                logger.warning("Failed to persist FAISS index. Error: %s", exc)
        if self._embeddings is not None:
            try:
                np.save(EMBED_PATH, self._embeddings)
            except Exception as exc:  # pragma: no cover
                logger.warning("Failed to persist cached embeddings. Error: %s", exc)
        try:
            with META_PATH.open("w", encoding="utf-8") as fh:
                json.dump({"texts": self._texts, "metadatas": self._metadatas}, fh)
        except Exception as exc:  # pragma: no cover
            logger.warning("Failed to persist metadata cache. Error: %s", exc)

    @staticmethod
    def _normalize(vecs: np.ndarray) -> np.ndarray:
        norms = np.linalg.norm(vecs, axis=1, keepdims=True)
        norms[norms == 0] = 1
        return vecs / norms

    def add_documents(self, docs: Iterable[Dict[str, Any]]) -> int:
        batch: List[Dict[str, Any]] = [doc for doc in docs if doc.get("embedding")]
        if not batch:
            return 0

        embeddings = np.vstack([
            np.asarray(doc["embedding"], dtype="float32") for doc in batch
        ])
        embeddings = self._normalize(embeddings)
        texts = [doc.get("text", "") for doc in batch]
        metadatas = [doc.get("meta", {}) for doc in batch]

        with self._lock:
            if self._index is not None:
                self._index.add(embeddings)
            if self._embeddings is None:
                self._embeddings = embeddings
            else:
                self._embeddings = np.vstack([self._embeddings, embeddings])
            self._texts.extend(texts)
            self._metadatas.extend(metadatas)
            self._persist()

        return len(batch)

    def reset(self) -> None:
        with self._lock:
            self._index = self._create_index()
            self._embeddings = None
            self._texts = []
            self._metadatas = []
            for path in (INDEX_PATH, EMBED_PATH, META_PATH):
                if path.exists():
                    try:
                        path.unlink()
                    except OSError:
                        logger.warning("Unable to delete %s during reset", path)

    def _search_numpy(
        self,
        query: np.ndarray,
        top_k: int,
        allowed_sources: Optional[Sequence[str]],
    ) -> List[Tuple[int, float]]:
        if self._embeddings is None or not len(self._texts):
            return []
        scores = self._embeddings @ query
        order = scores.argsort()[::-1]
        results: List[Tuple[int, float]] = []
        for idx in order[:top_k * 5]:
            meta = self._metadatas[idx] if idx < len(self._metadatas) else {}
            if allowed_sources:
                source = meta.get("source")
                if source not in allowed_sources:
                    continue
            results.append((int(idx), float(scores[idx])))
            if len(results) >= top_k:
                break
        return results

    def search(
        self,
        query_embedding: Sequence[float],
        top_k: int = 5,
        allowed_sources: Optional[Sequence[str]] = None,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        if not filters or "university" not in filters or "roll_no" not in filters:
            raise RuntimeError(f"CRITICAL: Filters (university, roll_no) are mandatory for multi-tenant isolation. Got: {filters}")

        if not query_embedding:
            return []
        query = np.asarray(query_embedding, dtype="float32").reshape(1, -1)
        query = self._normalize(query)

        def check_filters(meta: Dict[str, Any]) -> bool:
            if allowed_sources and meta.get("source") not in allowed_sources:
                return False
            # filters is guaranteed not None here
            for k, v in filters.items():
                 if meta.get(k) != v:
                     return False
            return True

        with self._lock:
            if self._index is not None and self._index.ntotal > 0:
                distances, indices = self._index.search(query, top_k * 10) # Fetch more to allow for filtering
                hits: List[Dict[str, Any]] = []
                for raw_idx, score in zip(indices[0], distances[0]):
                    if raw_idx < 0:
                        continue
                    meta = self._metadatas[raw_idx] if raw_idx < len(self._metadatas) else {}
                    
                    if not check_filters(meta):
                        continue

                    hits.append(
                        {
                            "text": self._texts[raw_idx],
                            "meta": meta,
                            "score": float(score),
                        }
                    )
                    if len(hits) >= top_k:
                        break
                if hits:
                    return hits

            # Fall back to numpy search when FAISS unavailable or returns nothing
            # Simplified fallback logic reuse isn't easy without duplicating the filter check
            # So generic implementation below for fallback:
            if self._embeddings is None or not len(self._texts):
                return []
            
            scores = self._embeddings @ query.squeeze(0)
            order = scores.argsort()[::-1]
            fallback_hits: List[Dict[str, Any]] = []
            
            for idx in order:
                meta = self._metadatas[idx] if idx < len(self._metadatas) else {}
                if not check_filters(meta):
                    continue
                
                fallback_hits.append({
                    "text": self._texts[idx],
                    "meta": meta,
                    "score": float(scores[idx])
                })
                if len(fallback_hits) >= top_k:
                    break
            
            return fallback_hits


_rag_index = RAGIndex()


def add_to_index(docs: Iterable[Dict[str, Any]]) -> int:
    """Add documents (text + embedding + metadata) to the persistent index."""
    return _rag_index.add_documents(docs)


def reset_index() -> None:
    _rag_index.reset()


def retrieve(
    query_embedding: Sequence[float],
    top_k: int = 5,
    allowed_sources: Optional[Sequence[str]] = None,
    filters: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    return _rag_index.search(query_embedding, top_k=top_k, allowed_sources=allowed_sources, filters=filters)


def retrieve_texts(
    query_embedding: Sequence[float],
    top_k: int = 5,
    allowed_sources: Optional[Sequence[str]] = None,
    filters: Optional[Dict[str, Any]] = None,
) -> List[str]:
    hits = retrieve(query_embedding, top_k=top_k, allowed_sources=allowed_sources, filters=filters)
    return [hit.get("text", "") for hit in hits if hit.get("text")]


def dump_metadata() -> Dict[str, Any]:
    return {
        "count": len(_rag_index._texts),  # type: ignore[attr-defined]
        "dimension": _rag_index.dimension,
        "index_path": str(INDEX_PATH.resolve()),
    }
