from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from ..schemas.schemas import RevenueByChannel, RevenueByCustomer, RevenueByStaff
from ..services.report_service import ReportService
from .auth import get_current_user
from ..models.models import User
from ..utils.guards import require_permission

router = APIRouter(prefix="/reports", tags=["Reports"], dependencies=[require_permission("REPORT_VIEW")])

@router.get("/revenue/channel", response_model=List[RevenueByChannel])
async def get_revenue_by_channel(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get revenue report grouped by sales channel (MT, GT, ECOM, EXPORT).
    Filters by start_date and end_date if provided.
    Only considers COMPLETED orders.
    """
    return ReportService.get_revenue_by_channel(db, start_date, end_date)

@router.get("/revenue/customer", response_model=List[RevenueByCustomer])
async def get_revenue_by_customer(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get revenue report grouped by customer.
    Filters by start_date and end_date if provided.
    Only considers COMPLETED orders.
    """
    return ReportService.get_revenue_by_customer(db, start_date, end_date, limit)

@router.get("/revenue/staff", response_model=List[RevenueByStaff])
async def get_revenue_by_staff(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get revenue report grouped by sales staff.
    Filters by start_date and end_date if provided.
    Only considers COMPLETED orders.
    """
    return ReportService.get_revenue_by_staff(db, start_date, end_date)
