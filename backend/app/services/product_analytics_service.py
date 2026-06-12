from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta
from ..models.models import Product, Order, OrderItem, OrderStatus, Category
from typing import List, Optional

class ProductAnalyticsService:
    @staticmethod
    def get_top_selling(db: Session, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[dict]:
        query = db.query(
            Product.id.label("product_id"),
            Product.name.label("product_name"),
            func.sum(OrderItem.quantity).label("sold_quantity"),
            func.sum(OrderItem.quantity * OrderItem.unit_price).label("revenue")
        ).join(OrderItem, Product.id == OrderItem.product_id)\
         .join(Order, OrderItem.order_id == Order.id)\
         .filter(Order.status == OrderStatus.COMPLETED)

        if start_date:
            query = query.filter(Order.created_at >= start_date)
        if end_date:
            query = query.filter(Order.created_at <= end_date)

        return query.group_by(Product.id).order_by(desc("sold_quantity")).all()

    @staticmethod
    def get_top_revenue(db: Session, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[dict]:
        query = db.query(
            Product.id.label("product_id"),
            Product.name.label("product_name"),
            func.sum(OrderItem.quantity * OrderItem.unit_price).label("revenue")
        ).join(OrderItem, Product.id == OrderItem.product_id)\
         .join(Order, OrderItem.order_id == Order.id)\
         .filter(Order.status == OrderStatus.COMPLETED)

        if start_date:
            query = query.filter(Order.created_at >= start_date)
        if end_date:
            query = query.filter(Order.created_at <= end_date)

        return query.group_by(Product.id).order_by(desc("revenue")).all()

    @staticmethod
    def get_low_stock(db: Session) -> List[dict]:
        return db.query(
            Product.id.label("product_id"),
            Product.name.label("product_name"),
            Product.stock_quantity,
            Product.low_stock_threshold
        ).filter(Product.stock_quantity <= Product.low_stock_threshold).all()

    @staticmethod
    def get_high_stock(db: Session) -> List[dict]:
        return db.query(
            Product.id.label("product_id"),
            Product.name.label("product_name"),
            Product.stock_quantity
        ).filter(Product.stock_quantity > Product.low_stock_threshold * 5).all()

    @staticmethod
    def get_slow_moving(db: Session) -> List[dict]:
        ninety_days_ago = datetime.now() - timedelta(days=90)
        
        # Subquery for sales in last 90 days
        sales_subquery = db.query(
            OrderItem.product_id,
            func.sum(OrderItem.quantity).label("total_sold")
        ).join(Order, OrderItem.order_id == Order.id)\
         .filter(Order.status == OrderStatus.COMPLETED, Order.created_at >= ninety_days_ago)\
         .group_by(OrderItem.product_id).subquery()

        return db.query(
            Product.id.label("product_id"),
            Product.name.label("product_name"),
            func.coalesce(sales_subquery.c.total_sold, 0).label("sold_quantity"),
            Product.stock_quantity
        ).outerjoin(sales_subquery, Product.id == sales_subquery.c.product_id)\
         .filter(
             Product.stock_quantity > Product.low_stock_threshold * 2, # High stock
             func.coalesce(sales_subquery.c.total_sold, 0) < 10 # Low sales
         ).order_by(desc(Product.stock_quantity)).all()

    @staticmethod
    def get_dashboard_stats(db: Session) -> dict:
        total_products = db.query(func.count(Product.id)).scalar()
        total_stock = db.query(func.sum(Product.stock_quantity)).scalar() or 0
        low_stock_count = db.query(func.count(Product.id)).filter(Product.stock_quantity <= Product.low_stock_threshold).scalar()
        
        best_selling = db.query(Product.name)\
            .join(OrderItem, Product.id == OrderItem.product_id)\
            .join(Order, OrderItem.order_id == Order.id)\
            .filter(Order.status == OrderStatus.COMPLETED)\
            .group_by(Product.id)\
            .order_by(desc(func.sum(OrderItem.quantity)))\
            .first()

        return {
            "total_products": total_products,
            "total_stock": total_stock,
            "low_stock_products": low_stock_count,
            "best_selling_product": best_selling[0] if best_selling else None
        }

    @staticmethod
    def get_product_detail(db: Session, product_id: int) -> dict:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return None

        # Basic stats
        stats = db.query(
            func.sum(OrderItem.quantity).label("total_sold"),
            func.sum(OrderItem.quantity * OrderItem.unit_price).label("total_revenue")
        ).filter(OrderItem.product_id == product_id)\
         .join(Order, OrderItem.order_id == Order.id)\
         .filter(Order.status == OrderStatus.COMPLETED).first()

        # Monthly sales
        monthly_sales = db.query(
            func.date_format(Order.created_at, '%Y-%m').label("month"),
            func.sum(OrderItem.quantity * OrderItem.unit_price).label("revenue"),
            func.sum(OrderItem.quantity).label("quantity")
        ).join(Order, OrderItem.order_id == Order.id)\
         .filter(OrderItem.product_id == product_id, Order.status == OrderStatus.COMPLETED)\
         .group_by("month")\
         .order_by("month").all()

        # Top customers
        from ..models.models import Customer
        top_customers = db.query(
            Customer.id.label("customer_id"),
            Customer.name.label("customer_name"),
            func.sum(OrderItem.quantity * OrderItem.unit_price).label("revenue"),
            func.sum(OrderItem.quantity).label("quantity")
        ).join(Order, Customer.id == Order.customer_id)\
         .join(OrderItem, Order.id == OrderItem.order_id)\
         .filter(OrderItem.product_id == product_id, Order.status == OrderStatus.COMPLETED)\
         .group_by(Customer.id)\
         .order_by(desc("revenue")).limit(5).all()

        total_sold = stats.total_sold or 0
        # Average monthly sales (approximate based on creation date or 12 months)
        months_diff = (datetime.now() - product.created_at).days / 30
        avg_monthly = total_sold / max(months_diff, 1)

        return {
            "product_info": {
                "id": product.id,
                "name": product.name,
                "sku": getattr(product, 'sku', f"SKU-{product.id}"), # Use SKU if exists
                "stock_quantity": product.stock_quantity,
                "price": product.price
            },
            "total_revenue": stats.total_revenue or 0,
            "sold_quantity": total_sold,
            "average_monthly_sales": avg_monthly,
            "monthly_sales": [dict(m._mapping) for m in monthly_sales],
            "top_customers": [dict(c._mapping) for c in top_customers]
        }
