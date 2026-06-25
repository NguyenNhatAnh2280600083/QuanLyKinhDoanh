# seed.py – Populate the MySQL database with initial data
"""
Utility script that reads the `QuanlyKinhDoanh.sql` dump file and executes
all statements against the MySQL server defined in the `.env` configuration.

Usage (run on your local machine or on the VPS after the containers are up):
    python seed.py

The script expects an environment variable `DATABASE_URL` in the form:
    mysql+pymysql://<user>:<password>@<host>:<port>/<database>

If you are using the Docker compose setup, you can point to the service
`db` (MySQL) by setting:
    DATABASE_URL="mysql+pymysql://root:example@localhost:3306/qlbanhangkinhdoanh"
"""

import os
import re
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Load environment variables – .env file is located under backend/.env
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set in .env – cannot connect to database")

# Path to the SQL dump file (project root)
SQL_DUMP_PATH = Path(__file__).parent.parent / "QuanlyKinhDoanh.sql"
if not SQL_DUMP_PATH.is_file():
    raise FileNotFoundError(f"SQL dump not found at {SQL_DUMP_PATH}")

engine = create_engine(DATABASE_URL, echo=False, future=True)

def run_sql_file(sql_path: Path):
    """Read the .sql file, split into individual statements and execute.
    MySQL dump files contain comments and multi‑line statements; we strip
    comments and execute each non‑empty statement.
    """
    raw_sql = sql_path.read_text(encoding="utf-8")
    # Remove MySQL comments (lines starting with -- or /*! ... */)
    cleaned_sql = []
    for line in raw_sql.splitlines():
        stripped = line.strip()
        if stripped.startswith("--") or stripped.startswith("/*!"):
            continue
        cleaned_sql.append(line)
    cleaned_sql = "\n".join(cleaned_sql)
    # Split on semicolon that ends a statement (ignore semicolons inside
    # definitions by a simple regex – works for most dump files)
    statements = [stmt.strip() for stmt in re.split(r";\s*\n", cleaned_sql) if stmt.strip()]
    with engine.begin() as conn:
        for stmt in statements:
            try:
                conn.execute(text(stmt))
            except SQLAlchemyError as exc:
                print(f"[WARN] Failed to execute statement: {stmt[:60]}… -> {exc}")
    print(f"✅ Executed {len(statements)} statements from {sql_path.name}")

if __name__ == "__main__":
    run_sql_file(SQL_DUMP_PATH)
