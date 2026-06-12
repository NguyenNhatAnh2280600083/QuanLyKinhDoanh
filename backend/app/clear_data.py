import sys
import os
from sqlalchemy.orm import Session
from sqlalchemy import text

# Add the current directory to sys.path to find app module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.models import Order, OrderItem, InventoryLog, ProductionPlan, Notification, OrderStatusLog, Payment

def clear_transaction_data():
    db = SessionLocal()
    try:
        print("Starting to clear transaction data...")

        # Delete in order of dependencies (Foreign Keys)
        print("Deleting notifications...")
        db.query(Notification).delete()
        
        print("Deleting order status logs...")
        db.query(OrderStatusLog).delete()
        
        print("Deleting payments...")
        db.query(Payment).delete()
        
        print("Deleting inventory logs...")
        db.query(InventoryLog).delete()
        
        print("Deleting production plans...")
        db.query(ProductionPlan).delete()
        
        print("Deleting order items...")
        db.query(OrderItem).delete()
        
        print("Deleting orders...")
        db.query(Order).delete()
        
        db.commit()
        print("Successfully cleared all transaction data!")
        print("Users, Customers, and Products are preserved.")

    except Exception as e:
        print(f"Error during clearing data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clear_transaction_data()
