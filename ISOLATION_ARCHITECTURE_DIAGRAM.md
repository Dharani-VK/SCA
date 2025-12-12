 # Multi-Tenant Data Isolation - Visual Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SMART CAMPUS ASSISTANT                             │
│                        Multi-Tenant Data Isolation                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              STUDENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────┐        ┌──────────────┐        ┌──────────────┐          │
│  │  Student A   │        │  Student B   │        │  Admin User  │          │
│  │  SCA:001     │        │  SCA:002     │        │  SCA:ADMIN   │          │
│  │  (Amir)      │        │  (Dev)       │        │  (Admin)     │          │
│  └──────┬───────┘        └──────┬───────┘        └──────┬───────┘          │
│         │                       │                       │                   │
│         │ JWT Token             │ JWT Token             │ JWT Token         │
│         │ {uni:SCA,roll:001}    │ {uni:SCA,roll:002}    │ {uni:SCA,ADMIN}  │
│         │                       │                       │                   │
└─────────┼───────────────────────┼───────────────────────┼───────────────────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION LAYER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  JWT Verification & Student Identity Extraction                      │   │
│  │  - Decode JWT token                                                  │   │
│  │  - Extract {university, roll_no}                                     │   │
│  │  - Verify signature and expiration                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEPENDENCY INJECTION LAYER                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────┐                  ┌──────────────────────┐         │
│  │ get_student_filter() │                  │  ensure_admin()      │         │
│  │                      │                  │                      │         │
│  │ Returns:             │                  │ Verifies:            │         │
│  │ {                    │                  │ - is_admin = True    │         │
│  │   university: "SCA", │                  │ - roll_no = "ADMIN"  │         │
│  │   roll_no: "001"     │                  │                      │         │
│  │ }                    │                  │ Raises 403 if not    │         │
│  └──────────────────────┘                  └──────────────────────┘         │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API ENDPOINTS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Student Endpoints              │  Admin Endpoints                           │
│  (use get_student_filter)       │  (use ensure_admin)                       │
│  ─────────────────────────      │  ─────────────────────                    │
│  • POST /ingest-file            │  • GET /admin/student-performance         │
│  • GET  /documents              │  • GET /admin/activity-log                │
│  • GET  /documents/{id}         │                                           │
│  • POST /qa                     │  Regular students → 403 Forbidden         │
│  • POST /summary                │  Only admins can access                   │
│  • POST /quiz                   │                                           │
│  • POST /quiz/next              │                                           │
│  • GET  /dashboard/overview     │                                           │
│  • GET  /self-test/isolation    │                                           │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
          │                       │
          ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA ISOLATION LAYER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      VECTOR STORE (ChromaDB)                         │   │
│  │                                                                       │   │
│  │  Query with filters: {university: "SCA", roll_no: "001"}            │   │
│  │                                                                       │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │   │
│  │  │ Student A Docs  │  │ Student B Docs  │  │ Student C Docs  │    │   │
│  │  │ uni:SCA         │  │ uni:SCA         │  │ uni:MIT         │    │   │
│  │  │ roll:001        │  │ roll:002        │  │ roll:003        │    │   │
│  │  │                 │  │                 │  │                 │    │   │
│  │  │ ✓ Visible to A  │  │ ✗ Hidden from A │  │ ✗ Hidden from A │    │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘    │   │
│  │                                                                       │   │
│  │  Metadata Filtering: WHERE university = ? AND roll_no = ?           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      RAG INDEX (FAISS)                               │   │
│  │                                                                       │   │
│  │  Post-retrieval filtering by {university, roll_no}                  │   │
│  │                                                                       │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │   │
│  │  │ Embeddings A    │  │ Embeddings B    │  │ Embeddings C    │    │   │
│  │  │ + metadata      │  │ + metadata      │  │ + metadata      │    │   │
│  │  │ uni:SCA,roll:001│  │ uni:SCA,roll:002│  │ uni:MIT,roll:003│    │   │
│  │  │                 │  │                 │  │                 │    │   │
│  │  │ ✓ Retrieved     │  │ ✗ Filtered out  │  │ ✗ Filtered out  │    │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      FILE SYSTEM                                     │   │
│  │                                                                       │   │
│  │  /data/                                                              │   │
│  │    ├── SCA/                                                          │   │
│  │    │   ├── 001/  ← Student A's files (Amir)                         │   │
│  │    │   │   ├── ml_notes_20251211.pdf                                │   │
│  │    │   │   └── lecture_20251211.txt                                 │   │
│  │    │   │                                                             │   │
│  │    │   ├── 002/  ← Student B's files (Dev)                          │   │
│  │    │   │   └── python_guide_20251211.pdf                            │   │
│  │    │   │                                                             │   │
│  │    │   └── ADMIN/  ← Admin files                                    │   │
│  │    │                                                                 │   │
│  │    └── MIT/                                                          │   │
│  │        └── 003/  ← Student C's files                                │   │
│  │                                                                       │   │
│  │  Physical separation prevents cross-student access                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ANALYTICS DATABASE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  student_activity table                                              │   │
│  │  ─────────────────────────                                           │   │
│  │  | id | university | roll_no | activity_type | timestamp |          │   │
│  │  |----|------------|---------|---------------|-----------|          │   │
│  │  | 1  | SCA        | 001     | login         | ...       |          │   │
│  │  | 2  | SCA        | 002     | login         | ...       |          │   │
│  │  | 3  | SCA        | 001     | upload        | ...       |          │   │
│  │  │                                                                   │   │
│  │  Query: WHERE university = ? AND roll_no = ?                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ⚠️  Note: quiz_attempts and retrieval_events use session_id              │   │
│      Need session-to-student mapping for complete isolation               │   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Upload Example

```
Student A uploads "ml_notes.pdf"
│
├─ 1. Authentication
│  └─ JWT Token: {university: "SCA", roll_no: "001"}
│
├─ 2. Dependency Injection
│  └─ get_student_filter() → {university: "SCA", roll_no: "001"}
│
├─ 3. File Processing
│  ├─ Extract text from PDF
│  ├─ Clean text (remove emojis, duplicates)
│  ├─ Chunk text (1000 chars, 200 overlap)
│  └─ Generate embeddings
│
├─ 4. Metadata Injection
│  └─ Each chunk tagged with:
│     {
│       "source": "ml_notes.pdf",
│       "chunk_index": 0,
│       "university": "SCA",      ← Student identity
│       "roll_no": "001",          ← Student identity
│       "ingested_at": "2025-12-11T07:58:11Z"
│     }
│
├─ 5. Storage
│  ├─ ChromaDB: Store chunks with metadata
│  ├─ FAISS: Index embeddings with metadata
│  └─ File System: Save to /data/SCA/001/ml_notes_20251211.pdf
│
└─ 6. Result
   └─ Document available ONLY to Student A
```

## Data Flow: Retrieval Example

```
Student B tries to retrieve documents
│
├─ 1. Authentication
│  └─ JWT Token: {university: "SCA", roll_no: "002"}
│
├─ 2. Dependency Injection
│  └─ get_student_filter() → {university: "SCA", roll_no: "002"}
│
├─ 3. Vector Store Query
│  └─ ChromaDB: WHERE university = "SCA" AND roll_no = "002"
│
├─ 4. Filtering
│  ├─ Student A's docs: {uni: "SCA", roll: "001"} → ✗ FILTERED OUT
│  ├─ Student B's docs: {uni: "SCA", roll: "002"} → ✓ INCLUDED
│  └─ Student C's docs: {uni: "MIT", roll: "003"} → ✗ FILTERED OUT
│
└─ 5. Result
   └─ Student B sees ONLY their own documents
      Student A's "ml_notes.pdf" is NOT visible ✓
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: JWT Authentication                                │
│  - Verifies user identity                                   │
│  - Extracts {university, roll_no}                           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Dependency Injection                              │
│  - Automatically applies student filter                     │
│  - Prevents manual filter bypass                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Vector Store Filtering                            │
│  - ChromaDB metadata WHERE clause                           │
│  - Database-level enforcement                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: RAG Post-Filtering                                │
│  - FAISS retrieval + metadata check                         │
│  - Double verification                                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 5: File System Isolation                             │
│  - Physical directory separation                            │
│  - /data/{university}/{roll_no}/                           │
└─────────────────────────────────────────────────────────────┘

Result: Defense in Depth - Multiple layers prevent data leakage
```

## Isolation Test Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Test: Verify Student B cannot see Student A's data        │
└─────────────────────────────────────────────────────────────┘

Step 1: Login as Student A
   ↓
Step 2: Upload document as Student A
   ↓
Step 3: Verify Student A can see document
   ↓
Step 4: Login as Student B
   ↓
Step 5: Try to access documents as Student B
   ↓
Step 6: Verify Student B sees ZERO documents from Student A
   ↓
┌─────────────────────────────────────────────────────────────┐
│  Expected Result:                                           │
│  ✅ Student A: 1 document                                   │
│  ✅ Student B: 0 documents                                  │
│  ✅ ISOLATION VERIFIED                                      │
└─────────────────────────────────────────────────────────────┘
```

---

**Legend:**
- ✓ = Allowed / Visible
- ✗ = Denied / Hidden
- → = Data flow direction
- ↓ = Sequential step
