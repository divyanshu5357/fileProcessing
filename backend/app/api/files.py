from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, desc, asc
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel

from backend.app.core.security import get_current_user, AuthenticatedUser
from backend.app.database.connection import get_db
from backend.app.database.models import File
from backend.app.services.s3_service import s3_service
from backend.app.services.quota_service import quota_service
from backend.app.schemas.file_schemas import FileResponse
from backend.app.core.exceptions import ResourceNotFoundException, ForbiddenFileAccessException

router = APIRouter(prefix="/files", tags=["files"])

class RenameFileRequest(BaseModel):
    new_name: str

class MoveFileRequest(BaseModel):
    folder_id: Optional[str] = None

class BulkDeleteRequest(BaseModel):
    file_ids: List[str]

@router.get("", response_model=List[FileResponse])
async def list_user_files(
    folder_id: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("created_at", enum=["created_at", "original_name", "file_size"]),
    sort_order: str = Query("desc", enum=["asc", "desc"]),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists files with server-side pagination, indexed queries, and ownership enforcement.
    """
    if db is None:
        return []

    stmt = select(File).where(
        File.user_id == current_user.user_id,
        File.deleted_at.is_(None)
    )

    if folder_id:
        stmt = stmt.where(File.folder_id == folder_id)

    if search:
        stmt = stmt.where(File.original_name.ilike(f"%{search}%"))

    # Sorting
    col = getattr(File, sort_by, File.created_at)
    stmt = stmt.order_by(desc(col) if sort_order == "desc" else asc(col))
    stmt = stmt.offset(skip).limit(limit)

    result = await db.execute(stmt)
    files = result.scalars().all()
    return files

@router.patch("/{file_id}/rename")
async def rename_file(
    file_id: str,
    payload: RenameFileRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if db is None:
        return {"status": "success"}

    stmt = select(File).where(File.id == file_id, File.deleted_at.is_(None))
    result = await db.execute(stmt)
    file_rec = result.scalar_one_or_none()

    if not file_rec:
        raise ResourceNotFoundException()
    if file_rec.user_id != current_user.user_id:
        raise ForbiddenFileAccessException()

    file_rec.original_name = payload.new_name
    file_rec.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "success", "file_id": file_id, "new_name": payload.new_name}

@router.patch("/{file_id}/move")
async def move_file(
    file_id: str,
    payload: MoveFileRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if db is None:
        return {"status": "success"}

    stmt = select(File).where(File.id == file_id, File.deleted_at.is_(None))
    result = await db.execute(stmt)
    file_rec = result.scalar_one_or_none()

    if not file_rec:
        raise ResourceNotFoundException()
    if file_rec.user_id != current_user.user_id:
        raise ForbiddenFileAccessException()

    file_rec.folder_id = payload.folder_id
    file_rec.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "success", "file_id": file_id, "folder_id": payload.folder_id}

@router.delete("/{file_id}")
async def delete_file(
    file_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if db is None:
        return {"status": "deleted"}

    stmt = select(File).where(File.id == file_id, File.deleted_at.is_(None))
    result = await db.execute(stmt)
    file_rec = result.scalar_one_or_none()

    if not file_rec:
        raise ResourceNotFoundException()
    if file_rec.user_id != current_user.user_id:
        raise ForbiddenFileAccessException()

    # Soft delete in Postgres & schedule permanent S3 deletion
    file_rec.deleted_at = datetime.now(timezone.utc)
    await db.commit()

    # Decrement quota atomically
    await quota_service.record_deletion_atomic(db, current_user.user_id, file_rec.file_size)

    # Delete from S3
    s3_service.delete_object(file_rec.s3_key)

    return {"status": "deleted", "file_id": file_id}

@router.post("/bulk-delete")
async def bulk_delete_files(
    payload: BulkDeleteRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if db is None:
        return {"deleted_count": len(payload.file_ids)}

    stmt = select(File).where(File.id.in_(payload.file_ids), File.user_id == current_user.user_id)
    result = await db.execute(stmt)
    files = result.scalars().all()

    total_size = sum(f.file_size for f in files)
    for f in files:
        f.deleted_at = datetime.now(timezone.utc)
        s3_service.delete_object(f.s3_key)

    await db.commit()
    await quota_service.record_deletion_atomic(db, current_user.user_id, total_size)

    return {"deleted_count": len(files)}
