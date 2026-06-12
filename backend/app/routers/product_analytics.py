from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from ..schemas.product_analytics_schema import (
    ProductTopSelling, ProductTopRevenue, ProductLowStock, 
    ProductHighStock, ProductSlowMoving, ProductAnalyticsDashboard,
    ProductDetailAnalytics
)
from ..services.product_analytics_service import ProductAnalyticsService
from .auth import get_current_user
from ..models.models import User
from ..utils.guards import require_permission

router = APIRouter(prefix="/reports/products", tags=["Product Analytics"], dependencies=[require_permission("PRODUCT_ANALYTICS_VIEW")])

@router.get("/top-selling", response_model=List[ProductTopSelling])
async def get_top_selling(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ProductAnalyticsService.get_top_selling(db, start_date, end_date)

@router.get("/top-revenue", response_model=List[ProductTopRevenue])
async def get_top_revenue(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ProductAnalyticsService.get_top_revenue(db, start_date, end_date)

@router.get("/low-stock", response_model=List[ProductLowStock])
async def get_low_stock(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ProductAnalyticsService.get_low_stock(db)

@router.get("/high-stock", response_model=List[ProductHighStock])
async def get_high_stock(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ProductAnalyticsService.get_high_stock(db)

@router.get("/slow-moving", response_model=List[ProductSlowMoving])
async def get_slow_moving(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ProductAnalyticsService.get_slow_moving(db)

@router.get("/dashboard", response_model=ProductAnalyticsDashboard)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ProductAnalyticsService.get_dashboard_stats(db)

@router.get("/{product_id}", response_model=ProductDetailAnalytics)
async def get_product_detail(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    detail = ProductAnalyticsService.get_product_detail(db, product_id)
    if not detail:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Product not found")
    return detail
