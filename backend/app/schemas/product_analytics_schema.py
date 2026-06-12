from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ProductTopSelling(BaseModel):
    product_id: int
    product_name: str
    sold_quantity: int
    revenue: float

class ProductTopRevenue(BaseModel):
    product_id: int
    product_name: str
    revenue: float

class ProductLowStock(BaseModel):
    product_id: int
    product_name: str
    stock_quantity: int
    low_stock_threshold: int

class ProductHighStock(BaseModel):
    product_id: int
    product_name: str
    stock_quantity: int

class ProductSlowMoving(BaseModel):
    product_id: int
    product_name: str
    sold_quantity: int
    stock_quantity: int

class ProductAnalyticsDashboard(BaseModel):
    total_products: int
    total_stock: int
    low_stock_products: int
    best_selling_product: Optional[str] = None

class MonthlySales(BaseModel):
    month: str
    revenue: float
    quantity: int

class TopCustomer(BaseModel):
    customer_id: int
    customer_name: str
    revenue: float
    quantity: int

class ProductDetailAnalytics(BaseModel):
    product_info: dict
    total_revenue: float
    sold_quantity: int
    average_monthly_sales: float
    monthly_sales: List[MonthlySales]
    top_customers: List[TopCustomer]
