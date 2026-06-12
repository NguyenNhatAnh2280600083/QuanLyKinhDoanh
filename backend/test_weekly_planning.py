from sqlalchemy import text
from app.database import SessionLocal, engine
from app.services.weekly_production_planning_service import WeeklyProductionPlanningService
from app.models.models import Order, OrderStatus, OrderItem, Product

def standalone_ensure_schema_updates():
    """Checks and adds safety_stock_rate to products table"""
    with engine.begin() as conn:
        print("Checking/adding safety_stock_rate to products table...")
        safety_stock_rate_column = conn.execute(
            text("SHOW COLUMNS FROM products LIKE 'safety_stock_rate'")
        ).mappings().first()
        if not safety_stock_rate_column:
            conn.execute(text(
                "ALTER TABLE products "
                "ADD COLUMN safety_stock_rate FLOAT DEFAULT 0.2 AFTER stock_quantity"
            ))
            print("Successfully added safety_stock_rate column!")
        else:
            print("safety_stock_rate column already exists.")

def run_test():
    print("=== Running Schema Updates ===")
    standalone_ensure_schema_updates()
    
    db = SessionLocal()
    try:
        print("\n=== Checking Products ===")
        products = db.query(Product).all()
        print(f"Total products: {len(products)}")
        for p in products:
            print(f"- {p.name} (Stock: {p.stock_quantity}, Safety stock rate: {p.safety_stock_rate})")

        print("\n=== Checking Completed Orders (last 7 days) ===")
        from datetime import datetime, timedelta
        seven_days_ago = datetime.now() - timedelta(days=7)
        completed_orders = db.query(Order).filter(Order.status == OrderStatus.COMPLETED, Order.created_at >= seven_days_ago).all()
        print(f"Completed orders in last 7 days: {len(completed_orders)}")
        for o in completed_orders:
            print(f"- Order ID: {o.id}, Created At: {o.created_at}, Total amount: {o.total_amount}")
            for item in o.items:
                print(f"  * Product: {item.product.name}, Quantity: {item.quantity}")

        print("\n=== Testing get_weekly_suggestions ===")
        suggestions = WeeklyProductionPlanningService.get_weekly_suggestions(db)
        print(f"Total suggestions generated: {len(suggestions)}")
        for s in suggestions:
            print(f"Product: {s['product_name']}")
            print(f"  - Sold last week: {s['sold_last_week']}")
            print(f"  - Avg daily sales: {s['avg_daily_sales']}")
            print(f"  - Forecast next week: {s['forecast_next_week']}")
            print(f"  - Current stock: {s['current_stock']}")
            print(f"  - Safety stock: {s['safety_stock']}")
            print(f"  - Suggested production: {s['suggested_production']}")
            print(f"  - Status: {s['status']}")
            print("-" * 30)

        print("\n=== Testing get_production_dashboard ===")
        dashboard = WeeklyProductionPlanningService.get_production_dashboard(db)
        print("Dashboard KPIs:")
        print(f"  - Total products needing production: {dashboard['total_products_need_production']}")
        print(f"  - Total planned quantity: {dashboard['total_planned_quantity']}")
        print(f"  - Low stock products: {dashboard['low_stock_products']}")
        print(f"  - Completion rate of last week: {dashboard['completion_rate']}")
        print(f"  - Top products needing production: {dashboard['top_products_need_production']}")

    finally:
        db.close()

if __name__ == "__main__":
    run_test()
