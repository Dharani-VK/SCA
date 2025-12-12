
import os
import sys
import sqlite3
from app.vector_store import ChromaVectorStore
from app.routers.auth import get_db_connection

# Mock environment if needed
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

def debug_documents():
    print("--- Debugging Documents ---")
    
    # 1. Check SQLite DB
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename, storage_path, university, roll_no FROM documents")
    rows = cursor.fetchall()
    conn.close()
    
    print(f"\n[SQLite] Found {len(rows)} documents. Checking first one:")
    if not rows:
        print("No documents in DB.")
        return

    row = rows[0]
    print(f"  ID: {row['id']}")
    print(f"  - Filename:      {row['filename']}")
    print(f"  - Storage Path:  {row['storage_path']}")
    print(f"  - User:          {row['roll_no']} ({row['university']})")
    
    # 2. Check Vector Store for this document
    store = ChromaVectorStore()
    
    # Write to verdict file to avoid console truncation
    with open('backend/verdict.txt', 'w', encoding='utf-8') as f:
        f.write(f"Filename: {row['filename']}\n")
        f.write(f"Storage Path: {row['storage_path']}\n")
        f.write(f"User: {row['roll_no']} ({row['university']})\n")
        
        peek = store.collection.peek(limit=1)
        if peek and peek['metadatas']:
            f.write(f"Peek Meta Sample: {peek['metadatas'][0]}\n")
        else:
            f.write("Peek: Collection Empty\n")
            
        filters = {"university": row['university'], "roll_no": row['roll_no']}
        docs = store.get_documents_by_source(row['storage_path'], filters=filters)
        f.write(f"Chunks found by Storage Path: {len(docs)}\n")
        
        docs_file = store.get_documents_by_source(row['filename'], filters=filters)
        f.write(f"Chunks found by Filename: {len(docs_file)}\n")

if __name__ == "__main__":
    debug_documents()
