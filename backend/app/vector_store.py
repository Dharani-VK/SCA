import json
from typing import Any, Dict, List, Optional

import chromadb


class ChromaVectorStore:
    """Light wrapper around ChromaDB persistent collections."""

    def __init__(
        self,
        persist_directory: str = "chroma_store",
        collection_name: str = "documents",
    ) -> None:
        self.persist_directory = persist_directory
        self.collection_name = collection_name
        self.client = chromadb.PersistentClient(path=persist_directory)
        self._collection = self._ensure_collection()

    def _ensure_collection(self):
        return self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"},
        )

    @property
    def collection(self):
        if self._collection is None:
            self._collection = self._ensure_collection()
        return self._collection

    @staticmethod
    def _sanitize_metadata_value(value: Any) -> Optional[Any]:
        if value is None or isinstance(value, (str, int, float, bool)):
            return value
        if isinstance(value, (list, tuple, set)):
            flattened = [str(item).strip() for item in value if item is not None]
            joined = ", ".join(item for item in flattened if item)
            return joined[:500] if joined else None
        if isinstance(value, dict):
            try:
                serialized = json.dumps(value, ensure_ascii=False, sort_keys=True)
            except TypeError:
                serialized = str(value)
            return serialized[:500] if serialized else None
        serialized = str(value)
        return serialized[:500] if serialized else None

    @classmethod
    def _sanitize_metadata(cls, meta: Any) -> Dict[str, Any]:
        if not isinstance(meta, dict):
            return {}
        cleaned: Dict[str, Any] = {}
        for key, value in meta.items():
            sanitized = cls._sanitize_metadata_value(value)
            if sanitized is None:
                continue
            cleaned[str(key)] = sanitized
        return cleaned

    def add_documents(self, docs: List[Dict[str, Any]]) -> None:
        if not docs:
            return
        metadatas = [self._sanitize_metadata(doc.get("meta") or {}) for doc in docs]
        self.collection.upsert(
            ids=[doc.get("id") or str(idx) for idx, doc in enumerate(docs)],
            documents=[doc.get("text", "") for doc in docs],
            embeddings=[doc.get("embedding") for doc in docs],
            metadatas=metadatas,
        )

    def _build_where_clause(self, allowed_sources: Optional[List[str]], filters: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        # Enforce strict isolation at the lowest level
        if not filters or not isinstance(filters, dict) or "university" not in filters or "roll_no" not in filters:
            # We strictly require university and roll_no to be present.
            # Exception: Admin querying global stats? No, Admin should use specific filters or separate method.
            # The Requirement says "All analytics endpoints ... filter by (university, roll_no)."
            raise RuntimeError(f"CRITICAL: Filters (university, roll_no) are mandatory for multi-tenant isolation. Got: {filters}")

        conditions = []
        if allowed_sources:
            # Optimize single source vs multiple
            if len(allowed_sources) == 1:
                conditions.append({"source": allowed_sources[0]})
            else:
                conditions.append({"source": {"$in": allowed_sources}})
        
        # Apply filters
        for k, v in filters.items():
            conditions.append({k: v})

        if not conditions:
            # Should be unreachable given the check above
            return None
        if len(conditions) == 1:
            print(f"DEBUG_WHERE: {conditions[0]}")
            return conditions[0]
        final = {"$and": conditions}
        print(f"DEBUG_WHERE: {final}")
        return final

    def similarity_search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        allowed_sources: Optional[List[str]] = None,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        # Check if embedding is empty - use len() to avoid numpy array ambiguity
        if query_embedding is None or len(query_embedding) == 0:
            return []
        
        where = self._build_where_clause(allowed_sources, filters)
        
        result = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["metadatas", "documents", "distances"],
            where=where,
        )
        documents_list = result.get("documents") or []
        if not documents_list:
            return []
        documents = documents_list[0] or []
        metadatas = (result.get("metadatas") or [[]])[0]
        ids = (result.get("ids") or [[]])[0]
        distances = (result.get("distances") or [[]])[0]
        hits: List[Dict[str, Any]] = []
        for idx, text in enumerate(documents):
            meta = metadatas[idx] if idx < len(metadatas) else {}
            score = distances[idx] if idx < len(distances) else None
            hits.append(
                {
                    "id": ids[idx] if idx < len(ids) else None,
                    "text": text,
                    "meta": meta,
                    "score": None if score is None else 1 - float(score),
                }
            )
        return hits

    def clear(self) -> None:
        try:
            self.client.delete_collection(self.collection_name)
        except Exception:
            pass
        self._collection = self._ensure_collection()

    def list_sources(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        # For listing sources, we just want distinct sources matching the filter.
        # Chroma doesn't support 'distinct' queries efficiently, so we must fetch metadata.
        # Warning: This scales poorly if millions of docs exist.
        where = self._build_where_clause(None, filters)
        
        data = self.collection.get(include=["metadatas"], where=where)
        sources: Dict[str, Dict[str, Any]] = {}
        for meta in data.get("metadatas", []):
            meta = meta or {}
            src = meta.get("source") or "Unknown"
            ingested_at = meta.get("ingested_at")
            entry = sources.setdefault(src, {"source": src, "chunks": 0, "latest_ingested_at": None})
            entry["chunks"] += 1
            if ingested_at and (entry["latest_ingested_at"] is None or ingested_at > entry["latest_ingested_at"]):
                entry["latest_ingested_at"] = ingested_at
        return sorted(
            sources.values(),
            key=lambda item: item.get("latest_ingested_at") or "",
            reverse=True,
        )

    def stats(self, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        where = self._build_where_clause(None, filters)
        count = self.collection.count() if not where else len(self.collection.get(where=where)['ids'])
        return {
            "docs": count,
            "sources": self.list_sources(filters),
        }

    def delete_document(self, source_id: str, filters: Optional[Dict[str, Any]] = None) -> int:
        where = self._build_where_clause([source_id], filters)
        # Check if exists first to return count, or just delete.
        # Chroma delete returns nothing.
        # We fetch IDs to count, then delete.
        ids = self.collection.get(where=where)['ids']
        if ids:
            self.collection.delete(ids=ids)
        return len(ids)

    def get_documents_by_source(
        self, 
        source_id: str, 
        limit: Optional[int] = None,
        filters: Optional[Dict[str, Any]] = None,
        include_embeddings: bool = False,
    ) -> List[Dict[str, Any]]:
        where = self._build_where_clause([source_id], filters)
        includes = ["documents", "metadatas"]
        if include_embeddings:
            includes.append("embeddings")

        data = self.collection.get(
            where=where,
            include=includes,
            limit=limit,
        )
        return self._format_documents(data)

    def get_all_documents(
        self,
        limit: Optional[int] = None,
        sources: Optional[List[str]] = None,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        where = self._build_where_clause(sources, filters)
        data = self.collection.get(
            include=["documents", "metadatas"],
            limit=limit,
            where=where,
        )
        return self._format_documents(data)

    @staticmethod
    def _format_documents(data: Dict[str, Any]) -> List[Dict[str, Any]]:
        documents = data.get("documents") or []
        metadatas = data.get("metadatas") or []
        ids = data.get("ids") or []
        embeddings = data.get("embeddings")
        
        formatted: List[Dict[str, Any]] = []
        for idx, text in enumerate(documents):
            item = {
                "id": ids[idx] if idx < len(ids) else None,
                "text": text,
                "meta": metadatas[idx] if idx < len(metadatas) else {},
            }
            if embeddings and idx < len(embeddings):
                item["embedding"] = embeddings[idx]
            
            formatted.append(item)
        return formatted
