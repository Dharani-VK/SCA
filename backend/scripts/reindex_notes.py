#!/usr/bin/env python
"""Utility script to (re)ingest local note files into the RAG index and Chroma store."""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path
from typing import Iterable, Sequence

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from app.ingest import ingest_bytes  # noqa: E402
from app.rag import reset_index  # noqa: E402
from app.vector_store import ChromaVectorStore  # noqa: E402

logger = logging.getLogger("rag.ingest")

SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".md", ".markdown"}


def iter_files(base: Path, extensions: Sequence[str]) -> Iterable[Path]:
    if base.is_file():
        yield base
        return
    for path in base.rglob("*"):
        if path.is_file() and path.suffix.lower() in extensions:
            yield path


def main() -> None:
    parser = argparse.ArgumentParser(description="Rebuild the local retrieval index from note files.")
    parser.add_argument("path", type=Path, help="Directory or file containing study notes (PDF, TXT, MD).")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Clear existing RAG and Chroma stores before ingesting.",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable debug logging for troubleshooting.",
    )
    args = parser.parse_args()

    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO)

    store = ChromaVectorStore()
    if args.reset:
        logger.info("Resetting vector stores before ingestion.")
        store.clear()
        reset_index()

    base_path = args.path
    if not base_path.exists():
        parser.error(f"Path not found: {base_path}")

    total_chunks = 0
    processed_files = 0
    for file_path in iter_files(base_path, SUPPORTED_EXTENSIONS):
        try:
            data = file_path.read_bytes()
        except OSError as exc:
            logger.warning("Failed to read %s: %s", file_path, exc)
            continue
        count = ingest_bytes(data, store, source_name=file_path.name)
        if count:
            processed_files += 1
            total_chunks += count
            logger.info("Indexed %s (%d chunks)", file_path.name, count)
        else:
            logger.info("Skipped %s (no text extracted)", file_path.name)

    logger.info("Ingestion complete: %d files, %d chunks", processed_files, total_chunks)


if __name__ == "__main__":
    main()
