import re
from typing import List

def summarize_document(chunks: List[str]) -> str:
    """
    Extracts a basic summary of a legal document using keyword-based heuristics.
    Targets sections like Purpose, Confidentiality, Term, and Obligations.
    """
    summary = {}
    content = "\n".join(chunks)

    sections = {
        "Purpose": r"(Purpose(?: of (this )?Agreement)?)[\s:]*([\s\S]{0,500})",
        "Confidentiality": r"(Confidential(?:ity)?(?: Information)?)\s*[:\-–]?\s*([\s\S]{0,500})",
        "Term": r"(Term(?: and Termination)?)\s*[:\-–]?\s*([\s\S]{0,300})",
        "Obligations": r"(Obligations(?: of (the )?(Receiving|Disclosing) Party)?)\s*[:\-–]?\s*([\s\S]{0,300})"
    }

    for section, pattern in sections.items():
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            summary[section] = match.group(3 if section == "Purpose" else 2).strip().split("\n")[0][:300]

    if not summary:
        return "No clear summary sections found."

    return "\n\n".join(f"{key}:\n{value}" for key, value in summary.items())
