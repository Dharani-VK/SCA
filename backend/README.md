# Smart Campus Assistant — Backend (Local RAG Stack)

This FastAPI backend now runs entirely on local models. It uses:

- **Sentence Transformers** (`all-MiniLM-L6-v2`) for text embeddings, or optional Ollama embeddings.
- **ChromaDB** for the vector store.
- **Ollama** running `llama3.1` (or any other local model) for chat, summaries, and quizzes.

The React frontend lives in the `frontend/` folder and can be started separately (see its README).

## Prerequisites

1. **Python** 3.11+
2. **Ollama** installed: https://ollama.com/download
3. Pull the desired models (minimum):

	```powershell
	ollama pull llama3.1
	# Optional, if you want Ollama-powered embeddings instead of sentence-transformers
	ollama pull nomic-embed-text
	```

## Setup (PowerShell)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Environment (optional)

| Variable | Default | Purpose |
|----------|---------|---------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Where the Ollama HTTP API is running |
| `OLLAMA_MODEL` | `llama3.1` | Chat/summarisation/quiz model |
| `OLLAMA_EMBED_MODEL` | _(unset)_ | If set, use Ollama’s embedding model (e.g. `nomic-embed-text`) |
| `EMBEDDER_MODEL` | `sentence-transformers/all-MiniLM-L6-v2` | Embedding model for sentence-transformers |
| `OLLAMA_TIMEOUT` | `90` | Seconds to wait for an Ollama response |

If `OLLAMA_EMBED_MODEL` is not set, the app falls back to the local sentence-transformer model. All embeddings and responses remain local, no cloud APIs required.

## Run the API

```powershell
uvicorn app.main:app --reload --port 8000
```

## Typical Flow

1. Start Ollama (`ollama serve` runs automatically once installed).
2. Run the FastAPI server as above.
3. In the frontend or via cURL/HTTP client:
	- `POST /ingest-file` with a PDF/TXT file to chunk and embed it.
	- `POST /qa` with `{ "question": "..." }` to run RAG-powered QA.
	- `POST /summary` for condensed notes.
	- `POST /quiz` to generate a static quiz sheet, or `POST /quiz/next` to drive the adaptive quiz one question at a time.

The ChromaDB data persists in `backend/chroma_store/` (ignored by git). Use `POST /reset-store` to wipe it.
