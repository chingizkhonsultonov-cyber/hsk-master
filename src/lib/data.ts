import "server-only";
import level1 from "@/data/hsk2/level-1.json";
import level2 from "@/data/hsk2/level-2.json";
import level3 from "@/data/hsk2/level-3.json";
import level4 from "@/data/hsk2/level-4.json";
import level5 from "@/data/hsk2/level-5.json";
import level6 from "@/data/hsk2/level-6.json";
import type { Word } from "./types";

const LEVELS: Record<number, Word[]> = {
  1: level1, 2: level2, 3: level3, 4: level4, 5: level5, 6: level6,
} as Record<number, Word[]>;

export const LEVEL_NUMBERS = [1, 2, 3, 4, 5, 6] as const;

export function getLevel(level: number): Word[] {
  const words = LEVELS[level];
  if (!words) throw new Error(`Unknown HSK level ${level}`);
  return words;
}

export function lessonCount(level: number): number {
  const words = getLevel(level);
  return words[words.length - 1].lesson;
}

export function getLesson(level: number, lesson: number): Word[] {
  return getLevel(level).filter((w) => w.lesson === lesson);
}

export function levelSummary(level: number) {
  const words = getLevel(level);
  return { level, words: words.length, lessons: lessonCount(level) };
}

export function parseLevel(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 6 ? n : null;
}

export function levelParams() {
  return LEVEL_NUMBERS.map((n) => ({ level: String(n) }));
}
