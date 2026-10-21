import { notFound } from "next/navigation";
import { levelParams } from "@/lib/data";
import { parseLevel } from "@/lib/levels";

export function generateStaticParams() {
  return levelParams();
}

export default async function LevelLayout({ children, params }: { children: React.ReactNode; params: Promise<{ level: string }> }) {
  const { level } = await params;
  if (!parseLevel(level)) notFound();
  return children;
}
