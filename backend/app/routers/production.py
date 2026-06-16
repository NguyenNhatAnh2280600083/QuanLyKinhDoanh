from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import desc
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
from ..services.material_request_service import MaterialRequestService
from ..utils.guards import require_permission
from ..utils.notifications import notify_material_shortage_for_production

router = APIRouter(prefix="/production-plans", tags=["Production Plans"], dependencies=[Depends(require_permission("PRODUCTION_MANAGEMENT"))])

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

def _create_material_requests_for_shortage(
    db: Session,
    plan: ProductionPlan,
    missing_materials: list,
    user_id: int
):
    created_or_updated_requests = []
    for item in missing_materials:
        missing_quantity = max(0.0, item["required_quantity"] - item["current_stock"])
        reason = (
            f"Tu dong tao do thieu NVL cho ke hoach san xuat {plan.plan_code}. "
            f"Can {item['required_quantity']:g}, ton kho {item['current_stock']:g}, thieu {missing_quantity:g}."
        )
        material_request = MaterialRequestService.create_or_update_shortage_request(
            db=db,
            material_id=item["material_id"],
            requested_quantity=missing_quantity,
            current_stock=item["current_stock"],
            missing_quantity=missing_quantity,
            reason=reason,
            production_plan_id=plan.id,
            user_id=user_id
        )
        created_or_updated_requests.append(material_request)
    return created_or_updated_requests

def _ensure_materials_available_or_notify(db: Session, plan: ProductionPlan, user_id: int):
    requirements = BOMService.calculate_requirements(
        db,
        plan.product_id,
        plan.planned_quantity
    )
    required_materials = requirements["required_materials"]
    if not required_materials:
        raise HTTPException(
            status_code=400,
            detail="Sản phẩm chưa được thiết lập định mức nguyên vật liệu (BOM), không thể sản xuất."
        )

    missing_materials = [
        {
            **item,
            "missing_quantity": max(0.0, item["required_quantity"] - item["current_stock"])
        }
        for item in required_materials
        if not item["enough"]
    ]
    if not missing_materials:
        return

    material_requests = _create_material_requests_for_shortage(db, plan, missing_materials, user_id)
    notify_material_shortage_for_production(db, plan, missing_materials)
    db.commit()
    shortage_summary = "; ".join(
        f"{item['material_name']}: thiếu {item['missing_quantity']:g}"
        for item in missing_materials
    )
    request_codes = ", ".join(
        request.request_code
        for request in material_requests
        if request.request_code
    )
    raise HTTPException(
        status_code=400,
        detail=f"Không đủ nguyên vật liệu để tiếp tục sản xuất. Đã tạo yêu cầu nhập hàng chờ duyệt ({request_codes}) và thông báo Admin/Manager. Chi tiết: {shortage_summary}"
    )

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
    # Check if product exists
    product = db.query(Product).filter(Product.id == plan_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Sản phẩm không tìm thấy")

    # Generate sequential plan code: PP-YYYY-XXX using MAX plan code to avoid collisions & count bugs
    plan_code = _generate_plan_code(db, plan_in.year)

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
    plan = db.query(ProductionPlan).filter(ProductionPlan.id == plan_id).with_for_update().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Kế hoạch sản xuất không tìm thấy")

    if plan.status == ProductionStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Không thể cập nhật tiến độ cho kế hoạch đã hoàn thành")
    if plan.status == ProductionStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Không thể cập nhật tiến độ cho kế hoạch đã huỷ")

    if progress_in.completed_quantity < 0:
        raise HTTPException(status_code=400, detail="Số lượng hoàn thành không hợp lệ")

    if progress_in.completed_quantity > plan.planned_quantity:
        raise HTTPException(status_code=400, detail="Số lượng hoàn thành không được vượt quá số lượng kế hoạch")

    if progress_in.completed_quantity > plan.completed_quantity:
        _ensure_materials_available_or_notify(db, plan, current_user.id)
        
    plan.completed_quantity = progress_in.completed_quantity
    plan.progress_percent = round((plan.completed_quantity / plan.planned_quantity) * 100, 2)
    
    # Update started_at if provided or if starting progress
    if progress_in.started_at:
        plan.started_at = progress_in.started_at
    elif plan.completed_quantity > 0 and not plan.started_at:
        plan.started_at = datetime.utcnow()
    
    # Update completed_at if provided or if auto-completing
    if progress_in.completed_at:
        plan.completed_at = progress_in.completed_at
    elif plan.completed_quantity >= plan.planned_quantity and not plan.completed_at:
        plan.completed_at = datetime.utcnow()
    
    if plan.completed_quantity >= plan.planned_quantity:
        # Auto trigger complete behavior
        plan.status = ProductionStatus.COMPLETED
        plan.progress_percent = 100.0
        
        # Add to product stock
        product = db.query(Product).filter(Product.id == plan.product_id).with_for_update().first()
        if product:
            product.stock_quantity += plan.completed_quantity
            db.add(InventoryLog(
                product_id=plan.product_id,
                type=InventoryLogType.IN,
                quantity=plan.completed_quantity,
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
    complete_in: Optional[schemas.ProductionPlanUpdateQuantity] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plan = db.query(ProductionPlan).filter(ProductionPlan.id == plan_id).with_for_update().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Kế hoạch sản xuất không tìm thấy")

    if plan.status == ProductionStatus.COMPLETED:
        return {
            "message": "Kế hoạch đã ở trạng thái hoàn thành",
            "plan_code": plan.plan_code,
            "status": plan.status
        }
    if plan.status == ProductionStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Không thể hoàn thành kế hoạch đã huỷ")

    _ensure_materials_available_or_notify(db, plan, current_user.id)

    plan.status = ProductionStatus.COMPLETED
    plan.completed_quantity = plan.planned_quantity
    plan.progress_percent = 100.0
    if not plan.started_at and (not complete_in or not complete_in.started_at):
        plan.started_at = datetime.utcnow()
    elif complete_in and complete_in.started_at:
        plan.started_at = complete_in.started_at
        
    if not plan.completed_at and (not complete_in or not complete_in.completed_at):
        plan.completed_at = datetime.utcnow()
    elif complete_in and complete_in.completed_at:
        plan.completed_at = complete_in.completed_at

    # Add to product stock
    product = db.query(Product).filter(Product.id == plan.product_id).with_for_update().first()
    if product:
        product.stock_quantity += plan.completed_quantity
        db.add(InventoryLog(
            product_id=plan.product_id,
            type=InventoryLogType.IN,
            quantity=plan.completed_quantity,
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

@router.put("/{plan_id}/cancel")
async def cancel_production_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plan = db.query(ProductionPlan).filter(ProductionPlan.id == plan_id).with_for_update().first()
    if not plan:
        raise HTTPException(status_code=404, detail="Kế hoạch sản xuất không tìm thấy")

    if plan.status == ProductionStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Không thể huỷ kế hoạch đã hoàn thành")

    if plan.status == ProductionStatus.CANCELLED:
        return {
            "message": "Kế hoạch đã ở trạng thái huỷ",
            "plan_code": plan.plan_code,
            "status": plan.status
        }

    plan.status = ProductionStatus.CANCELLED
    db.commit()
    db.refresh(plan)
    return {
        "message": "Huỷ kế hoạch sản xuất thành công",
        "plan_code": plan.plan_code,
        "status": plan.status
    }

@router.delete("/{plan_id}")
async def delete_production_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if user is admin/manager (optional, but recommended)
    plan = db.query(ProductionPlan).filter(ProductionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Kế hoạch sản xuất không tìm thấy")

    db.delete(plan)
    db.commit()
    return {
        "message": "Xoá kế hoạch sản xuất thành công"
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
    missing_materials = []
    
    materials = []
    for item in requirements["required_materials"]:
        req_qty = item["required_quantity"]
        stock_qty = item["current_stock"]
        enough = item["enough"]
        missing = max(0.0, req_qty - stock_qty) if not enough else 0.0
        if missing > 0:
            missing_materials.append({
                **item,
                "missing_quantity": missing
            })
        
        materials.append({
            "name": item["material_name"],
            "material": item["material_name"],
            "required": req_qty,
            "stock": stock_qty,
            "enough": enough,
            "missing": missing
        })

    if (
        missing_materials
        and plan.status not in [ProductionStatus.COMPLETED, ProductionStatus.CANCELLED]
    ):
        _create_material_requests_for_shortage(db, plan, missing_materials, current_user.id)
        db.commit()

    return {"materials": materials}
