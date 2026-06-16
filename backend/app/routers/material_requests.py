from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..schemas.material_request_schema import (
    MaterialRequest, MaterialRequestCreate, MaterialRequestUpdate, MaterialRequestListResponse, MaterialRequestStatus
)
from ..services.material_request_service import MaterialRequestService
from .auth import get_current_user
from ..models.models import User
from ..utils.guards import require_permission

router = APIRouter(prefix="/material-requests", tags=["Material Requests"], dependencies=[Depends(require_permission("RAW_MATERIAL_MANAGEMENT"))])

@router.get("", response_model=MaterialRequestListResponse)
async def get_material_requests(
    status: Optional[MaterialRequestStatus] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return MaterialRequestService.get_all(db, status, skip, limit)

@router.get("/{request_id}", response_model=MaterialRequest)
async def get_material_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return MaterialRequestService.get_by_id(db, request_id)

@router.post("", response_model=MaterialRequest)
async def create_material_request(
    request_data: MaterialRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return MaterialRequestService.create(db, request_data, current_user.id)

@router.put("/{request_id}", response_model=MaterialRequest)
async def update_material_request(
    request_id: int,
    request_data: MaterialRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return MaterialRequestService.update(db, request_id, request_data)

@router.post("/{request_id}/approve", response_model=MaterialRequest)
async def approve_material_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return MaterialRequestService.approve(db, request_id, current_user.id)

@router.post("/{request_id}/reject", response_model=MaterialRequest)
async def reject_material_request(
    request_id: int,
    reason: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return MaterialRequestService.reject(db, request_id, current_user.id, reason)

@router.post("/{request_id}/complete", response_model=MaterialRequest)
async def complete_material_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return MaterialRequestService.complete(db, request_id, current_user.id)

@router.delete("/{request_id}")
async def delete_material_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return MaterialRequestService.delete(db, request_id)
