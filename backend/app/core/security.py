from fastapi import Header, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Set
import logging
import hmac
from backend.app.core.config import settings

logger = logging.getLogger("gyanvatsala.security")

def get_authorized_admin_emails() -> Set[str]:
    raw = getattr(settings, "ADMIN_EMAILS", "")
    return {e.strip().lower() for e in raw.split(",") if e.strip()}

def get_authorized_support_emails() -> Set[str]:
    raw = getattr(settings, "SUPPORT_EMAILS", "support@gyanvatsala.in,help@gyanvatsala.in")
    return {e.strip().lower() for e in raw.split(",") if e.strip()}

def verify_internal_service_secret(secret_header: Optional[str]) -> bool:
    """
    Verifies in constant time that the request originates from our trusted Next.js server proxy.
    Prevents timing side-channel attacks.
    """
    if not secret_header:
        return False
    expected_srv = getattr(settings, "INTERNAL_SERVICE_KEY", None)
    expected_auth = getattr(settings, "BETTER_AUTH_SECRET", None)

    valid_srv = bool(expected_srv and hmac.compare_digest(secret_header, expected_srv))
    valid_auth = bool(expected_auth and hmac.compare_digest(secret_header, expected_auth))
    return valid_srv or valid_auth

class AuthenticatedUser(BaseModel):
    user_id: str
    name: str
    email: str
    plan: str = "Free"
    role: str = "user"  # 'admin' | 'support' | 'user'
    is_admin: bool = False
    is_support: bool = False

async def get_current_user(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email"),
    x_user_plan: Optional[str] = Header(None, alias="X-User-Plan"),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    x_internal_secret: Optional[str] = Header(None, alias="X-Internal-Secret"),
) -> AuthenticatedUser:
    """
    Validates authenticated user context passed from Next.js server session.
    NEVER trusts unauthenticated external callers or client-supplied headers.
    Requires a verified internal service secret for inter-service communication.
    Direct unauthorized external callers are strictly rejected with 401 Unauthorized.
    """
    is_trusted_service_call = verify_internal_service_secret(x_internal_secret)

    if not is_trusted_service_call:
        logger.warning(
            f"[SECURITY] Direct unauthorized backend call rejected without valid internal secret. "
            f"Claimed user_id: {x_user_id}, Claimed email: {x_user_email}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Direct backend access forbidden. Requests must originate from the authenticated Next.js gateway."
        )

    if not x_user_id or not x_user_id.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: User identity header missing from trusted proxy."
        )

    email = (x_user_email or "user@gyanvatsala.in").strip().lower()
    support_emails = get_authorized_support_emails()

    role = "user"
    if x_user_role == "admin":
        role = "admin"
    elif x_user_role == "support" or email in support_emails:
        role = "support"

    is_admin = (role == "admin")
    is_support = (role == "support")

    return AuthenticatedUser(
        user_id=x_user_id.strip(),
        name=email.split("@")[0].capitalize(),
        email=email,
        plan=x_user_plan or "Free",
        role=role,
        is_admin=is_admin,
        is_support=is_support,
    )

async def get_current_admin_user(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    """
    Enforces strict role-based access control for administrative endpoints.
    Requires role == 'admin'.
    Rejects normal users and support staff with 403 Forbidden.
    """
    if not current_user.is_admin:
        logger.warning(f"Unauthorized admin attempt by {current_user.email} (role: {current_user.role})")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Full administrative privileges required to access this resource."
        )
    return current_user

async def get_current_support_or_admin_user(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    """
    Enforces access control for support and administrative endpoints.
    Allows both 'admin' and 'support' roles.
    Rejects normal users with 403 Forbidden.
    """
    if not (current_user.is_admin or current_user.is_support):
        logger.warning(f"Unauthorized support attempt by {current_user.email} (role: {current_user.role})")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Administrative or support privileges required."
        )
    return current_user
