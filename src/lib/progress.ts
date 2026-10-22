"use client";

import { useSyncExternalStore } from "react";

/**
 * Learning progress, stored on the device. Every record carries `updatedAt`
 * so it can later be merged with the Supabase copy (newest record wins).
 */
export interface WordProgress {
  /** Leitner box 0–7; 0 = seen but not yet recalled */
  box: number;
  /** epoch ms when the word is next due */
  due: number;
  right: number;
  wrong: number;
  updatedAt: number;
}

export interface WritingProgress {
  /** fewest mistakes in a full quiz of the character */
  best: number;
  attempts: number;
  updatedAt: number;
}

export interface ProgressState {
  version: 1;
  words: Record<string, WordProgress>;
  writing: Record<string, WritingProgress>;
  tests: Record<string, { best: number; total: number; updatedAt: number }>;
  /** set by "Reset all progress"; synced records older than this are dropped */
  resetAt?: number;
}

const KEY = "hsk-master:progress:v1";
const DAY = 86_400_000;
const INTERVAL_DAYS = [0, 1, 2, 4, 8, 16, 32, 64];
const EMPTY: ProgressState = { version: 1, words: {}, writing: {}, tests: {} };

let state: ProgressState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ProgressState;
      if (parsed?.version === 1) state = { ...EMPTY, ...parsed };
    }
  } catch {
    /* storage blocked: progress lives in memory for this visit */
  }
}

function commit(next: ProgressState) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    loaded = false;
    load();
    listeners.forEach((l) => l());
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getProgress(): ProgressState {
  load();
  return state;
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, getProgress, () => EMPTY);
}

export type Grade = "again" | "hard" | "good" | "easy";

export function nextReview(p: WordProgress | undefined, grade: Grade, now = Date.now()): WordProgress {
  const box = p?.box ?? 0;
  const base = { right: p?.right ?? 0, wrong: p?.wrong ?? 0, updatedAt: now };
  switch (grade) {
    case "again":
      return { ...base, box: 1, due: now + 5 * 60_000, wrong: base.wrong + 1 };
    case "hard": {
      const b = Math.max(1, box);
      return { ...base, box: b, due: now + Math.max(0.5, INTERVAL_DAYS[b] / 2) * DAY, right: base.right + 1 };
    }
    case "good": {
      const b = Math.min(7, box + 1);
      return { ...base, box: b, due: now + INTERVAL_DAYS[b] * DAY, right: base.right + 1 };
    }
    case "easy": {
      const b = Math.min(7, box + 2);
      return { ...base, box: b, due: now + INTERVAL_DAYS[b] * DAY, right: base.right + 1 };
    }
  }
}

/** Interval the learner will see on each rating button, in days (fractions allowed). */
export function intervalDays(p: WordProgress | undefined, grade: Grade): number {
  const n = nextReview(p, grade, 0);
  return n.due / DAY;
}

export function rateWord(id: string, grade: Grade) {
  const s = getProgress();
  commit({ ...s, words: { ...s.words, [id]: nextReview(s.words[id], grade) } });
}

/** A test answer counts as a light review: wrong resets the word, right nudges it forward once per day. */
export function recordAnswer(id: string, correct: boolean) {
  const s = getProgress();
  const p = s.words[id];
  if (!correct) return rateWord(id, "again");
  if (p && p.due > Date.now()) {
    commit({ ...s, words: { ...s.words, [id]: { ...p, right: p.right + 1, updatedAt: Date.now() } } });
    return;
  }
  rateWord(id, "good");
}

export function recordTest(key: string, score: number, total: number) {
  const s = getProgress();
  const prev = s.tests[key];
  commit({ ...s, tests: { ...s.tests, [key]: { best: Math.max(prev?.best ?? 0, score), total, updatedAt: Date.now() } } });
}

export function recordWriting(char: string, mistakes: number) {
  const s = getProgress();
  const prev = s.writing[char];
  commit({
    ...s,
    writing: {
      ...s.writing,
      [char]: { best: Math.min(prev?.best ?? Infinity, mistakes), attempts: (prev?.attempts ?? 0) + 1, updatedAt: Date.now() },
    },
  });
}

export function resetProgress() {
  commit({ ...EMPTY, resetAt: Date.now() });
}

/** Listen for any change to progress (used by cloud sync). */
export const onProgressChange = subscribe;

/** Replace progress with a merged copy (used by cloud sync). */
export function replaceProgress(next: ProgressState) {
  commit(next);
}

function mergeRecords<T extends { updatedAt: number }>(a: Record<string, T>, b: Record<string, T>, after: number): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [k, v] of [...Object.entries(a), ...Object.entries(b)]) {
    if (v.updatedAt < after) continue;
    if (!out[k] || out[k].updatedAt < v.updatedAt) out[k] = v;
  }
  return out;
}

/** Combines two copies of progress: per word, character and test the newest record wins; a reset clears older records. */
export function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  const resetAt = Math.max(a.resetAt ?? 0, b.resetAt ?? 0);
  return {
    version: 1,
    words: mergeRecords(a.words, b.words, resetAt),
    writing: mergeRecords(a.writing, b.writing, resetAt),
    tests: mergeRecords(a.tests, b.tests, resetAt),
    ...(resetAt ? { resetAt } : {}),
  };
}

/** A word counts as learned once it has been recalled correctly on two separate reviews (box ≥ 2). */
export function isLearned(p: WordProgress | undefined) {
  return !!p && p.box >= 2;
}

export function isDue(p: WordProgress | undefined, now = Date.now()) {
  return !!p && p.due <= now;
}
