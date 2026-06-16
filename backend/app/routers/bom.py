from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas.bom_schema import (
    BOM, BOMCreate, BOMUpdate, 
    MaterialCalculationRequest, MaterialCalculationResponse
)
from ..services.bom_service import BOMService
from .auth import get_current_user
from ..models.models import User
from ..utils.guards import require_permission

router = APIRouter(prefix="/bom", tags=["BOM"], dependencies=[Depends(require_permission("BOM_MANAGEMENT"))])

@router.get("/product/{product_id}", response_model=List[BOM])
async def get_bom_by_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return BOMService.get_by_product(db, product_id)

@router.post("/", response_model=BOM)
async def create_bom(bom: BOMCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return BOMService.create(db, bom)

@router.put("/{id}", response_model=BOM)
async def update_bom(id: int, bom: BOMUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_bom = BOMService.update(db, id, bom)
    if not db_bom:
        raise HTTPException(status_code=404, detail="BOM item not found")
    return db_bom

@router.delete("/{id}")
async def delete_bom(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not BOMService.delete(db, id):
        raise HTTPException(status_code=404, detail="BOM item not found")
    return {"message": "BOM item deleted successfully"}

@router.post("/calculate-materials", response_model=MaterialCalculationResponse)
async def calculate_materials(request: MaterialCalculationRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return BOMService.calculate_requirements(db, request.product_id, request.production_quantity)
