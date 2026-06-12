from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class EmployeeRevenue(BaseModel):
    employee_id: int
    employee_name: str
    revenue: float
    total_orders: int
    total_customers: int
    avg_order_value: float

class EmployeeDashboardSummary(BaseModel):
    total_revenue: float
    total_orders: int
    total_sales_employees: int
    best_employee: Optional[EmployeeRevenue] = None

class EmployeeMonthlyRevenue(BaseModel):
    month: str
    revenue: float

class TopCustomer(BaseModel):
    customer_name: str
    revenue: float

class EmployeeRevenueDetail(BaseModel):
    employee_id: int
    employee_name: str
    email: str
    revenue: float
    total_orders: int
    total_customers: int
    avg_order_value: float
    monthly_revenue: List[EmployeeMonthlyRevenue]
    top_customers: List[TopCustomer]
