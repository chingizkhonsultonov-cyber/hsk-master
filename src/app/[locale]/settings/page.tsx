import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { Crumbs } from "@/components/Crumbs";
import { SettingsForm } from "@/components/SettingsForm";
import type { Locale } from "@/lib/types";

type P = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(locale).settings.title };
}

export default async function Settings({ params }: P) {
  const { locale } = await params;
  const t = getDictionary(locale);
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Crumbs items={[{ href: `/${locale}`, label: t.common.appName }, { label: t.settings.title }]} />
      <h1 className="text-3xl font-semibold tracking-tight">{t.settings.title}</h1>
      <SettingsForm />
    </div>
  );
}
