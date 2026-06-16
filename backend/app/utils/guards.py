from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models.models import Role, User
from ..routers.auth import get_current_user


def require_role(*roles: str):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        role_names = [r.lower() for r in roles]
        if current_user.role and current_user.role.name and current_user.role.name.lower() in role_names:
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have enough permissions",
        )
    return role_checker


def require_permission(*permission_codes: str):
    async def permission_checker(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role and current_user.role.name == "admin":
            return current_user

        user = (
            db.query(User)
            .options(joinedload(User.role).joinedload(Role.permissions))
            .filter(User.id == current_user.id)
            .first()
        )
        if not user or not user.role:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")

        user_permission_codes = {p.code for p in (user.role.permissions or [])}
        required_permissions = set(permission_codes)
        if required_permissions.issubset(user_permission_codes):
            return user

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")
    return permission_checker
