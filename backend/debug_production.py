"""Debug script to test production plan update"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models.models import ProductionPlan, ProductionStatus, Product, InventoryLog, InventoryLogType
from datetime import datetime

db = SessionLocal()

# 1. Check production plans exist
plans = db.query(ProductionPlan).all()
print(f"Total plans: {len(plans)}")

if plans:
    plan = plans[0]
    print(f"\nPlan #{plan.id}:")
    print(f"  order_id: {plan.order_id}")
    print(f"  product_id: {plan.product_id}")
    print(f"  required_quantity: {plan.required_quantity}")
    print(f"  planned_quantity: {plan.planned_quantity}")
    print(f"  completed_quantity: {plan.completed_quantity}")
    print(f"  status: {plan.status}")
    
    # Check column names
    print(f"\nColumn check:")
    try:
        val = plan.is_inventory_processed
        print(f"  is_inventory_processed = {val}")
    except AttributeError as e:
        print(f"  is_inventory_processed ERROR: {e}")
    
    try:
        val = plan.is_stock_deducted
        print(f"  is_stock_deducted = {val}")
    except AttributeError as e:
        print(f"  is_stock_deducted ERROR: {e}")

    # Try the actual update logic
    print(f"\n--- Simulating update to 500 ---")
    try:
        plan.completed_quantity = 500
        
        if plan.completed_quantity >= plan.planned_quantity:
            plan.status = ProductionStatus.PRODUCTION_DONE
            plan.actual_completion_date = datetime.now()
            print(f"  Status -> PRODUCTION_DONE")
        
        if not plan.is_inventory_processed:
            excess = plan.completed_quantity - plan.planned_quantity
            print(f"  Excess: {excess}")
            
            if excess > 0:
                product = db.query(Product).filter(Product.id == plan.product_id).first()
                print(f"  Product stock before: {product.stock_quantity}")
                product.stock_quantity += excess
                print(f"  Product stock after: {product.stock_quantity}")
                
                log = InventoryLog(
                    product_id=plan.product_id,
                    order_id=plan.order_id,
                    type=InventoryLogType.IN,
                    quantity=excess,
                    note=f"Test excess",
                    created_by=1
                )
                db.add(log)
            
            plan.is_inventory_processed = 1
        
        db.commit()
        print("  SUCCESS!")
    except Exception as e:
        db.rollback()
        print(f"  FAILED: {type(e).__name__}: {e}")

db.close()
