"""Checks the grammar row notes: every official row has a note, and example sentences
use only characters from the note's level and below.

Usage: python3 scripts/check-grammar.py [level ...]
"""
import json
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
chars = {}
for level in range(1, 8):
    words = json.loads((root / f"src/data/hsk3/level-{level}.json").read_text(encoding="utf8"))
    chars[level] = {c for w in words for c in w["h"]}
han = re.compile(r"\p{Han}" if False else r"[㐀-鿿]")

ok = True
for level in [int(a) for a in sys.argv[1:]] or range(2, 8):
    allowed = set().union(*(chars[n] for n in range(1, level + 1)))
    rows = json.loads((root / f"src/data/grammar/syllabus/level-{level}.json").read_text(encoding="utf8"))
    notes = json.loads((root / f"src/data/grammar/notes/level-{level}.json").read_text(encoding="utf8"))
    seen = {n["i"] for n in notes}
    missing = [i for i in range(len(rows)) if i not in seen]
    extra = [n["i"] for n in notes if n["i"] >= len(rows)]
    dupes = len(notes) - len(seen)
    print(f"level {level}: {len(seen)}/{len(rows)} rows explained" + (f", missing {missing}" if missing else "") + (f", bad index {extra}" if extra else "") + (f", {dupes} duplicates" if dupes else ""))
    for n in notes:
        for ex in n["e"]:
            if len(ex) != 4 or not all(ex):
                ok = False
                print(f"  row {n['i']}: incomplete example {ex}")
                continue
            off = sorted({c for c in ex[0] if han.match(c) and c not in allowed})
            if off:
                print(f"  row {n['i']}: above level: {''.join(off)} in {ex[0]}")
        for key in ("t", "x"):
            if len(n[key]) != 2 or not all(n[key]):
                ok = False
                print(f"  row {n['i']}: missing {key}")
    if missing or extra or dupes:
        ok = False
sys.exit(0 if ok else 1)
