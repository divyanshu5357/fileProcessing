import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.config import settings
from backend.app.core.security import create_test_internal_assertion
from backend.app.services.s3_service import s3_service

client = TestClient(app)

AUTH_HEADERS = {
    "X-User-Id": "usr_authed_test_123",
    "X-User-Email": "test.user@gyanvatsala.in",
    "X-User-Role": "user",
    "X-Internal-Secret": settings.INTERNAL_SERVICE_KEY,
}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "gyanvatsala-api"

def test_readiness_check():
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert "database" in data

def test_direct_external_call_without_secret_rejected():
    """Verify backend rejects direct external requests without X-Internal-Secret with 401."""
    response = client.get("/api/files")
    assert response.status_code == 401
    assert "unauthorized" in response.json()["detail"].lower()

def test_spoofed_admin_role_without_secret_rejected():
    """Verify spoofed X-User-Role header without internal secret is rejected."""
    headers = {
        "X-User-Id": "usr_attacker",
        "X-User-Role": "admin",
        "X-User-Email": "attacker@evil.com",
    }
    response = client.get("/api/admin/overview", headers=headers)
    assert response.status_code == 401

def test_single_part_upload_initiation_within_quota():
    payload = {
        "file_name": "contract.pdf",
        "file_size": 1024 * 1024 * 2, # 2MB
        "content_type": "application/pdf",
        "is_multipart": False
    }
    response = client.post("/api/uploads/initiate", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["is_multipart"] is False
    assert "upload_url" in data
    assert data["file_id"].startswith("fil_")

def test_upload_exceeding_free_quota_rejected():
    """Verify backend enforces storage quota and rejects uploads exceeding limit."""
    payload = {
        "file_name": "huge_file.pdf",
        "file_size": 1024 * 1024 * 30, # 30MB (exceeds 15MB free quota)
        "content_type": "application/pdf",
        "is_multipart": False
    }
    headers = {
        "X-User-Id": "usr_free_test",
        "X-User-Email": "free@test.com",
        "X-Internal-Secret": settings.INTERNAL_SERVICE_KEY,
    }
    response = client.post("/api/uploads/initiate", json=payload, headers=headers)
    assert response.status_code == 413
    assert "exceeds" in response.json()["detail"].lower() or "limit" in response.json()["detail"].lower()

def test_multipart_upload_for_prime_ultra_user():
    """Multipart upload allowed for users on higher tier (PrimeUltra)."""
    payload = {
        "file_name": "large_archive.pdf",
        "file_size": 1024 * 1024 * 50, # 50MB (within PrimeUltra 100MB file limit)
        "content_type": "application/pdf",
        "is_multipart": True
    }
    headers = {
        "X-User-Id": "usr_prime_ultra_test",
        "X-User-Email": "prime.ultra@test.com",
        "X-User-Plan": "PrimeUltra",
        "X-Internal-Secret": settings.INTERNAL_SERVICE_KEY,
    }
    response = client.post("/api/uploads/initiate", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["is_multipart"] is True
    assert "upload_id" in data

def test_database_driven_plans():
    """Verify plans endpoint returns Free, Prime, PrimePlus, PrimeUltra."""
    response = client.get("/api/subscriptions/plans")
    assert response.status_code == 200
    plans = response.json()
    assert len(plans) >= 4
    plan_names = [p["name"] for p in plans]
    assert "Free" in plan_names
    assert "Prime" in plan_names
    assert "PrimePlus" in plan_names
    assert "PrimeUltra" in plan_names

    prime_plus = next(p for p in plans if p["name"] == "PrimePlus")
    assert prime_plus["is_recommended"] is True
    assert prime_plus["retention_days"] == 30

def test_subscription_checkout_and_webhook_activation():
    """Verify pre-launch coming soon checkout response and secure backend webhook verification."""
    # 1. Pre-payment launch returns coming_soon for paid tiers
    checkout_payload = {
        "plan_id": "prime_plus",
        "billing_cycle": "monthly"
    }
    checkout_res = client.post("/api/subscriptions/checkout", json=checkout_payload, headers=AUTH_HEADERS)
    assert checkout_res.status_code == 200
    checkout_data = checkout_res.json()
    assert checkout_data["status"] == "coming_soon"
    assert checkout_data["is_pre_launch"] is True
    txn_id = "txn_mock_test_12345"

    # 2. Webhook rejected with invalid secret
    webhook_payload = {
        "event": "payment.succeeded",
        "transaction_id": txn_id,
        "user_id": "usr_test_webhook_user",
        "plan_id": "prime_plus",
        "amount_inr": 99,
        "billing_cycle": "monthly"
    }
    invalid_res = client.post(
        "/api/subscriptions/webhook",
        json=webhook_payload,
        headers={"X-Webhook-Secret": "wrong_secret"}
    )
    assert invalid_res.status_code == 401

    # 3. Old test_secret_2026 must be strictly rejected
    old_secret_res = client.post(
        "/api/subscriptions/webhook",
        json=webhook_payload,
        headers={"X-Webhook-Secret": "test_secret_2026"}
    )
    assert old_secret_res.status_code == 401

    # 4. Webhook accepted ONLY with authoritative WEBHOOK_SECRET
    valid_res = client.post(
        "/api/subscriptions/webhook",
        json=webhook_payload,
        headers={"X-Webhook-Secret": settings.WEBHOOK_SECRET}
    )
    assert valid_res.status_code == 200
    assert valid_res.json()["status"] == "subscription_activated"

def test_retention_cleanup_job():
    """Verify background retention cleanup worker executes safely without errors."""
    response = client.post("/api/retention/run-cleanup", headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["completed", "skipped"]
    assert "notifications_48h" in data or "reason" in data

def test_download_presigned_url():
    response = client.get("/api/downloads/fil_test_123", headers=AUTH_HEADERS)
    assert response.status_code == 200
    data = response.json()
    assert "download_url" in data
    assert data["file_id"] == "fil_test_123"

def test_expiring_soon_endpoint():
    response = client.get("/api/retention/expiring-soon", headers=AUTH_HEADERS)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_user_storage_ownership_enforcement():
    """Verify strict user isolation: users cannot access other users' storage quota."""
    headers = {
        "X-User-Id": "usr_intruder",
        "X-User-Email": "intruder@evil.com",
        "X-User-Role": "user",
        "X-Internal-Secret": settings.INTERNAL_SERVICE_KEY,
    }
    response = client.get("/api/users/usr_other_person/storage", headers=headers)
    assert response.status_code == 403

def test_admin_endpoints_rejected_for_normal_user():
    """Verify unprivileged users are rejected from admin APIs with 403 Forbidden."""
    headers = {
        "X-User-Email": "regular.user@example.com",
        "X-User-Id": "usr_regular",
        "X-User-Role": "user",
        "X-Internal-Secret": settings.INTERNAL_SERVICE_KEY,
    }
    ov_res = client.get("/api/admin/overview", headers=headers)
    assert ov_res.status_code == 403
    rev_res = client.get("/api/admin/revenue", headers=headers)
    assert rev_res.status_code == 403

def test_admin_endpoints_accessible_for_authorized_admin():
    """Verify verified admin with internal secret AND signed assertion can access overview and revenue."""
    assertion1 = create_test_internal_assertion(
        user_id="usr_sole_admin",
        email="admin.security@gyanvatsala.in",
        role="admin"
    )
    headers1 = {
        "X-User-Email": "admin.security@gyanvatsala.in",
        "X-User-Role": "admin",
        "X-User-Id": "usr_sole_admin",
        "X-Internal-Secret": settings.INTERNAL_SERVICE_KEY,
        "X-Internal-Assertion": assertion1,
    }
    me_res = client.get("/api/admin/me", headers=headers1)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["is_admin"] is True
    assert me_data["role"] == "admin"
    assert me_data["permissions"]["can_view_revenue"] is True

    # Revenue call with a fresh assertion to adhere to JTI nonce uniqueness
    assertion2 = create_test_internal_assertion(
        user_id="usr_sole_admin",
        email="admin.security@gyanvatsala.in",
        role="admin"
    )
    headers2 = {
        "X-User-Email": "admin.security@gyanvatsala.in",
        "X-User-Role": "admin",
        "X-User-Id": "usr_sole_admin",
        "X-Internal-Secret": settings.INTERNAL_SERVICE_KEY,
        "X-Internal-Assertion": assertion2,
    }
    rev_res = client.get("/api/admin/revenue", headers=headers2)
    assert rev_res.status_code == 200
    assert "total_verified_revenue_inr" in rev_res.json()

def test_support_role_cannot_access_revenue():
    """Verify support role can view overview and users, but is forbidden from financial revenue data."""
    assertion1 = create_test_internal_assertion(
        user_id="usr_support_1",
        email="support@gyanvatsala.in",
        role="support"
    )
    headers1 = {
        "X-User-Email": "support@gyanvatsala.in",
        "X-User-Role": "support",
        "X-User-Id": "usr_support_1",
        "X-Internal-Secret": settings.INTERNAL_SERVICE_KEY,
        "X-Internal-Assertion": assertion1,
    }
    ov_res = client.get("/api/admin/overview", headers=headers1)
    assert ov_res.status_code == 200

    # Fresh assertion for second call
    assertion2 = create_test_internal_assertion(
        user_id="usr_support_1",
        email="support@gyanvatsala.in",
        role="support"
    )
    headers2 = {
        "X-User-Email": "support@gyanvatsala.in",
        "X-User-Role": "support",
        "X-User-Id": "usr_support_1",
        "X-Internal-Secret": settings.INTERNAL_SERVICE_KEY,
        "X-Internal-Assertion": assertion2,
    }
    rev_res = client.get("/api/admin/revenue", headers=headers2)
    assert rev_res.status_code == 403

def test_admin_cannot_demote_self():
    """Verify administrators cannot accidentally or maliciously modify their own role."""
    assertion = create_test_internal_assertion(
        user_id="usr_sole_admin",
        email="admin.security@gyanvatsala.in",
        role="admin"
    )
    headers = {
        "X-User-Email": "admin.security@gyanvatsala.in",
        "X-User-Role": "admin",
        "X-User-Id": "usr_sole_admin",
        "X-Internal-Secret": settings.INTERNAL_SERVICE_KEY,
        "X-Internal-Assertion": assertion,
    }
    res = client.post(
        "/api/admin/users/usr_sole_admin/role",
        json={"role": "user"},
        headers=headers
    )
    assert res.status_code == 400
    assert "cannot modify their own role" in res.json()["detail"].lower()

def test_admin_role_cannot_be_assigned_dynamically():
    """Verify nobody can assign the role 'admin' dynamically via the API."""
    assertion = create_test_internal_assertion(
        user_id="usr_sole_admin",
        email="admin.security@gyanvatsala.in",
        role="admin"
    )
    headers = {
        "X-User-Email": "admin.security@gyanvatsala.in",
        "X-User-Role": "admin",
        "X-User-Id": "usr_sole_admin",
        "X-Internal-Secret": settings.INTERNAL_SERVICE_KEY,
        "X-Internal-Assertion": assertion,
    }
    res = client.post(
        "/api/admin/users/usr_target_candidate/role",
        json={"role": "admin"},
        headers=headers
    )
    assert res.status_code == 400
    assert "sole administrator" in res.json()["detail"].lower() or "cannot be dynamically assigned" in res.json()["detail"].lower()

def test_admin_elevation_without_signed_assertion_rejected():
    """Verify that knowing X-Internal-Secret alone CANNOT grant admin elevation without a signed assertion."""
    headers = {
        "X-User-Email": "attacker@evil.com",
        "X-User-Role": "admin",
        "X-User-Id": "usr_attacker",
        "X-Internal-Secret": settings.INTERNAL_SERVICE_KEY,
        # Intentionally missing X-Internal-Assertion
    }
    res = client.get("/api/admin/overview", headers=headers)
    assert res.status_code == 403
    assert "signed" in res.json()["detail"].lower() and "assertion" in res.json()["detail"].lower()

def test_expired_internal_assertion_rejected():
    """Verify that expired signed assertions are strictly rejected."""
    expired_assertion = create_test_internal_assertion(
        user_id="usr_sole_admin",
        email="admin.security@gyanvatsala.in",
        role="admin",
        exp_offset_seconds=-30 # Expired 30 seconds ago
    )
    headers = {
        "X-Internal-Secret": settings.INTERNAL_SERVICE_KEY,
        "X-Internal-Assertion": expired_assertion,
    }
    res = client.get("/api/admin/overview", headers=headers)
    assert res.status_code == 401

def test_replayed_internal_assertion_rejected():
    """Verify that reusing the same JTI nonce is detected as a replay attack and rejected."""
    fixed_jti = "nonce-test-replay-unique-12345"
    assertion1 = create_test_internal_assertion(
        user_id="usr_sole_admin",
        email="admin.security@gyanvatsala.in",
        role="admin",
        custom_jti=fixed_jti
    )
    headers = {
        "X-User-Role": "admin",
        "X-Internal-Secret": settings.INTERNAL_SERVICE_KEY,
        "X-Internal-Assertion": assertion1,
    }
    # First request: JTI accepted
    res1 = client.get("/api/admin/overview", headers=headers)
    assert res1.status_code == 200

    # Second request with identical JTI: Replay attack detected
    res2 = client.get("/api/admin/overview", headers=headers)
    assert res2.status_code == 401

def test_tampered_internal_assertion_rejected():
    """Verify that assertions signed with an invalid key or modified claims are rejected."""
    tampered_assertion = create_test_internal_assertion(
        user_id="usr_sole_admin",
        email="admin.security@gyanvatsala.in",
        role="admin",
        tamper_secret="forged_attacker_secret_9999"
    )
    headers = {
        "X-User-Role": "admin",
        "X-Internal-Secret": settings.INTERNAL_SERVICE_KEY,
        "X-Internal-Assertion": tampered_assertion,
    }
    res = client.get("/api/admin/overview", headers=headers)
    assert res.status_code == 401

def test_webhook_underpayment_rejected():
    """Verify that payment webhook with amount less than plan price is rejected with 400 Bad Request."""
    payload = {
        "event": "payment.succeeded",
        "transaction_id": "txn_underpay_attack_001",
        "user_id": "usr_cheap_attacker",
        "plan_id": "prime_plus",
        "amount_inr": 1,
        "billing_cycle": "monthly"
    }
    res = client.post(
        "/api/subscriptions/webhook",
        json=payload,
        headers={"X-Webhook-Secret": settings.WEBHOOK_SECRET}
    )
    assert res.status_code == 400
    assert "insufficient payment amount" in res.json()["detail"].lower()

def test_webhook_duplicate_replay_idempotent():
    """Verify that replaying a payment webhook with the same transaction_id returns already_processed."""
    unique_txn = "txn_idempotent_test_998877"
    payload = {
        "event": "payment.succeeded",
        "transaction_id": unique_txn,
        "user_id": "usr_idempotent_user",
        "plan_id": "prime_plus",
        "amount_inr": 99,
        "billing_cycle": "monthly"
    }
    # 1. First webhook execution succeeds
    res1 = client.post(
        "/api/subscriptions/webhook",
        json=payload,
        headers={"X-Webhook-Secret": settings.WEBHOOK_SECRET}
    )
    assert res1.status_code == 200
    assert res1.json()["status"] == "subscription_activated"

    # 2. Replay of same transaction returns already_processed without re-extending
    res2 = client.post(
        "/api/subscriptions/webhook",
        json=payload,
        headers={"X-Webhook-Secret": settings.WEBHOOK_SECRET}
    )
    assert res2.status_code == 200
    assert res2.json()["status"] == "already_processed"

def test_s3_key_sanitization_path_traversal():
    """Verify s3_service.generate_s3_key strips path traversal sequences and null bytes."""
    clean_key = s3_service.generate_s3_key(
        user_id="usr_tester",
        file_id="fil_xyz",
        file_name="../../../etc/passwd\x00malicious.pdf",
        folder="originals"
    )
    assert "../" not in clean_key
    assert "\x00" not in clean_key
    assert clean_key.startswith("users/usr_tester/originals/fil_xyz/")

def test_upload_dangerous_extension_rejected():
    """Verify upload initiation rejects dangerous executable and script file extensions."""
    for bad_file in ["trojan.exe", "script.sh", "payload.bat", "webshell.php", "rootkit.bin"]:
        payload = {
            "file_name": bad_file,
            "file_size": 1024,
            "content_type": "application/octet-stream",
            "is_multipart": False
        }
        res = client.post("/api/uploads/initiate", json=payload, headers=AUTH_HEADERS)
        assert res.status_code == 400
        assert "forbidden" in res.json()["detail"].lower()

def test_upload_zero_or_negative_file_size_rejected():
    """Verify upload initiation rejects zero-byte or negative-size payloads."""
    payload_zero = {
        "file_name": "empty.pdf",
        "file_size": 0,
        "content_type": "application/pdf",
        "is_multipart": False
    }
    res = client.post("/api/uploads/initiate", json=payload_zero, headers=AUTH_HEADERS)
    assert res.status_code == 400
    assert "positive" in res.json()["detail"].lower()

def test_better_auth_secret_as_internal_secret_rejected():
    """Verify BETTER_AUTH_SECRET alone cannot authenticate internal backend calls."""
    unauthorized_auth_secret = "arbitrary_better_auth_session_secret_not_internal_key"
    headers = {
        "X-User-Id": "usr_attacker",
        "X-User-Email": "attacker@evil.com",
        "X-User-Role": "user",
        "X-Internal-Secret": unauthorized_auth_secret,
    }
    res = client.get("/api/files", headers=headers)
    assert res.status_code == 401
    assert "unauthorized" in res.json()["detail"].lower()

def test_forged_support_role_without_assertion_rejected():
    """Verify that claiming support role without a signed assertion returns 403 Forbidden."""
    headers = {
        "X-User-Id": "usr_attacker",
        "X-User-Email": "support@gyanvatsala.in",
        "X-User-Role": "support",
        "X-Internal-Secret": settings.INTERNAL_SERVICE_KEY,
    }
    res = client.get("/api/admin/overview", headers=headers)
    assert res.status_code == 403
    assert "signed" in res.json()["detail"].lower()

def test_missing_user_email_rejected_no_fabricated_identity():
    """Verify that requests with missing email header are rejected and do NOT receive fabricated identities."""
    headers = {
        "X-User-Id": "usr_tester_no_email",
        "X-Internal-Secret": settings.INTERNAL_SERVICE_KEY,
        # Intentionally omitting X-User-Email
    }
    res = client.get("/api/files", headers=headers)
    assert res.status_code == 401
    assert "email" in res.json()["detail"].lower()

def test_assertion_incorrect_audience_rejected():
    """Verify that assertions addressed to a different audience are strictly rejected."""
    key = getattr(settings, "INTERNAL_SERVICE_KEY", "")
    import time, base64, json, hmac, uuid
    now = int(time.time())
    claims = {
        "sub": "usr_test",
        "email": "test@gyanvatsala.in",
        "role": "admin",
        "plan": "Free",
        "aud": "wrong-third-party-service",
        "iss": "pixelkit-bff",
        "iat": now,
        "exp": now + 60,
        "jti": str(uuid.uuid4())
    }
    payload_b64 = base64.urlsafe_b64encode(json.dumps(claims).encode("utf-8")).decode("utf-8").rstrip("=")
    sig = hmac.new(key.encode("utf-8"), payload_b64.encode("utf-8"), "sha256").hexdigest()
    bad_aud_token = f"{payload_b64}.{sig}"

    headers = {
        "X-User-Role": "admin",
        "X-Internal-Secret": settings.INTERNAL_SERVICE_KEY,
        "X-Internal-Assertion": bad_aud_token,
    }
    res = client.get("/api/admin/overview", headers=headers)
    assert res.status_code == 401

def test_assertion_missing_sub_or_email_claim_rejected():
    """Verify that assertions missing sub or email claims are rejected."""
    key = getattr(settings, "INTERNAL_SERVICE_KEY", "")
    import time, base64, json, hmac, uuid
    now = int(time.time())
    claims = {
        "role": "admin",
        "plan": "Free",
        "aud": "pixelkit-backend",
        "iss": "pixelkit-bff",
        "iat": now,
        "exp": now + 60,
        "jti": str(uuid.uuid4())
        # Missing sub and email
    }
    payload_b64 = base64.urlsafe_b64encode(json.dumps(claims).encode("utf-8")).decode("utf-8").rstrip("=")
    sig = hmac.new(key.encode("utf-8"), payload_b64.encode("utf-8"), "sha256").hexdigest()
    malformed_token = f"{payload_b64}.{sig}"

    headers = {
        "X-User-Role": "admin",
        "X-Internal-Secret": settings.INTERNAL_SERVICE_KEY,
        "X-Internal-Assertion": malformed_token,
    }
    res = client.get("/api/admin/overview", headers=headers)
    assert res.status_code == 401
