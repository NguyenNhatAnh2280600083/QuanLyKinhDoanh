from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime
from ..models.models import Order, User, OrderStatus, Customer, Role

class EmployeeReportService:
    @staticmethod
    def get_employee_revenue(db: Session, start_date: datetime = None, end_date: datetime = None):
        query = db.query(
            User.id.label('employee_id'),
            User.full_name.label('employee_name'),
            func.sum(Order.total_amount).label('revenue'),
            func.count(Order.id).label('total_orders'),
            func.count(func.distinct(Order.customer_id)).label('total_customers'),
            func.avg(Order.total_amount).label('avg_order_value')
        ).join(Order, User.id == Order.user_id)\
         .filter(Order.status == OrderStatus.COMPLETED)

        if start_date:
            query = query.filter(Order.created_at >= start_date)
        if end_date:
            query = query.filter(Order.created_at <= end_date)

        return query.group_by(User.id).order_by(func.sum(Order.total_amount).desc()).all()

    @staticmethod
    def get_top_sales(db: Session, limit: int = 10):
        return db.query(
            User.id.label('employee_id'),
            User.full_name.label('employee_name'),
            func.sum(Order.total_amount).label('revenue'),
            func.count(Order.id).label('total_orders'),
            func.count(func.distinct(Order.customer_id)).label('total_customers'),
            func.avg(Order.total_amount).label('avg_order_value')
        ).join(Order, User.id == Order.user_id)\
         .filter(Order.status == OrderStatus.COMPLETED)\
         .group_by(User.id)\
         .order_by(func.sum(Order.total_amount).desc())\
         .limit(limit).all()

    @staticmethod
    def get_employee_detail(db: Session, employee_id: int):
        user = db.query(User).filter(User.id == employee_id).first()
        if not user:
            return None

        # Basic stats
        stats = db.query(
            func.sum(Order.total_amount).label('revenue'),
            func.count(Order.id).label('total_orders'),
            func.count(func.distinct(Order.customer_id)).label('total_customers'),
            func.avg(Order.total_amount).label('avg_order_value')
        ).filter(Order.user_id == employee_id, Order.status == OrderStatus.COMPLETED).first()

        # Monthly revenue
        monthly = db.query(
            func.date_format(Order.created_at, '%Y-%m').label('month'),
            func.sum(Order.total_amount).label('revenue')
        ).filter(Order.user_id == employee_id, Order.status == OrderStatus.COMPLETED)\
         .group_by('month')\
         .order_by('month')\
         .all()

        # Top customers
        top_customers = db.query(
            Customer.name.label('customer_name'),
            func.sum(Order.total_amount).label('revenue')
        ).join(Order, Customer.id == Order.customer_id)\
         .filter(Order.user_id == employee_id, Order.status == OrderStatus.COMPLETED)\
         .group_by(Customer.id)\
         .order_by(func.sum(Order.total_amount).desc())\
         .limit(5).all()

        return {
            "employee_id": user.id,
            "employee_name": user.full_name,
            "email": user.email,
            "revenue": stats.revenue or 0,
            "total_orders": stats.total_orders or 0,
            "total_customers": stats.total_customers or 0,
            "avg_order_value": stats.avg_order_value or 0,
            "monthly_revenue": [{"month": m.month, "revenue": m.revenue} for m in monthly],
            "top_customers": [{"customer_name": c.customer_name, "revenue": c.revenue} for c in top_customers]
        }

    @staticmethod
    def get_dashboard_summary(db: Session):
        total_revenue = db.query(func.sum(Order.total_amount))\
                          .filter(Order.status == OrderStatus.COMPLETED).scalar() or 0
        total_orders = db.query(func.count(Order.id))\
                         .filter(Order.status == OrderStatus.COMPLETED).scalar() or 0
        
        sales_role = db.query(Role).filter(Role.name == "sales").first()
        total_sales_employees = db.query(func.count(User.id))\
                                  .filter(User.role_id == sales_role.id).scalar() if sales_role else 0
        
        best = db.query(
            User.id.label('employee_id'),
            User.full_name.label('employee_name'),
            func.sum(Order.total_amount).label('revenue'),
            func.count(Order.id).label('total_orders'),
            func.count(func.distinct(Order.customer_id)).label('total_customers'),
            func.avg(Order.total_amount).label('avg_order_value')
        ).join(Order, User.id == Order.user_id)\
         .filter(Order.status == OrderStatus.COMPLETED)\
         .group_by(User.id)\
         .order_by(func.sum(Order.total_amount).desc())\
         .first()

        return {
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "total_sales_employees": total_sales_employees,
            "best_employee": best if best else None
        }
