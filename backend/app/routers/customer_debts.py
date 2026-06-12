from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from ..models.models import User
from ..schemas import schemas
from ..services.debt_service import DebtService
from .auth import get_current_user
from ..utils.guards import require_permission

router = APIRouter(prefix="/customer-debts", tags=["Customer Debts"], dependencies=[require_permission("DEBT_MANAGEMENT")])

@router.get("/", response_model=List[schemas.CustomerDebtListItem])
async def get_customer_debts(
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    debts = DebtService.get_debts(db, customer_id, status, start_date, end_date)
    # Convert to list item schema
    result = []
    for debt in debts:
        result.append(schemas.CustomerDebtListItem(
            id=debt.id,
            customer_id=debt.customer_id,
            order_id=debt.order_id,
            total_amount=debt.total_amount,
            paid_amount=debt.paid_amount,
            remaining_amount=debt.remaining_amount,
            due_date=debt.due_date,
            status=debt.status,
            created_at=debt.created_at,
            customer_name=debt.customer.name,
            order_code=f"ORD-{debt.order_id}"
        ))
    return result

@router.get("/dashboard/summary", response_model=schemas.DebtSummary)
async def get_debt_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return DebtService.get_dashboard_summary(db)

@router.get("/{debt_id}", response_model=schemas.CustomerDebt)
async def get_debt_detail(
    debt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return DebtService.get_debt_detail(db, debt_id)

@router.patch("/{debt_id}", response_model=schemas.CustomerDebt)
async def update_debt(
    debt_id: int,
    debt_update: schemas.CustomerDebtUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Only admin or manager can update debt details")
    return DebtService.update_debt(db, debt_id, debt_update)

@router.post("/create-from-order/{order_id}", response_model=schemas.CustomerDebt)
async def create_debt_from_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    return DebtService.create_debt_from_order(db, order_id)

@router.post("/{debt_id}/payment", response_model=schemas.CustomerDebt)
async def record_debt_payment(
    debt_id: int,
    payment_in: schemas.DebtPaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return DebtService.record_payment(db, debt_id, payment_in, current_user.id)

@router.get("/customer/{customer_id}", response_model=List[schemas.CustomerDebtListItem])
async def get_debts_by_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    debts = DebtService.get_debts(db, customer_id=customer_id)
    result = []
    for debt in debts:
        result.append(schemas.CustomerDebtListItem(
            id=debt.id,
            customer_id=debt.customer_id,
            order_id=debt.order_id,
            total_amount=debt.total_amount,
            paid_amount=debt.paid_amount,
            remaining_amount=debt.remaining_amount,
            due_date=debt.due_date,
            status=debt.status,
            created_at=debt.created_at,
            customer_name=debt.customer.name,
            order_code=f"ORD-{debt.order_id}"
        ))
    return result
