import re
from typing import List

def extract_parties(text: str) -> List[str]:
    """
    Extracts party names from legal agreements like NDAs.
    Handles multiple common legal phrasing patterns.
    """
    parties = set()

    # Pattern 1: 'between X and Y'
    pattern_between = r'\bbetween\s+(.*?)\s+and\s+(.*?)(?:\.|,|\n|$)'
    for match in re.findall(pattern_between, text, flags=re.IGNORECASE):
        a, b = match
        parties.add(a.strip())
        parties.add(b.strip())

    # Pattern 2: 'by and between X and Y'
    pattern_by_between = r'\bby and between\s+(.*?)\s+and\s+(.*?)(?:\.|,|\n|$)'
    for match in re.findall(pattern_by_between, text, flags=re.IGNORECASE):
        a, b = match
        parties.add(a.strip())
        parties.add(b.strip())

    # Pattern 3: Quoted entities, e.g. "Alpha Tech Solutions Pvt. Ltd."
    quoted_entities = re.findall(r'"([^"]+?)"', text)
    for entity in quoted_entities:
        if any(keyword in entity.lower() for keyword in ['party', 'company', 'llp', 'inc', 'ltd', 'corporation']):
            parties.add(entity.strip())

    # Pattern 4: Label-based extraction
    role_patterns = [
        r'(?:Disclosing|Receiving)\s+Party:?\s*(.*?)\s*(?:\.|,|\n|$)',
        r'(.*?)\s*\((?:Disclosing|Receiving) Party\)',
    ]
    for pattern in role_patterns:
        for match in re.findall(pattern, text, flags=re.IGNORECASE):
            if match.strip():
                parties.add(match.strip())

    return list(parties)
