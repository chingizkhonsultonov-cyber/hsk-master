"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { updateSettings, useSettings, type ThemePref } from "@/lib/settings";
import { resetProgress } from "@/lib/progress";
import { DICTIONARIES } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

const row = "flex flex-col gap-3 rounded-xl border border-line bg-surface p-5";

export function SettingsForm() {
  const { t, locale } = useI18n();
  const s = useSettings();
  const router = useRouter();
  const pathname = usePathname();
  const [confirming, setConfirming] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const themes: { v: ThemePref; label: string }[] = [
    { v: "system", label: t.settings.system },
    { v: "light", label: t.common.themeLight },
    { v: "dark", label: t.common.themeDark },
  ];

  return (
    <div className="flex flex-col gap-4">
      <fieldset className={row}>
        <legend className="sr-only">{t.settings.language}</legend>
        <span aria-hidden="true" className="font-semibold">{t.settings.language}</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {(["en", "ru"] as Locale[]).map((l) => (
            <label key={l} lang={l} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 ${locale === l ? "border-accent bg-accent-soft" : "border-line"}`}>
              <input
                type="radio"
                name="locale"
                value={l}
                checked={locale === l}
                onChange={() => {
                  updateSettings({ locale: l });
                  router.push(pathname.replace(/^\/(en|ru)/, `/${l}`));
                }}
                className="accent-[var(--accent)]"
              />
              {DICTIONARIES[l].onboarding[l]}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className={row}>
        <legend className="sr-only">{t.settings.theme}</legend>
        <span aria-hidden="true" className="font-semibold">{t.settings.theme}</span>
        <div className="flex flex-wrap gap-2">
          {themes.map((th) => (
            <label key={th.v} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-4 ${s.theme === th.v ? "border-accent bg-accent-soft" : "border-line"}`}>
              <input type="radio" name="theme" value={th.v} checked={s.theme === th.v} onChange={() => updateSettings({ theme: th.v })} className="accent-[var(--accent)]" />
              {th.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className={row}>
        <label htmlFor="tone-colours" className="flex cursor-pointer items-center gap-3 font-semibold">
          <input id="tone-colours" type="checkbox" checked={s.toneColours} onChange={(e) => updateSettings({ toneColours: e.target.checked })} className="h-4 w-4 accent-[var(--accent)]" />
          {t.settings.toneColours}
        </label>
        <p className="tones text-sm text-muted">
          <span className="tone-1">mā</span> <span className="tone-2">má</span> <span className="tone-3">mǎ</span> <span className="tone-4">mà</span> <span className="tone-5">ma</span> · {t.settings.toneColoursHelp}
        </p>
      </div>
      <div className={row}>
        <span className="font-semibold">{t.settings.account}</span>
        <p className="text-sm text-muted">{t.settings.accountBody}</p>
      </div>
      <div className={row}>
        {!confirming ? (
          <button type="button" onClick={() => { setConfirming(true); setResetDone(false); }} className="min-h-11 self-start rounded-lg border border-danger/60 px-4 font-semibold text-danger">
            {t.settings.reset}
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="font-semibold">{t.settings.resetConfirm}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { resetProgress(); setConfirming(false); setResetDone(true); }} className="min-h-11 rounded-lg bg-danger px-4 font-semibold text-paper">
                {t.settings.resetYes}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="min-h-11 rounded-lg border border-line px-4 font-semibold">
                {t.settings.resetNo}
              </button>
            </div>
          </div>
        )}
        {resetDone && <p role="status" className="text-sm text-ok">{t.settings.resetDone}</p>}
      </div>
      <div className={row}>
        <span className="font-semibold">{t.settings.sources}</span>
        <p className="text-sm text-muted">{t.settings.sourcesBody}</p>
      </div>
    </div>
  );
}
