"use client";

import { useI18n } from "@/lib/i18n/client";

export interface MeaningData {
  en: string[];
  ru: string[];
}

export function Meaning({ w, max = 3, className = "" }: { w: MeaningData; max?: number; className?: string }) {
  const { locale, t } = useI18n();
  const ru = locale === "ru" && w.ru.length > 0;
  const list = (ru ? w.ru : w.en).slice(0, max);
  return (
    <span className={className} lang={ru || locale === "en" ? locale : "en"} title={locale === "ru" && !ru ? t.common.translationPending : undefined}>
      {list.join("; ")}
      {locale === "ru" && !ru && <span className="ml-1 align-super text-[0.65em] font-semibold text-muted">EN</span>}
    </span>
  );
}

export function meaningText(w: MeaningData, locale: string, max = 2) {
  const list = locale === "ru" && w.ru.length ? w.ru : w.en;
  return list.slice(0, max).join("; ");
}
