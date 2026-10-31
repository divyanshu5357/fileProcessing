# ------------------------------------------------------------------------------
# PixelKit Backend Dockerfile (FastAPI & Celery Worker)
# ------------------------------------------------------------------------------
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for document processing & OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libreoffice \
    tesseract-ocr \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/

EXPOSE 8000

# Default command runs the FastAPI server
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
