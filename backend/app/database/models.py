from sqlalchemy import Column, String, BigInteger, Integer, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from backend.app.database.connection import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "user"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, nullable=False, index=True)
    emailVerified = Column(Boolean, default=False)
    image = Column(String, nullable=True)
    role = Column(String(32), nullable=False, default="user", index=True)
    banned = Column(Boolean, default=False)
    banReason = Column(Text, nullable=True)
    banExpires = Column(DateTime(timezone=True), nullable=True)
    createdAt = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updatedAt = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    files = relationship("File", back_populates="user", cascade="all, delete-orphan")
    folders = relationship("Folder", back_populates="user", cascade="all, delete-orphan")
    jobs = relationship("ProcessingJob", back_populates="user", cascade="all, delete-orphan")

class Plan(Base):
    __tablename__ = "plans"

    id = Column(String(64), primary_key=True)
    name = Column(String(64), nullable=False)
    slug = Column(String(64), unique=True, nullable=False)
    price_monthly_inr = Column(Integer, nullable=False, default=0)
    price_yearly_inr = Column(Integer, nullable=False, default=0)
    storage_limit_bytes = Column(BigInteger, nullable=False)
    retention_days = Column(Integer, nullable=False)
    max_file_size_bytes = Column(BigInteger, nullable=False)
    features = Column(JSON, nullable=False, default=list)
    is_active = Column(Boolean, nullable=False, default=True)
    is_recommended = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Folder(Base):
    __tablename__ = "folders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_folder_id = Column(String(36), ForeignKey("folders.id", ondelete="CASCADE"), nullable=True, index=True)
    folder_name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="folders")
    files = relationship("File", back_populates="folder")

class File(Base):
    __tablename__ = "files"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)
    folder_id = Column(String(36), ForeignKey("folders.id", ondelete="SET NULL"), nullable=True, index=True)
    original_name = Column(String(512), nullable=False)
    stored_name = Column(String(512), nullable=False)
    mime_type = Column(String(128), nullable=False)
    file_extension = Column(String(32), nullable=False)
    file_size = Column(BigInteger, nullable=False, default=0)
    s3_key = Column(String(1024), nullable=False)
    checksum = Column(String(128), nullable=True)
    status = Column(String(64), nullable=False, default="ready", index=True)
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)
    notified_48h = Column(Boolean, nullable=False, default=False)
    notified_24h = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    deleted_at = Column(DateTime(timezone=True), nullable=True, index=True)

    user = relationship("User", back_populates="files")
    folder = relationship("Folder", back_populates="files")

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)
    file_id = Column(String(36), ForeignKey("files.id", ondelete="SET NULL"), nullable=True)
    operation = Column(String(128), nullable=False)
    job_status = Column(String(64), nullable=False, default="queued", index=True)
    progress = Column(Integer, nullable=False, default=0)
    input_s3_key = Column(String(1024), nullable=False)
    output_s3_key = Column(String(1024), nullable=True)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="jobs")

class StorageUsage(Base):
    __tablename__ = "storage_usage"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    total_storage_used = Column(BigInteger, nullable=False, default=0)
    total_files = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    plan_id = Column(String(64), ForeignKey("plans.id"), nullable=False, default="free")
    plan_name = Column(String(64), nullable=False, default="Free")
    storage_limit = Column(BigInteger, nullable=False, default=15728640)
    file_size_limit = Column(BigInteger, nullable=False, default=15728640)
    monthly_processing_limit = Column(Integer, nullable=False, default=50)
    subscription_status = Column(String(64), nullable=False, default="active")
    billing_cycle = Column(String(32), nullable=False, default="monthly")
    current_period_start = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    cancel_at_period_end = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    plan = relationship("Plan")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)
    subscription_id = Column(String(36), ForeignKey("subscriptions.id", ondelete="SET NULL"), nullable=True)
    plan_id = Column(String(64), ForeignKey("plans.id"), nullable=True)
    amount_inr = Column(Integer, nullable=False)
    billing_cycle = Column(String(32), nullable=False, default="monthly")
    payment_method = Column(String(64), nullable=False, default="UPI / Card")
    transaction_id = Column(String(128), nullable=False, unique=True)
    status = Column(String(64), nullable=False, default="succeeded")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class DeletionLog(Base):
    __tablename__ = "deletion_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=False, index=True)
    file_id = Column(String(36), nullable=False)
    file_name = Column(String(512), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    s3_key = Column(String(1024), nullable=False)
    reason = Column(String(64), nullable=False) # 'expired', 'user_deleted'
    status = Column(String(64), nullable=False) # 'success', 'failed'
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_id = Column(String(255), nullable=False)
    actor_email = Column(String(255), nullable=False)
    action = Column(String(128), nullable=False)
    target_id = Column(String(255), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
