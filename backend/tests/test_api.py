import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "pixelkit-api"

def test_readiness_check():
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert "database" in data

def test_single_part_upload_initiation():
    payload = {
        "file_name": "contract.pdf",
        "file_size": 1024 * 1024 * 2, # 2MB
        "content_type": "application/pdf",
        "is_multipart": False
    }
    response = client.post("/api/uploads/initiate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_multipart"] is False
    assert "upload_url" in data
    assert data["file_id"].startswith("fil_")

def test_multipart_upload_for_large_file():
    payload = {
        "file_name": "large_archive.pdf",
        "file_size": 1024 * 1024 * 50, # 50MB
        "content_type": "application/pdf",
        "is_multipart": False
    }
    response = client.post("/api/uploads/initiate", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Large files automatically use multipart S3 upload
    assert data["is_multipart"] is True
    assert "upload_id" in data

def test_queue_processing_job():
    payload = {
        "file_id": "fil_test_123",
        "operation": "PDF Compression & Linearization",
        "input_s3_key": "users/usr_test/originals/doc.pdf"
    }
    response = client.post("/api/processing/queue", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["job_status"] == "queued"
    assert data["progress"] == 0

def test_download_presigned_url():
    response = client.get("/api/downloads/fil_test_123")
    assert response.status_code == 200
    data = response.json()
    assert "download_url" in data
    assert data["file_id"] == "fil_test_123"
