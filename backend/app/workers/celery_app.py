import sys
from pathlib import Path

# Ensure repository root is on sys.path
_current = Path(__file__).resolve()
_backend_dir = _current.parents[2]
_repo_root = _backend_dir.parent
for _p in [str(_repo_root), str(_backend_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

import logging
from backend.app.core.config import settings

logger = logging.getLogger("gyanvatsala.celery")

try:
    from celery import Celery
    celery_app = Celery(
        "gyanvatsala_worker",
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
