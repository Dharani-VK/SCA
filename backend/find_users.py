import sqlite3
conn = sqlite3.connect("analytics.db")
cursor = conn.execute("SELECT DISTINCT university, roll_no FROM quiz_attempts")
rows = cursor.fetchall()
print("Users with data:", rows)
conn.close()
