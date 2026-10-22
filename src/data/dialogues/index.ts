import d1 from "./level-1.json";
import d2 from "./level-2.json";
import d3 from "./level-3.json";
import d4 from "./level-4.json";
import d5 from "./level-5.json";
import d6 from "./level-6.json";
import d7 from "./level-7.json";

/** One spoken line: speaker index, Chinese, pinyin, English, Russian. */
export type Line = [number, string, string, string, string];
export interface Dialogue {
  /** Situation title [en, ru]. */
  t: [string, string];
  /** Speakers as [Chinese name or role, pinyin]. */
  s: [string, string][];
  l: Line[];
}
export interface Topic {
  id: string;
  t: [string, string];
  d: Dialogue[];
}

const ALL = { 1: d1, 2: d2, 3: d3, 4: d4, 5: d5, 6: d6, 7: d7 } as unknown as Record<number, Topic[]>;

export function getDialogues(level: number): Topic[] {
  return ALL[level] ?? [];
}
