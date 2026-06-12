from app.seed import seed_db
import os

if __name__ == "__main__":
    print("Seeding database...")
    seed_db()
    print("Seeding completed!")
