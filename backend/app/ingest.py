import importlib
import io
import os
import re
import logging
import zipfile
from collections import Counter
from xml.etree import ElementTree as ET
from datetime import datetime
from threading import Lock
from typing import List, Dict, Optional, Any
# import PyPDF2 lazily inside PDF extraction to allow running tests without the package installed
from .vector_store import ChromaVectorStore
from .rag import add_to_index
from .analytics import derive_chunk_topics
import numpy as np
import requests
from sentence_transformers import SentenceTransformer

# Lightweight English stop-word list used when extracting keywords from ingested content.
STOP_WORDS: set[str] = {
    "a",
    "about",
    "above",
    "after",
    "again",
    "against",
    "all",
    "am",
    "an",
    "and",
    "any",
    "are",
    "aren't",
    "as",
    "at",
    "be",
    "because",
    "been",
    "before",
    "being",
    "below",
    "between",
    "both",
    "but",
    "by",
    "can't",
    "cannot",
    "could",
    "couldn't",
    "did",
    "didn't",
    "do",
    "does",
    "doesn't",
    "doing",
    "don't",
    "down",
    "during",
    "each",
    "few",
    "for",
    "from",
    "further",
    "had",
    "hadn't",
    "has",
    "hasn't",
    "have",
    "haven't",
    "having",
    "he",
    "he'd",
    "he'll",
    "he's",
    "her",
    "here",
    "here's",
    "hers",
    "herself",
    "him",
    "himself",
    "his",
    "how",
    "how's",
    "i",
    "i'd",
    "i'll",
    "i'm",
    "i've",
    "if",
    "in",
    "into",
    "is",
    "isn't",
    "it",
    "it's",
    "its",
    "itself",
    "let's",
    "me",
    "more",
    "most",
    "mustn't",
    "my",
    "myself",
    "no",
    "nor",
    "not",
    "of",
    "off",
    "on",
    "once",
    "only",
    "or",
    "other",
    "ought",
    "our",
    "ours",
    "ourselves",
    "out",
    "over",
    "own",
    "same",
    "she",
    "she'd",
    "she'll",
    "she's",
    "should",
    "shouldn't",
    "so",
    "some",
    "such",
    "than",
    "that",
    "that's",
    "the",
    "their",
    "theirs",
    "them",
    "themselves",
    "then",
    "there",
    "there's",
    "these",
    "they",
    "they'd",
    "they'll",
    "they're",
    "they've",
    "this",
    "those",
    "through",
    "to",
    "too",
    "under",
    "until",
    "up",
    "very",
    "was",
    "wasn't",
    "we",
    "we'd",
    "we'll",
    "we're",
    "we've",
    "were",
    "weren't",
    "what",
    "what's",
    "when",
    "when's",
    "where",
    "where's",
    "which",
    "while",
    "who",
    "who's",
    "whom",
    "why",
    "why's",
    "with",
    "won't",
    "would",
    "wouldn't",
    "you",
    "you'd",
    "you'll",
    "you're",
    "you've",
    "your",
    "yours",
    "yourself",
    "yourselves",
}

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL")
SENTENCE_TRANSFORMER_MODEL = os.getenv("EMBEDDER_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

_embedder: SentenceTransformer | None = None
_embedder_lock = Lock()


def extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    try:
        import PyPDF2
    except Exception as e:
        raise RuntimeError("PyPDF2 is required for PDF extraction. Install it with 'pip install PyPDF2'.") from e
    reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
    texts = []
    for page in reader.pages:
        try:
            texts.append(page.extract_text() or "")
        except Exception:
            continue
    result = "\n\n".join(texts)
    
    # If no usable text was extracted, attempt OCR as a secondary path.
    if not result.strip() or result.count("Scanned with") > 5:
        ocr_text = _ocr_pdf_bytes(file_bytes)
        if ocr_text.strip():
            return ocr_text
        raise ValueError(
            "The PDF appears to be scanned images. Tried OCR but no text was recovered. "
            "Install Tesseract and optional dependencies (pypdfium2, pillow, pytesseract) or upload an OCR-converted PDF."
        )
    
    return result


def _extract_text_from_docx_zip(zf: zipfile.ZipFile) -> str:
    try:
        xml_bytes = zf.read('word/document.xml')
    except KeyError:
        return ""

    root = ET.fromstring(xml_bytes)
    namespace = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    paragraphs: List[str] = []
    for paragraph in root.findall('.//w:p', namespace):
        texts = [node.text for node in paragraph.findall('.//w:t', namespace) if node.text]
        if texts:
            paragraphs.append("".join(texts))
    return "\n".join(paragraphs)


def _extract_text_from_pptx_zip(zf: zipfile.ZipFile) -> str:
    namespace = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}
    slides = [name for name in zf.namelist() if name.startswith('ppt/slides/slide') and name.endswith('.xml')]
    collected: List[str] = []
    for slide_name in slides:
        try:
            xml_bytes = zf.read(slide_name)
        except KeyError:
            continue
        root = ET.fromstring(xml_bytes)
        for node in root.findall('.//a:t', namespace):
            if node.text:
                collected.append(node.text)
    return "\n".join(collected)


def extract_text_auto(file_bytes: bytes, source_name: str | None = None) -> tuple[str, Dict[str, Any]]:
    """Best-effort text extraction with lightweight structural hints."""

    details: Dict[str, Any] = {
        "fileType": None,
        "tables": [],
        "fallbacks": [],
    }

    # If bytes look like a PDF, use PDF extractor first.
    if file_bytes[:4] == b"%PDF":
        details["fileType"] = "pdf"
        return extract_text_from_pdf_bytes(file_bytes), details

    lower_name = (source_name or "").lower()

    # Handle spreadsheets (xlsx, xls, csv)
    if lower_name.endswith((".xlsx", ".xls", ".csv")):
        sheet_text, tables = _extract_spreadsheet_text(file_bytes, lower_name)
        if sheet_text.strip():
            details["fileType"] = "spreadsheet"
            details["tables"] = tables
            return sheet_text, details

    # Handle docx/pptx (OpenXML zip formats)
    try:
        if zipfile.is_zipfile(io.BytesIO(file_bytes)):
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
                members = zf.namelist()
                if any(name.startswith('word/') for name in members) or lower_name.endswith('.docx'):
                    docx_text = _extract_text_from_docx_zip(zf)
                    if docx_text.strip():
                        details["fileType"] = "docx"
                        return docx_text, details
                if any(name.startswith('ppt/') for name in members) or lower_name.endswith('.pptx'):
                    pptx_text = _extract_text_from_pptx_zip(zf)
                    if pptx_text.strip():
                        details["fileType"] = "pptx"
                        return pptx_text, details
    except zipfile.BadZipFile:
        pass
    except ET.ParseError:
        pass

    # Default: attempt UTF-8 decode
    try:
        txt = file_bytes.decode("utf-8", errors="ignore")
        txt = txt.lstrip("\ufeff")
        txt = txt.replace("\r\n", "\n").replace("\r", "\n")
        if txt.strip():
            details["fileType"] = details.get("fileType") or (lower_name.split('.')[-1] if lower_name else "text")
            return txt, details
    except Exception:
        pass

    tika_text = _extract_with_tika(file_bytes)
    if tika_text.strip():
        details["fileType"] = details.get("fileType") or "generic"
        details["fallbacks"].append("tika")
        return tika_text, details

    return "", details


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP):
    tokens = []
    start = 0
    L = len(text)
    while start < L:
        end = min(start + chunk_size, L)
        chunk = text[start:end]
        tokens.append(chunk)
        start = max(end - overlap, end)
    return tokens


def _hash_embedding(text: str, dim: int = 384):
    # Simple deterministic hashing-based embedding fallback for local testing
    vec = np.zeros(dim, dtype=float)
    tokens = re.findall(r"\w+", text.lower())
    if not tokens:
        return vec.tolist()
    for t in tokens:
        idx = hash(t) % dim
        vec[idx] += 1.0
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()


def _get_sentence_transformer() -> SentenceTransformer:
    global _embedder
    with _embedder_lock:
        if _embedder is None:
            logger.info("Loading sentence-transformer model: %s", SENTENCE_TRANSFORMER_MODEL)
            _embedder = SentenceTransformer(SENTENCE_TRANSFORMER_MODEL)
    return _embedder


def _embed_with_ollama(texts: List[str]) -> List[List[float]]:
    embeddings: List[List[float]] = []
    url = f"{OLLAMA_BASE_URL.rstrip('/')}/api/embeddings"
    for text in texts:
        response = requests.post(
            url,
            json={"model": OLLAMA_EMBED_MODEL, "prompt": text},
            timeout=60,
        )
        response.raise_for_status()
        payload = response.json()
        embeddings.append(payload.get("embedding", []))
    return embeddings


def _embed_with_sentence_transformer(texts: List[str]) -> List[List[float]]:
    model = _get_sentence_transformer()
    vectors = model.encode(texts, normalize_embeddings=True)
    return vectors.tolist()


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Embed text snippets using Ollama embeddings or a local sentence-transformer."""
    if not texts:
        return []
    if OLLAMA_EMBED_MODEL:
        try:
            return _embed_with_ollama(texts)
        except requests.RequestException as exc:
            logger.warning("Ollama embedding failed; falling back to sentence-transformer. Error: %s", exc)
    try:
        return _embed_with_sentence_transformer(texts)
    except Exception as exc:
        logger.warning("Sentence-transformer embedding failed; using hash fallback. Error: %s", exc)
    return [_hash_embedding(text) for text in texts]


def _ocr_pdf_bytes(file_bytes: bytes) -> str:
    """Convert PDF pages to text using OCR. Requires optional OCR dependencies."""
    try:
        pypdfium2 = importlib.import_module("pypdfium2")
    except ImportError as exc:
        raise RuntimeError(
            "pypdfium2 is required for OCR fallback. Install it with 'pip install pypdfium2'."
        ) from exc
    try:
        pytesseract = importlib.import_module("pytesseract")
    except ImportError as exc:
        raise RuntimeError(
            "pytesseract is required for OCR fallback. Install it with 'pip install pytesseract'."
        ) from exc
    try:
        importlib.import_module("PIL.Image")
    except ImportError as exc:
        raise RuntimeError(
            "pillow is required for OCR fallback image handling. Install it with 'pip install pillow'."
        ) from exc

    pdf_stream = io.BytesIO(file_bytes)
    document = pypdfium2.PdfDocument(pdf_stream)
    collected: List[str] = []
    try:
        for index in range(len(document)):
            page = document[index]
            render = page.render(scale=2.0)
            try:
                pil_image = render.to_pil()
            finally:
                render.close()
            text = pytesseract.image_to_string(pil_image)
            if text.strip():
                collected.append(text)
            page.close()
    finally:
        document.close()
    return "\n\n".join(collected)


def _extract_spreadsheet_text(file_bytes: bytes, lower_name: str) -> tuple[str, List[Dict[str, Any]]]:
    tables: List[Dict[str, Any]] = []
    try:
        import pandas as pd  # type: ignore
    except ImportError:
        return "", tables

    buffer = io.BytesIO(file_bytes)
    try:
        if lower_name.endswith('.csv'):
            frames = {'Sheet1': pd.read_csv(buffer)}
        else:
            frames = pd.read_excel(buffer, sheet_name=None)
    except Exception:
        return "", tables

    table_texts: List[str] = []
    for sheet_name, frame in frames.items():
        if frame is None:
            continue
        trimmed = frame.fillna("")
        preview = trimmed.head(25)
        columns = [str(col) for col in preview.columns]
        rows = [[str(value) for value in row] for row in preview.values.tolist()]
        tables.append(
            {
                "title": sheet_name,
                "columns": columns,
                "rows": rows,
            }
        )
        header = " | ".join(columns)
        body_lines = [" | ".join(row) for row in rows]
        table_texts.append(f"Sheet {sheet_name}:\n{header}\n" + "\n".join(body_lines))
    return "\n\n".join(table_texts), tables


def _extract_with_tika(file_bytes: bytes) -> str:
    try:
        from tika import parser  # type: ignore
    except Exception:
        return ""
    try:
        parsed = parser.from_buffer(file_bytes)
    except Exception:
        return ""
    content = parsed.get("content") or ""
    return (content or "").replace("\r\n", "\n").replace("\r", "\n")


def _split_paragraphs(text: str) -> List[str]:
    chunks = [re.sub(r"\s+", " ", block).strip() for block in re.split(r"\n{2,}", text)]
    return [chunk for chunk in chunks if len(chunk) >= 60]


def _extract_headings(lines: List[str]) -> List[str]:
    headings: List[str] = []
    pattern = re.compile(r"^(?:#+\s*|\d+[\.)]\s+)?[A-Z][A-Z\d\s\-:]{3,}$")
    for raw in lines:
        candidate = raw.strip()
        if not candidate:
            continue
        if pattern.match(candidate) or (candidate == candidate.upper() and len(candidate) > 5):
            cleaned = re.sub(r"^(?:#+\s*|\d+[\.)]\s+)", "", candidate).strip()
            if cleaned and cleaned not in headings:
                headings.append(cleaned)
    return headings[:25]


def _extract_definitions(paragraphs: List[str]) -> List[Dict[str, str]]:
    definitions: List[Dict[str, str]] = []
    pattern = re.compile(r"^([A-Za-z][A-Za-z0-9\s/-]{3,60})\s*[:\-–]\s*(.+)$")
    for paragraph in paragraphs:
        match = pattern.match(paragraph)
        if match:
            term = match.group(1).strip()
            meaning = match.group(2).strip()
            if term and meaning:
                definitions.append({"term": term, "definition": meaning})
    return definitions[:25]


def _extract_examples(paragraphs: List[str]) -> List[str]:
    markers = ("for example", "for instance", "e.g.", "scenario", "case study")
    examples: List[str] = []
    for paragraph in paragraphs:
        lowered = paragraph.lower()
        if any(marker in lowered for marker in markers):
            examples.append(paragraph)
    return examples[:20]


def _extract_keywords(text: str, limit: int = 20) -> List[str]:
    tokens = re.findall(r"[A-Za-z][\w-]+", text.lower())
    filtered = [token for token in tokens if len(token) >= 4 and token not in STOP_WORDS]
    counts = Counter(filtered)
    ranked = [term for term, _ in counts.most_common(limit * 2)]
    unique: List[str] = []
    for term in ranked:
        if term not in unique:
            unique.append(term)
        if len(unique) >= limit:
            break
    return unique


def extract_structured_content(
    text: str,
    *,
    tables: Optional[List[Dict[str, Any]]] = None,
    source_name: Optional[str] = None,
    file_type: Optional[str] = None,
) -> Dict[str, Any]:
    normalized = (text or "").replace("\r\n", "\n").replace("\r", "\n")
    lines = [line.strip() for line in normalized.splitlines()]
    paragraphs = _split_paragraphs(normalized)
    headings = _extract_headings(lines)
    definitions = _extract_definitions(paragraphs)
    examples = _extract_examples(paragraphs)
    keywords = _extract_keywords(normalized)

    tables = tables or []

    truncated_paragraphs = [para[:400].strip() + ("..." if len(para) > 400 else "") for para in paragraphs[:40]]
    truncated_examples = [example[:320].strip() + ("..." if len(example) > 320 else "") for example in examples]

    return {
        "paragraphs": truncated_paragraphs,
        "headings": headings,
        "definitions": definitions,
        "examples": truncated_examples,
        "keywords": keywords,
        "tables": tables[:10],
        "contentLength": len(normalized),
        "sourceName": source_name,
        "fileType": file_type or "unknown",
    }


def _derive_chunk_keywords(text: str, limit: int = 6) -> List[str]:
    tokens = re.findall(r"[A-Za-z][\w-]+", text.lower())
    filtered = [token for token in tokens if len(token) >= 4 and token not in STOP_WORDS]
    counts = Counter(filtered)
    ranked = [term for term, _ in counts.most_common(limit)]
    return ranked[:limit]


def _annotate_chunks(
    chunks: List[str],
    structured: Dict[str, Any],
    chunk_topics: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    annotations: List[Dict[str, Any]] = []
    headings = structured.get("headings", [])
    examples = structured.get("examples", [])
    definitions = structured.get("definitions", [])

    topic_by_index = {
        int(entry.get("chunk_index", idx)): entry.get("topic")
        for idx, entry in enumerate(chunk_topics)
        if isinstance(entry, dict)
    }

    for idx, chunk in enumerate(chunks):
        lowered = chunk.lower()
        heading = next((h for h in headings if h.lower() in lowered), None)
        keywords = _derive_chunk_keywords(chunk)
        definition = next((d for d in definitions if d.get("term", "").lower() in lowered), None)
        example = next((e for e in examples if e.lower() in lowered), None)
        contains_table = any('|' in line or '\t' in line for line in chunk.splitlines())

        annotations.append(
            {
                "heading": heading,
                "keywords": keywords,
                "topic": topic_by_index.get(idx),
                "definitionTerm": definition.get("term") if definition else None,
                "definitionText": definition.get("definition") if definition else None,
                "example": example,
                "containsTable": contains_table,
            }
        )
    return annotations


def _build_semantic_blueprint(
    structured: Dict[str, Any],
    chunk_topics: List[Dict[str, Any]],
) -> Dict[str, Any]:
    topic_labels = [entry.get("topic") for entry in chunk_topics if entry.get("topic")]
    primary_topics = [label for label in topic_labels if label][:6]
    if not primary_topics:
        primary_topics = structured.get("headings", [])[:6]

    supporting = [definition.get("term") for definition in structured.get("definitions", [])][:5]

    return {
        "primaryTopics": primary_topics,
        "supportingConcepts": [term for term in supporting if term],
        "keywordCloud": structured.get("keywords", [])[:20],
        "exampleSnippets": structured.get("examples", [])[:5],
        "tableCount": len(structured.get("tables", [])),
    }


def ingest_bytes(
    file_bytes: bytes,
    store: ChromaVectorStore,
    source_name: str | None = None,
    *,
    with_metrics: bool = False,
    metadata_overrides: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any] | int:
    text, extraction_details = extract_text_auto(file_bytes, source_name)
    token_list = re.findall(r"[A-Za-z][\w-]+", text)
    token_count = len(token_list)
    chunks = chunk_text(text)
    chunk_topics = derive_chunk_topics(chunks)
    structured = extract_structured_content(
        text,
        tables=extraction_details.get("tables"),
        source_name=source_name,
        file_type=extraction_details.get("fileType"),
    )
    chunk_annotations = _annotate_chunks(chunks, structured, chunk_topics)
    semantic_blueprint = _build_semantic_blueprint(structured, chunk_topics)

    if not chunks:
        metrics = {
            "chunk_count": 0,
            "token_count": token_count,
            "char_count": len(text),
            "chunk_topics": chunk_topics,
            "chunk_annotations": chunk_annotations,
            "structured_content": structured,
            "semantic_blueprint": semantic_blueprint,
            "ingested_at": datetime.utcnow().isoformat(),
        }
        return metrics if with_metrics else 0

    embeddings = embed_texts(chunks)
    ingested_at = datetime.utcnow().isoformat()
    source = source_name or 'document'
    docs = []
    topic_map = {entry.get("chunk_index"): entry.get("topic") for entry in chunk_topics if isinstance(entry, dict)}
    
    # Prepare overrides once
    overrides = metadata_overrides or {}

    for i, (c, e) in enumerate(zip(chunks, embeddings)):
        annotation = chunk_annotations[i] if i < len(chunk_annotations) else {}
        topic_hint = topic_map.get(i)
        
        meta = {
            "source": source,
            "chunk_index": i,
            "ingested_at": ingested_at,
            "topic": topic_hint,
            **{k: v for k, v in annotation.items() if v},
            **overrides # Helper to context storage
        }

        docs.append({
            "id": f"{source}_{i}",
            "text": c,
            "embedding": e,
            "meta": meta
        })
    store.add_documents(docs)
    try:
        add_to_index(docs)
    except Exception as exc:
        logger.warning("RAG index update failed; continuing without refresh. Error: %s", exc)

    if with_metrics:
        return {
            "chunk_count": len(docs),
            "token_count": token_count,
            "char_count": len(text),
            "chunk_topics": chunk_topics,
            "chunk_annotations": chunk_annotations,
            "structured_content": structured,
            "semantic_blueprint": semantic_blueprint,
            "ingested_at": ingested_at,
        }
    return len(docs)


# Backwards-compatible alias used by main.py
def ingest_pdf_bytes(
    file_bytes: bytes,
    store: ChromaVectorStore,
    source_name: str | None = None,
    *,
    with_metrics: bool = False,
    metadata_overrides: Optional[Dict[str, Any]] = None,
):
    return ingest_bytes(file_bytes, store, source_name, with_metrics=with_metrics, metadata_overrides=metadata_overrides)
