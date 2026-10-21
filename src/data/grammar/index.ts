import notes1 from "./notes-1";
import s1 from "./syllabus/level-1.json";
import s2 from "./syllabus/level-2.json";
import s3 from "./syllabus/level-3.json";
import s4 from "./syllabus/level-4.json";
import s5 from "./syllabus/level-5.json";
import s6 from "./syllabus/level-6.json";
import s7 from "./syllabus/level-7.json";

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

const NOTES: Record<number, GrammarPoint[]> = { 1: notes1 };
const SYLLABUS: Record<number, SyllabusItem[]> = { 1: s1, 2: s2, 3: s3, 4: s4, 5: s5, 6: s6, 7: s7 };

export function getGrammar(level: number): GrammarPoint[] {
  return NOTES[level] ?? [];
}

export function getSyllabusGrammar(level: number): SyllabusItem[] {
  return SYLLABUS[level] ?? [];
}
