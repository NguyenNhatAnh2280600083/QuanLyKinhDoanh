from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from ..models.models import OrderStatus, InventoryLogType, ProductionStatus, NotificationType, CustomerType, DebtStatus

# Token Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# Role Schemas
class RoleBase(BaseModel):
    name: str

class Role(RoleBase):
    id: int
    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role_id: int

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[int] = None

class User(UserBase):
    id: int
    role_id: int
    is_active: int
    created_at: datetime
    role: Role

    class Config:
        from_attributes = True

# Customer Schemas
class CustomerBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    region: Optional[str] = None
    customer_type: Optional[CustomerType] = CustomerType.GT

class CustomerCreate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Product Schemas
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock_quantity: int
    low_stock_threshold: int = 10
    category_id: int
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    category: Category
    created_at: datetime
    updated_at: Optional[datetime]
    class Config:
        from_attributes = True

# InventoryLog Schemas
class InventoryLogBase(BaseModel):
    product_id: int
    order_id: Optional[int] = None
    type: InventoryLogType
    quantity: int
    note: Optional[str] = None

class InventoryLogCreate(InventoryLogBase):
    created_by: int

class InventoryLog(InventoryLogBase):
    id: int
    created_by: int
    created_at: datetime
    product: ProductBase
    user: UserBase
    ending_balance: Optional[int] = None
    
    class Config:
        from_attributes = True

class InventoryAdjust(BaseModel):
    quantity: int
    note: Optional[str] = None

class InventoryResponse(BaseModel):
    total: int
    items: List[Product]
    skip: int
    limit: int

class InventoryLogResponse(BaseModel):
    total: int
    items: List[InventoryLog]
    skip: int
    limit: int

# Order Schemas
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    unit_price: float
    product: Product
    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    customer_id: int
    status: Optional[OrderStatus] = OrderStatus.PENDING

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class Order(OrderBase):
    id: int
    user_id: int
    total_amount: float
    created_at: datetime
    updated_at: Optional[datetime]
    customer: Customer
    user: UserBase
    items: List[OrderItem]

    class Config:
        from_attributes = True

# Dashboard/Stats Schemas
class DashboardStats(BaseModel):
    total_revenue: float
    total_orders: int
    total_customers: int
    total_products: int
    pending_orders_count: int
    new_customers_this_week: int
    out_of_stock_count: int
    low_stock_count: int
    revenue_by_month: List[dict]
    top_products: List[dict]
    top_sales_staff: List[dict]
    revenue_by_region: List[dict]

class RevenueByChannel(BaseModel):
    channel: str
    channel_name: str
    revenue: float
    total_orders: int
    total_customers: int
    percentage: float

class RevenueByCustomer(BaseModel):
    customer_id: int
    customer_name: str
    customer_type: str
    revenue: float
    total_orders: int
    last_order_date: Optional[datetime]
    percentage: float

class RevenueByStaff(BaseModel):
    staff_id: int
    staff_name: str
    revenue: float
    total_orders: int
    total_customers: int
    percentage: float

# Production Plan Schemas
class ProductionPlanBase(BaseModel):
    product_id: int
    planned_quantity: int
    week_number: int
    year: int
    start_date: datetime
    end_date: datetime
    note: Optional[str] = None
    order_id: Optional[int] = None
    required_quantity: Optional[int] = None

class ProductionPlanCreate(ProductionPlanBase):
    pass

class ProductionPlanUpdateStatus(BaseModel):
    status: ProductionStatus

class ProductionPlanUpdateQuantity(BaseModel):
    completed_quantity: int
    status: Optional[ProductionStatus] = None

class ProductionPlan(BaseModel):
    id: int
    plan_code: str
    product_id: int
    planned_quantity: int
    completed_quantity: int
    week_number: int
    year: int
    start_date: datetime
    end_date: datetime
    status: ProductionStatus
    progress_percent: float
    note: Optional[str] = None
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    product: ProductBase
    creator: Optional[UserBase] = None
    order_id: Optional[int] = None
    required_quantity: Optional[int] = None
    is_stock_deducted: Optional[int] = 0

    class Config:
        from_attributes = True

class ProductionPlanResponse(BaseModel):
    total: int
    items: List[ProductionPlan]
    skip: int
    limit: int

# Notification Schemas
class Notification(BaseModel):
    id: int
    user_id: int
    order_id: Optional[int] = None
    product_id: Optional[int] = None
    type: NotificationType
    title: str
    message: str
    is_read: int
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    total: int
    unread_count: int
    items: List[Notification]
    skip: int
    limit: int

# Debt Schemas
class DebtPaymentBase(BaseModel):
    amount: float
    payment_method: Optional[str] = "cash"
    note: Optional[str] = None
    payment_date: Optional[datetime] = None

class DebtPaymentCreate(DebtPaymentBase):
    pass

class DebtPayment(DebtPaymentBase):
    id: int
    debt_id: int
    created_by: int
    created_at: datetime
    user: UserBase

    class Config:
        from_attributes = True

class CustomerDebtBase(BaseModel):
    customer_id: int
    order_id: int
    total_amount: float
    due_date: datetime

class CustomerDebtUpdate(BaseModel):
    due_date: Optional[datetime] = None
    status: Optional[DebtStatus] = None

class CustomerDebt(CustomerDebtBase):
    id: int
    paid_amount: float
    remaining_amount: float
    status: DebtStatus
    created_at: datetime
    updated_at: datetime
    customer: Customer
    order: Order
    payments: List[DebtPayment] = []

    class Config:
        from_attributes = True

class CustomerDebtListItem(BaseModel):
    id: int
    customer_id: int
    order_id: int
    total_amount: float
    paid_amount: float
    remaining_amount: float
    due_date: datetime
    status: DebtStatus
    created_at: datetime
    customer_name: str
    order_code: str

    class Config:
        from_attributes = True

class DebtSummary(BaseModel):
    total_debt: float
    total_paid: float
    total_remaining: float
    overdue_amount: float
    overdue_count: int
    top_debt_customers: List[dict]
