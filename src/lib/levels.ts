/**
 * Levels of the 2025 HSK 3.0 syllabus. Levels 7–9 share one word list and one exam,
 * so the app treats them as a single level, numbered 7 internally and shown as "7–9".
 */
export const LEVEL_NUMBERS = [1, 2, 3, 4, 5, 6, 7] as const;

export function levelSlug(level: number): string {
  return level === 7 ? "7-9" : String(level);
}

export function levelName(level: number): string {
  return level === 7 ? "HSK 7–9" : `HSK ${level}`;
}

export function parseLevel(raw: string): number | null {
  if (raw === "7-9") return 7;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 6 ? n : null;
}

/** Word ids follow the official list order: 3-<level>-<n> */
export function wordId(level: number, n: number) {
  return `3-${level}-${n}`;
}

/** The number part of the level name: "3", or "7–9". */
export function levelNumber(level: number): string {
  return level === 7 ? "7–9" : String(level);
}
