from PyPDF2 import PdfReader
import os

def extract_text_from_pdf(pdf_path: str) -> str:
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"{pdf_path} does not exist.")

    reader = PdfReader(pdf_path)
    text = ""

    for page_num, page in enumerate(reader.pages):
        text += page.extract_text() or f"\n[Page {page_num+1}: No text found]\n"

    return text
