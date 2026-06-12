import sys
import os

# Add root path to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.models import RawMaterial, ProductBOM, Product, User, RawMaterialLog, RawMaterialLogType

def seed_data():
    db = SessionLocal()
    try:
        # 1. Get admin user
        admin_user = db.query(User).first()
        if not admin_user:
            print("Error: No users found. Run seed_db.py first.")
            return

        # 2. Raw Materials Data
        materials_data = [
            {"code": "NVL-PHOI", "name": "Soap base powder", "unit": "kg", "stock_quantity": 5000, "minimum_stock": 1000, "description": "Main detergent ingredient"},
            {"code": "NVL-HUONG", "name": "Lemon fragrance", "unit": "liter", "stock_quantity": 100, "minimum_stock": 20, "description": "Scent for products"},
            {"code": "NVL-BAOBI-6KG", "name": "Lix 6kg bag", "unit": "pcs", "stock_quantity": 10000, "minimum_stock": 2000, "description": "6kg packaging"},
            {"code": "NVL-BAOBI-NGIAT", "name": "3.8kg Plastic bottle", "unit": "pcs", "stock_quantity": 5000, "minimum_stock": 1000, "description": "Detergent bottle"},
            {"code": "NVL-HOACHAT-A", "name": "LAS Surfactant", "unit": "kg", "stock_quantity": 2000, "minimum_stock": 500, "description": "Cleaning agent"},
            {"code": "NVL-MUOI", "name": "Industrial Salt NaCl", "unit": "kg", "stock_quantity": 3000, "minimum_stock": 800, "description": "Thickening agent"},
        ]

        inserted_materials = []
        for m_data in materials_data:
            existing = db.query(RawMaterial).filter(RawMaterial.code == m_data["code"]).first()
            if not existing:
                material = RawMaterial(**m_data)
                db.add(material)
                db.flush() 
                inserted_materials.append(material)
                
                # Create initial log
                log = RawMaterialLog(
                    material_id=material.id,
                    type=RawMaterialLogType.IMPORT,
                    quantity=m_data["stock_quantity"],
                    note="Initial system seeding",
                    created_by=admin_user.id
                )
                db.add(log)
            else:
                inserted_materials.append(existing)

        print(f"Seeded {len(inserted_materials)} raw materials.")

        # 3. Create BOM for products
        products = db.query(Product).limit(2).all()
        if not products:
            print("Warning: No products found.")
        else:
            for p in products:
                db.query(ProductBOM).filter(ProductBOM.product_id == p.id).delete()
            
            # BOM Product 1
            p1 = products[0]
            p1_bom = [
                {"product_id": p1.id, "material_id": inserted_materials[0].id, "quantity_required": 5.5},
                {"product_id": p1.id, "material_id": inserted_materials[4].id, "quantity_required": 0.4},
                {"product_id": p1.id, "material_id": inserted_materials[2].id, "quantity_required": 1.0},
            ]
            
            for b in p1_bom:
                db.add(ProductBOM(**b))
            
            # BOM Product 2
            if len(products) > 1:
                p2 = products[1]
                p2_bom = [
                    {"product_id": p2.id, "material_id": inserted_materials[5].id, "quantity_required": 2.0},
                    {"product_id": p2.id, "material_id": inserted_materials[1].id, "quantity_required": 0.05},
                    {"product_id": p2.id, "material_id": inserted_materials[3].id, "quantity_required": 1.0},
                ]
                for b in p2_bom:
                    db.add(ProductBOM(**b))

            print(f"BOM set for first 2 products.")

        db.commit()
        print("--- Seed successful! ---")
    except Exception as e:
        db.rollback()
        print(f"Error seeding: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
