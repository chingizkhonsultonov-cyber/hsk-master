import { readFile } from "node:fs/promises";
import path from "node:path";
import { levelParams } from "@/lib/data";
import { parseLevel } from "@/lib/levels";

/** Graded example sentences (from Tatoeba) for one level, used by listening, reading, speaking and mock exams. */
export const dynamic = "force-static";

export function generateStaticParams() {
  return levelParams();
}

export async function GET(_req: Request, { params }: { params: Promise<{ level: string }> }) {
  const level = parseLevel((await params).level);
  if (!level) return new Response("Unknown level", { status: 404 });
  const file = path.join(process.cwd(), "src/data/sentences", `level-${level}.json`);
  return new Response(await readFile(file), { headers: { "content-type": "application/json; charset=utf-8" } });
}
