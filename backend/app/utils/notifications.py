from sqlalchemy.orm import Session
from ..models.models import Notification, NotificationType, Product, User, Role

def check_low_stock_and_notify(db: Session, product_id: int):
    """
    Checks if a product's stock is below threshold and creates notifications for admins.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return

    if product.stock_quantity <= product.low_stock_threshold:
        # Get all admin users
        admin_users = (
            db.query(User)
            .join(Role)
            .filter(Role.name == "admin", User.is_active == 1)
            .all()
        )

        for admin in admin_users:
            # Check if an unread low-stock notification already exists for this product and admin
            existing_notification = (
                db.query(Notification)
                .filter(
                    Notification.user_id == admin.id,
                    Notification.product_id == product.id,
                    Notification.type == NotificationType.LOW_STOCK,
                    Notification.is_read == 0
                )
                .first()
            )

            if not existing_notification:
                db.add(Notification(
                    user_id=admin.id,
                    product_id=product.id,
                    type=NotificationType.LOW_STOCK,
                    title="Cảnh báo tồn kho thấp",
                    message=f"Sản phẩm '{product.name}' đang có tồn kho thấp ({product.stock_quantity} < ngưỡng {product.low_stock_threshold}). Vui lòng kiểm tra và bổ sung.",
                ))

def notify_material_shortage_for_production(db: Session, plan, missing_materials):
    if not missing_materials:
        return

    product_name = plan.product.name if plan.product else f"#{plan.product_id}"
    shortage_summary = "; ".join(
        f"{item['material_name']}: thiếu {item['missing_quantity']:g}"
        for item in missing_materials
    )
    title = "Cảnh báo thiếu nguyên vật liệu sản xuất"
    message = (
        f"Kế hoạch {plan.plan_code} - {product_name} không đủ nguyên vật liệu để tiếp tục sản xuất. "
        f"Chi tiết: {shortage_summary}. Vui lòng bổ sung NVL trước khi vận hành."
    )

    recipients = (
        db.query(User)
        .join(Role)
        .filter(Role.name.in_(["admin", "manager"]), User.is_active == 1)
        .all()
    )

    for user in recipients:
        existing_notification = (
            db.query(Notification)
            .filter(
                Notification.user_id == user.id,
                Notification.product_id == plan.product_id,
                Notification.type == NotificationType.LOW_STOCK,
                Notification.title == title,
                Notification.is_read == 0
            )
            .first()
        )

        if not existing_notification:
            db.add(Notification(
                user_id=user.id,
                product_id=plan.product_id,
                type=NotificationType.LOW_STOCK,
                title=title,
                message=message,
            ))
