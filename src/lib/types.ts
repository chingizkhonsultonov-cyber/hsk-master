export type Locale = "en" | "ru";

export interface Word {
  id: string;
  /** simplified hanzi */
  h: string;
  /** pinyin with tone marks, one syllable per character */
  p: string;
  /** traditional form */
  t: string;
  en: string[];
  ru: string[];
  /** further dictionary senses (CC-CEDICT) */
  dict: string[];
  cl: string[];
  pos: string[];
  freq: number;
  lesson: number;
}

export function meaning(w: Word, locale: Locale): string[] {
  return locale === "ru" && w.ru.length ? w.ru : w.en;
}

export function hasNativeMeaning(w: Word, locale: Locale): boolean {
  return locale === "en" || w.ru.length > 0;
}
