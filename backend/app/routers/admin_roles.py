from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas.role_schema import (
    PermissionOut,
    RoleCreate,
    RoleOut,
    RoleUpdate,
    SetRolePermissionsRequest,
)
from ..services.role_service import RoleService
from ..utils.guards import require_role


router = APIRouter(prefix="/admin", tags=["Admin - Roles & Permissions"])


@router.get("/roles", response_model=List[RoleOut], dependencies=[require_role("admin")])
async def list_roles(db: Session = Depends(get_db)):
    return RoleService.list_roles(db)


@router.post("/roles", response_model=RoleOut, dependencies=[require_role("admin")])
async def create_role(role_in: RoleCreate, db: Session = Depends(get_db)):
    return RoleService.create_role(db, role_in)


@router.put("/roles/{role_id}", response_model=RoleOut, dependencies=[require_role("admin")])
async def update_role(role_id: int, role_in: RoleUpdate, db: Session = Depends(get_db)):
    return RoleService.update_role(db, role_id, role_in)


@router.delete("/roles/{role_id}", dependencies=[require_role("admin")])
async def delete_role(role_id: int, db: Session = Depends(get_db)):
    RoleService.delete_role(db, role_id)
    return {"message": "Role deleted successfully"}


@router.get("/permissions", response_model=List[PermissionOut], dependencies=[require_role("admin")])
async def list_permissions(db: Session = Depends(get_db)):
    return RoleService.list_permissions(db)


@router.put("/roles/{role_id}/permissions", response_model=RoleOut, dependencies=[require_role("admin")])
async def set_role_permissions(role_id: int, req: SetRolePermissionsRequest, db: Session = Depends(get_db)):
    return RoleService.set_role_permissions(db, role_id, req.permission_ids)
