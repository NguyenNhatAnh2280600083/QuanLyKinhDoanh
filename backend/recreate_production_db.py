import sys
import os

# Add parent directory to path to allow importing app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine, Base
from app.models.models import ProductionPlan, ProductionMaterialUsage

def recreate_db():
    print("Connecting to database and dropping tables...")
    with engine.begin() as conn:
        # Disable foreign key checks to allow dropping tables safely
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        conn.execute(text("DROP TABLE IF EXISTS production_material_usage;"))
        conn.execute(text("DROP TABLE IF EXISTS production_plans;"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
    
    print("Creating updated tables...")
    Base.metadata.create_all(bind=engine)
    print("OK: Tables recreated successfully with the new schema!")

if __name__ == "__main__":
    recreate_db()
