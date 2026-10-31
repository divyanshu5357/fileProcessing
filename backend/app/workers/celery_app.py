import logging
from backend.app.core.config import settings

logger = logging.getLogger("pixelkit.celery")

try:
    from celery import Celery
    celery_app = Celery(
        "pixelkit_worker",
        broker=settings.REDIS_URL,
        backend=settings.CELERY_RESULT_BACKEND,
        include=["backend.app.workers.tasks"]
    )

    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        task_track_started=True,
        task_time_limit=600,
        task_soft_time_limit=540,
        worker_concurrency=settings.CELERY_WORKER_CONCURRENCY,
        worker_prefetch_multiplier=1,
        task_routes={
            "backend.app.workers.tasks.process_pdf_task": {"queue": "pdf_queue"},
            "backend.app.workers.tasks.process_image_task": {"queue": "image_queue"},
            "backend.app.workers.tasks.process_ocr_task": {"queue": "ocr_queue"},
        }
    )
except ImportError:
    logger.warning("Celery is not installed in the current environment; running in fallback mode.")
    class MockCelery:
        def task(self, *args, **kwargs):
            def decorator(f):
                f.delay = f
                return f
            return decorator
    celery_app = MockCelery()
