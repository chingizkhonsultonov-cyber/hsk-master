"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getProgress, mergeProgress, onProgressChange, replaceProgress, type ProgressState } from "./progress";
import { supabase } from "./supabase";

export type SyncStatus = "off" | "signed-out" | "syncing" | "synced" | "error";

let status: SyncStatus = "off";
let user: User | null = null;
let applying = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let started = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const setStatus = (s: SyncStatus) => {
  status = s;
  emit();
};

/** Pulls the cloud copy, merges it with this device (newest record wins), and pushes the result back. */
export async function syncNow() {
  const sb = supabase();
  if (!sb || !user) return;
  setStatus("syncing");
  try {
    const { data, error } = await sb.from("progress").select("data").eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    const remote = (data?.data ?? null) as ProgressState | null;
    const merged = remote?.version === 1 ? mergeProgress(getProgress(), remote) : getProgress();
    applying = true;
    replaceProgress(merged);
    applying = false;
    const { error: upErr } = await sb.from("progress").upsert({ user_id: user.id, data: merged, updated_at: new Date().toISOString() });
    if (upErr) throw upErr;
    setStatus("synced");
  } catch {
    applying = false;
    setStatus("error");
  }
}

/** Starts syncing once per page load: on sign-in, a few seconds after each change, and when the tab regains focus. */
export function startSync() {
  const sb = supabase();
  if (started || !sb) return;
  started = true;
  setStatus("signed-out");
  sb.auth.getSession().then(({ data }) => {
    user = data.session?.user ?? null;
    if (user) syncNow();
    else setStatus("signed-out");
  });
  sb.auth.onAuthStateChange((_event, session) => {
    const was = user?.id;
    user = session?.user ?? null;
    if (!user) setStatus("signed-out");
    else if (user.id !== was) syncNow();
    emit();
  });
  onProgressChange(() => {
    if (applying || !user) return;
    clearTimeout(timer);
    timer = setTimeout(syncNow, 3000);
  });
  window.addEventListener("focus", () => user && syncNow());
}

export function useSync() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return { status, email: user?.email ?? null };
}
