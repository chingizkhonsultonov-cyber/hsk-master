"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { cloudEnabled, supabase } from "@/lib/supabase";
import { startSync, syncNow, useSync } from "@/lib/sync";
import { BASE } from "@/lib/base";
import Link from "next/link";

/** Starts cloud sync on every page when Supabase is configured. */
export function CloudSync() {
  useEffect(() => startSync(), []);
  return null;
}

/** Email and password sign-in for syncing progress across devices. */
export function Account() {
  const { t, locale } = useI18n();
  const { status, email } = useSync();
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  if (!cloudEnabled) return <p className="text-sm text-muted">{t.settings.accountBody}</p>;

  const sb = supabase()!;
  const run = async (fn: () => Promise<{ error: { message: string } | null }>, okText?: string) => {
    setBusy(true);
    setNote(null);
    const { error } = await fn();
    setBusy(false);
    setNote(error ? { ok: false, text: error.message } : okText ? { ok: true, text: okText } : null);
  };

  if (email) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm">{t.account.signedInAs} <strong>{email}</strong></p>
        <p role="status" className="text-sm text-muted">{t.account.status[status]}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => syncNow()} className="min-h-11 rounded-lg border border-line px-4 font-semibold hover:border-muted">{t.account.syncNow}</button>
          <button type="button" onClick={() => run(() => sb.auth.signOut())} className="min-h-11 rounded-lg border border-line px-4 font-semibold hover:border-muted">{t.account.signOut}</button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="flex max-w-sm flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => sb.auth.signInWithPassword({ email: mail, password }));
      }}
    >
      <p className="text-sm text-muted">{t.account.intro}</p>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {t.account.email}
        <input type="email" required autoComplete="email" value={mail} onChange={(e) => setMail(e.target.value)} className="min-h-11 rounded-lg border border-line bg-paper px-3 font-normal" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        {t.account.password}
        <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="min-h-11 rounded-lg border border-line bg-paper px-3 font-normal" />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-paper disabled:opacity-60">{t.account.signIn}</button>
        <button
          type="button"
          disabled={busy || !mail || password.length < 8}
          onClick={() =>
            run(async () => {
              // The confirmation link (when the project requires one) brings the learner back to this page.
              const { data, error } = await sb.auth.signUp({ email: mail, password, options: { emailRedirectTo: `${window.location.origin}${BASE}/${locale}/settings` } });
              if (!error && !data.session) setNote({ ok: true, text: t.account.checkEmail });
              return { error };
            })
          }
          className="min-h-11 rounded-lg border border-line px-4 font-semibold hover:border-muted disabled:opacity-60"
        >
          {t.account.signUp}
        </button>
      </div>
      {note && <p role="status" className={`text-sm ${note.ok ? "text-ok" : "text-danger"}`}>{note.text}</p>}
    </form>
  );
}

/** Header shortcut to the account section: "Sign in" when signed out, the email's first letter when signed in. */
export function AccountButton() {
  const { t, locale } = useI18n();
  const { email } = useSync();
  if (!cloudEnabled) return null;
  return (
    <Link
      href={`/${locale}/settings#account`}
      aria-label={email ? `${t.account.signedInAs} ${email}` : t.account.signIn}
      title={email ?? t.account.signIn}
      className={`grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-sm font-semibold ${email ? "border-accent bg-accent-soft text-accent" : "border-line hover:border-muted"}`}
    >
      {email ? (
        email[0].toUpperCase()
      ) : (
        <>
          {/* user icon: Lucide "user" (ISC licence) */}
          <svg className="sm:hidden" width="17" height="17" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          <span className="hidden sm:inline">{t.account.signIn}</span>
        </>
      )}
    </Link>
  );
}
