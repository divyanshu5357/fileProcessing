from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.security import get_current_user, AuthenticatedUser
from backend.app.database.connection import get_db
from backend.app.database.models import File
from backend.app.services.s3_service import s3_service
from backend.app.core.exceptions import ResourceNotFoundException, ForbiddenFileAccessException

router = APIRouter(prefix="/downloads", tags=["downloads"])

@router.get("/{file_id}")
async def get_presigned_download_url(
    file_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generates a secure, temporary presigned download URL.
    Validates user ownership to ensure User A cannot download User B's files.
    """
    if db is not None:
        stmt = select(File).where(File.id == file_id, File.deleted_at.is_(None))
        result = await db.execute(stmt)
        file_record = result.scalar_one_or_none()

        if not file_record:
            raise ResourceNotFoundException("File not found or was deleted.")

        # Strict Multi-Tenant Isolation
        if file_record.user_id != current_user.user_id:
            raise ForbiddenFileAccessException("Access denied. You do not own this S3 file.")

        s3_key = file_record.s3_key
        original_name = file_record.original_name
    else:
        # Dev fallback
        s3_key = f"users/{current_user.user_id}/originals/{file_id}/document.pdf"
        original_name = "document.pdf"

    download_url = s3_service.generate_presigned_download_url(s3_key, original_name)
    return {
        "file_id": file_id,
        "original_name": original_name,
        "download_url": download_url,
        "expires_in_seconds": s3_service.expires
    }
