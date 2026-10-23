export type Tone = 1 | 2 | 3 | 4 | 5;

const MARKS: Record<string, Tone> = { "̄": 1, "́": 2, "̌": 3, "̀": 4 };
const MARK_FOR: Record<Tone, string> = { 1: "̄", 2: "́", 3: "̌", 4: "̀", 5: "" };

/** Tone of one pinyin syllable written with tone marks; unmarked syllables are neutral (5). */
export function toneOf(syllable: string): Tone {
  for (const ch of syllable.normalize("NFD")) if (MARKS[ch]) return MARKS[ch];
  return 5;
}

export function stripTones(s: string): string {
  return s.normalize("NFD").replace(/[̄́̌̀]/g, "").normalize("NFC");
}

/** Put a tone mark on a bare syllable using the standard placement rules. */
export function markSyllable(bare: string, tone: Tone): string {
  const s = stripTones(bare);
  let idx = s.search(/[ae]/i);
  if (idx < 0) idx = s.search(/o(?=u)/i);
  if (idx < 0) {
    const vowels = [...s.matchAll(/[iouü]/gi)];
    idx = vowels.length ? vowels[vowels.length - 1].index! : -1;
  }
  if (idx < 0) return s;
  return (s.slice(0, idx + 1) + MARK_FOR[tone]).normalize("NFC") + s.slice(idx + 1);
}

export function syllables(pinyin: string): string[] {
  return pinyin.trim().split(/\s+/);
}

/** Pairs each character with its syllable when the counts line up (they do for almost all HSK words). */
export function alignHanzi(hanzi: string, pinyin: string): { ch: string; syl?: string; tone: Tone }[] {
  const chars = [...hanzi];
  const syl = syllables(pinyin);
  if (chars.length !== syl.length) return chars.map((ch) => ({ ch, tone: 5 }));
  return chars.map((ch, i) => ({ ch, syl: syl[i], tone: toneOf(syl[i]) }));
}

/** Contour on the five-level pitch scale used for Mandarin. */
export const CONTOURS: Record<1 | 2 | 3 | 4, number[]> = { 1: [5, 5], 2: [3, 5], 3: [2, 1, 4], 4: [5, 1] };

/** Typed pinyin in a comparable form: "Ni3 hao3", "nǐhǎo" and "ni3hao3" all become "nǐhǎo"; v and u: become ü. */
export function normalizePinyin(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFC")
    .replace(/u:|v/g, "ü")
    .replace(/([a-zü]+)([1-5])/g, (_, bare: string, n: string) => markSyllable(bare, Number(n) as Tone))
    .replace(/[\s'’·-]/g, "")
    .normalize("NFC");
}

/** "right", "tones" when only the tone marks differ (or were left out), otherwise "wrong". */
export function checkPinyin(typed: string, answer: string): "right" | "tones" | "wrong" {
  const a = normalizePinyin(typed);
  const b = normalizePinyin(answer);
  if (!a) return "wrong";
  if (a === b) return "right";
  return stripTones(a) === stripTones(b) ? "tones" : "wrong";
}
