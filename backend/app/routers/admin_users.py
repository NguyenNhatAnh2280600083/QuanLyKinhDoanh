from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.models import User
from ..schemas.role_schema import (
    ChangeUserRoleRequest,
    UserAdminCreate,
    UserAdminOut,
    UserAdminUpdate,
)
from ..services.user_admin_service import UserAdminService
from ..utils.guards import require_role


router = APIRouter(prefix="/admin/users", tags=["Admin - Users"])


def _to_user_admin_out(user: User) -> dict:
    permissions = [p.code for p in (user.role.permissions or [])] if user.role else []
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "role_id": user.role_id,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "role": user.role,
        "permissions": permissions,
    }


@router.get("", response_model=List[UserAdminOut], dependencies=[require_role("admin")])
async def list_users(db: Session = Depends(get_db)):
    users = UserAdminService.list_users(db)
    return [_to_user_admin_out(u) for u in users]


@router.post("", response_model=UserAdminOut, dependencies=[require_role("admin")])
async def create_user(user_in: UserAdminCreate, db: Session = Depends(get_db)):
    user = UserAdminService.create_user(db, user_in)
    return _to_user_admin_out(user)


@router.put("/{user_id}", response_model=UserAdminOut, dependencies=[require_role("admin")])
async def update_user(user_id: int, user_in: UserAdminUpdate, db: Session = Depends(get_db)):
    user = UserAdminService.update_user(db, user_id, user_in)
    return _to_user_admin_out(user)


@router.put("/{user_id}/role", response_model=UserAdminOut, dependencies=[require_role("admin")])
async def change_user_role(user_id: int, req: ChangeUserRoleRequest, db: Session = Depends(get_db)):
    user = UserAdminService.change_role(db, user_id, req.role_id)
    return _to_user_admin_out(user)


@router.put("/{user_id}/lock", response_model=UserAdminOut, dependencies=[require_role("admin")])
async def lock_user(user_id: int, db: Session = Depends(get_db)):
    user = UserAdminService.lock_user(db, user_id)
    return _to_user_admin_out(user)


@router.put("/{user_id}/unlock", response_model=UserAdminOut, dependencies=[require_role("admin")])
async def unlock_user(user_id: int, db: Session = Depends(get_db)):
    user = UserAdminService.unlock_user(db, user_id)
    return _to_user_admin_out(user)
