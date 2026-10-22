"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n";
import { accessToken, cloudEnabled } from "@/lib/supabase";

const ENDPOINT = process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ask` : null;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const STORE = "hsk-ask-chat";

/** A user turn is plain text; an assistant turn keeps the API's content blocks so they are replayed unchanged. */
type Turn = { role: "user"; content: string } | { role: "assistant"; content: unknown[]; text: string };

const load = (): Turn[] => {
  try {
    return JSON.parse(sessionStorage.getItem(STORE) || "[]");
  } catch {
    return [];
  }
};

/** Floating "Ask Claude" chat, on every page. Answers come from the `ask` Supabase Edge Function. */
export function AskClaude() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setTurns(load()), []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify(turns));
    } catch {}
    end.current?.scrollIntoView({ block: "end" });
  }, [turns, busy]);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  const m = pathname.match(/\/hsk\/(\d)/);
  const level = m ? Number(m[1]) : null;
  const ready = cloudEnabled && !!ENDPOINT;

  /** Without the built-in chat, open claude.ai in a new tab with the question and the page already filled in. */
  const openClaude = () => {
    const q = draft.trim();
    if (!q) return;
    const ctx = fmt(t.ask.prefill, { level: level ? (level === 7 ? "7–9" : String(level)) : "—", page: location.href });
    window.open(`https://claude.ai/new?q=${encodeURIComponent(`${ctx}\n\n${q}`)}`, "_blank", "noopener");
    setDraft("");
  };

  const send = async () => {
    const q = draft.trim();
    if (!ready) return openClaude();
    if (!q || busy) return;
    const next: Turn[] = [...turns, { role: "user", content: q }];
    setTurns(next);
    setDraft("");
    setNote(null);
    setBusy(true);
    try {
      const token = await accessToken();
      if (!token) {
        setNote(t.ask.signIn);
        setTurns(turns);
        setDraft(q);
        return;
      }
      const r = await fetch(ENDPOINT!, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}`, apikey: ANON },
        body: JSON.stringify({ locale, level, page: pathname, messages: next.map((x) => ({ role: x.role, content: x.content })) }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.text) setTurns([...next, { role: "assistant", content: data.content, text: data.text }]);
      else {
        setTurns(turns);
        setDraft(q);
        setNote(r.status === 401 ? t.ask.signIn : r.status === 429 ? t.ask.limit : r.status === 503 ? t.ask.off : data.error === "refusal" ? t.ask.refusal : t.ask.error);
      }
    } catch {
      setTurns(turns);
      setDraft(q);
      setNote(t.ask.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed right-[max(16px,env(safe-area-inset-right))] bottom-[max(16px,env(safe-area-inset-bottom))] z-30 flex min-h-12 items-center gap-2 rounded-full bg-accent px-5 font-semibold text-paper shadow-lg"
        >
          <span aria-hidden="true">💬</span>
          {t.ask.button}
        </button>
      )}
      {open && (
        <section
          role="dialog"
          aria-label={t.ask.title}
          className="fixed inset-x-0 bottom-0 z-30 flex max-h-[85dvh] flex-col border-t border-line bg-paper shadow-2xl sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[400px] sm:rounded-2xl sm:border"
        >
          <header className="flex items-center gap-2 border-b border-line px-4 py-3">
            <h2 className="mr-auto font-semibold">{t.ask.title}</h2>
            {turns.length > 0 && (
              <button type="button" onClick={() => { setTurns([]); setNote(null); }} className="min-h-9 rounded-lg px-2 text-sm text-muted underline">
                {t.ask.clear}
              </button>
            )}
            <button type="button" onClick={() => setOpen(false)} aria-label={t.ask.close} className="grid h-9 w-9 place-items-center rounded-lg text-xl">
              ×
            </button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3" aria-live="polite">
            <p className="text-sm text-muted">{ready ? t.ask.intro : t.ask.off}</p>
            {turns.map((x, k) => (
              <div
                key={k}
                className={`whitespace-pre-wrap rounded-xl px-3 py-2 text-[15px] leading-relaxed ${x.role === "user" ? "ml-8 bg-accent-soft" : "mr-4 border border-line bg-surface"}`}
              >
                {x.role === "user" ? x.content : x.text}
              </div>
            ))}
            {busy && <p className="text-sm text-muted">{t.ask.thinking}</p>}
            {note && <p className="text-sm text-danger">{note}</p>}
            <div ref={end} />
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex items-end gap-2 border-t border-line px-3 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]"
          >
            <textarea
              ref={input}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              maxLength={2000}
              rows={2}
              placeholder={t.ask.placeholder}
              aria-label={t.ask.placeholder}
              className="min-h-11 flex-1 resize-none rounded-lg border border-line bg-surface px-3 py-2 text-base disabled:opacity-60"
            />
            <button type="submit" disabled={busy || !draft.trim()} className="min-h-11 rounded-lg bg-accent px-4 font-semibold text-paper disabled:opacity-50">
              {ready ? t.ask.send : t.ask.openClaude}
            </button>
          </form>
        </section>
      )}
    </>
  );
}
