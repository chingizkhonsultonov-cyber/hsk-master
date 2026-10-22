"""Applies curated glosses (scripts/glosses/hsk3-<level>.tsv) to the built word lists in src/data/hsk3.

Each TSV line is: word as listed (with sense number) · pinyin (blank keeps the built reading) · English · Russian.
Lines follow the official list order, the same order build-vocab.py reads them in, so a word listed twice
takes its glosses in turn. Dictionary senses dropped by the curated English move to `dict`.

Usage: python3 scripts/apply-glosses.py [level ...]   (default 3–7; levels 1–2 were glossed when built and use spaced pinyin)
"""
import json
import pathlib
import sys

root = pathlib.Path(__file__).resolve().parent.parent

def key(w):
    return (w.get("label") or w["h"]) + (str(w["sense"]) if w.get("sense") else "")

TONES = {c: t for t, cs in enumerate(["āēīōūǖ", "áéíóúǘ", "ǎěǐǒǔǚ", "àèìòùǜ"], start=1) for c in cs}
NUMERIC = set("第十百千万唯统初独数")

def tone(syllable):
    return next((TONES[c] for c in syllable if c in TONES), 0)

def sandhi(h, p):
    """Writes 一 and 不 with their changed tones, as the official syllabus does: 一定 yí dìng, 不错 bú cuò."""
    syl = p.split(" ")
    if len(syl) != len(h):
        return p
    for i, ch in enumerate(h[:-1]):
        nxt = tone(syl[i + 1])
        if ch == "一" and syl[i] == "yī" and nxt and h[i + 1] not in "一月号" and (i == 0 or h[i - 1] not in NUMERIC):
            syl[i] = "yí" if nxt == 4 else "yì"
        elif ch == "不" and syl[i] == "bù" and nxt == 4:
            syl[i] = "bú"
    return " ".join(syl)

ok = True
for level in [int(a) for a in sys.argv[1:]] or range(3, 8):
    src = root / "scripts/glosses" / f"hsk3-{level}.tsv"
    lines = src.read_text(encoding="utf8").splitlines() if src.exists() else []
    rows = [l.split("\t") for l in lines if l.strip() and not l.startswith("#")]
    path = root / "src/data/hsk3" / f"level-{level}.json"
    words = json.loads(path.read_text(encoding="utf8"))
    order = sorted(words, key=lambda w: int(w["id"].split("-")[2]))
    for n, row in enumerate(rows):
        if len(row) != 4 or not row[2] or not row[3]:
            print(f"level {level} line {n + 2}: needs 4 columns: {row}")
            ok = False
            continue
        if n >= len(order) or key(order[n]) != row[0]:
            print(f"level {level} line {n + 2}: {row[0]} does not match {key(order[n]) if n < len(order) else 'end of list'}")
            ok = False
            break
        w = order[n]
        if row[1]:
            w["p"] = row[1]
        en, ru = row[2].split("; "), row[3].split("; ")
        if en != w["en"]:
            w["dict"] = [d for d in w["en"] + w["dict"] if d not in en][:4]
        w["en"], w["ru"] = en, ru
    if level >= 3:
        for w in words:
            w["p"] = sandhi(w["h"], w["p"])
    path.write_text(json.dumps(words, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
    print(f"level {level}: {min(len(rows), len(order))}/{len(order)} words glossed")
sys.exit(0 if ok else 1)
