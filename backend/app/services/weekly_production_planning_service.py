from datetime import datetime, timedelta
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from fastapi import HTTPException
from ..models.models import (
    Product, Order, OrderItem, ProductionPlan, 
    ProductionStatus, OrderStatus, User, RawMaterial
)
from ..schemas.weekly_production_planning_schema import (
    WeeklyPlanCreateRequest, WeeklyProductionSuggestion
)
from .bom_service import BOMService

class WeeklyProductionPlanningService:

    @staticmethod
    def get_weekly_suggestions(db: Session):
        # 1. Fetch all products
        products = db.query(Product).all()

        # 2. Get sold quantity in the last 7 days for COMPLETED orders
        seven_days_ago = datetime.now() - timedelta(days=7)
        sales_query = (
            db.query(OrderItem.product_id, func.sum(OrderItem.quantity).label("sold_qty"))
            .join(Order, Order.id == OrderItem.order_id)
            .filter(Order.status == OrderStatus.COMPLETED)
            .filter(Order.created_at >= seven_days_ago)
            .group_by(OrderItem.product_id)
            .all()
        )
        sales_map = {product_id: sold_qty for product_id, sold_qty in sales_query}

        suggestions = []
        for product in products:
            sold_last_week = int(sales_map.get(product.id, 0) or 0)
            avg_daily_sales = round(sold_last_week / 7.0, 1)
            
            # Forecast next week sales is equivalent to sold quantity last week
            forecast_next_week = sold_last_week
            current_stock = product.stock_quantity
            
            # Safety stock rate defaults to 0.2 (20%) if not set
            safety_stock_rate = product.safety_stock_rate if product.safety_stock_rate is not None else 0.2
            safety_stock = int(round(forecast_next_week * safety_stock_rate))
            
            # Suggested production = Forecast + Safety Stock - Current Stock
            suggested_production = forecast_next_week + safety_stock - current_stock
            if suggested_production < 0:
                suggested_production = 0

            # Determine status
            if current_stock <= product.low_stock_threshold:
                status = "LOW_STOCK"
            elif suggested_production > 0:
                status = "NEED_PRODUCTION"
            else:
                status = "NO_NEED"

            suggestions.append({
                "product_id": product.id,
                "product_name": product.name,
                "sold_last_week": sold_last_week,
                "avg_daily_sales": avg_daily_sales,
                "forecast_next_week": forecast_next_week,
                "current_stock": current_stock,
                "safety_stock": safety_stock,
                "suggested_production": suggested_production,
                "status": status
            })
            
        return suggestions

    @staticmethod
    def create_week_plan(db: Session, request: WeeklyPlanCreateRequest, creator_id: int):
        created_plans = []
        
        # Calculate start and end dates based on ISO week
        # ISO week 1 is the week with the first Thursday
        first_thursday = datetime(request.year, 1, 4)
        start_of_week1 = first_thursday - timedelta(days=first_thursday.weekday())
        start_date = start_of_week1 + timedelta(weeks=request.week_number - 1)
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=6, hours=23, minutes=59, seconds=59)

        # Retrieve starting plan count for generating plan codes
        plan_count = db.query(ProductionPlan).filter(ProductionPlan.year == request.year).count()

        for item in request.plans:
            # Check if plan already exists for product in this week
            existing = (
                db.query(ProductionPlan)
                .filter(
                    ProductionPlan.product_id == item.product_id,
                    ProductionPlan.week_number == request.week_number,
                    ProductionPlan.year == request.year,
                    ProductionPlan.status != ProductionStatus.CANCELLED
                )
                .first()
            )
            if existing:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                p_name = product.name if product else f"ID {item.product_id}"
                raise HTTPException(
                    status_code=400,
                    detail=f"Kế hoạch sản xuất cho sản phẩm '{p_name}' trong tuần {request.week_number}/{request.year} đã tồn tại."
                )

            plan_count += 1
            plan_code = f"PP-{request.year}-{plan_count:03d}"

            new_plan = ProductionPlan(
                plan_code=plan_code,
                product_id=item.product_id,
                planned_quantity=item.planned_quantity,
                completed_quantity=0,
                week_number=request.week_number,
                year=request.year,
                start_date=start_date,
                end_date=end_date,
                status=ProductionStatus.PLANNED,
                progress_percent=0.0,
                created_by=creator_id,
                required_quantity=item.planned_quantity,
                is_stock_deducted=0
            )
            db.add(new_plan)
            created_plans.append(new_plan)

        db.commit()
        for plan in created_plans:
            db.refresh(plan)

        return created_plans

    @staticmethod
    def get_week_plans(db: Session, year: int, week_number: int):
        return (
            db.query(ProductionPlan)
            .filter(ProductionPlan.year == year, ProductionPlan.week_number == week_number)
            .options(joinedload(ProductionPlan.product), joinedload(ProductionPlan.creator))
            .all()
        )

    @staticmethod
    def get_last_week_product_materials(db: Session):
        today = datetime.now()
        current_year = today.year
        current_week = today.isocalendar()[1]

        prev_week = current_week - 1
        prev_year = current_year
        if prev_week == 0:
            prev_year -= 1
            prev_week = datetime(prev_year, 12, 28).isocalendar()[1]

        plans = (
            db.query(ProductionPlan)
            .filter(
                ProductionPlan.year == prev_year,
                ProductionPlan.week_number == prev_week,
                ProductionPlan.status != ProductionStatus.CANCELLED
            )
            .options(joinedload(ProductionPlan.product))
            .all()
        )

        results = []
        for plan in plans:
            requirements = BOMService.calculate_requirements(db, plan.product_id, plan.planned_quantity)
            bom_materials = []
            for item in requirements["required_materials"]:
                material = db.query(RawMaterial).filter(RawMaterial.id == item["material_id"]).first()
                bom_materials.append({
                    "material_id": item["material_id"],
                    "material_name": item["material_name"],
                    "material_unit": material.unit if material else None,
                    "required_quantity": item["required_quantity"],
                    "current_stock": item["current_stock"],
                    "enough": item["enough"],
                    "missing_quantity": max(0.0, item["required_quantity"] - item["current_stock"]) if not item["enough"] else 0.0
                })
            results.append({
                "week_number": prev_week,
                "year": prev_year,
                "plan_id": plan.id,
                "plan_code": plan.plan_code,
                "product_id": plan.product_id,
                "product_name": plan.product.name if plan.product else None,
                "planned_quantity": plan.planned_quantity,
                "completed_quantity": plan.completed_quantity,
                "status": plan.status,
                "progress_percent": plan.progress_percent,
                "bom_materials": bom_materials
            })

        return results

    @staticmethod
    def get_production_dashboard(db: Session):
        # 1. Fetch suggestions to calculate current recommendation KPIs
        suggestions = WeeklyProductionPlanningService.get_weekly_suggestions(db)
        
        total_products_need_production = sum(1 for s in suggestions if s["suggested_production"] > 0)
        total_planned_quantity = sum(s["suggested_production"] for s in suggestions if s["suggested_production"] > 0)
        low_stock_products = sum(1 for s in suggestions if s["status"] == "LOW_STOCK")

        # 2. Get last week's completion rate
        today = datetime.now()
        current_year = today.year
        current_week = today.isocalendar()[1]
        
        prev_week = current_week - 1
        prev_year = current_year
        if prev_week == 0:
            prev_year -= 1
            prev_week = datetime(prev_year, 12, 28).isocalendar()[1]

        prev_plans = (
            db.query(ProductionPlan)
            .filter(
                ProductionPlan.year == prev_year,
                ProductionPlan.week_number == prev_week,
                ProductionPlan.status != ProductionStatus.CANCELLED
            )
            .all()
        )

        if prev_plans:
            total_planned = sum(p.planned_quantity for p in prev_plans)
            total_completed = sum(p.completed_quantity for p in prev_plans)
            completion_rate = round((total_completed / total_planned) * 100, 1) if total_planned > 0 else 0.0
        else:
            completion_rate = 0.0

        # 3. Sort suggestions to get top 5 products needing production
        top_products = [
            {
                "product_id": s["product_id"],
                "product_name": s["product_name"],
                "suggested_production": s["suggested_production"],
                "current_stock": s["current_stock"]
            }
            for s in suggestions
            if s["suggested_production"] > 0
        ]
        top_products.sort(key=lambda x: x["suggested_production"], reverse=True)
        top_products = top_products[:5]

        # 4. Fetch general production plans statistics for charts
        all_plans = db.query(ProductionPlan).options(joinedload(ProductionPlan.product)).all()
        total_plans = len(all_plans)
        planned = sum(1 for p in all_plans if p.status == ProductionStatus.PLANNED)
        in_progress = sum(1 for p in all_plans if p.status == ProductionStatus.IN_PROGRESS)
        completed = sum(1 for p in all_plans if p.status == ProductionStatus.COMPLETED)
        
        active_plans = [p for p in all_plans if p.status != ProductionStatus.CANCELLED]
        completion_rate_overall = round(sum(p.progress_percent for p in active_plans) / len(active_plans)) if active_plans else 0

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
            weekly_volume.append({
                "name": f"Tuần {wk}",
                "planned": data["planned"],
                "completed": data["completed"]
            })
            weekly_progress.append({
                "name": f"Tuần {wk}",
                "progress": round(data["progress_sum"] / data["count"]) if data["count"] > 0 else 0
            })

        status_distribution = [
            {"name": "PLANNED", "value": planned, "label": "Chờ sản xuất"},
            {"name": "IN_PROGRESS", "value": in_progress, "label": "Đang sản xuất"},
            {"name": "COMPLETED", "value": completed, "label": "Hoàn thành"}
        ]

        return {
            "total_products_need_production": total_products_need_production,
            "total_planned_quantity": total_planned_quantity,
            "low_stock_products": low_stock_products,
            "completion_rate": completion_rate,
            
            "top_products_need_production": top_products,
            
            "total_plans": total_plans,
            "planned": planned,
            "in_progress": in_progress,
            "completed": completed,
            "completion_rate_overall": completion_rate_overall,
            "weekly_volume": weekly_volume,
            "weekly_progress": weekly_progress,
            "status_distribution": status_distribution
        }
