import os
from typing import Optional
from PyPDF2 import PdfReader
import docx

def load_document(file_path: str) -> Optional[str]:
    ext = os.path.splitext(file_path)[-1].lower()
    
    if ext == ".pdf":
        return load_pdf(file_path)
    elif ext == ".docx":
        return load_docx(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}")

def load_pdf(file_path: str) -> str:
    text = ""
    with open(file_path, "rb") as f:
        reader = PdfReader(f)
        for page in reader.pages:
            text += page.extract_text() or ""
    return text.strip()

def load_docx(file_path: str) -> str:
    doc = docx.Document(file_path)
    text = "\n".join([para.text for para in doc.paragraphs])
    return text.strip()