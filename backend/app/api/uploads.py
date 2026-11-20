from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
import os
import re
from datetime import datetime, timezone, timedelta
from backend.app.core.security import get_current_user, AuthenticatedUser
from backend.app.database.connection import get_db
from backend.app.database.models import File
from backend.app.services.s3_service import s3_service
from backend.app.services.quota_service import quota_service
from backend.app.schemas.file_schemas import (
    UploadInitiateRequest,
    UploadInitiateResponse,
    MultipartPartUrlRequest,
    MultipartPartUrlResponse,
    MultipartCompleteRequest,
    SingleUploadCompleteRequest,
    FileResponse,
)

router = APIRouter(prefix="/uploads", tags=["uploads"])

DISALLOWED_EXTENSIONS = {
    ".exe", ".sh", ".bat", ".cmd", ".com", ".msi", ".dll", ".so", ".bin",
    ".php", ".py", ".pl", ".cgi", ".vbs", ".ps1", ".scr", ".pif", ".hta",
    ".jar", ".war", ".apk", ".dmg", ".pkg", ".deb", ".rpm", ".elf"
}

DISALLOWED_CONTENT_TYPES = {
    "application/x-msdownload",
    "application/x-sh",
    "application/x-bash",
    "application/x-bat",
    "application/x-executable",
    "application/x-dosexec",
    "application/x-php",
    "text/x-php",
    "application/x-python",
    "text/x-python",
}

@router.post("/initiate", response_model=UploadInitiateResponse)
async def initiate_upload(
    payload: UploadInitiateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Initiates direct browser-to-S3 upload session.
    Verifies user storage quota, file extension, and maximum file size prior to issuing presigned S3 URLs.
    """
    if payload.file_size <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be strictly positive."
        )

    ext = os.path.splitext(payload.file_name.lower())[1]
    if ext in DISALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Executable and script file uploads ({ext}) are forbidden for security reasons."
        )

    if payload.content_type.lower().strip() in DISALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"MIME type '{payload.content_type}' is not permitted."
        )

    # 1. Quota Check based on user's database plan
    await quota_service.verify_upload_quota(
        db=db,
        user_id=current_user.user_id,
        file_size=payload.file_size,
        plan=current_user.plan
    )

    file_id = f"fil_{uuid.uuid4().hex[:12]}"
    s3_key = s3_service.generate_s3_key(
        user_id=current_user.user_id,
        file_id=file_id,
        file_name=payload.file_name,
        folder="originals"
    )

    # 2. Decide between Multipart Upload (large files > 25MB) or Single PUT URL
    is_multipart = payload.is_multipart or (payload.file_size > 25 * 1024 * 1024)

    if is_multipart:
        upload_id = s3_service.create_multipart_upload(s3_key, payload.content_type)
        return UploadInitiateResponse(
            file_id=file_id,
            s3_key=s3_key,
            upload_id=upload_id,
            is_multipart=True,
            part_size=5 * 1024 * 1024
        )
    else:
        upload_url = s3_service.generate_presigned_upload_url(s3_key, payload.content_type)
        return UploadInitiateResponse(
            file_id=file_id,
            s3_key=s3_key,
            upload_url=upload_url,
            is_multipart=False
        )

@router.post("/multipart/part-url", response_model=MultipartPartUrlResponse)
async def get_multipart_part_url(
    payload: MultipartPartUrlRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    """Returns an authorized presigned URL for a specific chunk in a multipart upload."""
    part_url = s3_service.generate_presigned_part_url(
        s3_key=payload.s3_key,
        upload_id=payload.upload_id,
        part_number=payload.part_number
    )
    return MultipartPartUrlResponse(
        part_number=payload.part_number,
        part_url=part_url
    )

@router.post("/multipart/complete")
async def complete_multipart(
    payload: MultipartCompleteRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Finalizes multipart upload by assembling chunks in S3.
    Verifies actual file size from S3, calculates data expiration date, and records quota.
    """
    parts_data = [{"PartNumber": p.PartNumber, "ETag": p.ETag} for p in payload.parts]
    s3_service.complete_multipart_upload(
        s3_key=payload.s3_key,
        upload_id=payload.upload_id,
        parts=parts_data
    )

    # 1. Do not trust frontend size - calculate actual size from S3
    actual_size = s3_service.get_actual_object_size(payload.s3_key)
    final_file_size = actual_size if actual_size > 0 else payload.file_size

    # 2. Re-verify quota against actual verified file size
    await quota_service.verify_upload_quota(
        db=db,
        user_id=current_user.user_id,
        file_size=final_file_size,
        plan=current_user.plan
    )

    # 3. Automatic Data Retention calculation based on plan
    plan_name, _, _, retention_days = await quota_service.get_user_plan_config(db, current_user.user_id)
    expires_at = datetime.now(timezone.utc) + timedelta(days=retention_days)

    ext = payload.original_name.split(".")[-1].lower() if "." in payload.original_name else "bin"

    if db is not None:
        db_file = File(
            id=payload.file_id,
            user_id=current_user.user_id,
            folder_id=payload.folder_id,
            original_name=payload.original_name,
            stored_name=payload.original_name,
            mime_type=payload.content_type,
            file_extension=ext,
            file_size=final_file_size,
            s3_key=payload.s3_key,
            status="ready",
            expires_at=expires_at
        )
        db.add(db_file)
        await db.commit()

        # Update quota accounting atomically
        await quota_service.record_upload_atomic(
            db=db,
            user_id=current_user.user_id,
            file_size=final_file_size
        )

    return {
        "status": "success",
        "file_id": payload.file_id,
        "file_size": final_file_size,
        "expires_at": expires_at.isoformat(),
        "retention_days": retention_days,
        "message": f"File ready in cloud storage. Retained for {retention_days} days until {expires_at.strftime('%Y-%m-%d %H:%M UTC')}."
    }

@router.post("/complete-single")
async def complete_single_upload(
    payload: SingleUploadCompleteRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Registers a successfully uploaded single file.
    Inspects actual S3 object size and assigns expiration timestamp based on user plan.
    """
    actual_size = s3_service.get_actual_object_size(payload.s3_key)
    final_file_size = actual_size if actual_size > 0 else (payload.file_size or 0)

    # Re-verify quota against actual size
    await quota_service.verify_upload_quota(
        db=db,
        user_id=current_user.user_id,
        file_size=final_file_size,
        plan=current_user.plan
    )

    plan_name, _, _, retention_days = await quota_service.get_user_plan_config(db, current_user.user_id)
    expires_at = datetime.now(timezone.utc) + timedelta(days=retention_days)

    ext = payload.original_name.split(".")[-1].lower() if "." in payload.original_name else "bin"

    if db is not None:
        db_file = File(
            id=payload.file_id,
            user_id=current_user.user_id,
            folder_id=payload.folder_id,
            original_name=payload.original_name,
            stored_name=payload.original_name,
            mime_type=payload.content_type,
            file_extension=ext,
            file_size=final_file_size,
            s3_key=payload.s3_key,
            status="ready",
            expires_at=expires_at
        )
        db.add(db_file)
        await db.commit()

        await quota_service.record_upload_atomic(
            db=db,
            user_id=current_user.user_id,
            file_size=final_file_size
        )

    return {
        "status": "success",
        "file_id": payload.file_id,
        "file_size": final_file_size,
        "expires_at": expires_at.isoformat(),
        "retention_days": retention_days,
        "message": f"File saved. Retained for {retention_days} days."
    }
