import json
import re
from typing import Optional

def extract_json(text: str) -> Optional[dict]:
    if not text:
        return None

    # Find all {...} blocks (non-greedy)
    matches = re.findall(r"\{[\s\S]*?\}", text)

    for block in matches:
        try:
            return json.loads(block)
        except json.JSONDecodeError:
            continue

    return None
