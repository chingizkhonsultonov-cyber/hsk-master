export type Locale = "en" | "ru";

export interface Word {
  id: string;
  /** simplified hanzi */
  h: string;
  /** the syllabus spelling when it differs, e.g. 没（有） */
  label?: string;
  /** homograph number in the syllabus (打1, 打2) */
  sense?: number;
  /** pinyin with tone marks, one syllable per character */
  p: string;
  /** traditional form */
  t: string;
  en: string[];
  ru: string[];
  /** further dictionary senses (CC-CEDICT) */
  dict: string[];
  cl: string[];
  freq: number;
  lesson: number;
}

export function meaning(w: Word, locale: Locale): string[] {
  return locale === "ru" && w.ru.length ? w.ru : w.en;
}

export function hasNativeMeaning(w: Word, locale: Locale): boolean {
  return locale === "en" || w.ru.length > 0;
}

/** An example sentence for a word: tokens, pinyin per token, word id per token, English and Russian. */
export interface Example {
  s: string[];
  p: string[];
  k: (string | null)[];
  e: string;
  r?: string;
}
