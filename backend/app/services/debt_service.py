from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from ..models.models import CustomerDebt, DebtPayment, Order, OrderStatus, DebtStatus, Customer, User
from ..schemas import schemas
from fastapi import HTTPException, status

class DebtService:
    @staticmethod
    def create_debt_from_order(db: Session, order_id: int):
        # Check if order exists and is completed
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if order.status != OrderStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="Order must be completed to create debt")
        
        # Check if debt already exists
        existing_debt = db.query(CustomerDebt).filter(CustomerDebt.order_id == order_id).first()
        if existing_debt:
            return existing_debt
        
        # Create new debt
        due_date = datetime.now() + timedelta(days=30)
        new_debt = CustomerDebt(
            customer_id=order.customer_id,
            order_id=order.id,
            total_amount=order.total_amount,
            paid_amount=0.0,
            remaining_amount=order.total_amount,
            due_date=due_date,
            status=DebtStatus.UNPAID
        )
        db.add(new_debt)
        db.commit()
        db.refresh(new_debt)
        return new_debt

    @staticmethod
    def get_debts(db: Session, customer_id: int = None, status: str = None, start_date: datetime = None, end_date: datetime = None):
        query = (
            db.query(CustomerDebt)
            .join(Customer)
            .join(Order)
            .options(
                joinedload(CustomerDebt.customer),
                joinedload(CustomerDebt.order)
            )
        )
        
        if customer_id:
            query = query.filter(CustomerDebt.customer_id == customer_id)
        
        if status:
            query = query.filter(CustomerDebt.status == status)
            
        if start_date:
            query = query.filter(CustomerDebt.created_at >= start_date)
            
        if end_date:
            query = query.filter(CustomerDebt.created_at <= end_date)
            
        # Update overdue status before returning
        now = datetime.now()
        overdue_debts = db.query(CustomerDebt).filter(
            CustomerDebt.due_date < now,
            CustomerDebt.remaining_amount > 0,
            CustomerDebt.status != DebtStatus.PAID
        ).all()
        
        for debt in overdue_debts:
            if debt.status != DebtStatus.OVERDUE:
                debt.status = DebtStatus.OVERDUE
        
        if overdue_debts:
            db.commit()
            
        return query.all()

    @staticmethod
    def get_debt_detail(db: Session, debt_id: int):
        debt = (
            db.query(CustomerDebt)
            .options(
                joinedload(CustomerDebt.customer),
                joinedload(CustomerDebt.order),
                selectinload(CustomerDebt.payments).joinedload(DebtPayment.user)
            )
            .filter(CustomerDebt.id == debt_id)
            .first()
        )
        if not debt:
            raise HTTPException(status_code=404, detail="Debt not found")
        return debt

    @staticmethod
    def update_debt(db: Session, debt_id: int, debt_update: schemas.CustomerDebtUpdate):
        debt = db.query(CustomerDebt).filter(CustomerDebt.id == debt_id).first()
        if not debt:
            raise HTTPException(status_code=404, detail="Debt not found")
        
        if debt_update.due_date is not None:
            # Ensure naive datetime for comparison with datetime.now()
            due_date = debt_update.due_date
            if due_date.tzinfo is not None:
                due_date = due_date.replace(tzinfo=None)
            debt.due_date = due_date
            
        if debt_update.status is not None:
            debt.status = debt_update.status
        
        # Recalculate status if due_date changed and it's not paid
        if debt.status != DebtStatus.PAID and debt.remaining_amount > 0:
            now = datetime.now()
            if debt.due_date < now:
                debt.status = DebtStatus.OVERDUE
            elif debt.paid_amount > 0:
                debt.status = DebtStatus.PARTIAL
            else:
                debt.status = DebtStatus.UNPAID
                
        db.commit()
        db.refresh(debt)
        return debt

    @staticmethod
    def record_payment(db: Session, debt_id: int, payment_in: schemas.DebtPaymentCreate, user_id: int):
        debt = db.query(CustomerDebt).filter(CustomerDebt.id == debt_id).first()
        if not debt:
            raise HTTPException(status_code=404, detail="Debt not found")
            
        if payment_in.amount <= 0:
            raise HTTPException(status_code=400, detail="Payment amount must be greater than zero")
            
        if payment_in.amount > debt.remaining_amount:
            raise HTTPException(status_code=400, detail=f"Payment amount cannot exceed remaining debt ({debt.remaining_amount})")
            
        # Create payment record
        payment_date = payment_in.payment_date or datetime.now()
        if payment_date.tzinfo is not None:
            payment_date = payment_date.replace(tzinfo=None)
            
        payment = DebtPayment(
            debt_id=debt_id,
            amount=payment_in.amount,
            payment_method=payment_in.payment_method,
            payment_date=payment_date,
            note=payment_in.note,
            created_by=user_id
        )
        db.add(payment)
        
        # Update debt record
        debt.paid_amount += payment_in.amount
        debt.remaining_amount = debt.total_amount - debt.paid_amount
        
        if debt.remaining_amount == 0:
            debt.status = DebtStatus.PAID
        elif debt.paid_amount > 0:
            # Check if it was overdue
            if debt.due_date < datetime.now():
                debt.status = DebtStatus.OVERDUE
            else:
                debt.status = DebtStatus.PARTIAL
        
        db.commit()
        db.refresh(debt)
        return debt

    @staticmethod
    def get_dashboard_summary(db: Session):
        now = datetime.now()
        
        total_debt = db.query(func.sum(CustomerDebt.total_amount)).scalar() or 0.0
        total_paid = db.query(func.sum(CustomerDebt.paid_amount)).scalar() or 0.0
        total_remaining = db.query(func.sum(CustomerDebt.remaining_amount)).scalar() or 0.0
        
        overdue_query = db.query(CustomerDebt).filter(
            CustomerDebt.due_date < now,
            CustomerDebt.remaining_amount > 0
        )
        overdue_amount = overdue_query.with_entities(func.sum(CustomerDebt.remaining_amount)).scalar() or 0.0
        overdue_count = overdue_query.count()
        
        # Top debt customers
        top_customers = db.query(
            Customer.name,
            func.sum(CustomerDebt.remaining_amount).label('remaining_debt')
        ).join(CustomerDebt).group_by(Customer.id).order_by(func.sum(CustomerDebt.remaining_amount).desc()).limit(5).all()
        
        return {
            "total_debt": total_debt,
            "total_paid": total_paid,
            "total_remaining": total_remaining,
            "overdue_amount": overdue_amount,
            "overdue_count": overdue_count,
            "top_debt_customers": [{"name": c.name, "amount": c.remaining_debt} for c in top_customers]
        }
