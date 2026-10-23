#!/usr/bin/env python3
"""Records every word, sentence and dialogue line the app can play, with a free neural Mandarin voice.

    python scripts/audio.py OUT_DIR            # records what is missing, writes OUT_DIR/index.json
    python scripts/audio.py OUT_DIR --list     # only prints how many clips there are
    python scripts/audio.py OUT_DIR --index    # only rewrites OUT_DIR/index.json from the clips present

Each clip is OUT_DIR/<key>.mp3, where <key> is the same cyrb53 hash that src/lib/speech.ts computes
(audioKey). A single character is keyed with its pinyin, and when it has more than one
reading, a homophone that has only that reading is recorded instead (行 háng → 航).
Needs: pip install edge-tts pypinyin
"""
import asyncio
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data"
VOICES = {"": "zh-CN-XiaoxiaoNeural", "m": "zh-CN-YunxiNeural"}
HAN = re.compile(r"[一-鿿]")


def imul(a, b):
    return (a * b) & 0xFFFFFFFF


def cyrb53(s):
    h1, h2 = 0xDEADBEEF, 0x41C6CE57
    units = s.encode("utf-16-le")
    for i in range(0, len(units), 2):
        ch = units[i] | (units[i + 1] << 8)
        h1 = imul(h1 ^ ch, 2654435761)
        h2 = imul(h2 ^ ch, 1597334677)
    h1 = imul(h1 ^ (h1 >> 16), 2246822507)
    h1 ^= imul(h2 ^ (h2 >> 13), 3266489909)
    h2 = imul(h2 ^ (h2 >> 16), 2246822507)
    h2 ^= imul(h1 ^ (h1 >> 13), 3266489909)
    return format(4294967296 * (2097151 & h2) + h1, "x")


def norm_py(py):
    return unicodedata.normalize("NFC", py).strip().lower()


def audio_key(text, py=None, voice=""):
    k = text.strip()
    if py and len(k) == 1:
        k += "|" + norm_py(py)
    if voice:
        k = voice + ":" + k
    return cyrb53(k)


def clips():
    """(key, text, voice, py) for everything a listen button can play, mirroring the call sites."""
    out = {}

    def add(text, py=None, voice=""):
        text = text.strip()
        if text and HAN.search(text):
            out.setdefault(audio_key(text, py, voice), (text, voice, py if len(text) == 1 else None))

    for n in range(1, 8):
        # Word lists, flashcards, lesson tests and the writing page's teaching words.
        for w in json.loads((DATA / "hsk3" / f"level-{n}.json").read_text()):
            add(w["h"], w["p"])
            # Tone drill: each character with its syllable in the word (alignHanzi in src/lib/pinyin.ts).
            chars, syl = list(w["h"]), w["p"].split()
            for i, c in enumerate(chars):
                if HAN.match(c):
                    add(c, syl[i] if len(syl) == len(chars) else w["p"])
        for s in json.loads((DATA / "sentences" / f"level-{n}.json").read_text()):
            add("".join(s["s"]))
        for topic in json.loads((DATA / "dialogues" / f"level-{n}.json").read_text()):
            for d in topic["d"]:
                for line in d["l"]:
                    add(line[1], voice="m" if line[0] % 2 else "")
    for zh in re.findall(r'zh:\s*"([^"]+)"', (DATA / "hskk-questions.ts").read_text()):
        add(zh)
    return out


def homophones():
    """Maps a toned syllable to characters that have only that reading, commonest (HSK) first."""
    from pypinyin import Style, pinyin

    order = re.search(r"=\s*(\{.*\})", (DATA / "level-chars.ts").read_text(), re.S)
    chars = "".join(json.loads(order.group(1)).values()) if order else ""
    table = {}
    for c in dict.fromkeys(chars):
        readings = pinyin(c, style=Style.TONE, heteronym=True)[0]
        if len(readings) == 1:
            table.setdefault(norm_py(readings[0]), c)
    return table


def spoken(text, py, table):
    """The text to send to the voice: a single character whose default reading differs is swapped for a homophone."""
    if not py or len(text) != 1:
        return text
    from pypinyin import Style, pinyin

    want = norm_py(py)
    if not re.search(r"[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]", want):
        return text  # neutral tone: nothing better to record
    readings = pinyin(text, style=Style.TONE, heteronym=True)[0]
    if len(readings) == 1:
        return text
    # Several readings: the voice may pick any of them, so record a character that has only this one.
    return table.get(want, text)


async def record(out_dir, items):
    import edge_tts

    sem = asyncio.Semaphore(6)
    failed = []

    async def one(key, text, voice):
        path = out_dir / f"{key}.mp3"
        async with sem:
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(text, VOICES[voice]).save(str(path))
                    if path.stat().st_size > 0:
                        return
                except Exception as e:  # noqa: BLE001 - retried, then reported
                    err = e
                await asyncio.sleep(2 ** attempt)
            path.unlink(missing_ok=True)
            failed.append((text, repr(err) if "err" in locals() else "empty"))

    done = 0
    tasks = [asyncio.create_task(one(*it)) for it in items]
    for t in asyncio.as_completed(tasks):
        await t
        done += 1
        if done % 500 == 0:
            print(f"{done}/{len(items)}", flush=True)
    return failed


def write_index(out_dir, all_clips):
    keys = sorted(k for k in all_clips if (out_dir / f"{k}.mp3").exists())
    (out_dir / "index.json").write_text(json.dumps(keys, separators=(",", ":")))
    return keys


def main():
    out_dir = Path(sys.argv[1])
    all_clips = clips()
    if "--list" in sys.argv:
        print(len(all_clips), "clips")
        return
    out_dir.mkdir(parents=True, exist_ok=True)
    if "--index" in sys.argv:
        write_index(out_dir, all_clips)
        return
    table = homophones()
    todo = [(k, spoken(t, py, table), v) for k, (t, v, py) in all_clips.items() if not (out_dir / f"{k}.mp3").exists()]
    print(f"{len(all_clips)} clips, {len(todo)} to record", flush=True)
    failed = asyncio.run(record(out_dir, todo)) if todo else []
    for text, err in failed[:20]:
        print("failed:", text, err)
    keys = write_index(out_dir, all_clips)
    print(f"{len(keys)} recorded, {len(failed)} failed")
    if len(failed) > len(all_clips) // 20:
        sys.exit(1)


if __name__ == "__main__":
    main()
