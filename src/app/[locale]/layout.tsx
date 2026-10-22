import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { I18nProvider } from "@/lib/i18n/client";
import { LOCALES, getDictionary, isLocale } from "@/lib/i18n";
import { ServiceWorker } from "@/components/ServiceWorker";
import { CloudSync } from "@/components/Account";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return { description: t.meta.description, alternates: { languages: { en: "/en", ru: "/ru" } } };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return (
    <I18nProvider locale={locale}>
      <a href="#main" className="absolute -left-[999px] top-2 z-30 rounded bg-surface px-3 py-2 focus:left-4">
        {t.common.skip}
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="mx-auto max-w-5xl pt-6 pb-16 pr-[max(16px,env(safe-area-inset-right))] pl-[max(16px,env(safe-area-inset-left))] pb-[calc(4rem+env(safe-area-inset-bottom))] outline-none sm:pt-10">
        {children}
      </main>
      <ServiceWorker />
      <CloudSync />
    </I18nProvider>
  );
}
