import sqlite3
import os
from passlib.context import CryptContext

# Define the database path explicitly relative to backend
DB_PATH = "analytics.db"

def init_db():
    print(f"Initializing Database at: {os.path.abspath(DB_PATH)}")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Create Tables
    print("Creating tables...")
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            university TEXT NOT NULL,
            roll_no TEXT NOT NULL,
            full_name TEXT NOT NULL,
            hashed_password TEXT DEFAULT 'shared_auth', 
            is_active INTEGER DEFAULT 1,
            is_admin INTEGER DEFAULT 0,
            UNIQUE(university, roll_no)
        );
        
        CREATE TABLE IF NOT EXISTS student_activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            university TEXT NOT NULL,
            roll_no TEXT NOT NULL,
            activity_type TEXT NOT NULL,
            details TEXT,
            timestamp TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS user_sessions (
            session_id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES students(id)
        );

        -- NEW: Documents Table
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            university TEXT NOT NULL,
            roll_no TEXT NOT NULL,
            filename TEXT NOT NULL,
            storage_path TEXT NOT NULL,
            file_type TEXT,
            file_size INTEGER,
            difficulty TEXT DEFAULT 'Medium',
            created_at TEXT NOT NULL,
            version_number INTEGER DEFAULT 1,
            content_hash TEXT,
            is_deleted INTEGER DEFAULT 0
        );

        -- NEW: Document Versions Table
        CREATE TABLE IF NOT EXISTS document_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id INTEGER NOT NULL,
            version_number INTEGER NOT NULL,
            storage_path TEXT NOT NULL,
            filename TEXT NOT NULL, 
            created_at TEXT NOT NULL,
            difficulty TEXT,
            FOREIGN KEY(document_id) REFERENCES documents(id)
        );
    """)
    
    # 2. Check for Admin User (Existing logic)
    print("Checking for Admin user...")
    cursor.execute("SELECT * FROM students WHERE roll_no = 'ADMIN'")
    if not cursor.fetchone():
        print("Admin user not found. Creating...")
        pass_str = "admin2025"
        
        try:
            pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
            hashed = pwd_context.hash(pass_str)
        except Exception as e:
            print(f"HASH FAILURE: {e}")
            import hashlib
            hashed = hashlib.sha256(pass_str.encode()).hexdigest()

        cursor.execute("""
            INSERT INTO students (university, roll_no, full_name, hashed_password, is_active, is_admin)
            VALUES (?, ?, ?, ?, ?, ?)
        """, ("SCA", "ADMIN", "System Admin", hashed, 1, 1))
        conn.commit()
        print("✅ Admin user created.")
    else:
        print("✅ Admin user already exists.")

    conn.close()
    print("Database initialization complete.")

if __name__ == "__main__":
    init_db()
