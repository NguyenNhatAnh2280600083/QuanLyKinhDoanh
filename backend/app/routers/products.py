from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from ..database import get_db
from ..models.models import Product, Category, User, InventoryLog, InventoryLogType
from ..schemas.schemas import Product as ProductSchema, ProductCreate, Category as CategorySchema, CategoryCreate
from .auth import get_current_user, check_role

router = APIRouter(prefix="/products", tags=["Products"])

# Category Endpoints
@router.get("/categories", response_model=List[CategorySchema])
async def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@router.post("/categories", response_model=CategorySchema)
async def create_category(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "manager"]))
):
    new_cat = Category(**category_in.dict())
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

# Product Endpoints
@router.get("/", response_model=List[ProductSchema])
async def get_products(
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    return query.all()

@router.post("/", response_model=ProductSchema)
async def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "manager"]))
):
    new_product = Product(**product_in.dict())
    db.add(new_product)
    db.flush() # Flush to get new_product.id
    
    # Create inventory log for initial stock
    if new_product.stock_quantity > 0:
        log = InventoryLog(
            product_id=new_product.id,
            type=InventoryLogType.ADJUST,
            quantity=new_product.stock_quantity,
            note="Khởi tạo sản phẩm mới với số lượng tồn ban đầu",
            created_by=current_user.id
        )
        db.add(log)
    
    db.commit()
    db.refresh(new_product)
    return new_product

@router.put("/{product_id}", response_model=ProductSchema)
async def update_product(
    product_id: int,
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "manager"]))
):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    old_stock = db_product.stock_quantity
    new_stock = product_in.stock_quantity
    
    for key, value in product_in.dict().items():
        setattr(db_product, key, value)
    
    # If stock changed, create an inventory log
    if old_stock != new_stock:
        log = InventoryLog(
            product_id=db_product.id,
            type=InventoryLogType.ADJUST,
            quantity=new_stock - old_stock,
            note=f"Cập nhật số lượng tồn kho từ {old_stock} thành {new_stock} qua quản lý sản phẩm",
            created_by=current_user.id
        )
        db.add(log)
    
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "manager"]))
):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted successfully"}

@router.post("/{product_id}/image")
async def upload_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role(["admin", "manager"]))
):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Create static directory if not exists
    os.makedirs("static/products", exist_ok=True)
    file_path = f"static/products/{product_id}_{file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    db_product.image_url = f"/static/products/{product_id}_{file.filename}"
    db.commit()
    return {"image_url": db_product.image_url}

    
