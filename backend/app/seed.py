from sqlalchemy.orm import Session
from .database import SessionLocal, engine
from sqlalchemy import delete
from .models import (
    Base,
    Permission,
    Role,
    RolePermission,
    User,
    Customer,
    Category,
    Product,
    Order,
    OrderItem,
    OrderStatus,
    InventoryLog,
    InventoryLogType,
    ProductionPlan,
    ProductionStatus,
    CustomerType,
)
from passlib.context import CryptContext
import random
from datetime import datetime, timedelta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def seed_db():
    # Drop and recreate tables only when necessary to apply schema changes
    # print("Dropping all tables...")
    # Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()

    # 1. Seed Roles
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if not admin_role:
        # 1. Seed Roles
        admin_role = Role(name="admin", description="Toàn quyền hệ thống")
        manager_role = Role(name="manager", description="Quản lý kinh doanh")
        sales_role = Role(name="sales", description="Nhân viên kinh doanh")
        warehouse_role = Role(name="warehouse", description="Nhân viên kho")
        db.add_all([admin_role, manager_role, sales_role, warehouse_role])
        db.commit()
        db.refresh(admin_role)
    
    manager_role = db.query(Role).filter(Role.name == "manager").first()
    sales_role = db.query(Role).filter(Role.name == "sales").first()
    warehouse_role = db.query(Role).filter(Role.name == "warehouse").first()

    # 1.1 Seed Permissions
    permissions_seed = [
        ("USER_MANAGEMENT", "Quản lý người dùng", "Tạo/sửa/khóa/mở khóa/gán role cho user"),
        ("ROLE_MANAGEMENT", "Quản lý role", "Tạo/sửa/xóa role"),
        ("PERMISSION_MANAGEMENT", "Quản lý phân quyền", "Gán permission cho role"),
        ("CUSTOMER_MANAGEMENT", "Quản lý khách hàng", "CRUD khách hàng"),
        ("DEBT_MANAGEMENT", "Quản lý công nợ", "Xem/ghi nhận công nợ"),
        ("PRODUCT_MANAGEMENT", "Quản lý sản phẩm", "CRUD sản phẩm"),
        ("ORDER_MANAGEMENT", "Quản lý đơn hàng", "CRUD đơn hàng"),
        ("INVENTORY_VIEW", "Xem tồn kho", "Xem tồn kho thành phẩm"),
        ("WAREHOUSE_MANAGEMENT", "Quản lý kho", "Nhập/xuất/điều chỉnh kho"),
        ("RAW_MATERIAL_MANAGEMENT", "Quản lý NVL", "CRUD nguyên vật liệu + nhập/xuất"),
        ("BOM_MANAGEMENT", "Quản lý BOM", "CRUD BOM + tính nhu cầu NVL"),
        ("PRODUCTION_MANAGEMENT", "Quản lý kế hoạch sản xuất", "CRUD kế hoạch sản xuất"),
        ("REPORT_VIEW", "Xem báo cáo", "Xem báo cáo doanh thu"),
        ("PRODUCT_ANALYTICS_VIEW", "Xem Product Analytics", "Xem báo cáo phân tích sản phẩm"),
    ]

    existing_permissions = {p.code: p for p in db.query(Permission).all()}
    for code, name, description in permissions_seed:
        if code not in existing_permissions:
            db.add(Permission(code=code, name=name, description=description))
    db.commit()

    def set_role_permissions(role: Role, permission_codes: list[str]):
        if not role:
            return
        perms = db.query(Permission).filter(Permission.code.in_(permission_codes)).all()
        db.execute(delete(RolePermission).where(RolePermission.role_id == role.id))
        for p in perms:
            db.add(RolePermission(role_id=role.id, permission_id=p.id))
        db.commit()

    all_permission_codes = [code for code, _, _ in permissions_seed]
    set_role_permissions(admin_role, all_permission_codes)
    set_role_permissions(
        manager_role,
        [
            "CUSTOMER_MANAGEMENT",
            "DEBT_MANAGEMENT",
            "PRODUCT_MANAGEMENT",
            "ORDER_MANAGEMENT",
            "INVENTORY_VIEW",
            "WAREHOUSE_MANAGEMENT",
            "RAW_MATERIAL_MANAGEMENT",
            "BOM_MANAGEMENT",
            "PRODUCTION_MANAGEMENT",
            "REPORT_VIEW",
            "PRODUCT_ANALYTICS_VIEW",
        ],
    )
    set_role_permissions(sales_role, ["CUSTOMER_MANAGEMENT", "ORDER_MANAGEMENT", "INVENTORY_VIEW"])
    set_role_permissions(warehouse_role, ["INVENTORY_VIEW", "WAREHOUSE_MANAGEMENT", "RAW_MATERIAL_MANAGEMENT"])

    # 2. Seed Users
    if not db.query(User).filter(User.username == "admin").first():
        admin_user = User(
            username="admin", 
            email="admin@example.com", 
            hashed_password=get_password_hash("admin123"), 
            full_name="Administrator", 
            role_id=admin_role.id
        )
        db.add(admin_user)
    
    if not db.query(User).filter(User.username == "manager").first():
        manager_user = User(
            username="manager", 
            email="manager@example.com", 
            hashed_password=get_password_hash("manager123"), 
            full_name="Sales Manager", 
            role_id=manager_role.id
        )
        db.add(manager_user)
    
    if not db.query(User).filter(User.username == "sale").first():
        sale_user = User(
            username="sale", 
            email="sale@example.com", 
            hashed_password=get_password_hash("sale123"), 
            full_name="Sales Staff", 
            role_id=sales_role.id
        )
        db.add(sale_user)

    if warehouse_role and not db.query(User).filter(User.username == "warehouse").first():
        warehouse_user = User(
            username="warehouse",
            email="warehouse@example.com",
            hashed_password=get_password_hash("warehouse123"),
            full_name="Warehouse Staff",
            role_id=warehouse_role.id,
        )
        db.add(warehouse_user)
    
    db.commit()
    users = db.query(User).all()

    # 3. Seed Categories
    if not db.query(Category).first():
        categories = [
            Category(name="Bột giặt", description="Các loại bột giặt Lix"),
            Category(name="Nước giặt", description="Các loại nước giặt Lix cao cấp"),
            Category(name="Nước xả vải", description="Các loại nước xả làm mềm vải Lix"),
            Category(name="Chất tẩy rửa khác", description="Nước rửa chén, lau sàn Lix"),
        ]
        db.add_all(categories)
        db.commit()
    else:
        categories = db.query(Category).all()

    # 4. Seed Products
    if not db.query(Product).first():
        products = [
            # Bột giặt
            Product(name="Bột giặt Lix Extra Chanh 6kg", description="Bột giặt hương chanh thơm mát, tẩy sạch vết bẩn", price=150.0, stock_quantity=500, category_id=categories[0].id),
            Product(name="Bột giặt Lix Đậm Đặc 2kg", description="Công thức đậm đặc, tiết kiệm hơn", price=55.0, stock_quantity=300, category_id=categories[0].id),
            Product(name="Bột giặt Lix Sạch Thơm 400g", description="Gói nhỏ tiện lợi, sạch nhanh", price=12.0, stock_quantity=1000, category_id=categories[0].id),
            
            # Nước giặt
            Product(name="Nước giặt Lix Matic Hương Nước Hoa 3.8kg", description="Chuyên dùng cho máy giặt, hương thơm bền lâu", price=125.0, stock_quantity=200, category_id=categories[1].id),
            Product(name="Nước giặt Lix Thơm Ngát 2kg", description="Sạch vết bẩn, bảo vệ sợi vải", price=75.0, stock_quantity=400, category_id=categories[1].id),
            
            # Nước xả
            Product(name="Nước xả vải Lix Soft Hương Hoa Hồng 1.8L", description="Làm mềm vải, hương hoa hồng dịu nhẹ", price=45.0, stock_quantity=350, category_id=categories[2].id),
            
            # Khác
            Product(name="Nước rửa chén Lix Hương Chanh 4kg", description="Tẩy sạch dầu mỡ, hương chanh tự nhiên", price=65.0, stock_quantity=600, category_id=categories[3].id),
            Product(name="Nước lau sàn Lix Hương Lily 1L", description="Sạch bóng mặt sàn, hương hoa Lily", price=25.0, stock_quantity=800, category_id=categories[3].id),
    
            ]
        db.add_all(products)
        db.commit()
    else:
        products = db.query(Product).all()

    # 4.1 Seed Initial Inventory Logs
    if not db.query(InventoryLog).first():
        admin_user = db.query(User).filter(User.username == "admin").first()
        for product in products:
            log = InventoryLog(
                product_id=product.id,
                type=InventoryLogType.ADJUST,
                quantity=product.stock_quantity,
                note="Nhập kho ban đầu khi khởi tạo hệ thống",
                created_by=admin_user.id if admin_user else 1
            )
            db.add(log)
        db.commit()

    # 5. Seed Customers
    if not db.query(Customer).first():
        customers = [
            Customer(name="Công ty Cổ phần Bột giặt Lix", email="sales@lixco.com", phone="02838966803", address="Số 3, đường số 2, Khu phố 4, Phường Linh Trung, TP. Thủ Đức, TP. HCM", region="South", customer_type=CustomerType.MT),
            Customer(name="Công ty TNHH MTV Lix Việt Nam", email="info@lixvietnam.vn", phone="02438542961", address="Lô A2, KCN Yên Phong, Xã Yên Trung, Huyện Yên Phong, Tỉnh Bắc Ninh", region="North", customer_type=CustomerType.GT),
            Customer(name="Công ty TNHH Thương mại Dịch vụ Tổng hợp WinCommerce", email="contact@wincommerce.vn", phone="02471066866", address="Số 72 Lê Thánh Tôn, Phường Bến Nghé, Quận 1, TP. HCM", region="South", customer_type=CustomerType.ECOM),
            Customer(name="Công ty Cổ phần EB Services (Big C/Go!)", email="customer-service@bigc.vn", phone="02839939200", address="163 Phan Đăng Lưu, Phường 1, Quận Phú Nhuận, TP. HCM", region="South", customer_type=CustomerType.EXPORT),
            Customer(name="Hệ thống Siêu thị Co.op Mart (Saigon Co.op)", email="chamsockhachhang@saigoncoop.vn", phone="1900555568", address="199-205 Nguyễn Thái Học, Phường Phạm Ngũ Lão, Quận 1, TP. HCM", region="South", customer_type=CustomerType.MT),
            Customer(name="Chi nhánh Công ty CP Bột giặt Lix tại Bình Dương", email="lixbd@lixco.com", phone="02743742441", address="Lô A6-A12, KCN Đại Đăng, Phường Phú Tân, TP. Thủ Dầu Một, Tỉnh Bình Dương", region="South", customer_type=CustomerType.GT),
        ]
        db.add_all(customers)
        db.commit()
    else:
        customers = db.query(Customer).all()

    # 6. Seed Orders & Order Items
    if not db.query(Order).first():
        # Add more random products if not enough
        all_products = db.query(Product).all()
        all_customers = db.query(Customer).all()
        sales_users = db.query(User).join(Role).filter(Role.name == "sales").all()

        for i in range(10): # Create 10 fake orders
            customer = random.choice(all_customers)
            user = random.choice(sales_users)
            
            # Random status with more "completed" for revenue stats
            status_list = [OrderStatus.COMPLETED] * 5 + [OrderStatus.APPROVED] * 2 + [OrderStatus.PENDING] * 2 + [OrderStatus.CANCELLED] * 1
            status = random.choice(status_list)
            
            # Random date within last 6 months
            created_date = datetime.now() - timedelta(days=random.randint(0, 180))
            
            order = Order(
                customer_id=customer.id,
                user_id=user.id,
                status=status,
                created_at=created_date
            )
            db.add(order)
            db.commit()
            
            # Items for order
            total_amount = 0
            for _ in range(random.randint(1, 4)):
                product = random.choice(all_products)
                quantity = random.randint(1, 3)
                item = OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=quantity,
                    unit_price=product.price
                )
                total_amount += product.price * quantity
                db.add(item)
            
            order.total_amount = total_amount
            db.commit()

        # 7. Seed Production Plans for Approved Orders
        approved_orders = db.query(Order).filter(Order.status == OrderStatus.APPROVED).all()
        admin_user = db.query(User).filter(User.username == "admin").first()
        
        for order in approved_orders:
            for item in order.items:
                plan = ProductionPlan(
                    order_id=order.id,
                    product_id=item.product_id,
                    required_quantity=item.quantity,
                    planned_quantity=item.quantity,
                    completed_quantity=random.randint(0, item.quantity),
                    status=random.choice(list(ProductionStatus)),
                    expected_completion_date=datetime.now() + timedelta(days=random.randint(1, 7)),
                    created_by=admin_user.id if admin_user else 1
                )
                if plan.status == ProductionStatus.PRODUCTION_DONE:
                    plan.completed_quantity = plan.planned_quantity
                    plan.actual_completion_date = datetime.now()
                db.add(plan)
        db.commit()

    print("Database seeded successfully!")
    db.close()

if __name__ == "__main__":
    seed_db()
