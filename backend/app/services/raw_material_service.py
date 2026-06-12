from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..models.models import RawMaterial, RawMaterialLog, RawMaterialLogType
from ..schemas.raw_material_schema import RawMaterialCreate, RawMaterialUpdate
from fastapi import HTTPException

class RawMaterialService:
    @staticmethod
    def get_all(db: Session):
        return db.query(RawMaterial).order_by(RawMaterial.code).all()

    @staticmethod
    def get_by_id(db: Session, material_id: int):
        return db.query(RawMaterial).filter(RawMaterial.id == material_id).first()

    @staticmethod
    def create(db: Session, material: RawMaterialCreate):
        db_material = RawMaterial(**material.model_dump())
        db.add(db_material)
        db.commit()
        db.refresh(db_material)
        return db_material

    @staticmethod
    def update(db: Session, material_id: int, material: RawMaterialUpdate):
        db_material = RawMaterialService.get_by_id(db, material_id)
        if not db_material:
            return None
        
        for key, value in material.model_dump(exclude_unset=True).items():
            setattr(db_material, key, value)
        
        db.commit()
        db.refresh(db_material)
        return db_material

    @staticmethod
    def delete(db: Session, material_id: int):
        db_material = RawMaterialService.get_by_id(db, material_id)
        if db_material:
            db.delete(db_material)
            db.commit()
            return True
        return False

    @staticmethod
    def import_material(db: Session, material_id: int, quantity: float, note: str, user_id: int):
        db_material = RawMaterialService.get_by_id(db, material_id)
        if not db_material:
            raise HTTPException(status_code=404, detail="Material not found")
        
        db_material.stock_quantity += quantity
        
        log = RawMaterialLog(
            material_id=material_id,
            type=RawMaterialLogType.IMPORT,
            quantity=quantity,
            note=note,
            created_by=user_id
        )
        db.add(log)
        db.commit()
        db.refresh(db_material)
        return db_material

    @staticmethod
    def export_material(db: Session, material_id: int, quantity: float, note: str, user_id: int):
        db_material = RawMaterialService.get_by_id(db, material_id)
        if not db_material:
            raise HTTPException(status_code=404, detail="Material not found")
        
        if db_material.stock_quantity < quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        
        db_material.stock_quantity -= quantity
        
        log = RawMaterialLog(
            material_id=material_id,
            type=RawMaterialLogType.EXPORT,
            quantity=quantity,
            note=note,
            created_by=user_id
        )
        db.add(log)
        db.commit()
        db.refresh(db_material)
        return db_material

    @staticmethod
    def get_logs(db: Session):
        from ..models.models import User
        logs = db.query(
            RawMaterialLog.id,
            RawMaterialLog.material_id,
            RawMaterialLog.type,
            RawMaterialLog.quantity,
            RawMaterialLog.note,
            RawMaterialLog.created_by,
            RawMaterialLog.created_at,
            RawMaterial.name.label("material_name"),
            User.full_name.label("user_full_name")
        ).join(RawMaterial, RawMaterialLog.material_id == RawMaterial.id)\
         .join(User, RawMaterialLog.created_by == User.id)\
         .order_by(desc(RawMaterialLog.created_at)).all()
        return logs
