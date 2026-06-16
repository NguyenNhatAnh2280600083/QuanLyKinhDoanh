from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schemas.raw_material_schema import (
    RawMaterial, RawMaterialCreate, RawMaterialUpdate, 
    RawMaterialLog, RawMaterialImportExport
)
from ..services.raw_material_service import RawMaterialService
from .auth import get_current_user
from ..models.models import User
from ..utils.guards import require_permission

router = APIRouter(prefix="/raw-materials", tags=["Raw Materials"], dependencies=[Depends(require_permission("RAW_MATERIAL_MANAGEMENT"))])

@router.get("/", response_model=List[RawMaterial])
async def get_raw_materials(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return RawMaterialService.get_all(db)

@router.get("/logs", response_model=List[RawMaterialLog])
async def get_raw_material_logs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return RawMaterialService.get_logs(db)

@router.get("/{id}", response_model=RawMaterial)
async def get_raw_material(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    material = RawMaterialService.get_by_id(db, id)
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return material

@router.post("/", response_model=RawMaterial)
async def create_raw_material(material: RawMaterialCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return RawMaterialService.create(db, material)

@router.put("/{id}", response_model=RawMaterial)
async def update_raw_material(id: int, material: RawMaterialUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_material = RawMaterialService.update(db, id, material)
    if not db_material:
        raise HTTPException(status_code=404, detail="Material not found")
    return db_material

@router.delete("/{id}")
async def delete_raw_material(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not RawMaterialService.delete(db, id):
        raise HTTPException(status_code=404, detail="Material not found")
    return {"message": "Material deleted successfully"}

@router.post("/{id}/import", response_model=RawMaterial)
async def import_material(id: int, data: RawMaterialImportExport, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return RawMaterialService.import_material(db, id, data.quantity, data.note, current_user.id)

@router.post("/{id}/export", response_model=RawMaterial)
async def export_material(id: int, data: RawMaterialImportExport, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return RawMaterialService.export_material(db, id, data.quantity, data.note, current_user.id)
