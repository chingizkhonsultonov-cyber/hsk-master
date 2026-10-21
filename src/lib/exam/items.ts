import { shuffle } from "../random";
import { stripTones, syllables } from "../pinyin";
import type { Bank, BankWord, Sentence } from "../bank";

/**
 * Exam-style questions generated from the graded sentence bank. Every call draws new
 * sentences and new distractors, so no two sets are the same.
 *
 * Kinds, by exam section:
 *   listening: judge (does the text match what you heard), hearSentence (pick the sentence you heard),
 *              hearWord (pick the word you heard)
 *   reading:   gap (choose the word for the blank), order (choose the correctly ordered sentence),
 *              meaning (choose the translation)
 *   writing:   arrange (put the words in order), typeChar (write the missing character from pinyin)
 */
export type Kind = "judge" | "hearSentence" | "hearWord" | "gap" | "order" | "meaning" | "arrange" | "typeChar";
export type Section = "listening" | "reading" | "writing";

export const SECTION_KINDS: Record<Section, Kind[]> = {
  listening: ["judge", "hearSentence", "hearWord"],
  reading: ["gap", "order", "meaning"],
  writing: ["arrange", "typeChar"],
};

interface Base {
  /** unique within a set */
  key: string;
  kind: Kind;
  sentence: Sentence;
}
export interface ChoiceItem extends Base {
  kind: "judge" | "hearSentence" | "hearWord" | "gap" | "order" | "meaning";
  /** shown text for judge; the sentence with a blank for gap */
  prompt?: string;
  options: string[];
  answer: number;
  /** index of the blanked token (gap) */
  blank?: number;
}
export interface ArrangeItem extends Base {
  kind: "arrange";
  tiles: string[];
  /** every token order accepted as correct (the original plus any other bank sentence with the same tokens) */
  accepted: string[];
  end: string;
}
export interface TypeItem extends Base {
  kind: "typeChar";
  /** token index and character index of the missing character */
  token: number;
  char: number;
  answer: string;
  pinyin: string;
}
export type Item = ChoiceItem | ArrangeItem | TypeItem;

const PUNCT = /^[，。！？、；：“”‘’（）《》…—,.!?;:]+$/;
const isPunct = (t: string) => PUNCT.test(t);
const text = (s: Sentence) => s.s.join("");
const charLen = (t: string) => [...t].length;

/** Facts about the bank used to keep distractors wrong: which word pairs occur next to each other, and every sentence. */
export interface Index {
  bigrams: Set<string>;
  texts: Set<string>;
  byTokens: Map<string, string[]>;
  levelWords: BankWord[];
}

export function indexBank(bank: Bank): Index {
  const bigrams = new Set<string>();
  const texts = new Set<string>();
  const byTokens = new Map<string, string[]>();
  for (const s of bank.sentences) {
    texts.add(text(s));
    for (let i = 1; i < s.s.length; i++) bigrams.add(s.s[i - 1] + "|" + s.s[i]);
    const words = s.s.filter((t) => !isPunct(t));
    const bag = [...words].sort().join("|");
    byTokens.set(bag, [...(byTokens.get(bag) ?? []), words.join("")]);
  }
  return { bigrams, texts, byTokens, levelWords: bank.words.filter((w) => !w.h.includes("…")) };
}

/** A replacement word is a safe distractor only if it never appears next to the same neighbours anywhere in the bank. */
function plausible(ix: Index, s: Sentence, at: number, word: string) {
  const left = s.s[at - 1];
  const right = s.s[at + 1];
  return (left !== undefined && ix.bigrams.has(left + "|" + word)) || (right !== undefined && ix.bigrams.has(word + "|" + right));
}

/** Content tokens worth testing: HSK words of at least one character that aren't punctuation; level words first. */
function targets(s: Sentence, levelIds: Set<string>) {
  const idx = s.s.map((_, i) => i).filter((i) => s.k[i] && !isPunct(s.s[i]));
  const own = idx.filter((i) => levelIds.has(s.k[i]!));
  return own.length ? own : idx;
}

const INITIAL = /^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?(.*)$/;

/** How alike two words sound: same toneless syllable 3, otherwise same initial or same final 1 each, per syllable. */
function soundScore(a: string, b: string) {
  const x = syllables(a).map((t) => stripTones(t).toLowerCase());
  const y = syllables(b).map((t) => stripTones(t).toLowerCase());
  if (x.length !== y.length) return 0;
  let score = 0;
  x.forEach((sx, i) => {
    if (sx === y[i]) score += 3;
    else {
      const [, ix0, fx] = INITIAL.exec(sx)!;
      const [, iy0, fy] = INITIAL.exec(y[i])!;
      if (ix0 && ix0 === iy0) score += 1;
      if (fx && fx === fy) score += 1;
    }
  });
  return score;
}

/** Listening distractors sound like the right word, so the question tests hearing, not guessing. */
function distractorWords(ix: Index, s: Sentence, at: number, n: number, sound = false): string[] {
  const right = s.s[at];
  const len = charLen(right);
  const inSentence = new Set(s.s);
  const out: string[] = [];
  const sameLen = ix.levelWords.filter((w) => charLen(w.h) === len);
  const byScore = sound && s.p[at]
    ? shuffle(sameLen).map((w) => ({ w, sc: soundScore(s.p[at], w.p) })).sort((a, b) => b.sc - a.sc).map((x) => x.w)
    : shuffle(sameLen);
  const pools = [byScore, ix.levelWords];
  for (const pool of pools) {
    for (const w of pool === byScore ? pool : shuffle(pool)) {
      if (out.length >= n) return out;
      if (w.h === right || inSentence.has(w.h) || out.includes(w.h) || plausible(ix, s, at, w.h)) continue;
      // A homophone can't be told apart by ear.
      if (sound && w.p.replace(/\s/g, "") === s.p[at].replace(/\s/g, "")) continue;
      const swapped = s.s.map((t, i) => (i === at ? w.h : t)).join("");
      if (ix.texts.has(swapped)) continue;
      out.push(w.h);
    }
  }
  return out;
}

function withOptions<T extends Omit<ChoiceItem, "options" | "answer">>(item: T, right: string, wrong: string[]): (T & { options: string[]; answer: number }) | null {
  if (wrong.length < 3) return null;
  const options = shuffle([right, ...wrong.slice(0, 3)]);
  return { ...item, options, answer: options.indexOf(right) };
}

let serial = 0;
const key = (kind: Kind, s: Sentence) => `${kind}-${s.i}-${++serial}`;

function makeJudge(ix: Index, s: Sentence, levelIds: Set<string>): ChoiceItem | null {
  const same = Math.random() < 0.5;
  let shown = text(s);
  if (!same) {
    const at = shuffle(targets(s, levelIds))[0];
    if (at === undefined) return null;
    const [d] = distractorWords(ix, s, at, 1, true);
    if (!d) return null;
    shown = s.s.map((t, i) => (i === at ? d : t)).join("");
  }
  return { key: key("judge", s), kind: "judge", sentence: s, prompt: shown, options: ["✓", "✗"], answer: same ? 0 : 1 };
}

function makeHearSentence(ix: Index, s: Sentence, levelIds: Set<string>): ChoiceItem | null {
  const at = shuffle(targets(s, levelIds))[0];
  if (at === undefined) return null;
  const wrong = distractorWords(ix, s, at, 3, true).map((d) => s.s.map((t, i) => (i === at ? d : t)).join(""));
  return withOptions({ key: key("hearSentence", s), kind: "hearSentence" as const, sentence: s }, text(s), wrong);
}

function makeHearWord(ix: Index, s: Sentence, levelIds: Set<string>): ChoiceItem | null {
  const at = shuffle(targets(s, levelIds))[0];
  if (at === undefined) return null;
  return withOptions({ key: key("hearWord", s), kind: "hearWord" as const, sentence: s }, s.s[at], distractorWords(ix, s, at, 3, true));
}

function makeGap(ix: Index, s: Sentence, levelIds: Set<string>): ChoiceItem | null {
  const at = shuffle(targets(s, levelIds))[0];
  if (at === undefined) return null;
  const prompt = s.s.map((t, i) => (i === at ? "＿＿" : t)).join("");
  return withOptions({ key: key("gap", s), kind: "gap" as const, sentence: s, prompt, blank: at }, s.s[at], distractorWords(ix, s, at, 3));
}

/** Wrong orders swap two neighbouring words where the new pairings never occur in the bank. */
function makeOrder(ix: Index, s: Sentence): ChoiceItem | null {
  const words = s.s.filter((t) => !isPunct(t));
  if (words.length < 4) return null;
  const right = text(s);
  const wrong = new Set<string>();
  for (const i of shuffle(s.s.map((_, i) => i).slice(0, -1))) {
    if (wrong.size >= 3) break;
    const a = s.s[i];
    const b = s.s[i + 1];
    if (isPunct(a) || isPunct(b) || a === b) continue;
    const t = [...s.s];
    [t[i], t[i + 1]] = [b, a];
    const left = t[i - 1];
    const after = t[i + 2];
    if (ix.bigrams.has(b + "|" + a) || (left && ix.bigrams.has(left + "|" + b)) || (after && ix.bigrams.has(a + "|" + after))) continue;
    const joined = t.join("");
    if (joined !== right && !ix.texts.has(joined)) wrong.add(joined);
  }
  return withOptions({ key: key("order", s), kind: "order" as const, sentence: s }, right, [...wrong]);
}

function makeMeaning(bank: Bank, s: Sentence): ChoiceItem | null {
  const len = s.e.length;
  const others = shuffle(bank.sentences.filter((o) => o.i !== s.i && o.e !== s.e && Math.abs(o.e.length - len) < 15)).slice(0, 3).map((o) => o.e);
  return withOptions({ key: key("meaning", s), kind: "meaning" as const, sentence: s }, s.e, others);
}

function makeArrange(ix: Index, s: Sentence): ArrangeItem | null {
  const words = s.s.filter((t) => !isPunct(t));
  if (words.length < 3 || words.length > 7) return null;
  const end = s.s[s.s.length - 1] && isPunct(s.s[s.s.length - 1]) ? s.s[s.s.length - 1] : "";
  let tiles = shuffle(words);
  for (let g = 0; g < 5 && tiles.join("") === words.join(""); g++) tiles = shuffle(words);
  const accepted = ix.byTokens.get([...words].sort().join("|")) ?? [words.join("")];
  return { key: key("arrange", s), kind: "arrange", sentence: s, tiles, accepted, end };
}

function makeType(s: Sentence, levelIds: Set<string>): TypeItem | null {
  const at = shuffle(targets(s, levelIds))[0];
  if (at === undefined || !s.p[at]) return null;
  const chars = [...s.s[at]];
  const syl = s.p[at].split(" ");
  if (syl.length !== chars.length) return null;
  const c = Math.floor(Math.random() * chars.length);
  return { key: key("typeChar", s), kind: "typeChar", sentence: s, token: at, char: c, answer: chars[c], pinyin: syl[c] };
}

export function makeItem(kind: Kind, bank: Bank, ix: Index, s: Sentence, levelIds: Set<string>): Item | null {
  switch (kind) {
    case "judge": return makeJudge(ix, s, levelIds);
    case "hearSentence": return makeHearSentence(ix, s, levelIds);
    case "hearWord": return makeHearWord(ix, s, levelIds);
    case "gap": return makeGap(ix, s, levelIds);
    case "order": return makeOrder(ix, s);
    case "meaning": return makeMeaning(bank, s);
    case "arrange": return makeArrange(ix, s);
    case "typeChar": return makeType(s, levelIds);
  }
}

/**
 * Draws `n` questions of the given kinds (dealt evenly in random order) from random sentences,
 * never using a sentence twice in one set and skipping sentences listed in `avoid`.
 */
export function makeSet(bank: Bank, ix: Index, kinds: Kind[], n: number, avoid: Set<number> = new Set()): Item[] {
  const levelIds = new Set(bank.words.map((w) => w.id));
  const deal: Kind[] = [];
  while (deal.length < n) deal.push(...shuffle(kinds));
  const fresh = shuffle(bank.sentences.filter((s) => !avoid.has(s.i)));
  const pool = fresh.length >= n * 3 ? fresh : [...fresh, ...shuffle(bank.sentences.filter((s) => avoid.has(s.i)))];
  const used = new Set<number>();
  const out: Item[] = [];
  let cursor = 0;
  for (const kind of deal.slice(0, n)) {
    for (let tries = 0; tries < 40 && cursor < pool.length; tries++, cursor++) {
      const s = pool[cursor];
      if (used.has(s.i)) continue;
      const item = makeItem(kind, bank, ix, s, levelIds);
      if (item) {
        used.add(s.i);
        out.push(item);
        cursor++;
        break;
      }
    }
  }
  return out;
}

/** Recently used sentence ids per level and purpose, so consecutive sets use different sentences. */
const RECENT_KEY = "hsk-master:recent-sentences:v1";

export function recentSentences(scope: string): Set<number> {
  try {
    return new Set(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "{}")[scope] ?? []);
  } catch {
    return new Set();
  }
}

export function rememberSentences(scope: string, ids: number[], keep: number) {
  try {
    const all = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "{}");
    all[scope] = [...ids, ...(all[scope] ?? [])].slice(0, keep);
    localStorage.setItem(RECENT_KEY, JSON.stringify(all));
  } catch {
    // Private mode: sets stay random, without the hold-back.
  }
}

/** Correctness of a finished answer, for every kind. */
export function isCorrect(item: Item, answer: unknown): boolean {
  if (item.kind === "arrange") return typeof answer === "string" && item.accepted.includes(answer);
  if (item.kind === "typeChar") return typeof answer === "string" && answer.trim() === item.answer;
  return answer === item.answer;
}
