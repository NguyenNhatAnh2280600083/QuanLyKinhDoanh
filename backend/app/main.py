from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .routers import (
    admin_roles,
    admin_users,
    auth,
    bom,
    customer_debts,
    customers,
    employee_reports,
    inventory,
    notifications,
    orders,
    product_analytics,
    products,
    production,
    reports,
    stats,
    users,
    raw_materials,
    weekly_production_planning,
)
from .config import settings
from .database import engine, Base
from sqlalchemy import text
import os


def ensure_schema_updates():
    if not settings.DATABASE_URL or not settings.DATABASE_URL.startswith("mysql"):
        return

    # Auto drop old table if week_number column is missing
    with engine.begin() as conn:
        table_exists = conn.execute(
            text("SHOW TABLES LIKE 'production_plans'")
        ).mappings().first()
        if table_exists:
            week_col = conn.execute(
                text("SHOW COLUMNS FROM production_plans LIKE 'week_number'")
            ).mappings().first()
            if not week_col:
                print("--- MIGRATION: Dropping old production plans tables ---")
                conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
                conn.execute(text("DROP TABLE IF EXISTS production_material_usage;"))
                conn.execute(text("DROP TABLE IF EXISTS production_plans;"))
                conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
                # Recreate them
                Base.metadata.create_all(bind=engine)
                print("--- MIGRATION: Recreated production plans tables successfully ---")

        # Check and add customer_type to customers table
        customer_type_column = conn.execute(
            text("SHOW COLUMNS FROM customers LIKE 'customer_type'")
        ).mappings().first()

        if not customer_type_column:
            conn.execute(text(
                "ALTER TABLE customers "
                "ADD COLUMN customer_type ENUM('MT', 'GT', 'ECOM', 'EXPORT') DEFAULT 'GT' AFTER region"
            ))

        role_description_column = conn.execute(
            text("SHOW COLUMNS FROM roles LIKE 'description'")
        ).mappings().first()
        if not role_description_column:
            conn.execute(text(
                "ALTER TABLE roles "
                "ADD COLUMN description TEXT NULL"
            ))

        role_created_at_column = conn.execute(
            text("SHOW COLUMNS FROM roles LIKE 'created_at'")
        ).mappings().first()
        if not role_created_at_column:
            conn.execute(text(
                "ALTER TABLE roles "
                "ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"
            ))

        # Check and add safety_stock_rate to products table
        safety_stock_rate_column = conn.execute(
            text("SHOW COLUMNS FROM products LIKE 'safety_stock_rate'")
        ).mappings().first()
        if not safety_stock_rate_column:
            conn.execute(text(
                "ALTER TABLE products "
                "ADD COLUMN safety_stock_rate FLOAT DEFAULT 0.2 AFTER stock_quantity"
            ))


# Create tables (In a real app, use Alembic)
Base.metadata.create_all(bind=engine)
ensure_schema_updates()

app = FastAPI(title=settings.PROJECT_NAME)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for product images
os.makedirs("static/products", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(auth.router)
app.include_router(admin_users.router)
app.include_router(admin_roles.router)
app.include_router(users.router)
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(orders.router)
app.include_router(weekly_production_planning.router)
app.include_router(production.router)
app.include_router(notifications.router)
app.include_router(stats.router)
app.include_router(reports.router)
app.include_router(product_analytics.router)
app.include_router(raw_materials.router)
app.include_router(bom.router)
app.include_router(customer_debts.router)
app.include_router(employee_reports.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Internal Sales Management System API"}
