from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from ..database import get_db
from ..models.models import Product, InventoryLog, InventoryLogType, User, Category
from ..schemas.schemas import (
    Product as ProductSchema, 
    InventoryLog as InventoryLogSchema, 
    InventoryAdjust,
    InventoryResponse,
    InventoryLogResponse
)
from ..utils.notifications import check_low_stock_and_notify
from .auth import get_current_user
from ..utils.guards import require_permission

router = APIRouter(prefix="/inventory", tags=["Inventory"], dependencies=[require_permission("INVENTORY_VIEW")])

@router.get("/", response_model=InventoryResponse)
async def get_inventory(
    skip: int = 0,
    limit: int = 10,
    search: Optional[str] = None,
    low_stock: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Product)
    
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    
    if low_stock:
        query = query.filter(Product.stock_quantity <= Product.low_stock_threshold)
        
    total = query.count()
    products = query.offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "items": products,
        "skip": skip,
        "limit": limit
    }

@router.get("/low-stock/", response_model=List[ProductSchema])
async def get_low_stock(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    products = db.query(Product).filter(Product.stock_quantity <= Product.low_stock_threshold).all()
    return products

@router.get("/logs/", response_model=InventoryLogResponse, dependencies=[require_permission("WAREHOUSE_MANAGEMENT")])
async def get_inventory_logs(
    skip: int = 0,
    limit: int = 10,
    type: Optional[InventoryLogType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(InventoryLog)
    
    if type:
        query = query.filter(InventoryLog.type == type)
        
    total = query.count()
    logs = query.order_by(InventoryLog.created_at.desc()).offset(skip).limit(limit).all()
    
    # Calculate ending balance for each log
    for log in logs:
        # Get all logs for this product up to and including current log
        earlier_logs = db.query(InventoryLog).filter(
            InventoryLog.product_id == log.product_id,
            InventoryLog.created_at <= log.created_at
        ).order_by(InventoryLog.created_at.asc()).all()
        
        # Calculate running balance
        balance = 0
        for earlier_log in earlier_logs:
            if earlier_log.type == InventoryLogType.OUT or earlier_log.type == InventoryLogType.ADJUST:
                if earlier_log.type == InventoryLogType.ADJUST:
                    # ADJUST is the new stock value, not a difference
                    balance = earlier_log.quantity
                else:
                    balance -= earlier_log.quantity
            else:  # IN or RETURN
                balance += earlier_log.quantity
            
            if earlier_log.id == log.id:
                break
        
        log.ending_balance = balance
    
    return {
        "total": total,
        "items": logs,
        "skip": skip,
        "limit": limit
    }

@router.get("/{product_id}", response_model=ProductSchema)
async def get_product_inventory(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.patch("/{product_id}/adjust", dependencies=[require_permission("WAREHOUSE_MANAGEMENT")])
async def adjust_inventory(
    product_id: int,
    adjust_data: InventoryAdjust,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    old_stock = product.stock_quantity
    product.stock_quantity = adjust_data.quantity
    
    # Create log
    log = InventoryLog(
        product_id=product.id,
        type=InventoryLogType.ADJUST,
        quantity=adjust_data.quantity - old_stock, # Difference
        note=adjust_data.note or f"Manual adjustment from {old_stock} to {adjust_data.quantity}",
        created_by=current_user.id
    )
    db.add(log)
    
    # Check for low stock after adjustment
    check_low_stock_and_notify(db, product.id)
    
    db.commit()
    
    return {"message": "Inventory adjusted successfully", "new_stock": product.stock_quantity}
