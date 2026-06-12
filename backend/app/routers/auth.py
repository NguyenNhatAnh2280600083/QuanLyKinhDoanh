from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models.models import Role, User
from ..schemas.schemas import Token, User as UserSchema, UserCreate
from ..schemas.role_schema import AuthUserOut, LoginResponse
from ..utils.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from datetime import timedelta
from ..config import settings
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict

# Temporary storage for OTPs
otp_storage: Dict[str, str] = {}

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def _build_auth_user_out(user: User) -> dict:
    permissions = [p.code for p in (user.role.permissions or [])] if user.role else []
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "created_at": user.created_at,
        "is_active": user.is_active,
        "role": user.role,
        "permissions": permissions,
    }

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    user = (
        db.query(User)
        .options(joinedload(User.role).joinedload(Role.permissions))
        .filter(User.username == username)
        .first()
    )
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is locked")
    return user

def check_role(roles: list[str]):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role.name not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have enough permissions"
            )
        return current_user
    return role_checker

@router.post("/login", response_model=LoginResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .options(joinedload(User.role).joinedload(Role.permissions))
        .filter(User.username == form_data.username)
        .first()
    )
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is locked")
    
    auth_user = _build_auth_user_out(user)
    access_token = create_access_token(
        data={
            "sub": user.username,
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role.name,
            "permissions": auth_user["permissions"],
        }
    )
    refresh_token = create_refresh_token(data={"sub": user.username})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": auth_user,
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    payload = decode_token(refresh_token)
    if payload is None or not payload.get("refresh"):
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    username = payload.get("sub")
    user = (
        db.query(User)
        .options(joinedload(User.role).joinedload(Role.permissions))
        .filter(User.username == username)
        .first()
    )
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is locked")
    
    auth_user = _build_auth_user_out(user)
    access_token = create_access_token(
        data={
            "sub": user.username,
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role.name,
            "permissions": auth_user["permissions"],
        }
    )
    new_refresh_token = create_refresh_token(data={"sub": user.username})
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=AuthUserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return _build_auth_user_out(current_user)

@router.get("/roles")
async def get_roles(db: Session = Depends(get_db)):
    return db.query(Role).all()

def send_email_otp(email: str, otp: str):
    msg = MIMEMultipart()
    msg['From'] = settings.MAIL_FROM
    msg['To'] = email
    msg['Subject'] = f"Mã xác thực OTP cho Lixco Sales - {otp}"
    
    body = f"""
    Chào bạn,
    
    Mã xác thực OTP của bạn để đăng ký tài khoản Lixco Sales là: {otp}
    
    Mã này có hiệu lực trong vòng 5 phút. Vui lòng không cung cấp mã này cho bất kỳ ai.
    
    Trân trọng,
    Đội ngũ Lixco Sales.
    """
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        print(f"DEBUG: Attempting to send email to {email} via {settings.MAIL_SERVER}:{settings.MAIL_PORT}")
        server = smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT, timeout=10)
        # server.set_debuglevel(1) # Enable debug output if needed
        server.starttls()
        server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"DEBUG: Email sent successfully to {email}")
        return True
    except Exception as e:
        print(f"DEBUG: SMTP Error: {str(e)}")
        return False

@router.post("/send-otp")
async def send_otp(email: str):
    # Generate a 6-digit OTP
    otp = str(random.randint(100000, 999999))
    otp_storage[email] = otp
    
    # Send actual email
    success = send_email_otp(email, otp)
    if not success:
        raise HTTPException(status_code=500, detail="Không thể gửi email OTP. Vui lòng kiểm tra lại cấu hình SMTP.")
    
    print(f"DEBUG: Sent OTP {otp} to {email}")
    return {"message": "Mã OTP đã được gửi đến email của bạn"}

@router.post("/register", response_model=UserSchema)
async def register(
    user_in: UserCreate, 
    otp: str = Query(...), 
    db: Session = Depends(get_db)
):
    # 1. Verify OTP
    if user_in.email not in otp_storage or otp_storage[user_in.email] != otp:
        raise HTTPException(status_code=400, detail="Mã OTP không chính xác hoặc đã hết hạn")
    
    # 2. Check existing user
    db_user = db.query(User).filter(User.username == user_in.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại")
    
    db_email = db.query(User).filter(User.email == user_in.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")

    # Remove OTP after use
    del otp_storage[user_in.email]
    
    # 3. Create user
    sales_role = db.query(Role).filter(Role.name == "sales").first()
    if not sales_role:
        # Fallback if roles are not seeded
        sales_role = Role(name="sales")
        db.add(sales_role)
        db.commit()
        db.refresh(sales_role)

    new_user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role_id=sales_role.id,
        is_active=1
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
