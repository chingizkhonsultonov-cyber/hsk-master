import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getLevel } from "./data";
import { LEVEL_NUMBERS } from "./levels";
import type { Example, Word } from "./types";

const sentences = new Map<number, Example[]>();

function levelSentences(level: number): Example[] {
  let s = sentences.get(level);
  if (!s) {
    const file = path.join(process.cwd(), "src/data/sentences", `level-${level}.json`);
    s = (JSON.parse(readFileSync(file, "utf8")) as (Example & { i: number })[]).map(({ s, p, k, e, r }) => ({ s, p, k, e, r }));
    sentences.set(level, s);
  }
  return s;
}

let order: Map<string, number> | null = null;

/** Position of every word in the course (level, then lesson), so "already learned" is a simple comparison. */
function courseOrder() {
  if (!order) {
    order = new Map();
    for (const l of LEVEL_NUMBERS) for (const w of getLevel(l)) order.set(w.id, l * 1000 + w.lesson);
  }
  return order;
}

/**
 * Up to `per` example sentences for each word of a lesson. Sentences that use only words learned up to
 * this lesson come first, then shorter ones; a sentence is shown for one word only.
 */
export function lessonExamples(level: number, words: Word[], per = 2): Record<string, Example[]> {
  const pos = courseOrder();
  const here = level * 1000 + (words[0]?.lesson ?? 0);
  const unknown = (x: Example) => x.k.filter((id) => id && (pos.get(id) ?? Infinity) > here).length;
  const all = levelSentences(level);
  const used = new Set<Example>();
  const out: Record<string, Example[]> = {};
  for (const w of words) {
    const picks = all
      .filter((x) => x.k.includes(w.id) && !used.has(x))
      .map((x) => ({ x, u: unknown(x), n: x.s.join("").length }))
      .sort((a, b) => a.u - b.u || a.n - b.n)
      .slice(0, per)
      .map((c) => c.x);
    picks.forEach((x) => used.add(x));
    if (picks.length) out[w.id] = picks;
  }
  return out;
}
