"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSettings, updateSettings } from "@/lib/settings";
import { DICTIONARIES } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

/** First visit: pick the explanation language. Returning visitors go straight to their dashboard. */
export default function Onboarding() {
  const router = useRouter();
  useEffect(() => {
    const saved = getSettings().locale;
    if (saved) router.replace(`/${saved}`);
  }, [router]);

  const choose = (l: Locale) => {
    updateSettings({ locale: l });
    router.push(`/${l}`);
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-10 py-12 pr-[max(16px,env(safe-area-inset-right))] pl-[max(16px,env(safe-area-inset-left))]">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="han grid h-12 w-12 place-items-center rounded-lg bg-ink text-2xl text-paper">考</span>
        <span className="text-2xl font-semibold">HSK Master</span>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {(["en", "ru"] as const).map((l) => {
          const t = DICTIONARIES[l];
          return (
            <section key={l} lang={l} className="flex flex-col gap-3">
              <h1 className="text-xl font-semibold">{t.onboarding.title}</h1>
              <p className="text-sm text-muted">{t.onboarding.body}</p>
            </section>
          );
        })}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["en", "ru"] as const).map((l) => (
          <button
            key={l}
            type="button"
            lang={l}
            onClick={() => choose(l)}
            className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-line bg-surface px-5 text-left text-lg font-semibold hover:border-accent"
          >
            {DICTIONARIES[l].onboarding[l]}
            <span aria-hidden="true" className="text-muted">→</span>
          </button>
        ))}
      </div>
    </main>
  );
}
