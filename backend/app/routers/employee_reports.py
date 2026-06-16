from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..services.employee_report_service import EmployeeReportService
from ..schemas import employee_report_schema as schemas
from .auth import get_current_user
from ..models.models import User
from ..utils.guards import require_permission

router = APIRouter(prefix="/reports/revenue/employee", tags=["Employee Revenue Reports"], dependencies=[Depends(require_permission("REPORT_VIEW"))])

@router.get("/", response_model=List[schemas.EmployeeRevenue])
async def get_employee_revenue(
    start_date: datetime = Query(None),
    end_date: datetime = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return EmployeeReportService.get_employee_revenue(db, start_date, end_date)

@router.get("/top-sales", response_model=List[schemas.EmployeeRevenue])
async def get_top_sales(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return EmployeeReportService.get_top_sales(db, limit)

@router.get("/dashboard", response_model=schemas.EmployeeDashboardSummary)
async def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return EmployeeReportService.get_dashboard_summary(db)

@router.get("/{employee_id}", response_model=schemas.EmployeeRevenueDetail)
async def get_employee_detail(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    detail = EmployeeReportService.get_employee_detail(db, employee_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Employee not found")
    return detail
