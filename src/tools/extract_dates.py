import re
from typing import List

def extract_dates(text: str) -> List[str]:
    """
    Extract various human-readable date formats.
    """
    pattern = r"""
        \b(?:                             # Start boundary
            \d{1,2}(?:st|nd|rd|th)?        # 1st, 2nd, 3rd, 10th etc.
            (?:\s+day\s+of)?               # optional 'day of'
            \s+\w+\s*,?\s*\d{4}            # August, 2025 or August 2025
            |
            \w+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4}  # August 1, 2025 or August 1st, 2025
            |
            \d{4}-\d{2}-\d{2}              # ISO format: 2025-08-01
            |
            \d{1,2}/\d{1,2}/\d{4}          # 01/08/2025
        )\b                                # End boundary
    """
    return re.findall(pattern, text, re.IGNORECASE | re.VERBOSE)
