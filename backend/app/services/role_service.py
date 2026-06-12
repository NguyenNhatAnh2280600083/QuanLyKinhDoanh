from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import delete
from ..models.models import Permission, Role, RolePermission
from ..schemas.role_schema import RoleCreate, RoleUpdate


class RoleService:
    DEFAULT_PERMISSIONS = [
        ("USER_MANAGEMENT", "Quản lý người dùng", "Tạo/sửa/khóa/mở khóa/gán role cho user"),
        ("ROLE_MANAGEMENT", "Quản lý role", "Tạo/sửa/xóa role"),
        ("PERMISSION_MANAGEMENT", "Quản lý phân quyền", "Gán permission cho role"),
        ("CUSTOMER_MANAGEMENT", "Quản lý khách hàng", "CRUD khách hàng"),
        ("DEBT_MANAGEMENT", "Quản lý công nợ", "Xem/ghi nhận công nợ"),
        ("PRODUCT_MANAGEMENT", "Quản lý sản phẩm", "CRUD sản phẩm"),
        ("ORDER_MANAGEMENT", "Quản lý đơn hàng", "CRUD đơn hàng"),
        ("INVENTORY_VIEW", "Xem tồn kho", "Xem tồn kho thành phẩm"),
        ("WAREHOUSE_MANAGEMENT", "Quản lý kho", "Nhập/xuất/điều chỉnh kho + xem nhật ký kho"),
        ("RAW_MATERIAL_MANAGEMENT", "Quản lý NVL", "CRUD nguyên vật liệu + nhập/xuất"),
        ("BOM_MANAGEMENT", "Quản lý BOM", "CRUD BOM + tính nhu cầu NVL"),
        ("PRODUCTION_MANAGEMENT", "Quản lý kế hoạch sản xuất", "CRUD kế hoạch sản xuất"),
        ("REPORT_VIEW", "Xem báo cáo", "Xem báo cáo doanh thu"),
        ("PRODUCT_ANALYTICS_VIEW", "Xem Product Analytics", "Xem báo cáo phân tích sản phẩm"),
    ]

    @staticmethod
    def list_roles(db: Session):
        return db.query(Role).options(joinedload(Role.permissions)).order_by(Role.id.asc()).all()

    @staticmethod
    def create_role(db: Session, data: RoleCreate):
        existing = db.query(Role).filter(Role.name == data.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Role already exists")

        role = Role(name=data.name, description=data.description)
        db.add(role)
        db.commit()
        db.refresh(role)
        return role

    @staticmethod
    def update_role(db: Session, role_id: int, data: RoleUpdate):
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")

        payload = data.model_dump(exclude_unset=True)
        if "name" in payload:
            existing = db.query(Role).filter(Role.name == payload["name"], Role.id != role_id).first()
            if existing:
                raise HTTPException(status_code=400, detail="Role name already exists")

        for k, v in payload.items():
            setattr(role, k, v)

        db.commit()
        db.refresh(role)
        return role

    @staticmethod
    def delete_role(db: Session, role_id: int):
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")

        if role.name == "admin":
            raise HTTPException(status_code=400, detail="Cannot delete admin role")

        has_users = db.query(Role).filter(Role.id == role_id).first().users
        if has_users:
            raise HTTPException(status_code=400, detail="Role has users")

        db.execute(delete(RolePermission).where(RolePermission.role_id == role_id))
        db.delete(role)
        db.commit()
        return True

    @staticmethod
    def list_permissions(db: Session):
        existing = {p.code: p for p in db.query(Permission).all()}
        created = False
        for code, name, description in RoleService.DEFAULT_PERMISSIONS:
            if code not in existing:
                db.add(Permission(code=code, name=name, description=description))
                created = True
        if created:
            db.commit()
        return db.query(Permission).order_by(Permission.id.asc()).all()

    @staticmethod
    def set_role_permissions(db: Session, role_id: int, permission_ids: list[int]):
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")

        permissions = db.query(Permission).filter(Permission.id.in_(permission_ids)).all() if permission_ids else []
        if len(permissions) != len(set(permission_ids)):
            raise HTTPException(status_code=400, detail="Some permissions not found")

        db.execute(delete(RolePermission).where(RolePermission.role_id == role_id))
        for permission in permissions:
            db.add(RolePermission(role_id=role_id, permission_id=permission.id))

        db.commit()
        return db.query(Role).options(joinedload(Role.permissions)).filter(Role.id == role_id).first()
