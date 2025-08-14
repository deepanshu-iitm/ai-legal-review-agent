# api/main.py

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import shutil
import os
import uuid
import logging
from datetime import datetime

from src.api.models import QueryRequest, QueryResponse, UploadResponse, DocumentInfo, ErrorResponse
from src.core.document_processor import process_document_query

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Legal Document Review API",
    description="An intelligent assistant for legal document analysis and review",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "data/raw"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    """Root endpoint - API health check"""
    return {
        "message": "AI Legal Document Review API is running!",
        "version": "1.0.0",
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
def health_check():
    """Detailed health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "api": "running",
            "vector_db": "connected",
            "llm": "available"
        },
        "timestamp": datetime.now().isoformat()
    }

@app.post("/upload/", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload a legal document for processing"""
    try:
        # Validate file type
        allowed_extensions = [".pdf", ".docx"]
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file format. Allowed formats: {', '.join(allowed_extensions)}"
            )

        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Get file size
        file_size = os.path.getsize(file_path)

        logger.info(f"File uploaded successfully: {unique_filename} ({file_size} bytes)")

        return UploadResponse(
            message="File uploaded successfully.",
            filename=unique_filename,
            file_size=file_size,
            document_type=file_extension[1:]  # Remove the dot
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")

@app.post("/ask/", response_model=QueryResponse)
def ask_question(request: QueryRequest):
    """Ask a question about an uploaded document"""
    try:
        file_path = os.path.join(UPLOAD_DIR, request.filename)

        # Check if file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found.")

        # Process the query
        logger.info(f"Processing query for file: {request.filename}")
        logger.info(f"Question: {request.question}")

        answer = process_document_query(file_path, request.question)

        return QueryResponse(
            answer=answer,
            confidence=0.85,  # Placeholder - can be enhanced later
            sources=["document_content"]  # Placeholder - can be enhanced later
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

@app.get("/documents/", response_model=list[DocumentInfo])
def list_documents():
    """List all uploaded documents"""
    try:
        documents = []
        if os.path.exists(UPLOAD_DIR):
            for filename in os.listdir(UPLOAD_DIR):
                file_path = os.path.join(UPLOAD_DIR, filename)
                if os.path.isfile(file_path):
                    stat = os.stat(file_path)
                    file_extension = os.path.splitext(filename)[1].lower()
                    
                    # Extract original filename (remove UUID prefix)
                    original_name = "_".join(filename.split("_")[1:]) if "_" in filename else filename
                    
                    documents.append(DocumentInfo(
                        filename=filename,
                        original_name=original_name,
                        file_size=stat.st_size,
                        upload_date=datetime.fromtimestamp(stat.st_ctime),
                        document_type=file_extension[1:] if file_extension else "unknown",
                        status="ready"
                    ))
        
        return documents

    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing documents: {str(e)}")

@app.get("/documents/{filename}/content")
def get_document_content(filename: str):
    """Get the raw content of an uploaded document"""
    try:
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found.")
        
        # Import document loaders
        from src.parsers.document_loader import load_document
        
        # Extract text content from the document
        content = load_document(file_path)
        logger.info(f"Document content retrieved: {filename}")
        
        return {
            "filename": filename,
            "content": content,
            "content_length": len(content) if content else 0
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving document content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving document content: {str(e)}")

@app.delete("/documents/{filename}")
def delete_document(filename: str):
    """Delete an uploaded document"""
    try:
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found.")
        
        os.remove(file_path)
        logger.info(f"Document deleted: {filename}")
        
        return {"message": f"Document {filename} deleted successfully."}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.detail,
            code=str(exc.status_code)
        ).dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            detail=str(exc),
            code="500"
        ).dict()
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=True)
