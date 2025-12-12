import sqlite3
import os

db_path = "analytics.db"
if not os.path.exists(db_path):
    print("analytics.db not found")
    exit()

conn = sqlite3.connect(db_path)
try:
    cursor = conn.execute("SELECT count(*) FROM quiz_attempts")
    count = cursor.fetchone()[0]
    print(f"Total quiz attempts: {count}")
    
    if count > 0:
        cursor = conn.execute("SELECT * FROM quiz_attempts LIMIT 1")
        print("Sample row:", cursor.fetchone())
except Exception as e:
    print(f"Error reading DB: {e}")
finally:
    conn.close()
