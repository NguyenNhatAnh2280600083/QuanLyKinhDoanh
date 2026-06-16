from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..models.models import (
    MaterialRequest,
    MaterialRequestStatus,
    RawMaterial,
    RawMaterialLog,
    RawMaterialLogType,
    User
)
from ..schemas.material_request_schema import MaterialRequestCreate, MaterialRequestUpdate
from fastapi import HTTPException
from datetime import datetime

class MaterialRequestService:
    @staticmethod
    def _generate_request_code(db: Session) -> str:
        from sqlalchemy import func
        today = datetime.now()
        year = today.year
        month = today.month
        prefix = f"MR-{year}{month:02d}"
        
        max_request = db.query(MaterialRequest).filter(
            MaterialRequest.request_code.like(f"{prefix}%")
        ).order_by(desc(MaterialRequest.request_code)).first()
        
        if not max_request:
            return f"{prefix}-001"
        
        try:
            last_num = int(max_request.request_code.split("-")[-1])
            return f"{prefix}-{last_num + 1:03d}"
        except (ValueError, IndexError):
            count = db.query(MaterialRequest).filter(
                MaterialRequest.request_code.like(f"{prefix}%")
            ).count()
            return f"{prefix}-{count + 1:03d}"

    @staticmethod
    def get_all(db: Session, status: MaterialRequestStatus = None, skip: int = 0, limit: int = 100):
        from sqlalchemy.orm import aliased
        ApproverUser = aliased(User)
        
        query = db.query(
            MaterialRequest.id,
            MaterialRequest.request_code,
            MaterialRequest.material_id,
            MaterialRequest.requested_quantity,
            MaterialRequest.current_stock,
            MaterialRequest.missing_quantity,
            MaterialRequest.reason,
            MaterialRequest.status,
            MaterialRequest.production_plan_id,
            MaterialRequest.created_by,
            MaterialRequest.approved_by,
            MaterialRequest.approved_at,
            MaterialRequest.created_at,
            MaterialRequest.updated_at,
            RawMaterial.name.label("material_name"),
            RawMaterial.unit.label("material_unit"),
            User.full_name.label("creator_full_name"),
            ApproverUser.full_name.label("approver_full_name")
        ).join(RawMaterial, MaterialRequest.material_id == RawMaterial.id)\
         .join(User, MaterialRequest.created_by == User.id)\
         .outerjoin(ApproverUser, MaterialRequest.approved_by == ApproverUser.id)\
         .order_by(desc(MaterialRequest.created_at))
        
        if status:
            query = query.filter(MaterialRequest.status == status)
        
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        
        return {
            "total": total,
            "items": items
        }

    @staticmethod
    def get_by_id(db: Session, request_id: int):
        from sqlalchemy.orm import aliased
        ApproverUser = aliased(User)
        
        result = db.query(
            MaterialRequest.id,
            MaterialRequest.request_code,
            MaterialRequest.material_id,
            MaterialRequest.requested_quantity,
            MaterialRequest.current_stock,
            MaterialRequest.missing_quantity,
            MaterialRequest.reason,
            MaterialRequest.status,
            MaterialRequest.production_plan_id,
            MaterialRequest.created_by,
            MaterialRequest.approved_by,
            MaterialRequest.approved_at,
            MaterialRequest.created_at,
            MaterialRequest.updated_at,
            RawMaterial.name.label("material_name"),
            RawMaterial.unit.label("material_unit"),
            User.full_name.label("creator_full_name"),
            ApproverUser.full_name.label("approver_full_name")
        ).join(RawMaterial, MaterialRequest.material_id == RawMaterial.id)\
         .join(User, MaterialRequest.created_by == User.id)\
         .outerjoin(ApproverUser, MaterialRequest.approved_by == ApproverUser.id)\
         .filter(MaterialRequest.id == request_id).first()
        
        if not result:
            raise HTTPException(status_code=404, detail="Material request not found")
        return result

    @staticmethod
    def create(db: Session, request_data: MaterialRequestCreate, user_id: int):
        request_code = MaterialRequestService._generate_request_code(db)
        
        db_request = MaterialRequest(
            request_code=request_code,
            material_id=request_data.material_id,
            requested_quantity=request_data.requested_quantity,
            current_stock=request_data.current_stock,
            missing_quantity=request_data.missing_quantity,
            reason=request_data.reason,
            production_plan_id=request_data.production_plan_id,
            created_by=user_id,
            status=MaterialRequestStatus.PENDING
        )
        
        db.add(db_request)
        db.commit()
        db.refresh(db_request)
        return db_request

    @staticmethod
    def create_or_update_shortage_request(
        db: Session,
        material_id: int,
        requested_quantity: float,
        current_stock: float,
        missing_quantity: float,
        reason: str,
        production_plan_id: int,
        user_id: int
    ):
        existing_request = db.query(MaterialRequest).filter(
            MaterialRequest.material_id == material_id,
            MaterialRequest.production_plan_id == production_plan_id,
            MaterialRequest.status.in_([
                MaterialRequestStatus.PENDING,
                MaterialRequestStatus.APPROVED
            ])
        ).order_by(desc(MaterialRequest.created_at)).first()

        if existing_request:
            if existing_request.status == MaterialRequestStatus.PENDING:
                existing_request.requested_quantity = requested_quantity
                existing_request.current_stock = current_stock
                existing_request.missing_quantity = missing_quantity
                existing_request.reason = reason
            return existing_request

        db_request = MaterialRequest(
            request_code=MaterialRequestService._generate_request_code(db),
            material_id=material_id,
            requested_quantity=requested_quantity,
            current_stock=current_stock,
            missing_quantity=missing_quantity,
            reason=reason,
            production_plan_id=production_plan_id,
            created_by=user_id,
            status=MaterialRequestStatus.PENDING
        )
        db.add(db_request)
        db.flush()
        return db_request

    @staticmethod
    def update(db: Session, request_id: int, request_data: MaterialRequestUpdate):
        db_request = db.query(MaterialRequest).filter(MaterialRequest.id == request_id).first()
        if not db_request:
            raise HTTPException(status_code=404, detail="Material request not found")
        
        for key, value in request_data.model_dump(exclude_unset=True).items():
            setattr(db_request, key, value)
        
        db.commit()
        db.refresh(db_request)
        return db_request

    @staticmethod
    def approve(db: Session, request_id: int, user_id: int):
        db_request = db.query(MaterialRequest).filter(MaterialRequest.id == request_id).first()
        if not db_request:
            raise HTTPException(status_code=404, detail="Material request not found")
        
        db_request.status = MaterialRequestStatus.APPROVED
        db_request.approved_by = user_id
        db_request.approved_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_request)
        return db_request

    @staticmethod
    def reject(db: Session, request_id: int, user_id: int, reason: str = None):
        db_request = db.query(MaterialRequest).filter(MaterialRequest.id == request_id).first()
        if not db_request:
            raise HTTPException(status_code=404, detail="Material request not found")
        
        db_request.status = MaterialRequestStatus.REJECTED
        if reason:
            db_request.reason = (db_request.reason or "") + f"\n\nLý do từ chối: {reason}"
        
        db.commit()
        db.refresh(db_request)
        return db_request

    @staticmethod
    def complete(db: Session, request_id: int, user_id: int):
        db_request = db.query(MaterialRequest).filter(MaterialRequest.id == request_id).with_for_update().first()
        if not db_request:
            raise HTTPException(status_code=404, detail="Material request not found")

        if db_request.status == MaterialRequestStatus.COMPLETED:
            return db_request

        if db_request.status != MaterialRequestStatus.APPROVED:
            raise HTTPException(status_code=400, detail="Chỉ yêu cầu đã duyệt mới được hoàn tất nhập hàng")

        material = db.query(RawMaterial).filter(RawMaterial.id == db_request.material_id).with_for_update().first()
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")

        material.stock_quantity += db_request.requested_quantity

        log = RawMaterialLog(
            material_id=db_request.material_id,
            type=RawMaterialLogType.IMPORT,
            quantity=db_request.requested_quantity,
            note=f"Nhập kho từ yêu cầu {db_request.request_code}",
            created_by=user_id
        )
        db.add(log)
        
        db_request.status = MaterialRequestStatus.COMPLETED
        
        db.commit()
        db.refresh(db_request)
        return db_request

    @staticmethod
    def delete(db: Session, request_id: int):
        db_request = db.query(MaterialRequest).filter(MaterialRequest.id == request_id).first()
        if not db_request:
            raise HTTPException(status_code=404, detail="Material request not found")
        
        db.delete(db_request)
        db.commit()
        return {"message": "Material request deleted successfully"}
