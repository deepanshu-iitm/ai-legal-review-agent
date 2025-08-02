import re
from typing import List

def clean_text(text: str) -> str:
    # Remove excessive whitespace
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def chunk_text(text: str, max_chunk_size: int = 500) -> List[str]:
    words = text.split()
    chunks = []

    for i in range(0, len(words), max_chunk_size):
        chunk = " ".join(words[i:i + max_chunk_size])
        chunks.append(chunk)

    return chunks
