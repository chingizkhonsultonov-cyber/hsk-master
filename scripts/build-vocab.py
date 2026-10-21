"""Build per-level vocabulary for the 2025 HSK 3.0 syllabus (新版HSK考试大纲, levels 1–6 and 7–9).

Inputs, all in one raw folder:
  k25/w{1,2,3,4,5,6,7-9}.txt  official word lists, one word per line; homographs carry a number (打1, 打2)
                              https://github.com/krmanik/HSK-3.0-words-list  (New HSK (2025)/HSK Words)
  ced/package/cedict.json     CC-CEDICT (CC BY-SA 4.0), npm package cedict-json
  complete.json               word frequency ranks, https://github.com/drkameleon/complete-hsk-vocabulary (MIT)
Pinyin: the CC-CEDICT reading that agrees with pypinyin's phrase reading of the word.
Curated English/Russian glosses: scripts/glosses/hsk3-<level>.tsv (word, pinyin, English, Russian).
Usage: python3 scripts/build-vocab.py <raw dir>
"""
import json, pathlib, re, sys, unicodedata
from pypinyin import pinyin as py_reading, Style

raw = pathlib.Path(sys.argv[1])
root = pathlib.Path(__file__).resolve().parent.parent
out_dir = root / "src/data/hsk3"
out_dir.mkdir(parents=True, exist_ok=True)

LEVEL_FILES = ["1", "2", "3", "4", "5", "6", "7-9"]
LESSON_SIZE = {1: 15, 2: 15, 3: 20, 4: 25, 5: 30, 6: 30, 7: 40}

TONE_MARKS = {"a": "āáǎà", "e": "ēéěè", "i": "īíǐì", "o": "ōóǒò", "u": "ūúǔù", "ü": "ǖǘǚǜ"}

def numeric_to_marks(syl):
    s = syl.replace("u:", "ü").replace("v", "ü")
    m = re.fullmatch(r"([A-Za-zü]+)([1-5])", s)
    if not m:
        return s
    base, tone = m.group(1), int(m.group(2))
    if tone == 5:
        return base
    low = base.lower()
    if "a" in low: idx = low.index("a")
    elif "e" in low: idx = low.index("e")
    elif "ou" in low: idx = low.index("o")
    else:
        idx = max(i for i, ch in enumerate(low) if ch in "aeiouü")
    ch = base[idx]
    marked = TONE_MARKS[ch.lower()][tone - 1]
    if ch.isupper():
        marked = marked.upper()
    return base[:idx] + marked + base[idx + 1:]

def cedict_pinyin(p):
    return " ".join(numeric_to_marks(s) for s in p.split())

def strip(p):
    return unicodedata.normalize("NFC", "".join(ch for ch in unicodedata.normalize("NFD", p.lower()) if ch not in "̄́̌̀")).replace(" ", "")

def same_reading(a, b):
    sa, sb = a.lower().split(), b.lower().split()
    if len(sa) != len(sb):
        return strip(a) == strip(b)
    for x, y in zip(sa, sb):
        if strip(x) != strip(y):
            return False
        if x != y and x != strip(x) and y != strip(y):  # both toned and different
            return False
    return True

def split_like(joined, spaced):
    """Splits an official joined reading (bàba, nǚ'ér, méi(yǒu)) into the syllables of the dictionary reading."""
    letters = [c for c in unicodedata.normalize("NFC", joined) if c not in "'’() "]
    sizes = [len(strip(s)) for s in spaced.split()]
    if sum(sizes) != len(letters) or strip("".join(letters)) != strip(spaced):
        return spaced
    out, i = [], 0
    for n in sizes:
        out.append("".join(letters[i:i + n]))
        i += n
    return " ".join(out)

ced = {}
for e in json.loads((raw / "ced/package/cedict.json").read_text(encoding="utf8")):
    ced.setdefault(e["simplified"], []).append(e)

freq = {}
for w in json.loads((raw / "complete.json").read_text(encoding="utf8")):
    freq.setdefault(w["simplified"], w.get("frequency", 99999))

def load_glosses(level):
    f = root / "scripts/glosses" / f"hsk3-{level}.tsv"
    out = {}
    if f.exists():
        for line in f.read_text(encoding="utf8").splitlines():
            if line.strip() and not line.startswith("#"):
                word, py, en, ru = line.split("\t")
                out.setdefault(word, []).append((py, en.split("; "), ru.split("; ")))
    return out

def clean_meanings(lines):
    out, classifiers = [], []
    for m in lines:
        for part in m.split(";" if "CL:" not in m else "\x00"):
            part = part.strip()
            if part.startswith("CL:"):
                classifiers += [c.split("|")[-1].split("[")[0] for c in part[3:].split(",")]
                continue
            if not part or re.match(r"^(variant of|old variant|see |also written|used in|surname |abbr\. |\(bound form\) )", part):
                continue
            if part not in out:
                out.append(part)
    return out[:5], classifiers

report, all_chars = [], {}
for li, lf in enumerate(LEVEL_FILES, start=1):
    entries = [w.strip() for w in (raw / f"k25/w{lf}.txt").read_text(encoding="utf8").splitlines() if w.strip()]
    glosses = load_glosses(li)
    words, no_dict = [], 0
    for n, entry in enumerate(entries, start=1):
        sense = int(m.group(1)) if (m := re.search(r"(\d+)$", entry)) else None
        label = re.sub(r"\d+$", "", entry).strip()
        full = re.sub(r"[（）()]", "", label)            # 没（有） -> 没有
        short = re.sub(r"[（(][^）)]*[）)]", "", label)   # 没（有） -> 没
        guess = " ".join(s[0] for s in py_reading(full, style=Style.TONE, heteronym=False, neutral_tone_with_five=False))
        cands = [e for e in ced.get(full, []) if not e["pinyin"][:1].isupper()] or ced.get(full, [])
        # Among readings that agree with pypinyin (neutral tones count as agreeing), prefer an exact match,
        # then the one with more neutral syllables: dictionaries list 东西 dōngxi and 吧 ba that way.
        agree = [e for e in cands if same_reading(cedict_pinyin(e["pinyin"]), guess)]
        agree.sort(key=lambda e: (cedict_pinyin(e["pinyin"]).lower() != guess.lower(), -e["pinyin"].count("5")))
        neutral_first = sorted(agree, key=lambda e: -e["pinyin"].count("5"))
        chosen = (neutral_first[0] if neutral_first and neutral_first[0]["pinyin"].count("5") else (agree[0] if agree else None))
        if chosen is None and cands:
            chosen = cands[0]
        if chosen is None:
            no_dict += 1
        p = cedict_pinyin(chosen["pinyin"]) if chosen else guess
        same = [e for e in cands if chosen and e["pinyin"].lower() == chosen["pinyin"].lower()]
        en, cl = clean_meanings([m for e in same for m in e["english"]]) if same else ([], [])
        g = glosses[entry].pop(0) if glosses.get(entry) else None
        ru = []
        if g:
            if g[0]:
                # split the official reading along whichever dictionary reading has the same letters
                options = [p] + [cedict_pinyin(e["pinyin"]) for e in ced.get(full, [])]
                fit = next((o for o in options if strip(o) == strip(g[0].replace("(", "").replace(")", "").replace("'", ""))), None)
                p = split_like(g[0], fit) if fit else (g[0] if len(full) == 1 else p)
            dict_en = en
            en, ru = g[1], g[2]
        else:
            dict_en = en
        words.append({
            "id": f"3-{li}-{n}",
            "h": full,
            "label": label if label != full else None,
            "p": p,
            "t": chosen["traditional"] if chosen else full,
            "en": en,
            "ru": ru,
            "dict": [x for x in dict_en if x not in en][:4],
            "cl": cl[:3],
            "sense": sense,
            "freq": freq.get(full, freq.get(short, 99999)),
        })
        for ch in full:
            if "一" <= ch <= "鿿":
                all_chars.setdefault(li, [])
                if ch not in all_chars[li]:
                    all_chars[li].append(ch)
    ordered = sorted(words, key=lambda w: (w["freq"], int(w["id"].split("-")[2])))
    for i, w in enumerate(ordered):
        w["lesson"] = i // LESSON_SIZE[li] + 1
        if w["label"] is None:
            del w["label"]
        if w["sense"] is None:
            del w["sense"]
    (out_dir / f"level-{li}.json").write_text(json.dumps(ordered, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
    report.append(f"HSK {lf}: {len(words)} words, {ordered[-1]['lesson']} lessons, {no_dict} not in CC-CEDICT, {sum(1 for w in words if w['ru'])} with Russian")

(root / "src/data/level-chars.ts").write_text(
    "/** Unique characters per level (1–6, 7 = levels 7–9). Generated by scripts/build-vocab.py. */\n"
    "export const LEVEL_CHARS: Record<number, string> = " + json.dumps({k: "".join(v) for k, v in all_chars.items()}, ensure_ascii=False) + ";\n",
    encoding="utf8",
)
print("\n".join(report))
