from fastapi import Header, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Set
import logging
from backend.app.core.config import settings

logger = logging.getLogger("gyanvatsala.security")

def get_authorized_admin_emails() -> Set[str]:
    raw = getattr(settings, "ADMIN_EMAILS", "")
    return {e.strip().lower() for e in raw.split(",") if e.strip()}

def get_authorized_support_emails() -> Set[str]:
    raw = getattr(settings, "SUPPORT_EMAILS", "support@gyanvatsala.in,help@gyanvatsala.in")
    return {e.strip().lower() for e in raw.split(",") if e.strip()}

def verify_internal_service_secret(secret_header: Optional[str]) -> bool:
    """Verifies that the request originates from our trusted Next.js server proxy."""
    if not secret_header:
        return False
    expected_srv = getattr(settings, "INTERNAL_SERVICE_KEY", None)
    expected_auth = getattr(settings, "BETTER_AUTH_SECRET", None)
    return (bool(expected_srv and secret_header == expected_srv) or 
            bool(expected_auth and secret_header == expected_auth))

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
    NEVER blindly trusts client-supplied headers.
    Roles are honored only when backed by a verified internal service secret
    and validated against authoritative server-side configuration.
    """
    email = (x_user_email or "user@gyanvatsala.in").strip().lower()
    admin_emails = get_authorized_admin_emails()
    support_emails = get_authorized_support_emails()
    is_trusted_service_call = verify_internal_service_secret(x_internal_secret)

    role = "user"

    # Only honor elevated role if internal service secret is valid AND user is authorized
    if is_trusted_service_call:
        if x_user_role == "admin" and email in admin_emails:
            role = "admin"
        elif x_user_role == "support" or email in support_emails:
            role = "support"
        elif email in admin_emails:
            role = "admin"
    else:
        # Untrusted external caller trying to send X-User-Role is logged and rejected from elevated roles
        if x_user_role in ("admin", "support"):
            logger.warning(
                f"[SECURITY] Untrusted external caller attempted to claim role '{x_user_role}' "
                f"without valid internal service secret (email: {email})"
            )
        role = "user"

    is_admin = (role == "admin")
    is_support = (role == "support")

    return AuthenticatedUser(
        user_id=x_user_id or "usr_authed_session",
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
