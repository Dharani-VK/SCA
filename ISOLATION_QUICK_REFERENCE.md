# Data Isolation Quick Reference

## How It Works (End-to-End)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Student Login & Upload                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  JWT Token       │
                    │  {university,    │
                    │   roll_no}       │
                    └──────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Dependency Injection (Automatic)                    │
│  get_student_filter() → {university: "SCA", roll_no: "001"}    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Vector Store Query                            │
│  store.similarity_search(query, filters=student_filter)         │
│                                                                   │
│  ChromaDB WHERE clause:                                         │
│    WHERE university = "SCA" AND roll_no = "001"                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Results (Filtered)                            │
│  ✓ Only chunks with matching {university, roll_no}             │
│  ✗ Other students' chunks are EXCLUDED                          │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Student Filter Dependency
```python
# In any endpoint:
from app.dependencies import get_student_filter

@app.get("/my-endpoint")
def my_endpoint(student_filter: Dict = Depends(get_student_filter)):
    # student_filter = {university: "SCA", roll_no: "001"}
    results = store.similarity_search(..., filters=student_filter)
```

### 2. Admin Protection
```python
from app.dependencies import ensure_admin

@app.get("/admin/endpoint")
def admin_endpoint(admin: Student = Depends(ensure_admin)):
    # Only admins can access
    # Regular students → 403 Forbidden
```

### 3. Metadata Injection (Upload)
```python
# In /ingest-file endpoint:
metadata_overrides = {
    "university": current_user.university,
    "roll_no": current_user.roll_no,
}
ingest_pdf_bytes(..., metadata_overrides=metadata_overrides)
```

## Isolation Checklist

When adding a new feature, ensure:

- [ ] Endpoint uses `get_student_filter()` dependency
- [ ] All vector store calls include `filters=student_filter`
- [ ] All RAG calls include `filters=student_filter`
- [ ] Uploaded data includes student metadata
- [ ] Admin endpoints use `ensure_admin()` dependency
- [ ] Test with multiple students to verify isolation

## Common Patterns

### Pattern 1: Document Retrieval
```python
@app.get("/documents")
def list_docs(student_filter: Dict = Depends(get_student_filter)):
    stats = store.stats(filters=student_filter)
    return stats
```

### Pattern 2: Semantic Search
```python
@app.post("/search")
def search(query: str, student_filter: Dict = Depends(get_student_filter)):
    embedding = embed_texts([query])[0]
    results = store.similarity_search(
        embedding, 
        top_k=5, 
        filters=student_filter  # ← Critical!
    )
    return results
```

### Pattern 3: RAG Retrieval
```python
@app.post("/qa")
def qa(question: str, student_filter: Dict = Depends(get_student_filter)):
    embedding = embed_texts([question])[0]
    contexts = rag_retrieve_texts(
        embedding,
        top_k=5,
        filters=student_filter  # ← Critical!
    )
    answer = generate_answer(question, contexts)
    return answer
```

## Testing Commands

### Quick Test
```bash
# Run automated test
python backend/test_isolation.py
```

### Manual Verification
```bash
# 1. Login as Student A
TOKEN_A=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"university":"SCA","roll_no":"A001","full_name":"Alice","password":"smart2025"}' \
  | jq -r '.access_token')

# 2. Upload as Student A
curl -X POST http://localhost:8000/ingest-file \
  -H "Authorization: Bearer $TOKEN_A" \
  -F "file=@test.pdf"

# 3. Login as Student B
TOKEN_B=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"university":"SCA","roll_no":"B002","full_name":"Bob","password":"smart2025"}' \
  | jq -r '.access_token')

# 4. Check Student B's docs (should be empty)
curl http://localhost:8000/documents \
  -H "Authorization: Bearer $TOKEN_B"

# Expected: {"sources": [], "total_docs": 0}
```

## Troubleshooting

### Issue: Student can see other students' data
**Cause**: Missing `filters=student_filter` in query
**Fix**: Add `filters=student_filter` to all store/RAG calls

### Issue: Admin cannot access admin endpoints
**Cause**: User not marked as admin in database
**Fix**: Update database:
```sql
UPDATE students 
SET is_admin = 1 
WHERE roll_no = 'ADMIN';
```

### Issue: 403 Forbidden on regular endpoints
**Cause**: Using `ensure_admin()` instead of `get_student_filter()`
**Fix**: Use correct dependency:
```python
# Wrong:
def endpoint(admin: Student = Depends(ensure_admin)):

# Right:
def endpoint(student_filter: Dict = Depends(get_student_filter)):
```

## Security Checklist

- ✅ JWT token required for all endpoints (except /auth/*)
- ✅ Student filter automatically injected
- ✅ Vector store enforces metadata filtering
- ✅ RAG enforces post-retrieval filtering
- ✅ Admin endpoints protected by `ensure_admin()`
- ✅ File uploads tagged with student metadata
- ✅ Self-test endpoint available for verification

## Quick Reference Table

| Operation | Isolation Method | Code Location |
|-----------|------------------|---------------|
| Upload | Metadata injection | `main.py:263-369` |
| List Docs | Student filter | `main.py:372-376` |
| Get Doc | Student filter | `main.py:379-408` |
| QA | Student filter | `main.py:469-540` |
| Summary | Student filter | `main.py:543-601` |
| Quiz | Student filter | `main.py:604-670` |
| Dashboard | Student filter | `main.py:1118-1252` |
| Admin | ensure_admin() | `admin.py:9-66` |

## Environment Variables

```bash
# Required for production
SECRET_KEY=your-secret-key-here  # JWT signing key
ANALYTICS_DB_PATH=./analytics.db  # SQLite database path

# Optional
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=nomic-embed-text
EMBEDDER_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

## Contact

For questions or issues with data isolation:
1. Check `ISOLATION_IMPLEMENTATION.md` for detailed architecture
2. Check `ISOLATION_SUMMARY.md` for implementation details
3. Run `python backend/test_isolation.py` to verify
4. Check backend logs for filter application
