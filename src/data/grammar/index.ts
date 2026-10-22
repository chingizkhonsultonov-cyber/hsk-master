import notes1 from "./notes-1";
import s1 from "./syllabus/level-1.json";
import s2 from "./syllabus/level-2.json";
import s3 from "./syllabus/level-3.json";
import s4 from "./syllabus/level-4.json";
import s5 from "./syllabus/level-5.json";
import s6 from "./syllabus/level-6.json";
import s7 from "./syllabus/level-7.json";
import r1 from "./notes/level-1.json";
import r2 from "./notes/level-2.json";
import r3 from "./notes/level-3.json";
import r4 from "./notes/level-4.json";
import r5 from "./notes/level-5.json";
import r6 from "./notes/level-6.json";
import r7 from "./notes/level-7.json";
import d1 from "./notes/detail-1.json";
import d2 from "./notes/detail-2.json";
import d3 from "./notes/detail-3.json";
import d4 from "./notes/detail-4.json";
import d5 from "./notes/detail-5.json";
import d6 from "./notes/detail-6.json";
import d7 from "./notes/detail-7.json";

export interface Example {
  zh: string;
  py: string;
  en: string;
  ru: string;
}

/** A grammar point explained for learners, with examples. */
export interface GrammarPoint {
  id: string;
  title: { zh: string; en: string; ru: string };
  structure: string;
  explain: { en: string; ru: string };
  examples: Example[];
  warning?: { en: string; ru: string };
}

/** One row of the official syllabus grammar list: category, category name, sub-item, content. */
export interface SyllabusItem {
  c: string;
  n: string;
  s: string;
  v: string;
}

/**
 * A short explanation attached to one row of the official list (by its index):
 * title, pattern, explanation, examples as [zh, pinyin, en, ru], and an optional exam warning.
 */
export interface RowNote {
  i: number;
  t: [string, string];
  f?: string;
  x: [string, string];
  e: [string, string, string, string][];
  w?: [string, string];
  /** When to use it, negative and question forms, and how it differs from similar patterns. */
  u?: [string, string];
  q?: [string, string];
  c?: [string, string];
}

/** Detailed additions to a row note: usage, forms, comparison and more examples. */
type RowDetail = Pick<RowNote, "i" | "e" | "u" | "q" | "c">;

const NOTES: Record<number, GrammarPoint[]> = { 1: notes1 };
const ROW_NOTES: Record<number, RowNote[]> = { 1: r1, 2: r2, 3: r3, 4: r4, 5: r5, 6: r6, 7: r7 } as unknown as Record<number, RowNote[]>;
const DETAILS: Record<number, RowDetail[]> = { 1: d1, 2: d2, 3: d3, 4: d4, 5: d5, 6: d6, 7: d7 } as unknown as Record<number, RowDetail[]>;
const SYLLABUS: Record<number, SyllabusItem[]> = { 1: s1, 2: s2, 3: s3, 4: s4, 5: s5, 6: s6, 7: s7 };

export function getGrammar(level: number): GrammarPoint[] {
  return NOTES[level] ?? [];
}

export function getSyllabusGrammar(level: number): SyllabusItem[] {
  return SYLLABUS[level] ?? [];
}

/** Explanations for rows of the official list, keyed by row index. */
export function getRowNotes(level: number): Map<number, RowNote> {
  const detail = new Map((DETAILS[level] ?? []).map((d) => [d.i, d]));
  return new Map(
    (ROW_NOTES[level] ?? []).map((n) => {
      const d = detail.get(n.i);
      return [n.i, d ? { ...n, u: d.u, q: d.q, c: d.c, e: [...n.e, ...d.e] } : n];
    }),
  );
}

/** How many grammar items of the level have an explanation. */
export function explainedCount(level: number): number {
  return Math.max(getRowNotes(level).size, getGrammar(level).length);
}
