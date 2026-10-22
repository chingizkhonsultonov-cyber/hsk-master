"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n";
import { accessToken } from "@/lib/supabase";
import { Pinyin } from "../Hanzi";

interface Feedback {
  score: number;
  summary: string;
  issues: { kind: "pronunciation" | "tone" | "grammar" | "vocabulary" | "missing" | "extra"; heard: string; expected: string; tip: string }[];
  corrected: string;
  pinyin: string;
  modelAnswer: string;
}

let statusPromise: Promise<{ enabled: boolean; signIn: boolean }> | null = null;
const coachStatus = () =>
  (statusPromise ??= fetch("/api/coach").then((r) => (r.ok ? r.json() : { enabled: false, signIn: false })).catch(() => ({ enabled: false, signIn: false })));

/** Whether the AI coach is available on this deployment (an API key is configured on the server). */
export function useCoachEnabled() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    coachStatus().then((s) => setEnabled(s.enabled));
  }, []);
  return enabled;
}

export function Coach({ level, mode, target, heard }: { level: number; mode: "read" | "repeat" | "answer"; target: string; heard: string }) {
  const { t, locale } = useI18n();
  const enabled = useCoachEnabled();
  const [busy, setBusy] = useState(false);
  const [fb, setFb] = useState<Feedback | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (enabled === null) return null;
  if (!enabled) return <p className="text-xs text-muted">{t.coach.off}</p>;

  const ask = async () => {
    setBusy(true);
    setErr(null);
    try {
      const token = await accessToken();
      const r = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ level, locale, mode, target, heard }),
      });
      if (r.status === 401) setErr(t.coach.signIn);
      else if (!r.ok) setErr(t.coach.error);
      else setFb(await r.json());
    } catch {
      setErr(t.coach.error);
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {!fb && (
        <button type="button" onClick={ask} disabled={busy} className="min-h-11 self-start rounded-lg border border-accent px-4 font-semibold text-accent disabled:opacity-60">
          {busy ? t.coach.loading : t.coach.get}
        </button>
      )}
      {err && <p role="status" className="text-sm text-danger">{err}</p>}
      {fb && (
        <div role="status" className="flex flex-col gap-3 rounded-lg border border-line bg-paper p-4">
          <p className="font-semibold tabular-nums">{fmt(t.coach.score, { n: fb.score })}</p>
          <p className="text-sm">{fb.summary}</p>
          {fb.issues.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="eyebrow">{t.coach.issues}</span>
              <ul className="flex flex-col gap-2 text-sm">
                {fb.issues.map((x, i) => (
                  <li key={i} className="flex flex-col">
                    <span>
                      <span className="font-semibold">{t.coach.kinds[x.kind]}</span>
                      {x.heard && <> · <span lang="zh-CN">{x.heard}</span></>}
                      {x.expected && <> → <span lang="zh-CN">{fmt(t.coach.expected, { e: x.expected })}</span></>}
                    </span>
                    <span className="text-muted">{x.tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {fb.corrected && (
            <div className="flex flex-col gap-1">
              <span className="eyebrow">{t.coach.corrected}</span>
              <span lang="zh-CN" className="han text-lg">{fb.corrected}</span>
              {fb.pinyin && <Pinyin p={fb.pinyin} className="text-sm font-normal text-muted" />}
            </div>
          )}
          {fb.modelAnswer && (
            <div className="flex flex-col gap-1">
              <span className="eyebrow">{t.coach.model}</span>
              <span lang="zh-CN" className="han text-lg">{fb.modelAnswer}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
