from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models.models import Role, User
from ..routers.auth import get_current_user


class RoleGuard:
    def __init__(self, roles: list[str]):
        self.roles = [r.lower() for r in roles]

    async def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role and current_user.role.name and current_user.role.name.lower() in self.roles:
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have enough permissions",
        )


class PermissionGuard:
    def __init__(self, permission_codes: list[str]):
        self.permission_codes = set(permission_codes)

    async def __call__(
        self,
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
        if self.permission_codes.issubset(user_permission_codes):
            return user

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")


def require_role(*roles: str):
    return Depends(RoleGuard(list(roles)))


def require_permission(*permission_codes: str):
    return Depends(PermissionGuard(list(permission_codes)))
