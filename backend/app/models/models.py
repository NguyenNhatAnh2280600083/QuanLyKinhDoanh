from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Enum, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
import enum

class OrderStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    READY_TO_SHIP = "ready_to_ship"
    SHIPPED = "shipped"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class DebtStatus(enum.Enum):
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"
    OVERDUE = "overdue"

class ProductionStatus(enum.Enum):
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class NotificationType(enum.Enum):
    PRODUCTION_REQUEST = "production_request"
    LOW_STOCK = "low_stock"

class InventoryLogType(enum.Enum):
    IN = "IN"
    OUT = "OUT"
    ADJUST = "ADJUST"
    RETURN = "RETURN"

class CustomerType(enum.Enum):
    MT = "MT"
    GT = "GT"
    ECOM = "ECOM"
    EXPORT = "EXPORT"

class RawMaterialLogType(enum.Enum):
    IMPORT = "IMPORT"
    EXPORT = "EXPORT"

class MaterialRequestStatus(enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False) # admin, manager, sales
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    users = relationship("User", back_populates="role")
    role_permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")
    permissions = relationship("Permission", secondary="role_permissions", back_populates="roles", viewonly=True)

class Permission(Base):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)

    role_permissions = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")
    roles = relationship("Role", secondary="role_permissions", back_populates="permissions", viewonly=True)

class RolePermission(Base):
    __tablename__ = "role_permissions"
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False, index=True)
    permission_id = Column(Integer, ForeignKey("permissions.id"), nullable=False, index=True)

    role = relationship("Role", back_populates="role_permissions")
    permission = relationship("Permission", back_populates="role_permissions")

    __table_args__ = (
        UniqueConstraint("role_id", "permission_id", name="uq_role_permission"),
    )

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role_id = Column(Integer, ForeignKey("roles.id"))
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    role = relationship("Role", back_populates="users")
    orders = relationship("Order", back_populates="user")
    notifications = relationship("Notification", back_populates="user")

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True)
    phone = Column(String(20))
    address = Column(String(255))
    region = Column(String(50)) # For filtering by region
    customer_type = Column(Enum(CustomerType), default=CustomerType.GT)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    orders = relationship("Order", back_populates="customer")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    
    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, default=0)
    low_stock_threshold = Column(Integer, default=10)
    safety_stock_rate = Column(Float, default=0.2, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    image_url = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    category = relationship("Category", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
    inventory_logs = relationship("InventoryLog", back_populates="product")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    user_id = Column(Integer, ForeignKey("users.id")) # Sales staff who created the order
    total_amount = Column(Float, default=0.0)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    customer = relationship("Customer", back_populates="orders")
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")
    payment = relationship("Payment", back_populates="order", uselist=False)
    status_logs = relationship("OrderStatusLog", back_populates="order")
    production_plans = relationship("ProductionPlan", back_populates="order")
    debt = relationship("CustomerDebt", back_populates="order", uselist=False)

class RawMaterial(Base):
    __tablename__ = "raw_materials"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    unit = Column(String(20), nullable=False)
    stock_quantity = Column(Float, default=0.0)
    minimum_stock = Column(Float, default=0.0)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    logs = relationship("RawMaterialLog", back_populates="material")
    bom_items = relationship("ProductBOM", back_populates="material")

class RawMaterialLog(Base):
    __tablename__ = "raw_material_logs"
    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("raw_materials.id"))
    type = Column(Enum(RawMaterialLogType), nullable=False)
    quantity = Column(Float, nullable=False)
    note = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    material = relationship("RawMaterial", back_populates="logs")
    user = relationship("User")

class ProductBOM(Base):
    __tablename__ = "product_bom"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    material_id = Column(Integer, ForeignKey("raw_materials.id"))
    quantity_required = Column(Float, nullable=False) # Quantity per 1 unit of product
    
    product = relationship("Product")
    material = relationship("RawMaterial", back_populates="bom_items")

class ProductionMaterialUsage(Base):
    __tablename__ = "production_material_usage"
    id = Column(Integer, primary_key=True, index=True)
    production_plan_id = Column(Integer, ForeignKey("production_plans.id"))
    material_id = Column(Integer, ForeignKey("raw_materials.id"))
    quantity_used = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    production_plan = relationship("ProductionPlan", back_populates="material_usages")
    material = relationship("RawMaterial")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False) # Price at the time of order
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50)) # cash, transfer, card
    payment_date = Column(DateTime(timezone=True), server_default=func.now())
    
    order = relationship("Order", back_populates="payment")

class SalesReport(Base):
    __tablename__ = "sales_reports"
    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String(20)) # daily, monthly, quarterly, yearly
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    total_revenue = Column(Float)
    total_orders = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class InventoryLog(Base):
    __tablename__ = "inventory_logs"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    type = Column(Enum(InventoryLogType), nullable=False)
    quantity = Column(Integer, nullable=False)
    note = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    product = relationship("Product", back_populates="inventory_logs")
    order = relationship("Order")
    user = relationship("User")

class OrderStatusLog(Base):
    __tablename__ = "order_status_logs"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    old_status = Column(Enum(OrderStatus))
    new_status = Column(Enum(OrderStatus))
    changed_by = Column(Integer, ForeignKey("users.id"))
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    order = relationship("Order", back_populates="status_logs")
    user = relationship("User")

class ProductionPlan(Base):
    __tablename__ = "production_plans"
    id = Column(Integer, primary_key=True, index=True)
    plan_code = Column(String(50), unique=True, index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    planned_quantity = Column(Integer, nullable=False)
    completed_quantity = Column(Integer, default=0)
    week_number = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    status = Column(Enum(ProductionStatus), default=ProductionStatus.PLANNED)
    progress_percent = Column(Float, default=0.0)
    note = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    # Optional fields for backward compatibility with order flow
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    required_quantity = Column(Integer, nullable=True)
    is_stock_deducted = Column(Integer, default=0) # 0: No, 1: Yes
    
    order = relationship("Order", back_populates="production_plans")
    product = relationship("Product")
    creator = relationship("User", foreign_keys=[created_by])
    material_usages = relationship("ProductionMaterialUsage", back_populates="production_plan")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")
    order = relationship("Order")
    product = relationship("Product")

class CustomerDebt(Base):
    __tablename__ = "customer_debts"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)
    total_amount = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    remaining_amount = Column(Float, default=0.0)
    due_date = Column(DateTime, nullable=False)
    status = Column(Enum(DebtStatus), default=DebtStatus.UNPAID)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer")
    order = relationship("Order", back_populates="debt")
    payments = relationship("DebtPayment", back_populates="debt")

class DebtPayment(Base):
    __tablename__ = "debt_payments"
    id = Column(Integer, primary_key=True, index=True)
    debt_id = Column(Integer, ForeignKey("customer_debts.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50))
    payment_date = Column(DateTime(timezone=True), server_default=func.now())
    note = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    debt = relationship("CustomerDebt", back_populates="payments")
    user = relationship("User")

class MaterialRequest(Base):
    __tablename__ = "material_requests"
    id = Column(Integer, primary_key=True, index=True)
    request_code = Column(String(50), unique=True, index=True, nullable=False)
    material_id = Column(Integer, ForeignKey("raw_materials.id"), nullable=False)
    requested_quantity = Column(Float, nullable=False)
    current_stock = Column(Float, nullable=False)
    missing_quantity = Column(Float, nullable=False)
    reason = Column(Text)
    status = Column(Enum(MaterialRequestStatus), default=MaterialRequestStatus.PENDING)
    production_plan_id = Column(Integer, ForeignKey("production_plans.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    material = relationship("RawMaterial")
    creator = relationship("User", foreign_keys=[created_by])
    approver = relationship("User", foreign_keys=[approved_by])
    production_plan = relationship("ProductionPlan")
