from sqlalchemy.orm import Session
from ..models.models import ProductBOM, Product, RawMaterial, ProductionPlan, ProductionMaterialUsage, RawMaterialLog, RawMaterialLogType
from ..schemas.bom_schema import BOMCreate, BOMUpdate
from fastapi import HTTPException

class BOMService:
    @staticmethod
    def get_by_product(db: Session, product_id: int):
        return db.query(
            ProductBOM.id,
            ProductBOM.product_id,
            ProductBOM.material_id,
            ProductBOM.quantity_required,
            RawMaterial.name.label("material_name"),
            RawMaterial.unit.label("material_unit")
        ).join(RawMaterial, ProductBOM.material_id == RawMaterial.id)\
         .filter(ProductBOM.product_id == product_id).all()

    @staticmethod
    def create(db: Session, bom_data: BOMCreate):
        db_bom = ProductBOM(**bom_data.model_dump())
        db.add(db_bom)
        db.commit()
        db.refresh(db_bom)
        return db_bom

    @staticmethod
    def update(db: Session, bom_id: int, bom_data: BOMUpdate):
        db_bom = db.query(ProductBOM).filter(ProductBOM.id == bom_id).first()
        if not db_bom:
            return None
        db_bom.quantity_required = bom_data.quantity_required
        db.commit()
        db.refresh(db_bom)
        return db_bom

    @staticmethod
    def delete(db: Session, bom_id: int):
        db_bom = db.query(ProductBOM).filter(ProductBOM.id == bom_id).first()
        if db_bom:
            db.delete(db_bom)
            db.commit()
            return True
        return False

    @staticmethod
    def calculate_requirements(db: Session, product_id: int, quantity: float):
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        bom_items = BOMService.get_by_product(db, product_id)
        required_materials = []
        status = "ENOUGH"
        missing_any = False

        for item in bom_items:
            material = db.query(RawMaterial).filter(RawMaterial.id == item.material_id).first()
            required_qty = quantity * item.quantity_required
            enough = material.stock_quantity >= required_qty
            
            if not enough:
                status = "NOT_ENOUGH"
                missing_any = True

            required_materials.append({
                "material_id": item.material_id,
                "material_name": item.material_name,
                "required_quantity": required_qty,
                "current_stock": material.stock_quantity,
                "enough": enough
            })

        return {
            "product_name": product.name,
            "required_materials": required_materials,
            "status": status,
            "missing_any": missing_any
        }

    @staticmethod
    def get_missing_materials_for_production(db: Session, product_id: int, quantity: float):
        requirements = BOMService.calculate_requirements(db, product_id, quantity)
        return [
            {
                **item,
                "missing_quantity": max(0.0, item["required_quantity"] - item["current_stock"])
            }
            for item in requirements["required_materials"]
            if not item["enough"]
        ]

    @staticmethod
    def deduct_materials_for_production(db: Session, plan_id: int, user_id: int):
        plan = db.query(ProductionPlan).filter(ProductionPlan.id == plan_id).first()
        if not plan:
            return

        bom_items = db.query(ProductBOM).filter(ProductBOM.product_id == plan.product_id).all()
        
        for item in bom_items:
            material = db.query(RawMaterial).filter(RawMaterial.id == item.material_id).first()
            qty_used = plan.completed_quantity * item.quantity_required
            
            # Update material stock
            material.stock_quantity -= qty_used
            
            # Create usage log
            usage = ProductionMaterialUsage(
                production_plan_id=plan_id,
                material_id=item.material_id,
                quantity_used=qty_used
            )
            db.add(usage)
            
            # Create material inventory log
            log = RawMaterialLog(
                material_id=item.material_id,
                type=RawMaterialLogType.EXPORT,
                quantity=qty_used,
                note=f"Xuất sản xuất theo kế hoạch #{plan_id}",
                created_by=user_id
            )
            db.add(log)

        db.commit()
