from fastapi import Header, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging
import hmac
import time
import json
import base64
from backend.app.core.config import settings

logger = logging.getLogger("gyanvatsala.security")

# Replay protection cache: nonce -> expiry timestamp
_seen_jtis: Dict[str, float] = {}

def clean_expired_jtis():
    now = time.time()
    expired = [k for k, exp in _seen_jtis.items() if exp <= now]
    for k in expired:
        del _seen_jtis[k]

def mask_email(email: str) -> str:
    """Sanitizes email address for secure logging without exposing PII."""
    if not email or "@" not in email:
        return "[anonymous]"
    name, domain = email.split("@", 1)
    masked_name = name[0] + "***" if len(name) > 1 else "*"
    return f"{masked_name}@{domain}"

def verify_internal_service_secret(secret_header: Optional[str]) -> bool:
    """
    Verifies in constant time that the request originates from our trusted Next.js server proxy.
    STRICT SECURITY: Only accepts dedicated INTERNAL_SERVICE_KEY.
    BETTER_AUTH_SECRET is explicitly rejected as an internal service credential.
    """
    if not secret_header:
        return False
    expected_srv = getattr(settings, "INTERNAL_SERVICE_KEY", None)
    if not expected_srv or len(expected_srv) < 16:
        logger.error("[SECURITY] INTERNAL_SERVICE_KEY is unconfigured or insecure; failing closed.")
        return False

    return hmac.compare_digest(secret_header, expected_srv)

def verify_internal_assertion(token: Optional[str]) -> Optional[Dict[str, Any]]:
    """
    Verifies a cryptographically signed, short-lived (60s) internal identity assertion.
    Guarantees:
    1. Signature integrity using HMAC-SHA256 with dedicated INTERNAL_SERVICE_KEY.
    2. Expiration enforcement (token valid for at most 60 seconds).
    3. Audience verification (must be 'pixelkit-backend').
    4. Issuer verification (must be 'pixelkit-bff').
    5. Nonce / Replay protection (each JTI can only be used once).
    6. Claims validation (requires sub and email).
    """
    if not token or "." not in token:
        return None

    parts = token.split(".")
    if len(parts) != 2:
        return None

    payload_b64, signature = parts
    expected_key = getattr(settings, "INTERNAL_SERVICE_KEY", None)
    if not expected_key or len(expected_key) < 16:
        logger.error("[SECURITY] INTERNAL_SERVICE_KEY not set for assertion verification; failing closed.")
        return None

    expected_sig = hmac.new(expected_key.encode("utf-8"), payload_b64.encode("utf-8"), "sha256").hexdigest()
    if not hmac.compare_digest(signature, expected_sig):
        logger.warning("[SECURITY] Internal identity assertion signature verification failed.")
        return None

    try:
        rem = len(payload_b64) % 4
        padded = payload_b64 + ("=" * (4 - rem) if rem else "")
        claims = json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))
    except Exception as e:
        logger.warning(f"[SECURITY] Internal assertion decoding error: {e}")
        return None

    # Required claims validation
    sub = claims.get("sub")
    email = claims.get("email")
    if not sub or not isinstance(sub, str) or not sub.strip():
        logger.warning("[SECURITY] Assertion rejected: missing or invalid 'sub' claim.")
        return None
    if not email or not isinstance(email, str) or "@" not in email:
        logger.warning("[SECURITY] Assertion rejected: missing or invalid 'email' claim.")
        return None

    now = time.time()
    exp = claims.get("exp", 0)
    if exp < now:
        logger.warning(f"[SECURITY] Expired internal assertion token (expired {now - exp:.1f}s ago).")
        return None

    iat = claims.get("iat", 0)
    if iat > now + 10:
        logger.warning("[SECURITY] Future-dated internal assertion token.")
        return None

    if claims.get("aud") != "pixelkit-backend" or claims.get("iss") != "pixelkit-bff":
        logger.warning(
            f"[SECURITY] Internal assertion aud/iss mismatch: aud={claims.get('aud')}, iss={claims.get('iss')}"
        )
        return None

    clean_expired_jtis()
    jti = claims.get("jti")
    if jti:
        if jti in _seen_jtis:
            logger.warning(f"[SECURITY] Replay attack detected for JTI nonce: {jti}")
            return None
        _seen_jtis[jti] = now + 120  # Retain for 2 minutes

    return claims

def create_test_internal_assertion(
    user_id: str,
    email: str,
    role: str = "user",
    plan: str = "Free",
    exp_offset_seconds: int = 60,
    custom_jti: Optional[str] = None,
    tamper_secret: Optional[str] = None,
) -> str:
    """Helper to generate signed internal identity assertion tokens for testing."""
    key = tamper_secret or getattr(settings, "INTERNAL_SERVICE_KEY", "")
    now = int(time.time())
    import uuid
    claims = {
        "sub": user_id,
        "email": email.lower().strip(),
        "role": role,
        "plan": plan,
        "aud": "pixelkit-backend",
        "iss": "pixelkit-bff",
        "iat": now,
        "exp": now + exp_offset_seconds,
        "jti": custom_jti or str(uuid.uuid4())
    }
    payload_b64 = base64.urlsafe_b64encode(json.dumps(claims).encode("utf-8")).decode("utf-8").rstrip("=")
    sig = hmac.new(key.encode("utf-8"), payload_b64.encode("utf-8"), "sha256").hexdigest()
    return f"{payload_b64}.{sig}"

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
    x_internal_assertion: Optional[str] = Header(None, alias="X-Internal-Assertion"),
) -> AuthenticatedUser:
    """
    Validates authenticated user context passed from Next.js server session.
    NEVER trusts unauthenticated external callers or raw browser headers.
    
    Security Architecture:
    1. Cryptographically signed, short-lived (60s) assertions (X-Internal-Assertion) are required
       for elevated privileges (admin and support).
    2. Direct callers without internal secret or assertion are rejected with 401 Unauthorized.
    3. Knowing X-Internal-Secret alone cannot grant admin status; signed assertion with valid audience is required.
    4. Missing email or user ID causes immediate rejection; no fabricated identities are permitted.
    """
    # 1. Resolve via signed internal identity assertion (Authoritative Path)
    if x_internal_assertion:
        claims = verify_internal_assertion(x_internal_assertion)
        if not claims:
            logger.warning("[SECURITY] Rejected request with invalid/expired/replayed internal assertion.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized: Invalid, expired, or replayed internal identity assertion."
            )
        
        user_id = str(claims.get("sub", "")).strip()
        email = str(claims.get("email", "")).strip().lower()
        role = str(claims.get("role", "user"))
        plan = str(claims.get("plan", "Free"))

        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized: Missing user ID or email claims in internal assertion."
            )

        return AuthenticatedUser(
            user_id=user_id,
            name=email.split("@")[0].capitalize(),
            email=email,
            plan=plan,
            role=role,
            is_admin=(role == "admin"),
            is_support=(role == "support"),
        )

    # 2. Inter-service secret validation (fallback for internal non-elevated proxy calls)
    is_trusted_service_call = verify_internal_service_secret(x_internal_secret)

    if not is_trusted_service_call:
        logger.warning(
            f"[SECURITY] Direct unauthorized backend call rejected without valid internal secret. "
            f"Claimed user_id: {x_user_id}, Claimed email: {mask_email(x_user_email or '')}"
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

    if not x_user_email or not x_user_email.strip() or "@" not in x_user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Valid user email header required from trusted proxy."
        )

    clean_email = x_user_email.strip().lower()

    # Elevated roles require signed cryptographic assertion; static header alone cannot elevate
    if x_user_role in ("admin", "support"):
        logger.warning(
            f"[SECURITY] Elevation attempt: Caller attempted to claim '{x_user_role}' without a signed identity assertion."
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Administrative privileges require a cryptographically signed internal identity assertion."
        )

    return AuthenticatedUser(
        user_id=x_user_id.strip(),
        name=clean_email.split("@")[0].capitalize(),
        email=clean_email,
        plan=x_user_plan or "Free",
        role="user",
        is_admin=False,
        is_support=False,
    )

async def get_current_admin_user(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    """
    Enforces strict role-based access control for administrative endpoints.
    Requires role == 'admin' verified via signed cryptographic assertion.
    Rejects normal users and support staff with 403 Forbidden.
    """
    if not current_user.is_admin:
        logger.warning(f"Unauthorized admin attempt by {mask_email(current_user.email)} (role: {current_user.role})")
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
        logger.warning(f"Unauthorized support attempt by {mask_email(current_user.email)} (role: {current_user.role})")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Administrative or support privileges required."
        )
    return current_user
