from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..models.models import Order, OrderItem, Product, User, Customer, OrderStatus
from ..schemas.schemas import DashboardStats
from .auth import get_current_user, check_role
import pandas as pd
from fastapi.responses import FileResponse
import os

router = APIRouter(prefix="/stats", tags=["Statistics"])

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Basic counts
    total_revenue = db.query(func.sum(Order.total_amount)).filter(Order.status == OrderStatus.COMPLETED).scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar()
    total_customers = db.query(func.count(Customer.id)).scalar()
    total_products = db.query(func.count(Product.id)).scalar()
    
    # New real-time stats
    pending_orders_count = db.query(func.count(Order.id)).filter(Order.status == OrderStatus.PENDING).scalar() or 0
    
    one_week_ago = datetime.now() - timedelta(days=7)
    new_customers_this_week = db.query(func.count(Customer.id)).filter(Customer.created_at >= one_week_ago).scalar() or 0
    
    out_of_stock_count = db.query(func.count(Product.id)).filter(Product.stock_quantity <= 0).scalar() or 0
    low_stock_count = db.query(func.count(Product.id)).filter(Product.stock_quantity > 0, Product.stock_quantity <= Product.low_stock_threshold).scalar() or 0
    
    # Revenue by month (last 6 months)
    six_months_ago = datetime.now() - timedelta(days=180)
    
    if db.bind.dialect.name == 'sqlite':
        month_func = func.strftime('%Y-%m', Order.created_at)
    else:
        month_func = func.date_format(Order.created_at, '%Y-%m')

    revenue_by_month = db.query(
        month_func.label('month'),
        func.sum(Order.total_amount).label('revenue')
    ).filter(Order.created_at >= six_months_ago, Order.status == OrderStatus.COMPLETED)\
     .group_by('month').all()
    
    # Top products
    top_products = db.query(
        Product.name,
        func.sum(OrderItem.quantity).label('value')
    ).join(OrderItem).group_by(Product.id).order_by(desc('value')).limit(5).all()
    
    # Top sales staff
    top_staff = db.query(
        User.full_name.label('name'),
        func.sum(Order.total_amount).label('value')
    ).join(Order).filter(Order.status == OrderStatus.COMPLETED)\
     .group_by(User.id).order_by(desc('value')).limit(5).all()
    
    # Revenue by region
    revenue_by_region = db.query(
        Customer.region,
        func.sum(Order.total_amount).label('revenue')
    ).join(Order).filter(Order.status == OrderStatus.COMPLETED)\
     .group_by(Customer.region).all()

    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "total_customers": total_customers,
        "total_products": total_products,
        "pending_orders_count": pending_orders_count,
        "new_customers_this_week": new_customers_this_week,
        "out_of_stock_count": out_of_stock_count,
        "low_stock_count": low_stock_count,
        "revenue_by_month": [{"month": r.month, "revenue": r.revenue} for r in revenue_by_month],
        "top_products": [{"name": p.name, "value": p.value} for p in top_products],
        "top_sales_staff": [{"name": s.name, "value": s.value} for s in top_staff],
        "revenue_by_region": [{"region": r.region, "revenue": r.revenue} for r in revenue_by_region]
    }

@router.get("/export/excel")
async def export_to_excel(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "manager"]))
):
    orders = db.query(Order).all()
    data = []
    for o in orders:
        data.append({
            "Order ID": o.id,
            "Customer": o.customer.name,
            "Staff": o.user.full_name,
            "Total Amount": o.total_amount,
            "Status": o.status.value,
            "Date": o.created_at
        })
    
    df = pd.DataFrame(data)
    os.makedirs("exports", exist_ok=True)
    file_path = "exports/sales_report.xlsx"
    df.to_excel(file_path, index=False)
    
    return FileResponse(file_path, filename="sales_report.xlsx")
