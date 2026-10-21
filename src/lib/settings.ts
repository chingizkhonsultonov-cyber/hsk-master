"use client";

import { useSyncExternalStore } from "react";
import type { Locale } from "./types";

export type ThemePref = "system" | "light" | "dark";
export interface Settings {
  locale: Locale | null;
  theme: ThemePref;
  toneColours: boolean;
  pinyinFront: boolean;
}

export const SETTINGS_KEY = "hsk-master:settings:v1";
const DEFAULTS: Settings = { locale: null, theme: "system", toneColours: true, pinyinFront: false };

let state: Settings = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) state = { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
}

export function getSettings(): Settings {
  load();
  return state;
}

export function updateSettings(patch: Partial<Settings>) {
  state = { ...getSettings(), ...patch };
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  if (patch.theme) applyTheme(state.theme);
  listeners.forEach((l) => l());
}

export function useSettings(): Settings {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSettings,
    () => DEFAULTS,
  );
}

export function resolvedTheme(pref: ThemePref): "light" | "dark" {
  if (pref !== "system") return pref;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(pref: ThemePref) {
  document.documentElement.dataset.theme = resolvedTheme(pref);
}

if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getSettings().theme === "system") applyTheme("system");
  });
}

/** Runs before first paint so the page never flashes the wrong theme. */
export const THEME_BOOT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(SETTINGS_KEY)})||"{}");var t=s.theme||"system";if(t==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="light";}var l=location.pathname.split("/")[1];if(l==="ru"||l==="en")document.documentElement.lang=l;})();`;
