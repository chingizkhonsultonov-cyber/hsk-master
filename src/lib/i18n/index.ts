import en, { type Dictionary } from "./en";
import ru from "./ru";
import type { Locale } from "../types";

export const LOCALES: Locale[] = ["en", "ru"];
export const DICTIONARIES: Record<Locale, Dictionary> = { en, ru };

export function isLocale(x: string): x is Locale {
  return (LOCALES as string[]).includes(x);
}

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/** Replaces {name} placeholders. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** Russian plural for "N strokes/words" style labels: 1 черта, 2 черты, 5 черт. */
export function ruPlural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export type { Dictionary };

/** Picks the right plural form: English [one, other], Russian [one, few, many]. */
export function count(forms: string[], n: number, locale: Locale): string {
  let form: string;
  if (locale === "ru" && forms.length === 3) form = ruPlural(n, forms[0], forms[1], forms[2]);
  else form = n === 1 ? forms[0] : forms[forms.length - 1];
  return fmt(form, { n: n.toLocaleString(locale === "ru" ? "ru-RU" : "en-US") });
}
