#!/usr/bin/env python3
"""Finds Russian translations on Tatoeba for the app's sentences (src/data/sentences), directly linked
to the Chinese sentence or through its English translation. Writes {tatoeba id: Russian} to OUT.

    python scripts/tatoeba-ru.py DOWNLOADS_DIR OUT.json
DOWNLOADS_DIR holds cmn-rus_links.tsv, cmn-eng_links.tsv, eng-rus_links.tsv and rus_sentences.tsv
from https://downloads.tatoeba.org/exports/per_language/ (CC BY 2.0 FR).
"""
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
dl, out = Path(sys.argv[1]), Path(sys.argv[2])
csv.field_size_limit(10**7)


def links(name):
    m = defaultdict(list)
    with open(dl / name, encoding="utf-8") as f:
        for row in csv.reader(f, delimiter="\t"):
            m[int(row[0])].append(int(row[1]))
    return m


ids = set()
for n in range(1, 8):
    ids |= {s["i"] for s in json.loads((ROOT / "src/data/sentences" / f"level-{n}.json").read_text())}
cmn_rus, cmn_eng, eng_rus = links("cmn-rus_links.tsv"), links("cmn-eng_links.tsv"), links("eng-rus_links.tsv")
rus = {}
with open(dl / "rus_sentences.tsv", encoding="utf-8") as f:
    for row in csv.reader(f, delimiter="\t", quoting=csv.QUOTE_NONE):
        rus[int(row[0])] = row[2]
res, direct = {}, 0
for i in ids:
    cand = [r for r in cmn_rus.get(i, []) if r in rus]
    if cand:
        direct += 1
    else:
        cand = [r for e in cmn_eng.get(i, []) for r in eng_rus.get(e, []) if r in rus]
    if cand:
        res[i] = rus[min(cand)]
out.write_text(json.dumps(res, ensure_ascii=False, sort_keys=True, indent=0))
print(f"{len(ids)} sentences, {len(res)} with Russian ({direct} direct)")
