from pydantic import BaseModel
from typing import List, Optional

class WeeklyProductionSuggestion(BaseModel):
    product_id: int
    product_name: str
    sold_last_week: int
    avg_daily_sales: float
    forecast_next_week: int
    current_stock: int
    safety_stock: int
    suggested_production: int
    status: str

    class Config:
        from_attributes = True

class WeeklyPlanItemCreate(BaseModel):
    product_id: int
    planned_quantity: int

class WeeklyPlanCreateRequest(BaseModel):
    week_number: int
    year: int
    plans: List[WeeklyPlanItemCreate]

class WeeklyDashboardKPI(BaseModel):
    total_products_need_production: int
    total_planned_quantity: int
    low_stock_products: int
    completion_rate: float

    class Config:
        from_attributes = True
