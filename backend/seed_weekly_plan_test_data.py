from sqlalchemy import text

from app.database import Base, SessionLocal, engine
from app.models.models import (
    Category,
    Customer,
    Order,
    OrderItem,
    Product,
    ProductionMaterialUsage,
    ProductionPlan,
)


TEST_PREFIX = "[TEST PLAN]"


PRODUCTS = []


CUSTOMERS = []




def delete_previous_test_orders(db, customers):
    customer_ids = [customer.id for customer in customers]
    if not customer_ids:
        return

    order_ids = [
        row[0]
        for row in db.query(Order.id).filter(Order.customer_id.in_(customer_ids)).all()
    ]
    if not order_ids:
        return

    db.query(OrderItem).filter(OrderItem.order_id.in_(order_ids)).delete(synchronize_session=False)
    db.query(Order).filter(Order.id.in_(order_ids)).delete(synchronize_session=False)
    db.flush()




def delete_previous_test_plans(db, products):
    product_ids = [product.id for product in products]
    if not product_ids:
        return

    plan_ids = [
        row[0]
        for row in db.query(ProductionPlan.id).filter(ProductionPlan.product_id.in_(product_ids)).all()
    ]
    if not plan_ids:
        return

    db.query(ProductionMaterialUsage).filter(
        ProductionMaterialUsage.production_plan_id.in_(plan_ids)
    ).delete(synchronize_session=False)
    db.query(ProductionPlan).filter(ProductionPlan.id.in_(plan_ids)).delete(synchronize_session=False)
    db.flush()


def find_test_products(db):
    return db.query(Product).filter(Product.name.startswith(TEST_PREFIX)).all()


def find_test_customers(db):
    return db.query(Customer).filter(Customer.name.startswith(TEST_PREFIX)).all()


def delete_test_products(db, products):
    product_ids = [product.id for product in products]
    if not product_ids:
        return

    db.query(Product).filter(Product.id.in_(product_ids)).delete(synchronize_session=False)
    db.flush()


def delete_test_customers(db, customers):
    customer_ids = [customer.id for customer in customers]
    if not customer_ids:
        return

    db.query(Customer).filter(Customer.id.in_(customer_ids)).delete(synchronize_session=False)
    db.flush()


def delete_test_category(db):
    db.query(Category).filter(Category.name == f"{TEST_PREFIX} Weekly Planning").delete(synchronize_session=False)
    db.flush()



def seed_weekly_plan_test_data():
    Base.metadata.create_all(bind=engine)
    ensure_schema_updates()
    db = SessionLocal()
    try:
        products = find_test_products(db)
        customers = find_test_customers(db)

        delete_previous_test_orders(db, customers)
        delete_previous_test_plans(db, products)
        delete_test_products(db, products)
        delete_test_customers(db, customers)
        delete_test_category(db)

        db.commit()
        print("Weekly production planning test data removed successfully.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def ensure_schema_updates():
    if not engine.url.get_backend_name().startswith("mysql"):
        return

    with engine.begin() as conn:
        safety_stock_rate_column = conn.execute(
            text("SHOW COLUMNS FROM products LIKE 'safety_stock_rate'")
        ).mappings().first()
        if not safety_stock_rate_column:
            conn.execute(
                text(
                    "ALTER TABLE products "
                    "ADD COLUMN safety_stock_rate FLOAT NOT NULL DEFAULT 0.2 AFTER low_stock_threshold"
                )
            )
            print("Added products.safety_stock_rate column.")


if __name__ == "__main__":
    seed_weekly_plan_test_data()
