import re
from typing import List

def extract_parties(text: str) -> List[str]:
    """
    Attempts to extract party names from legal agreements like NDAs.
    Looks for patterns like 'This Agreement is made between X and Y' or 'by and between X ("Disclosing Party") and Y ("Receiving Party")'
    """
    parties = []

    # Pattern 1: "between [Party A] and [Party B]"
    pattern1 = r'between\s+(.*?)\s+and\s+(.*?)(?:,|\n|\.|$)'
    matches1 = re.findall(pattern1, text, flags=re.IGNORECASE)
    for a, b in matches1:
        parties.extend([a.strip(), b.strip()])

    # Pattern 2: "by and between [Party A] and [Party B]"
    pattern2 = r'by and between\s+(.*?)\s+and\s+(.*?)(?:,|\n|\.|$)'
    matches2 = re.findall(pattern2, text, flags=re.IGNORECASE)
    for a, b in matches2:
        parties.extend([a.strip(), b.strip()])

    return list(set(parties))  # Deduplicate
