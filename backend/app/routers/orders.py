from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.models import (
    Notification,
    NotificationType,
    Order,
    OrderItem,
    Product,
    Role,
    User,
    OrderStatus,
    InventoryLog,
    InventoryLogType,
    ProductionPlan,
    ProductionStatus,
)
from ..utils.notifications import check_low_stock_and_notify
from ..services.debt_service import DebtService
from ..schemas.schemas import Order as OrderSchema, OrderCreate
from .auth import get_current_user
from ..utils.guards import require_permission

router = APIRouter(prefix="/orders", tags=["Orders"], dependencies=[Depends(require_permission("ORDER_MANAGEMENT"))])

def _generate_plan_code(db: Session, year: int) -> str:
    max_plan = (
        db.query(ProductionPlan)
        .filter(ProductionPlan.year == year)
        .order_by(desc(ProductionPlan.plan_code))
        .first()
    )
    if not max_plan:
        return f"PP-{year}-001"
    try:
        last_num_str = max_plan.plan_code.split("-")[-1]
        next_num = int(last_num_str) + 1
        return f"PP-{year}-{next_num:03d}"
    except (ValueError, IndexError):
        plan_count = db.query(ProductionPlan).filter(ProductionPlan.year == year).count()
        return f"PP-{year}-{plan_count + 1:03d}"

@router.get("/", response_model=List[OrderSchema])
async def get_orders(
    status: Optional[OrderStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    
    # Sales staff can only see their own orders unless they are admin/manager
    if current_user.role.name == "sales":
        query = query.filter(Order.user_id == current_user.id)
        
    return query.all()

@router.post("/", response_model=OrderSchema)
async def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_order = Order(
        customer_id=order_in.customer_id,
        user_id=current_user.id,
        status=OrderStatus.PENDING,
        total_amount=0
    )
    db.add(new_order)
    db.flush()
    
    total_amount = 0
    production_requests = []
    for item_in in order_in.items:
        product = db.query(Product).filter(Product.id == item_in.product_id).first()
        if not product:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Sản phẩm ID {item_in.product_id} không tìm thấy")
        
        total_amount += product.price * item_in.quantity
        db.add(OrderItem(
            order_id=new_order.id,
            product_id=product.id,
            quantity=item_in.quantity,
            unit_price=product.price
        ))

        if item_in.quantity > product.stock_quantity:
            production_requests.append({
                "product": product,
                "ordered_quantity": item_in.quantity,
                "stock_quantity": product.stock_quantity,
                "shortage": item_in.quantity - product.stock_quantity,
            })
    
    new_order.total_amount = total_amount
    if production_requests:
        admin_users = (
            db.query(User)
            .join(Role)
            .filter(Role.name == "admin", User.is_active == 1)
            .all()
        )
        for admin in admin_users:
            for request in production_requests:
                product = request["product"]
                db.add(Notification(
                    user_id=admin.id,
                    order_id=new_order.id,
                    product_id=product.id,
                    type=NotificationType.PRODUCTION_REQUEST,
                    title="Yeu cau san xuat them san pham",
                    message=(
                        f"Don hang ORD-{new_order.id} can {request['ordered_quantity']} "
                        f"{product.name}, ton kho hien co {request['stock_quantity']}. "
                        f"Can san xuat them {request['shortage']} san pham."
                    ),
                ))

    db.commit()
    db.refresh(new_order)
    return new_order

@router.put("/{order_id}/status")
async def update_order_status(
    order_id: int,
    status: OrderStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Đơn hàng không tìm thấy")
    
    if current_user.role.name == "sales" and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền cập nhật đơn hàng này")
    
    old_status = order.status

    # ===== FIX 1: Guard against invalid status transitions =====
    allowed_transitions = {
        OrderStatus.PENDING:       [OrderStatus.APPROVED, OrderStatus.CANCELLED],
        OrderStatus.APPROVED:      [OrderStatus.READY_TO_SHIP, OrderStatus.CANCELLED],
        OrderStatus.READY_TO_SHIP: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
        OrderStatus.COMPLETED:     [],  # Terminal state
        OrderStatus.CANCELLED:     [],  # Terminal state
    }
    if status not in allowed_transitions.get(old_status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Không thể chuyển trạng thái từ '{old_status.value}' sang '{status.value}'"
        )

    # Check permissions
    if status == OrderStatus.APPROVED and current_user.role.name not in ["sales", "manager", "admin"]:
        raise HTTPException(status_code=403, detail="Bạn không có quyền duyệt đơn hàng")
    
    # ===== Approve: Use stock first, create production plan for deficit =====
    if status == OrderStatus.APPROVED:
        all_in_stock = True
        for item in order.items:
            # ===== FIX 2: Lock rows to prevent race conditions =====
            product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            ordered_qty = item.quantity
            current_stock = product.stock_quantity
            
            used_from_stock = min(ordered_qty, current_stock)
            needed_production = ordered_qty - used_from_stock
            
            if used_from_stock > 0:
                product.stock_quantity -= used_from_stock
                # ===== FIX 3: Log quantity always positive, use type to distinguish =====
                db.add(InventoryLog(
                    product_id=product.id,
                    order_id=order.id,
                    type=InventoryLogType.OUT,
                    quantity=used_from_stock,  # FIX: positive number, type=OUT indicates direction
                    note=f"Xuất kho {used_from_stock} sp cho đơn #{order.id} (tồn trước: {current_stock})",
                    created_by=current_user.id
                ))
                # Check for low stock after deduction
                check_low_stock_and_notify(db, product.id)
            
            if needed_production > 0:
                all_in_stock = False
                
                # Auto-generate weekly planning fields
                today = datetime.now()
                yr = today.year
                wk = today.isocalendar()[1]
                start_dt = today - timedelta(days=today.weekday())
                start_dt = start_dt.replace(hour=0, minute=0, second=0, microsecond=0)
                end_dt = start_dt + timedelta(days=6, hours=23, minutes=59, seconds=59)
                
                # Sequential plan code using MAX plan code to avoid collisions & count bugs
                p_code = _generate_plan_code(db, yr)
                
                db.add(ProductionPlan(
                    plan_code=p_code,
                    product_id=item.product_id,
                    planned_quantity=needed_production,
                    completed_quantity=0,
                    week_number=wk,
                    year=yr,
                    start_date=start_dt,
                    end_date=end_dt,
                    status=ProductionStatus.PLANNED,
                    progress_percent=0.0,
                    note=f"Tự động tạo từ Đơn hàng ORD-{order.id}",
                    created_by=current_user.id,
                    order_id=order.id,
                    required_quantity=ordered_qty
                ))
        
        if all_in_stock:
            order.status = OrderStatus.READY_TO_SHIP
            db.commit()
            return {"message": "Đơn hàng đủ hàng trong kho, đã chuyển sang Sẵn sàng giao"}

    # ===== Cancel: Return stock correctly =====
    if status == OrderStatus.CANCELLED:
        for item in order.items:
            # FIX 2: Lock rows here too
            product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
            plan = next((p for p in order.production_plans if p.product_id == item.product_id), None)
            
            used_from_stock = 0
            produced_for_order = 0
            
            if plan:
                # Stock used = (total ordered) - (amount sent to production)
                used_from_stock = plan.required_quantity - plan.planned_quantity
                # Return only what was actually produced (capped at planned, excess already went to stock)
                produced_for_order = min(plan.completed_quantity, plan.planned_quantity)
                plan.is_stock_deducted = 0
                plan.status = ProductionStatus.CANCELLED
            else:
                # No production plan → entire quantity was taken from stock
                used_from_stock = item.quantity
            
            total_to_return = used_from_stock + produced_for_order
            
            if total_to_return > 0:
                product.stock_quantity += total_to_return
                # FIX 3: Log quantity always positive
                db.add(InventoryLog(
                    product_id=product.id,
                    order_id=order.id,
                    type=InventoryLogType.RETURN,
                    quantity=total_to_return,
                    note=f"Hoàn kho {total_to_return} sp từ đơn hủy #{order.id} (kho: {used_from_stock}, sx: {produced_for_order})",
                    created_by=current_user.id
                ))

    order.status = status
    
    # Auto create debt if order is completed
    if status == OrderStatus.COMPLETED:
        DebtService.create_debt_from_order(db, order.id)
        
    db.commit()
    return {"message": f"Cập nhật trạng thái đơn hàng thành '{status.value}' thành công"}

@router.get("/{order_id}", response_model=OrderSchema)
async def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Đơn hàng không tìm thấy")
    
    if current_user.role.name == "sales" and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập đơn hàng này")
        
    return order 
