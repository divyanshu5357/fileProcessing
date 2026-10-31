from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from backend.app.core.security import get_current_user, AuthenticatedUser
from backend.app.database.connection import get_db
from backend.app.database.models import Folder
from backend.app.schemas.file_schemas import FolderCreateRequest, FolderResponse
from backend.app.core.exceptions import ResourceNotFoundException, ForbiddenFileAccessException

router = APIRouter(prefix="/folders", tags=["folders"])

@router.get("", response_model=List[FolderResponse])
async def list_folders(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if db is None:
        return []
    stmt = select(Folder).where(Folder.user_id == current_user.user_id).order_by(Folder.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("", response_model=FolderResponse)
async def create_folder(
    payload: FolderCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_folder = Folder(
        user_id=current_user.user_id,
        folder_name=payload.folder_name,
        parent_folder_id=payload.parent_folder_id
    )
    if db is not None:
        db.add(new_folder)
        await db.commit()
        await db.refresh(new_folder)
    return new_folder

@router.delete("/{folder_id}")
async def delete_folder(
    folder_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if db is None:
        return {"status": "deleted"}
    stmt = select(Folder).where(Folder.id == folder_id)
    res = await db.execute(stmt)
    folder = res.scalar_one_or_none()
    if not folder:
        raise ResourceNotFoundException()
    if folder.user_id != current_user.user_id:
        raise ForbiddenFileAccessException()

    await db.delete(folder)
    await db.commit()
    return {"status": "deleted", "folder_id": folder_id}
