import asyncio
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database.connection import AsyncSessionLocal
from backend.app.database.models import File, DeletionLog, User
from backend.app.services.s3_service import s3_service
from backend.app.services.quota_service import quota_service

logger = logging.getLogger("gyanvatsala.cleanup")

async def run_retention_cleanup(db: AsyncSession = None) -> dict:
    """
    Scheduled background data retention worker.
    Requirements:
    - Notify users 2 days before expiration.
    - Notify users 24 hours before expiration.
    - Avoid duplicate deletion jobs (locks rows by setting status='deleting').
    - Delete expired objects from cloud storage.
    - Remove corresponding database records ONLY after successful cloud deletion.
    - Log deletion operations in deletion_logs table.
    - Handle failed deletion attempts safely without corrupting database state.
    - Never delete unexpired files.
    """
    close_db_after = False
    if db is None:
        if AsyncSessionLocal is None:
            logger.warning("No database connection available for retention cleanup.")
            return {"status": "skipped", "reason": "No DB connection"}
        db = AsyncSessionLocal()
        close_db_after = True

    now = datetime.now(timezone.utc)
    in_48h = now + timedelta(days=2)
    in_24h = now + timedelta(days=1)

    notifications_sent_48h = 0
    notifications_sent_24h = 0
    files_deleted = 0
    files_failed = 0

    try:
        # ----------------------------------------------------------------------
        # 1. 48-Hour Expiration Warnings
        # ----------------------------------------------------------------------
        stmt_48 = select(File).where(
            File.deleted_at.is_(None),
            File.status == "ready",
            File.notified_48h == False,
            File.expires_at.is_not(None),
            File.expires_at <= in_48h,
            File.expires_at > in_24h
        )
        res_48 = await db.execute(stmt_48)
        files_48 = res_48.scalars().all()

        for f in files_48:
            logger.info(f"[Retention 48h Alert] File '{f.original_name}' (ID: {f.id}) for user {f.user_id} expires in < 48 hours at {f.expires_at.isoformat()}. Download before expiration.")
            f.notified_48h = True
            notifications_sent_48h += 1

        if files_48:
            await db.commit()

        # ----------------------------------------------------------------------
        # 2. 24-Hour Urgent Expiration Warnings
        # ----------------------------------------------------------------------
        stmt_24 = select(File).where(
            File.deleted_at.is_(None),
            File.status == "ready",
            File.notified_24h == False,
            File.expires_at.is_not(None),
            File.expires_at <= in_24h,
            File.expires_at > now
        )
        res_24 = await db.execute(stmt_24)
        files_24 = res_24.scalars().all()

        for f in files_24:
            logger.warning(f"[Retention 24h Urgent Alert] File '{f.original_name}' (ID: {f.id}) for user {f.user_id} expires in < 24 hours at {f.expires_at.isoformat()}! Permanent deletion imminent.")
            f.notified_24h = True
            notifications_sent_24h += 1

        if files_24:
            await db.commit()

        # ----------------------------------------------------------------------
        # 3. Expired Files Cleanup
        # Avoid duplicate deletion jobs: filter out status='deleting'
        # ----------------------------------------------------------------------
        stmt_expired = select(File).where(
            File.deleted_at.is_(None),
            File.expires_at.is_not(None),
            File.expires_at <= now,
            File.status != "deleting"
        ).with_for_update()

        res_expired = await db.execute(stmt_expired)
        expired_files = res_expired.scalars().all()

        # Mark them as 'deleting' atomically to prevent race conditions from concurrent workers
        for f in expired_files:
            f.status = "deleting"
        if expired_files:
            await db.commit()

        # Now process each file individually
        for f in expired_files:
            logger.info(f"[Retention Cleanup] Attempting permanent cloud storage deletion for expired file: {f.s3_key}")
            
            # Step A: Delete object from cloud storage
            try:
                storage_deleted = s3_service.delete_object(f.s3_key)
            except Exception as e:
                storage_deleted = False
                logger.error(f"[Retention Cleanup] Cloud storage deletion failed for {f.s3_key}: {e}")

            # Step B: Remove DB records ONLY after successful deletion
            if storage_deleted:
                f.deleted_at = datetime.now(timezone.utc)
                f.status = "expired_deleted"

                # Log successful deletion in deletion_logs
                log_entry = DeletionLog(
                    user_id=f.user_id,
                    file_id=f.id,
                    file_name=f.original_name,
                    file_size=f.file_size,
                    s3_key=f.s3_key,
                    reason="expired",
                    status="success"
                )
                db.add(log_entry)
                await db.commit()

                # Atomically decrement storage usage
                await quota_service.record_deletion_atomic(db, f.user_id, f.file_size)
                files_deleted += 1
                logger.info(f"[Retention Cleanup] Successfully deleted expired file {f.id} from cloud and database.")
            else:
                # Safe failure handling: reset status so it can be retried; do NOT delete DB record
                f.status = "deletion_failed"
                log_entry = DeletionLog(
                    user_id=f.user_id,
                    file_id=f.id,
                    file_name=f.original_name,
                    file_size=f.file_size,
                    s3_key=f.s3_key,
                    reason="expired",
                    status="failed",
                    error_message="Cloud storage deletion attempt failed or timed out."
                )
                db.add(log_entry)
                await db.commit()
                files_failed += 1
                logger.error(f"[Retention Cleanup] Failed to delete file {f.id} from cloud storage. Retaining DB record for retry.")

        return {
            "status": "completed",
            "timestamp": now.isoformat(),
            "notifications_48h": notifications_sent_48h,
            "notifications_24h": notifications_sent_24h,
            "expired_files_deleted": files_deleted,
            "failed_deletions": files_failed
        }

    finally:
        if close_db_after:
            await db.close()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(run_retention_cleanup())
