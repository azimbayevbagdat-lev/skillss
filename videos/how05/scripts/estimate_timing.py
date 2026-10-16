"""Placeholder timing until the real how05.mp3 voiceover exists.

Assumes a steady Kazakh narration pace (130 ms per syllable) with short pauses
at punctuation. Replace by running align.py on the real recording.
Usage: python3 -I scripts/estimate_timing.py
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOWELS = set("аәеиоөуұүыіэюяёaeiouy")
MS_PER_SYL = 0.130
PAUSE = {"sentence": 0.38, "comma": 0.22, "dash": 0.26}

text = re.search(r"`([\s\S]*)`", (ROOT / "src/script.ts").read_text(encoding="utf8")).group(1)
tokens = text.split()
words, t = [], 0.25
for i, tok in enumerate(tokens):
    if tok == "—":
        t += PAUSE["dash"]
        continue
    syl = max(1, sum(c in VOWELS for c in tok.lower()))
    if tok.strip("«»").isupper() and len(tok) > 3:
        syl += 1  # spelled-out brand words run a little longer
    d = syl * MS_PER_SYL
    words.append({"text": tok, "start": round(t, 3), "end": round(t + d, 3)})
    t += d
    if tok[-1] in ".?!":
        t += PAUSE["sentence"]
    elif tok[-1] in ",:":
        t += PAUSE["comma"]
(ROOT / "src/timing.json").write_text(json.dumps(
    {"duration": round(t, 3), "method": "estimate (no voiceover yet)", "hasVoice": False,
     "words": words}, ensure_ascii=False, indent=1), encoding="utf8")
print(f"{len(words)} words, estimated narration {t:.1f}s")
