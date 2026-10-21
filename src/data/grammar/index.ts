import hsk1 from "./hsk2-1";

export interface Example {
  zh: string;
  py: string;
  en: string;
  ru: string;
}

export interface GrammarPoint {
  id: string;
  title: { zh: string; en: string; ru: string };
  structure: string;
  explain: { en: string; ru: string };
  examples: Example[];
  warning?: { en: string; ru: string };
}

const GRAMMAR: Record<number, GrammarPoint[]> = { 1: hsk1 };

export function getGrammar(level: number): GrammarPoint[] {
  return GRAMMAR[level] ?? [];
}
