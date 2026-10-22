"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { cloudEnabled, supabase } from "@/lib/supabase";
import { startSync, syncNow, useSync } from "@/lib/sync";

/** Starts cloud sync on every page when Supabase is configured. */
export function CloudSync() {
  useEffect(() => startSync(), []);
  return null;
}

/** Email and password sign-in for syncing progress across devices. */
export function Account() {
  const { t } = useI18n();
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
        <input type="password" required minLength={6} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="min-h-11 rounded-lg border border-line bg-paper px-3 font-normal" />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-paper disabled:opacity-60">{t.account.signIn}</button>
        <button
          type="button"
          disabled={busy || !mail || password.length < 6}
          onClick={() => run(() => sb.auth.signUp({ email: mail, password }), t.account.checkEmail)}
          className="min-h-11 rounded-lg border border-line px-4 font-semibold hover:border-muted disabled:opacity-60"
        >
          {t.account.signUp}
        </button>
      </div>
      {note && <p role="status" className={`text-sm ${note.ok ? "text-ok" : "text-danger"}`}>{note.text}</p>}
    </form>
  );
}
