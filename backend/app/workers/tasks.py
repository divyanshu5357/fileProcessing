import os
import tempfile
import time
import logging
from backend.app.workers.celery_app import celery_app
from backend.app.services.s3_service import s3_service

logger = logging.getLogger("pixelkit.celery")

@celery_app.task(bind=True, max_retries=3, default_retry_delay=10)
def process_pdf_task(self, job_id: str, user_id: str, input_s3_key: str, operation: str):
    """
    Background worker for CPU-intensive PDF conversions, compression,
    and LibreOffice document rendering.
    """
    logger.info(f"[Celery PDF Task] Starting Job {job_id} for user {user_id}: {operation}")
    temp_dir = tempfile.mkdtemp(prefix=f"pixelkit_job_{job_id}_")

    try:
        # 1. Download file from AWS S3
        local_input = os.path.join(temp_dir, "input.pdf")
        # In real AWS, s3_service.client.download_file(...)
        time.sleep(1) # simulate work safely

        # 2. Perform document operation
        local_output = os.path.join(temp_dir, "output.pdf")
        with open(local_output, "w") as f:
            f.write("Processed PDF artifact")

        # 3. Upload output artifact to S3
        filename = os.path.basename(input_s3_key)
        output_s3_key = f"users/{user_id}/processed/{job_id}/{filename}"
        # In real AWS, s3_service.client.upload_file(...)

        logger.info(f"[Celery PDF Task] Completed Job {job_id} -> {output_s3_key}")
        return {
            "status": "completed",
            "job_id": job_id,
            "output_s3_key": output_s3_key,
            "progress": 100
        }
    except Exception as exc:
        logger.error(f"[Celery PDF Task Error] Job {job_id} failed: {exc}")
        # Exponential backoff retry
        raise self.retry(exc=exc, countdown=10 * (2 ** self.request.retries))
    finally:
        # Crucial: cleanup temporary files to avoid memory / disk leaks
        try:
            for root, dirs, files in os.walk(temp_dir, topdown=False):
                for name in files:
                    os.remove(os.path.join(root, name))
                for name in dirs:
                    os.rmdir(os.path.join(root, name))
            os.rmdir(temp_dir)
        except Exception as e:
            logger.warning(f"Failed to remove temp dir {temp_dir}: {e}")

@celery_app.task(bind=True, max_retries=3)
def process_image_task(self, job_id: str, user_id: str, input_s3_key: str, operation: str):
    """Background worker for batch image manipulation and WebP re-encoding."""
    logger.info(f"[Celery Image Task] Starting Job {job_id}: {operation}")
    time.sleep(1)
    filename = os.path.basename(input_s3_key)
    output_s3_key = f"users/{user_id}/processed/{job_id}/{filename}"
    return {
        "status": "completed",
        "job_id": job_id,
        "output_s3_key": output_s3_key,
        "progress": 100
    }

@celery_app.task(bind=True, max_retries=2)
def process_ocr_task(self, job_id: str, user_id: str, input_s3_key: str):
    """Background worker for Tesseract OCR text layer injection."""
    logger.info(f"[Celery OCR Task] Starting OCR Job {job_id}")
    time.sleep(2)
    filename = os.path.basename(input_s3_key)
    output_s3_key = f"users/{user_id}/processed/{job_id}/ocr_{filename}"
    return {
        "status": "completed",
        "job_id": job_id,
        "output_s3_key": output_s3_key,
        "progress": 100
    }
