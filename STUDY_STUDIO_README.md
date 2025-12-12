
# Study Studio Feature

## Configuration

### Environment Variables
Add the following to your backend `.env` file:
```bash
# OpenAI (Required for Fusion & TTS)
OPENAI_API_KEY=sk-proj-...

# Groq (Optional - for fast semantic search/retrieval)
GROQ_API_KEY=gsk_...
GROQ_MODEL=mixtral-8x7b-32768
```

### Infrastructure
- **Database**: Uses the existing `analytics.db` SQLite database. The `summaries` table is automatically created on startup.
- **Worker**: Uses FastAPI `BackgroundTasks` (in-process) for simplicity. For production scaling, move `_fusion_worker` logic to Celery/Bull.
- **Vector Store**: Uses the existing ChromaDB instance managed by `app.vector_store`.

## Usage
1. **Navigate** to `/study-studio` in the frontend or click "Study Studio" in the sidebar.
2. **Type** a topic in the Magic Prompt Ring (e.g., "Photosynthesis").
3. **Wait** for the fusion engine to retrieve chunks from your documents and generate a summary.
4. **Interact** with the resulting cards (Overview, Concepts, Practice).
5. **Listen** via the Voice Avatar (requires OpenAI TTS).

## Testing
Run the backend tests:
```bash
cd backend
python -m pytest tests/test_study_studio.py
```
