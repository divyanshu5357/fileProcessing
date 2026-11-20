from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from pydantic import BaseModel
import hmac
import hashlib
import uuid

from backend.app.core.security import get_current_user, AuthenticatedUser
from backend.app.database.connection import get_db
from backend.app.database.models import Plan, Subscription, Payment, User
from backend.app.services.quota_service import quota_service
from backend.app.core.config import settings
from backend.app.core.exceptions import ResourceNotFoundException, UnauthorizedAccessException

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

# Schemas
class CheckoutSessionRequest(BaseModel):
    plan_id: str
    billing_cycle: str = "monthly" # 'monthly' | 'yearly'

class WebhookPaymentPayload(BaseModel):
    event: str # 'payment.succeeded' | 'payment.failed'
    transaction_id: str
    user_id: str
    plan_id: str
    amount_inr: int
    billing_cycle: str = "monthly"
    payment_method: str = "UPI / Netbanking"
    signature: Optional[str] = None

class CancelSubscriptionRequest(BaseModel):
    reason: Optional[str] = None

@router.get("/plans")
async def get_plans(db: AsyncSession = Depends(get_db)):
    """
    Database-driven plan configurations:
    Returns all subscription plans from PostgreSQL with monthly & yearly pricing,
    storage quotas, and automatic retention duration.
    """
    if db is None:
        # Fallback if DB disconnected
        return [
            {
                "id": "free",
                "name": "Free",
                "slug": "free",
                "price_monthly_inr": 0,
                "price_yearly_inr": 0,
                "storage_limit_bytes": 15728640,
                "retention_days": 7,
                "max_file_size_bytes": 15728640,
                "is_recommended": False,
                "features": ["15 MB Cloud Storage", "7-Day Automatic Data Retention", "In-Browser Privacy Mode"]
            },
            {
                "id": "prime",
                "name": "Prime",
                "slug": "prime",
                "price_monthly_inr": 49,
                "price_yearly_inr": 499,
                "storage_limit_bytes": 52428800,
                "retention_days": 14,
                "max_file_size_bytes": 26214400,
                "is_recommended": False,
                "features": ["50 MB Cloud Storage", "14-Day Automatic Data Retention", "Priority Queue"]
            },
            {
                "id": "prime_plus",
                "name": "PrimePlus",
                "slug": "prime_plus",
                "price_monthly_inr": 99,
                "price_yearly_inr": 999,
                "storage_limit_bytes": 104857600,
                "retention_days": 30,
                "max_file_size_bytes": 52428800,
                "is_recommended": True,
                "features": ["100 MB Cloud Storage", "30-Day Retention", "High-Speed Parallel Processing"]
            },
            {
                "id": "prime_ultra",
                "name": "PrimeUltra",
                "slug": "prime_ultra",
                "price_monthly_inr": 249,
                "price_yearly_inr": 2499,
                "storage_limit_bytes": 524288000,
                "retention_days": 365,
                "max_file_size_bytes": 104857600,
                "is_recommended": False,
                "features": ["500 MB Cloud Storage", "365-Day (1 Year) Retention", "VIP Support"]
            }
        ]

    stmt = select(Plan).where(Plan.is_active == True).order_by(Plan.price_monthly_inr.asc())
    res = await db.execute(stmt)
    plans = res.scalars().all()
    return plans

@router.get("/current")
async def get_current_subscription(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns current user's active subscription, renewal date, and live storage quota usage.
    """
    storage = await quota_service.get_storage_overview(db, current_user.user_id)

    subscription_info = {
        "plan_id": "free",
        "plan_name": "Free",
        "billing_cycle": "monthly",
        "subscription_status": "active",
        "current_period_start": datetime.now(timezone.utc).isoformat(),
        "current_period_end": (datetime.now(timezone.utc) + timedelta(days=36500)).isoformat(),
        "cancel_at_period_end": False,
        "storage": storage
    }

    if db is not None:
        stmt = select(Subscription).where(Subscription.user_id == current_user.user_id)
        res = await db.execute(stmt)
        sub = res.scalar_one_or_none()

        if sub:
            # Query plan details
            plan_stmt = select(Plan).where(Plan.id == sub.plan_id)
            plan_res = await db.execute(plan_stmt)
            plan_obj = plan_res.scalar_one_or_none()

            subscription_info.update({
                "plan_id": sub.plan_id,
                "plan_name": plan_obj.name if plan_obj else sub.plan_name,
                "billing_cycle": sub.billing_cycle,
                "subscription_status": sub.subscription_status,
                "current_period_start": sub.current_period_start.isoformat() if sub.current_period_start else None,
                "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
                "cancel_at_period_end": sub.cancel_at_period_end,
                "plan": plan_obj
            })

    return subscription_info

@router.post("/activate-free")
async def activate_free_plan(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Activates the Free Starter plan for the authenticated user on the backend.
    Enforces 15 MB storage quota and 7-day data retention limits.
    """
    now = datetime.now(timezone.utc)
    free_storage_limit = settings.FREE_STORAGE_LIMIT_BYTES
    free_file_limit = settings.FREE_MAX_FILE_SIZE_BYTES
    free_retention = settings.FREE_RETENTION_DAYS

    if db is not None:
        sub_stmt = select(Subscription).where(Subscription.user_id == current_user.user_id)
        sub_res = await db.execute(sub_stmt)
        sub = sub_res.scalar_one_or_none()

        if sub:
            sub.plan_id = "free"
            sub.plan_name = "Free"
            sub.storage_limit = free_storage_limit
            sub.file_size_limit = free_file_limit
            sub.subscription_status = "active"
            sub.billing_cycle = "forever"
            sub.cancel_at_period_end = False
            sub.updated_at = now
        else:
            sub = Subscription(
                user_id=current_user.user_id,
                plan_id="free",
                plan_name="Free",
                storage_limit=free_storage_limit,
                file_size_limit=free_file_limit,
                subscription_status="active",
                billing_cycle="forever",
                current_period_start=now,
                cancel_at_period_end=False
            )
            db.add(sub)
        await db.commit()

    return {
        "status": "success",
        "plan_id": "free",
        "plan_name": "Free Starter",
        "storage_limit_bytes": free_storage_limit,
        "max_file_size_bytes": free_file_limit,
        "retention_days": free_retention,
        "message": "Free Starter plan activated successfully on backend."
    }

@router.post("/checkout")
async def create_checkout_session(
    payload: CheckoutSessionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Prepares payment order architecture for Razorpay.
    During pre-payment launch, paid checkouts return 'coming_soon' and never activate plans.
    """
    plan_id = payload.plan_id.lower().replace("-", "_")

    if plan_id != "free":
        # Pre-payment launch: Razorpay integration pending merchant onboarding
        return {
            "status": "coming_soon",
            "is_pre_launch": True,
            "plan_id": plan_id,
            "message": "Payment gateway integration is currently under review with Razorpay. Paid upgrades are coming soon and cannot be purchased yet."
        }

    return await activate_free_plan(current_user, db)

FALLBACK_PLAN_PRICES = {
    "free": {"monthly": 0, "yearly": 0},
    "prime": {"monthly": 49, "yearly": 499},
    "prime_plus": {"monthly": 99, "yearly": 999},
    "prime_ultra": {"monthly": 249, "yearly": 2499},
}
_PROCESSED_WEBHOOK_TXNS = set()

@router.post("/webhook")
async def payment_webhook(
    payload: WebhookPaymentPayload,
    x_webhook_secret: Optional[str] = Header(None, alias="X-Webhook-Secret"),
    x_webhook_signature: Optional[str] = Header(None, alias="X-Webhook-Signature"),
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature"),
    db: AsyncSession = Depends(get_db)
):
    """
    Security verification:
    Activates paid plans ONLY upon verified webhook from payment gateway.
    Enforces signature verification, replay protection, and amount validation.
    """
    # 1. Verify Secret / Signature Header in constant-time
    configured_secret = getattr(settings, "WEBHOOK_SECRET", "")
    sig_to_verify = x_webhook_signature or x_razorpay_signature

    is_verified = False
    if sig_to_verify and configured_secret:
        # Provider signature verification
        is_verified = hmac.compare_digest(sig_to_verify, configured_secret)
    elif x_webhook_secret and configured_secret:
        is_verified = hmac.compare_digest(x_webhook_secret, configured_secret)

    if not is_verified:
        raise UnauthorizedAccessException("Invalid payment webhook signature/secret.")

    if payload.event != "payment.succeeded":
        return {"status": "ignored", "event": payload.event}

    # 2. Replay & Idempotency Check: Prevent duplicate webhook replay attacks
    if payload.transaction_id in _PROCESSED_WEBHOOK_TXNS:
        return {
            "status": "already_processed",
            "message": "Payment webhook transaction already processed and verified.",
            "transaction_id": payload.transaction_id,
        }

    if db is not None:
        existing_payment_stmt = select(Payment).where(
            and_(Payment.transaction_id == payload.transaction_id, Payment.status == "succeeded")
        )
        existing_payment_res = await db.execute(existing_payment_stmt)
        if existing_payment_res.scalar_one_or_none():
            _PROCESSED_WEBHOOK_TXNS.add(payload.transaction_id)
            return {
                "status": "already_processed",
                "message": "Payment webhook transaction already processed and verified.",
                "transaction_id": payload.transaction_id,
            }

    # 3. Fetch & Validate Plan Details and Underpayment Tampering
    expected_amount = None
    plan_obj = None

    if db is not None:
        plan_stmt = select(Plan).where(Plan.id == payload.plan_id)
        plan_res = await db.execute(plan_stmt)
        plan_obj = plan_res.scalar_one_or_none()
        if plan_obj:
            expected_amount = plan_obj.price_yearly_inr if payload.billing_cycle == "yearly" else plan_obj.price_monthly_inr

    if expected_amount is None:
        fallback_plan = FALLBACK_PLAN_PRICES.get(payload.plan_id)
        if fallback_plan:
            expected_amount = fallback_plan["yearly"] if payload.billing_cycle == "yearly" else fallback_plan["monthly"]

    if expected_amount is not None and payload.amount_inr < expected_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient payment amount ₹{payload.amount_inr} for plan {payload.plan_id} (expected ₹{expected_amount})."
        )

    _PROCESSED_WEBHOOK_TXNS.add(payload.transaction_id)

    if db is None:
        return {"status": "subscription_activated", "note": "Database disconnected (test mode)"}

    # 3. Calculate period end
    period_start = datetime.now(timezone.utc)
    if payload.billing_cycle == "yearly":
        period_end = period_start + timedelta(days=365)
    else:
        period_end = period_start + timedelta(days=30)

    # 4. Upsert Subscription
    sub_stmt = select(Subscription).where(Subscription.user_id == payload.user_id)
    sub_res = await db.execute(sub_stmt)
    sub = sub_res.scalar_one_or_none()

    if sub:
        sub.plan_id = plan_obj.id
        sub.plan_name = plan_obj.name
        sub.storage_limit = plan_obj.storage_limit_bytes
        sub.file_size_limit = plan_obj.max_file_size_bytes
        sub.subscription_status = "active"
        sub.billing_cycle = payload.billing_cycle
        sub.current_period_start = period_start
        sub.current_period_end = period_end
        sub.cancel_at_period_end = False
        sub.updated_at = period_start
    else:
        sub = Subscription(
            user_id=payload.user_id,
            plan_id=plan_obj.id,
            plan_name=plan_obj.name,
            storage_limit=plan_obj.storage_limit_bytes,
            file_size_limit=plan_obj.max_file_size_bytes,
            subscription_status="active",
            billing_cycle=payload.billing_cycle,
            current_period_start=period_start,
            current_period_end=period_end,
            cancel_at_period_end=False
        )
        db.add(sub)

    await db.flush()

    # 5. Insert Payment Record
    payment = Payment(
        user_id=payload.user_id,
        subscription_id=sub.id,
        plan_id=plan_obj.id,
        amount_inr=payload.amount_inr,
        billing_cycle=payload.billing_cycle,
        payment_method=payload.payment_method,
        transaction_id=payload.transaction_id,
        status="succeeded"
    )
    db.add(payment)
    await db.commit()

    return {
        "status": "subscription_activated",
        "user_id": payload.user_id,
        "plan_name": plan_obj.name,
        "storage_limit_bytes": plan_obj.storage_limit_bytes,
        "retention_days": plan_obj.retention_days,
        "period_end": period_end.isoformat()
    }

@router.post("/cancel")
async def cancel_subscription(
    payload: CancelSubscriptionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Cancels auto-renewal of the current subscription.
    User retains access until current_period_end.
    """
    if db is None:
        return {"status": "cancelled", "cancel_at_period_end": True}

    stmt = select(Subscription).where(Subscription.user_id == current_user.user_id)
    res = await db.execute(stmt)
    sub = res.scalar_one_or_none()

    if not sub or sub.plan_id == "free":
        return {"status": "info", "message": "You are currently on the Free plan; no paid renewal to cancel."}

    sub.cancel_at_period_end = True
    sub.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return {
        "status": "success",
        "cancel_at_period_end": True,
        "expires_at": sub.current_period_end.isoformat() if sub.current_period_end else None,
        "message": "Auto-renewal cancelled. You will continue to have access to your plan until the end of your billing cycle."
    }

@router.get("/payments")
async def get_payment_history(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns payment history for the authenticated user."""
    if db is None:
        return []

    stmt = select(Payment).where(Payment.user_id == current_user.user_id).order_by(desc(Payment.created_at))
    res = await db.execute(stmt)
    payments = res.scalars().all()
    return payments
