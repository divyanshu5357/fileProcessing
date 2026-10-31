from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class JobCreateRequest(BaseModel):
    file_id: str
    operation: str
    input_s3_key: str

class JobResponse(BaseModel):
    id: str
    user_id: str
    file_id: Optional[str]
    operation: str
    job_status: str
    progress: int
    input_s3_key: str
    output_s3_key: Optional[str]
    created_at: datetime
    error_message: Optional[str] = None
