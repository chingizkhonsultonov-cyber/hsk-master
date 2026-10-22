"use client";

import { useEffect, useState } from "react";
import type { Word } from "./types";
import { BASE } from "@/lib/base";

export type BankWord = Pick<Word, "id" | "h" | "p" | "en" | "ru" | "lesson">;

/** A graded Tatoeba sentence: tokens, pinyin per token, HSK word id per token (null for punctuation), English. */
export interface Sentence {
  i: number;
  s: string[];
  p: string[];
  k: (string | null)[];
  e: string;
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

/** Loads the level's words and sentences once per page; `error` is set if either request fails. */
export function useBank(slug: string) {
  const [bank, setBank] = useState<Bank | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    Promise.all([loadWords(slug), loadSentences(slug)])
      .then(([words, sentences]) => live && setBank({ words, sentences }))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, [slug]);
  return { bank, error };
}

export const sentenceText = (s: Sentence) => s.s.join("");
