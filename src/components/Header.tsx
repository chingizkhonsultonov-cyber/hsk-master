"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { resolvedTheme, updateSettings, useSettings } from "@/lib/settings";
import { useEffect } from "react";
import type { Locale } from "@/lib/types";
import { AccountButton } from "./Account";

export function Header() {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const settings = useSettings();
  useEffect(() => {
    document.documentElement.lang = locale;
    if (settings.locale !== locale) updateSettings({ locale });
  }, [locale, settings.locale]);

  const switchTo = (l: Locale) => {
    updateSettings({ locale: l });
    router.push(pathname.replace(/^\/(en|ru)(?=\/|$)/, `/${l}`));
  };

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 py-3 pr-[max(16px,env(safe-area-inset-right))] pl-[max(16px,env(safe-area-inset-left))]">
        <Link href={`/${locale}`} className="mr-auto flex items-center gap-2.5 font-semibold">
          <span aria-hidden="true" className="han grid h-8 w-8 place-items-center rounded-md bg-ink text-lg text-paper">
            考
          </span>
          <span>{t.common.appName}</span>
        </Link>
        <div role="group" aria-label={t.common.language} className="flex rounded-lg border border-line p-0.5 text-sm">
          {(["en", "ru"] as const).map((l) => (
            <button
              key={l}
              type="button"
              lang={l}
              aria-pressed={locale === l}
              onClick={() => switchTo(l)}
              className={`min-h-8 rounded-md px-2.5 font-semibold uppercase ${locale === l ? "bg-accent-soft text-accent" : "text-muted hover:text-ink"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => updateSettings({ theme: resolvedTheme(settings.theme) === "dark" ? "light" : "dark" })}
          aria-label={t.common.themeToggle}
          className="grid h-9 w-9 place-items-center rounded-lg border border-line hover:border-muted"
        >
          <svg className="hidden dark:block" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="3" /><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1" strokeLinecap="round" /></svg>
          <svg className="dark:hidden" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z" strokeLinejoin="round" /></svg>
        </button>
        <AccountButton />
        <Link
          href={`/${locale}/settings`}
          aria-label={t.common.settings}
          className="grid h-9 w-9 place-items-center rounded-lg border border-line hover:border-muted"
        >
          {/* gear icon: Lucide "settings" (ISC licence) */}
          <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
        </Link>
      </div>
    </header>
  );
}
