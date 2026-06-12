from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..models.models import (
    ProductionPlan,
    ProductionStatus,
    User,
    Product,
    InventoryLog,
    InventoryLogType,
    ProductBOM,
    RawMaterial,
    RawMaterialLog,
    RawMaterialLogType
)
from ..schemas import schemas
from .auth import get_current_user
from ..services.bom_service import BOMService

router = APIRouter(prefix="/production-plans", tags=["Production Plans"])

@router.get("/dashboard")
async def get_production_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    all_plans = db.query(ProductionPlan).options(joinedload(ProductionPlan.product)).all()
    
    total_plans = len(all_plans)
    planned = sum(1 for p in all_plans if p.status == ProductionStatus.PLANNED)
    in_progress = sum(1 for p in all_plans if p.status == ProductionStatus.IN_PROGRESS)
    completed = sum(1 for p in all_plans if p.status == ProductionStatus.COMPLETED)
    cancelled = sum(1 for p in all_plans if p.status == ProductionStatus.CANCELLED)
    
    active_plans = [p for p in all_plans if p.status != ProductionStatus.CANCELLED]
    completion_rate = round(sum(p.progress_percent for p in active_plans) / len(active_plans)) if active_plans else 0
    
    # Group by week and year
    weeks_data = {}
    for p in active_plans:
        key = (p.year, p.week_number)
        if key not in weeks_data:
            weeks_data[key] = {"planned": 0, "completed": 0, "progress_sum": 0.0, "count": 0}
        weeks_data[key]["planned"] += p.planned_quantity
        weeks_data[key]["completed"] += p.completed_quantity
        weeks_data[key]["progress_sum"] += p.progress_percent
        weeks_data[key]["count"] += 1

    sorted_keys = sorted(weeks_data.keys())
    
    weekly_volume = []
    weekly_progress = []
    for key in sorted_keys:
        yr, wk = key
        data = weeks_data[key]
        name = f"Tuần {wk}"
        weekly_volume.append({
            "name": name,
            "planned": data["planned"],
            "completed": data["completed"]
        })
        weekly_progress.append({
            "name": name,
            "progress": round(data["progress_sum"] / data["count"]) if data["count"] > 0 else 0
        })
        
    status_distribution = [
        {"name": "PLANNED", "value": planned, "label": "Chờ sản xuất"},
        {"name": "IN_PROGRESS", "value": in_progress, "label": "Đang sản xuất"},
        {"name": "COMPLETED", "value": completed, "label": "Hoàn thành"}
    ]
    
    return {
        "total_plans": total_plans,
        "planned": planned,
        "in_progress": in_progress,
        "completed": completed,
        "completion_rate": completion_rate,
        "weekly_volume": weekly_volume,
        "weekly_progress": weekly_progress,
        "status_distribution": status_distribution
    }

@router.get("/", response_model=schemas.ProductionPlanResponse)
async def get_production_plans(
    skip: int = 0,
    limit: int = 100,
    week_number: Optional[int] = Query(None, description="Lọc theo tuần"),
    year: Optional[int] = Query(None, description="Lọc theo năm"),
    status: Optional[ProductionStatus] = Query(None, description="Lọc theo trạng thái"),
    product_id: Optional[int] = Query(None, description="Lọc theo sản phẩm"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ProductionPlan)
    
    if week_number is not None:
        query = query.filter(ProductionPlan.week_number == week_number)
    if year is not None:
        query = query.filter(ProductionPlan.year == year)
    if status is not None:
        query = query.filter(ProductionPlan.status == status)
    if product_id is not None:
        query = query.filter(ProductionPlan.product_id == product_id)
        
    total = query.count()
    items = (
        query.options(joinedload(ProductionPlan.product), joinedload(ProductionPlan.creator))
        .order_by(ProductionPlan.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    return {
        "total": total,
        "items": items,
        "skip": skip,
        "limit": limit
    }

@router.post("/", response_model=schemas.ProductionPlan)
async def create_production_plan(
    plan_in: schemas.ProductionPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Chỉ Admin hoặc Manager mới có quyền tạo kế hoạch sản xuất")
        
    # Check if product exists
    product = db.query(Product).filter(Product.id == plan_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Sản phẩm không tìm thấy")

    # Generate sequential plan code: PP-YYYY-XXX
    plan_count = db.query(ProductionPlan).filter(ProductionPlan.year == plan_in.year).count()
    plan_code = f"PP-{plan_in.year}-{plan_count + 1:03d}"

    new_plan = ProductionPlan(
        plan_code=plan_code,
        product_id=plan_in.product_id,
        planned_quantity=plan_in.planned_quantity,
        completed_quantity=0,
        week_number=plan_in.week_number,
        year=plan_in.year,
        start_date=plan_in.start_date,
        end_date=plan_in.end_date,
        status=ProductionStatus.PLANNED,
        progress_percent=0.0,
        note=plan_in.note,
        created_by=current_user.id,
        order_id=plan_in.order_id,
        required_quantity=plan_in.required_quantity or plan_in.planned_quantity
    )
    
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return new_plan

@router.get("/{plan_id}", response_model=schemas.ProductionPlan)
async def get_production_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plan = db.query(ProductionPlan).options(joinedload(ProductionPlan.product), joinedload(ProductionPlan.creator)).filter(ProductionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Kế hoạch sản xuất không tìm thấy")
    return plan

@router.put("/{plan_id}/progress")
async def update_production_progress(
    plan_id: int,
    progress_in: schemas.ProductionPlanUpdateQuantity,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Chỉ Admin hoặc Manager mới có quyền cập nhật tiến độ")
        
    plan = db.query(ProductionPlan).filter(ProductionPlan.id == plan_id).with_for_update().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Kế hoạch sản xuất không tìm thấy")

    if plan.status == ProductionStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Không thể cập nhật tiến độ cho kế hoạch đã hoàn thành")
        
    if progress_in.completed_quantity > plan.planned_quantity:
        raise HTTPException(status_code=400, detail="Số lượng hoàn thành không được lớn hơn số lượng kế hoạch")

    plan.completed_quantity = progress_in.completed_quantity
    plan.progress_percent = round((plan.completed_quantity / plan.planned_quantity) * 100, 2)
    
    if plan.completed_quantity >= plan.planned_quantity:
        # Auto trigger complete behavior
        plan.status = ProductionStatus.COMPLETED
        plan.progress_percent = 100.0
        
        # Add to product stock
        product = db.query(Product).filter(Product.id == plan.product_id).with_for_update().first()
        if product:
            product.stock_quantity += plan.planned_quantity
            db.add(InventoryLog(
                product_id=plan.product_id,
                type=InventoryLogType.IN,
                quantity=plan.planned_quantity,
                note=f"Tự động nhập kho từ hoàn thành kế hoạch sản xuất tuần {plan.plan_code}",
                created_by=current_user.id
            ))
            
        # Deduct materials from BOM
        BOMService.deduct_materials_for_production(db, plan.id, current_user.id)
    elif plan.completed_quantity > 0:
        plan.status = ProductionStatus.IN_PROGRESS
    else:
        plan.status = ProductionStatus.PLANNED
        
    db.commit()
    db.refresh(plan)
    return {
        "plan_code": plan.plan_code,
        "planned_quantity": plan.planned_quantity,
        "completed_quantity": plan.completed_quantity,
        "progress_percent": plan.progress_percent,
        "status": plan.status
    }

@router.put("/{plan_id}/complete")
async def complete_production_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.name not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Chỉ Admin hoặc Manager mới có quyền hoàn thành kế hoạch")
        
    plan = db.query(ProductionPlan).filter(ProductionPlan.id == plan_id).with_for_update().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Kế hoạch sản xuất không tìm thấy")

    if plan.status == ProductionStatus.COMPLETED:
        return {
            "message": "Kế hoạch đã ở trạng thái hoàn thành",
            "plan_code": plan.plan_code,
            "status": plan.status
        }

    plan.status = ProductionStatus.COMPLETED
    plan.completed_quantity = plan.planned_quantity
    plan.progress_percent = 100.0

    # Add to product stock
    product = db.query(Product).filter(Product.id == plan.product_id).with_for_update().first()
    if product:
        product.stock_quantity += plan.planned_quantity
        db.add(InventoryLog(
            product_id=plan.product_id,
            type=InventoryLogType.IN,
            quantity=plan.planned_quantity,
            note=f"Nhập kho từ hoàn thành kế hoạch sản xuất tuần {plan.plan_code}",
            created_by=current_user.id
        ))

    # Deduct materials from BOM
    BOMService.deduct_materials_for_production(db, plan.id, current_user.id)

    db.commit()
    db.refresh(plan)
    return {
        "message": "Hoàn thành kế hoạch sản xuất thành công",
        "plan_code": plan.plan_code,
        "status": plan.status
    }

@router.get("/{plan_id}/material-requirements")
async def get_material_requirements(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plan = db.query(ProductionPlan).filter(ProductionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Kế hoạch sản xuất không tìm thấy")

    requirements = BOMService.calculate_requirements(db, plan.product_id, plan.planned_quantity)
    
    materials = []
    for item in requirements["required_materials"]:
        req_qty = item["required_quantity"]
        stock_qty = item["current_stock"]
        enough = item["enough"]
        missing = max(0.0, req_qty - stock_qty) if not enough else 0.0
        
        materials.append({
            "name": item["material_name"],
            "material": item["material_name"],
            "required": req_qty,
            "stock": stock_qty,
            "enough": enough,
            "missing": missing
        })
        
    return {"materials": materials}
