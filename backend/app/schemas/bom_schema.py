from pydantic import BaseModel
from typing import Optional, List

class BOMBase(BaseModel):
    product_id: int
    material_id: int
    quantity_required: float

class BOMCreate(BOMBase):
    pass

class BOMUpdate(BaseModel):
    quantity_required: float

class BOM(BOMBase):
    id: int
    material_name: Optional[str] = None
    material_unit: Optional[str] = None

    class Config:
        from_attributes = True

class MaterialCalculationRequest(BaseModel):
    product_id: int
    production_quantity: float

class RequiredMaterial(BaseModel):
    material_id: int
    material_name: str
    required_quantity: float
    current_stock: float
    enough: bool

class MaterialCalculationResponse(BaseModel):
    product_name: str
    required_materials: List[RequiredMaterial]
    status: str # "ENOUGH" or "NOT_ENOUGH"
    missing_any: bool
