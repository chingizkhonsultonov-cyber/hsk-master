import { getLevel, levelParams } from "@/lib/data";
import { parseLevel } from "@/lib/levels";

/** The whole level as a compact list, fetched by the random practice page instead of being inlined into its HTML. */
export const dynamic = "force-static";

export function generateStaticParams() {
  return levelParams();
}

export async function GET(_req: Request, { params }: { params: Promise<{ level: string }> }) {
  const level = parseLevel((await params).level);
  if (!level) return new Response("Unknown level", { status: 404 });
  const words = getLevel(level).map(({ id, h, p, en, ru, lesson }) => ({ id, h, p, en: en.slice(0, 3), ru: ru.slice(0, 3), lesson }));
  return Response.json(words);
}
