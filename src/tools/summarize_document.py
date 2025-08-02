from typing import List

def summarize_document(chunks: List[str]) -> str:
    """
    Returns a simple summary from the full document.
    Uses a very basic heuristic for now — can be upgraded later.
    """
    summary_parts = []
    for chunk in chunks:
        if "Purpose" in chunk:
            summary_parts.append("Purpose: " + chunk.split("Purpose:")[1].split("\n")[0].strip())
        if "Confidential" in chunk:
            summary_parts.append("Confidential Info: " + chunk.split("Confidential")[1][:100].strip() + "...")
        if "Term" in chunk:
            summary_parts.append("Term: " + chunk.split("Term:")[1].split("\n")[0].strip())

    return "\n".join(summary_parts) if summary_parts else "No clear summary found."