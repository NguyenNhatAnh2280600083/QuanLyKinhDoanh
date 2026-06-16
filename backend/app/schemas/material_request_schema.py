from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class MaterialRequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"

class MaterialRequestBase(BaseModel):
    material_id: int
    requested_quantity: float
    current_stock: float
    missing_quantity: float
    reason: Optional[str] = None
    production_plan_id: Optional[int] = None

class MaterialRequestCreate(MaterialRequestBase):
    pass

class MaterialRequestUpdate(BaseModel):
    requested_quantity: Optional[float] = None
    reason: Optional[str] = None
    status: Optional[MaterialRequestStatus] = None

class MaterialRequest(MaterialRequestBase):
    id: int
    request_code: str
    status: MaterialRequestStatus
    created_by: int
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    material_name: Optional[str] = None
    material_unit: Optional[str] = None
    creator_full_name: Optional[str] = None
    approver_full_name: Optional[str] = None

    class Config:
        from_attributes = True

class MaterialRequestListResponse(BaseModel):
    total: int
    items: List[MaterialRequest]
