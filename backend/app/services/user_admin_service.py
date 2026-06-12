from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from ..models.models import Role, User
from ..schemas.role_schema import UserAdminCreate, UserAdminUpdate
from ..utils.security import get_password_hash


class UserAdminService:
    @staticmethod
    def list_users(db: Session):
        return (
            db.query(User)
            .options(joinedload(User.role).joinedload(Role.permissions))
            .order_by(User.id.asc())
            .all()
        )

    @staticmethod
    def get_user(db: Session, user_id: int):
        return (
            db.query(User)
            .options(joinedload(User.role).joinedload(Role.permissions))
            .filter(User.id == user_id)
            .first()
        )

    @staticmethod
    def create_user(db: Session, data: UserAdminCreate):
        if db.query(User).filter(User.username == data.username).first():
            raise HTTPException(status_code=400, detail="Username already registered")
        if db.query(User).filter(User.email == data.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")

        role = db.query(Role).filter(Role.id == data.role_id).first()
        if not role:
            raise HTTPException(status_code=400, detail="Role not found")

        user = User(
            username=data.username,
            email=data.email,
            full_name=data.full_name,
            hashed_password=get_password_hash(data.password),
            role_id=data.role_id,
            is_active=1,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return UserAdminService.get_user(db, user.id)

    @staticmethod
    def update_user(db: Session, user_id: int, data: UserAdminUpdate):
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        payload = data.model_dump(exclude_unset=True)
        if "email" in payload:
            existing_email = db.query(User).filter(User.email == payload["email"], User.id != user_id).first()
            if existing_email:
                raise HTTPException(status_code=400, detail="Email already registered")
            user.email = payload["email"]

        if "full_name" in payload:
            user.full_name = payload["full_name"]

        if "password" in payload and payload["password"]:
            user.hashed_password = get_password_hash(payload["password"])

        db.commit()
        return UserAdminService.get_user(db, user_id)

    @staticmethod
    def change_role(db: Session, user_id: int, role_id: int):
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            raise HTTPException(status_code=400, detail="Role not found")

        user.role_id = role_id
        db.commit()
        return UserAdminService.get_user(db, user_id)

    @staticmethod
    def lock_user(db: Session, user_id: int):
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.username == "admin":
            raise HTTPException(status_code=400, detail="Cannot lock admin user")
        user.is_active = 0
        db.commit()
        return UserAdminService.get_user(db, user_id)

    @staticmethod
    def unlock_user(db: Session, user_id: int):
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.is_active = 1
        db.commit()
        return UserAdminService.get_user(db, user_id)
