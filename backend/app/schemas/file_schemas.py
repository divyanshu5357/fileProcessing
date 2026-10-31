from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class UploadInitiateRequest(BaseModel):
    file_name: str
    file_size: int
    content_type: str
    folder_id: Optional[str] = None
    is_multipart: bool = False

class UploadInitiateResponse(BaseModel):
    file_id: str
    s3_key: str
    upload_url: Optional[str] = None
    upload_id: Optional[str] = None
    is_multipart: bool
    part_size: int = 5242880 # 5 MB min

class MultipartPartUrlRequest(BaseModel):
    s3_key: str
    upload_id: str
    part_number: int

class MultipartPartUrlResponse(BaseModel):
    part_number: int
    part_url: str

class S3Part(BaseModel):
    PartNumber: int
    ETag: str

class MultipartCompleteRequest(BaseModel):
    file_id: str
    s3_key: str
    upload_id: str
    parts: List[S3Part]
    original_name: str
    file_size: int
    content_type: str
    folder_id: Optional[str] = None

class FileResponse(BaseModel):
    id: str
    user_id: str
    folder_id: Optional[str]
    original_name: str
    mime_type: str
    file_extension: str
    file_size: int
    s3_key: str
    status: str
    created_at: datetime

class FolderCreateRequest(BaseModel):
    folder_name: str
    parent_folder_id: Optional[str] = None

class FolderResponse(BaseModel):
    id: str
    user_id: str
    parent_folder_id: Optional[str]
    folder_name: str
    created_at: datetime
