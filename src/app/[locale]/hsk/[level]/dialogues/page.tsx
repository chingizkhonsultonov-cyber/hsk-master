import type { Metadata } from "next";
import { getDictionary, fmt } from "@/lib/i18n";
import { getDialogues } from "@/data/dialogues";
import { Crumbs } from "@/components/Crumbs";
import { DialogueList } from "@/components/dialogues/DialogueList";
import type { Locale } from "@/lib/types";
import { levelName, levelNumber, levelSlug, parseLevel } from "@/lib/levels";

type P = { params: Promise<{ locale: Locale; level: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, level: raw } = await params;
  const level = parseLevel(raw) ?? 1;
  return { title: fmt(getDictionary(locale).dialogues.title, { n: levelNumber(level) }) };
}

export default async function Dialogues({ params }: P) {
  const { locale, level: raw } = await params;
  const level = parseLevel(raw)!;
  const t = getDictionary(locale);
  const topics = getDialogues(level);
  const total = topics.reduce((a, x) => a + x.d.length, 0);
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Crumbs items={[{ href: `/${locale}`, label: t.common.appName }, { href: `/${locale}/hsk/${levelSlug(level)}`, label: levelName(level) }, { label: t.hub.modules.dialogues.title }]} />
        <h1 className="text-3xl font-semibold tracking-tight">{fmt(t.dialogues.title, { n: levelNumber(level) })}</h1>
        <p className="max-w-2xl text-muted">{t.dialogues.intro}</p>
        {total > 0 && <p className="text-sm text-muted">{fmt(t.dialogues.counts, { t: topics.length, d: total })}</p>}
      </div>
      {total > 0 ? <DialogueList topics={topics} /> : <p className="text-muted">{t.dialogues.soon}</p>}
    </div>
  );
}
