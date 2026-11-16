import hmac

import jwt

from app.errors import AuthenticationRequiredError, PermissionDeniedError
from app.models import User
from app.repositories.user_repository import UserRepository

ROLE_PERMISSIONS = {
    "super_admin": frozenset({"*"}),
    "area_operator": frozenset({"poi:read", "poi:write"}),
    "content_editor": frozenset({"poi:read", "content:write"}),
    "analytics_viewer": frozenset({"analytics:read"}),
}


class AdminAccessService:
    def __init__(self, user_repository: UserRepository, jwt_secret: str, sync_token: str) -> None:
        self.user_repository = user_repository
        self.jwt_secret = jwt_secret
        self.sync_token = sync_token

    async def authorize(self, token: str, permission: str) -> User:
        if len(self.jwt_secret.encode("utf-8")) < 32:
            raise RuntimeError("JWT_SECRET must contain at least 32 bytes")
        try:
            claims = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=["HS256"],
                options={"require": ["sub", "exp", "iat", "jti"]},
            )
        except jwt.InvalidTokenError:
            raise AuthenticationRequiredError("Authentication required") from None
        user = await self.user_repository.get_by_id(str(claims["sub"]))
        if user is None or not user.is_active or user.role != claims.get("role"):
            raise AuthenticationRequiredError("Authentication required")
        permissions = ROLE_PERMISSIONS.get(user.role, frozenset())
        if "*" not in permissions and permission not in permissions:
            raise PermissionDeniedError("Insufficient permission")
        return user

    async def sync_user(self, user: User, supplied_token: str | None) -> User:
        if not self.sync_token:
            raise RuntimeError("POI_ADMIN_SYNC_TOKEN is not configured")
        if not supplied_token or not hmac.compare_digest(self.sync_token, supplied_token):
            raise PermissionDeniedError("Invalid user synchronization token")
        if user.role not in ROLE_PERMISSIONS:
            raise PermissionDeniedError("Unsupported admin role")
        return await self.user_repository.save(user)
