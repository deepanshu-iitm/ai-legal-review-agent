from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class QueryRequest(BaseModel):
    filename: str
    question: str

class QueryResponse(BaseModel):
    answer: str
    confidence: Optional[float] = None
    sources: Optional[List[str]] = None

class UploadResponse(BaseModel):
    message: str
    filename: str
    file_size: Optional[int] = None
    document_type: Optional[str] = None

class DocumentInfo(BaseModel):
    filename: str
    original_name: str
    file_size: int
    upload_date: datetime
    document_type: str
    status: str  # "processing", "ready", "error"

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None
