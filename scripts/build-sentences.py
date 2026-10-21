"""Build graded example sentences for each HSK level from Tatoeba.

Inputs:
  <raw>/tat/package/sentences.json   Tatoeba Mandarin–English pairs (CC BY 2.0 FR, https://tatoeba.org),
                                     npm package tatoeba-sentence-pairs-in-mandarin-chinese-english
  src/data/hsk3/level-*.json         the word lists built by build-vocab.py

A sentence belongs to the lowest level whose words cover it completely: it is segmented
into HSK words (longest match), and any piece that is not an HSK word must be made of
single-character HSK words. Sentences with names, Latin letters or digits are dropped.

Output: src/data/sentences/level-{1..7}.json, each entry
  {"i": tatoeba id, "s": [tokens], "p": [pinyin per token], "k": [word id or null], "e": English}

Usage: python3 scripts/build-sentences.py /home/claude/data-raw   (needs opencc-python-reimplemented)
"""
import json
import random
import re
import sys
from pathlib import Path

import opencc

raw = Path(sys.argv[1])
root = Path(__file__).resolve().parent.parent
out_dir = root / "src/data/sentences"
out_dir.mkdir(parents=True, exist_ok=True)

# Longest sentence (in characters) per level, roughly what each exam uses.
MAX_LEN = {1: 10, 2: 14, 3: 18, 4: 24, 5: 30, 6: 36, 7: 44}
CAP = {1: 1200, 2: 1500, 3: 2000, 4: 2500, 5: 2500, 6: 2500, 7: 3000}
PUNCT = set("，。！？、；：“”‘’（）《》…—,.!?;:")

words = {}  # hanzi -> (level, id, pinyin); the first (lowest) level wins
for level in range(1, 8):
    for w in json.loads((root / f"src/data/hsk3/level-{level}.json").read_text(encoding="utf8")):
        words.setdefault(w["h"], (level, w["id"], w["p"]))
MAX_WORD = max(len(h) for h in words)

t2s = opencc.OpenCC("t2s")


def segment(text):
    """Longest-match segmentation over the HSK word list; unknown characters come out singly."""
    out, i = [], 0
    while i < len(text):
        for n in range(min(MAX_WORD, len(text) - i), 0, -1):
            piece = text[i : i + n]
            if piece in words or n == 1:
                out.append(piece)
                i += n
                break
    return out


def grade(tokens):
    level = 1
    for tok in tokens:
        if tok in PUNCT:
            continue
        if tok not in words:
            return None
        level = max(level, words[tok][0])
    return level



pairs = json.loads((raw / "tat/package/sentences.json").read_text(encoding="utf8"))
by_zh = {}
for zid, zh, _eid, en in pairs:
    zh = t2s.convert(zh.strip()).replace(" ", "").translate(str.maketrans(",?!;:", "，？！；："))
    if re.search(r"[A-Za-z0-9０-９Ａ-Ｚａ-ｚ]", zh) or not re.search(r"[。！？]$", zh):
        continue
    entry = by_zh.setdefault(zh, {"i": int(zid), "e": en, "n": 0})
    entry["n"] += 1
    if len(en) < len(entry["e"]):
        entry["e"] = en

levels = {n: [] for n in range(1, 8)}
for zh, entry in by_zh.items():
    body = [c for c in zh if c not in PUNCT]
    if len(body) < 3:
        continue
    tokens = segment(zh)
    level = grade(tokens)
    if level is None or len(body) > MAX_LEN[level]:
        continue
    levels[level].append({
        "i": entry["i"],
        "s": tokens,
        "p": ["" if t in PUNCT else words[t][2] for t in tokens],
        "k": [None if t in PUNCT else words[t][1] for t in tokens],
        "e": entry["e"],
        "n": entry["n"],
    })

# Sentences with several English translations have been checked by more Tatoeba members: keep those first.
random.seed(2025)
for level, items in levels.items():
    random.shuffle(items)
    items.sort(key=lambda x: -x["n"])
    items = sorted(items[: CAP[level]], key=lambda x: x["i"])
    for x in items:
        del x["n"]
    (out_dir / f"level-{level}.json").write_text(json.dumps(items, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
    print(f"level {level}: {len(items)} sentences")
