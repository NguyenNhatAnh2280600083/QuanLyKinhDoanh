from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.models import User
from ..schemas import schemas
from ..schemas import weekly_production_planning_schema as wp_schemas
from ..routers.auth import get_current_user
from ..services.weekly_production_planning_service import WeeklyProductionPlanningService
from ..utils.guards import require_permission

router = APIRouter(
    prefix="/production-plans",
    tags=["Weekly Production Planning"],
    dependencies=[Depends(require_permission("PRODUCTION_MANAGEMENT"))]
)

@router.get("/weekly-suggestions", response_model=List[wp_schemas.WeeklyProductionSuggestion])
async def get_weekly_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return WeeklyProductionPlanningService.get_weekly_suggestions(db)

@router.post("/create-week-plan", response_model=List[schemas.ProductionPlan])
async def create_week_plan(
    request: wp_schemas.WeeklyPlanCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return WeeklyProductionPlanningService.create_week_plan(db, request, current_user.id)

@router.get("/week/{year}/{week_number}", response_model=List[schemas.ProductionPlan])
async def get_week_plans(
    year: int,
    week_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return WeeklyProductionPlanningService.get_week_plans(db, year, week_number)

@router.get("/last-week-materials")
async def get_last_week_product_materials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return WeeklyProductionPlanningService.get_last_week_product_materials(db)

@router.get("/dashboard")
async def get_production_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return WeeklyProductionPlanningService.get_production_dashboard(db)
