from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


class PermissionOut(BaseModel):
    id: int
    code: str
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class RoleOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    permissions: List[PermissionOut] = []

    class Config:
        from_attributes = True


class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class SetRolePermissionsRequest(BaseModel):
    permission_ids: List[int]


class UserAdminOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    role_id: int
    is_active: int
    created_at: datetime
    role: RoleOut
    permissions: List[str]

    class Config:
        from_attributes = True


class UserAdminCreate(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    password: str
    role_id: int


class UserAdminUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None


class ChangeUserRoleRequest(BaseModel):
    role_id: int


class AuthUserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    created_at: datetime
    is_active: int
    role: RoleOut
    permissions: List[str]

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: AuthUserOut
