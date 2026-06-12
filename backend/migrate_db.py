# pyrefly: ignore [missing-import]
import pymysql
from dotenv import load_dotenv
import os

load_dotenv()

# Parse DATABASE_URL
db_url = os.getenv("DATABASE_URL")
# mysql+pymysql://root:123456@localhost:3306/QLbanhangkinhdoanh
parts = db_url.replace("mysql+pymysql://", "").split("@")
user_pass = parts[0].split(":")
host_db = parts[1].split("/")

config = {
    'host': host_db[0],
    'user': user_pass[0],
    'password': user_pass[1],
    'database': host_db[1]
}

try:
    conn = pymysql.connect(**config)
    cursor = conn.cursor()
    
    # Update production_plans table enum
    sql = """ALTER TABLE production_plans 
    MODIFY COLUMN status ENUM('waiting_production', 'in_production', 'production_done', 'cancelled') DEFAULT 'waiting_production'"""
    
    cursor.execute(sql)
    conn.commit()
    print("✓ Database updated successfully - added 'cancelled' status to production_plans")
    
except Exception as e:
    print(f"✗ Error: {e}")
finally:
    if cursor:
        cursor.close()
    if conn:
        conn.close()
