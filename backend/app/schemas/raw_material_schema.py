from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class RawMaterialLogType(str, Enum):
    IMPORT = "IMPORT"
    EXPORT = "EXPORT"

class RawMaterialBase(BaseModel):
    code: str
    name: str
    unit: str
    stock_quantity: float = 0.0
    minimum_stock: float = 0.0
    description: Optional[str] = None

class RawMaterialCreate(RawMaterialBase):
    pass

class RawMaterialUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    unit: Optional[str] = None
    minimum_stock: Optional[float] = None
    description: Optional[str] = None

class RawMaterial(RawMaterialBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RawMaterialLogBase(BaseModel):
    quantity: float
    note: Optional[str] = None

class RawMaterialLog(RawMaterialLogBase):
    id: int
    material_id: int
    type: RawMaterialLogType
    created_by: int
    created_at: datetime
    material_name: Optional[str] = None
    user_full_name: Optional[str] = None

    class Config:
        from_attributes = True

class RawMaterialImportExport(BaseModel):
    quantity: float
    note: Optional[str] = None
