from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import List
from ..models.models import Order, Customer, OrderStatus, CustomerType

class ReportService:
    @staticmethod
    def get_revenue_by_channel(db: Session, start_date: datetime = None, end_date: datetime = None):
        # Base query for completed orders joined with customers
        query = db.query(
            Customer.customer_type,
            func.sum(Order.total_amount).label('revenue'),
            func.count(Order.id).label('total_orders'),
            func.count(func.distinct(Customer.id)).label('total_customers')
        ).join(Order, Customer.id == Order.customer_id)\
         .filter(Order.status == OrderStatus.COMPLETED)

        if start_date:
            query = query.filter(Order.created_at >= start_date)
        if end_date:
            query = query.filter(Order.created_at <= end_date)

        results = query.group_by(Customer.customer_type).all()

        # Map for readable names
        channel_map = {
            CustomerType.MT: "Modern Trade",
            CustomerType.GT: "General Trade",
            CustomerType.ECOM: "Ecommerce",
            CustomerType.EXPORT: "Export"
        }

        total_revenue = sum(r.revenue for r in results) if results else 0
        
        # Prepare final list with all channels (even those with 0 revenue)
        final_data = []
        seen_channels = {r.customer_type for r in results}

        # First add data from query
        for r in results:
            percentage = (r.revenue / total_revenue * 100) if total_revenue > 0 else 0
            final_data.append({
                "channel": r.customer_type.value,
                "channel_name": channel_map.get(r.customer_type, r.customer_type.value),
                "revenue": float(r.revenue),
                "total_orders": r.total_orders,
                "total_customers": r.total_customers,
                "percentage": round(percentage, 2)
            })

        # Add missing channels with 0 values
        for c_type in CustomerType:
            if c_type not in seen_channels:
                final_data.append({
                    "channel": c_type.value,
                    "channel_name": channel_map.get(c_type, c_type.value),
                    "revenue": 0.0,
                    "total_orders": 0,
                    "total_customers": 0,
                    "percentage": 0.0
                })

        # Sort by revenue descending
        final_data.sort(key=lambda x: x['revenue'], reverse=True)
        return final_data

    @staticmethod
    def get_revenue_by_staff(db: Session, start_date: datetime = None, end_date: datetime = None):
        # Base query for completed orders joined with users (staff)
        query = db.query(
            User.id,
            User.full_name,
            func.sum(Order.total_amount).label('revenue'),
            func.count(Order.id).label('total_orders'),
            func.count(func.distinct(Order.customer_id)).label('total_customers')
        ).join(Order, User.id == Order.user_id)\
         .filter(Order.status == OrderStatus.COMPLETED)

        if start_date:
            query = query.filter(Order.created_at >= start_date)
        if end_date:
            query = query.filter(Order.created_at <= end_date)

        results = query.group_by(User.id).order_by(func.sum(Order.total_amount).desc()).all()

        # Calculate total revenue for percentage calculation
        total_revenue_query = db.query(func.sum(Order.total_amount))\
            .filter(Order.status == OrderStatus.COMPLETED)
        
        if start_date:
            total_revenue_query = total_revenue_query.filter(Order.created_at >= start_date)
        if end_date:
            total_revenue_query = total_revenue_query.filter(Order.created_at <= end_date)
            
        total_revenue = total_revenue_query.scalar() or 0

        final_data = []
        for r in results:
            percentage = (r.revenue / total_revenue * 100) if total_revenue > 0 else 0
            final_data.append({
                "staff_id": r.id,
                "staff_name": r.full_name,
                "revenue": float(r.revenue),
                "total_orders": r.total_orders,
                "total_customers": r.total_customers,
                "percentage": round(percentage, 2)
            })

        return final_data

    @staticmethod
    def get_revenue_by_customer(db: Session, start_date: datetime = None, end_date: datetime = None, limit: int = 50):
        # Base query for completed orders joined with customers
        query = db.query(
            Customer.id,
            Customer.name,
            Customer.customer_type,
            func.sum(Order.total_amount).label('revenue'),
            func.count(Order.id).label('total_orders'),
            func.max(Order.created_at).label('last_order_date')
        ).join(Order, Customer.id == Order.customer_id)\
         .filter(Order.status == OrderStatus.COMPLETED)

        if start_date:
            query = query.filter(Order.created_at >= start_date)
        if end_date:
            query = query.filter(Order.created_at <= end_date)

        results = query.group_by(Customer.id).order_by(func.sum(Order.total_amount).desc()).limit(limit).all()

        # Calculate total revenue for percentage calculation
        total_revenue_query = db.query(func.sum(Order.total_amount))\
            .filter(Order.status == OrderStatus.COMPLETED)
        
        if start_date:
            total_revenue_query = total_revenue_query.filter(Order.created_at >= start_date)
        if end_date:
            total_revenue_query = total_revenue_query.filter(Order.created_at <= end_date)
            
        total_revenue = total_revenue_query.scalar() or 0

        final_data = []
        for r in results:
            percentage = (r.revenue / total_revenue * 100) if total_revenue > 0 else 0
            final_data.append({
                "customer_id": r.id,
                "customer_name": r.name,
                "customer_type": r.customer_type.value,
                "revenue": float(r.revenue),
                "total_orders": r.total_orders,
                "last_order_date": r.last_order_date,
                "percentage": round(percentage, 2)
            })

        return final_data
