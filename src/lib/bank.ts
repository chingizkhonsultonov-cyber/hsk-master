"use client";

import { useEffect, useState } from "react";
import type { Word } from "./types";
import { BASE } from "@/lib/base";
import { useI18n } from "@/lib/i18n/client";

export type BankWord = Pick<Word, "id" | "h" | "p" | "en" | "ru" | "lesson">;

/** A graded Tatoeba sentence: tokens, pinyin per token, HSK word id per token (null for punctuation), English, Russian. */
export interface Sentence {
  i: number;
  s: string[];
  p: string[];
  k: (string | null)[];
  e: string;
  r?: string;
}

const cache = new Map<string, Promise<unknown>>();

function load<T>(url: string): Promise<T> {
  let p = cache.get(url);
  if (!p) {
    p = fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${url}: ${r.status}`))));
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p as Promise<T>;
}

export const loadWords = (slug: string) => load<BankWord[]>(`${BASE}/data/words/${slug}`);
export const loadSentences = (slug: string) => load<Sentence[]>(`${BASE}/data/sentences/${slug}`);

export interface Bank {
  words: BankWord[];
  sentences: Sentence[];
}

/** Loads the level's words and sentences once per page; `error` is set if either request fails.
 * In Russian, each sentence's translation `e` is the Russian one, so drills and answer options follow the interface language. */
export function useBank(slug: string) {
  const { locale } = useI18n();
  const [bank, setBank] = useState<Bank | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    Promise.all([loadWords(slug), loadSentences(slug)])
      .then(([words, sentences]) => live && setBank({ words, sentences: locale === "ru" ? sentences.map((s) => (s.r ? { ...s, e: s.r } : s)) : sentences }))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, [slug, locale]);
  return { bank, error };
}

export const sentenceText = (s: Sentence) => s.s.join("");
