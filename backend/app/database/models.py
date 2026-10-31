from sqlalchemy import Column, String, BigInteger, Integer, Boolean, DateTime, ForeignKey, Text
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
    createdAt = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updatedAt = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    files = relationship("File", back_populates="user", cascade="all, delete-orphan")
    folders = relationship("Folder", back_populates="user", cascade="all, delete-orphan")
    jobs = relationship("ProcessingJob", back_populates="user", cascade="all, delete-orphan")

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
    plan_name = Column(String(64), nullable=False, default="free")
    storage_limit = Column(BigInteger, nullable=False, default=524288000)
    file_size_limit = Column(BigInteger, nullable=False, default=52428800)
    monthly_processing_limit = Column(Integer, nullable=False, default=100)
    subscription_status = Column(String(64), nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
