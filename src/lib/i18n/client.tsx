"use client";

import { createContext, useContext } from "react";
import type { Dictionary } from "./en";
import type { Locale } from "../types";
import { DICTIONARIES } from "./index";

const Ctx = createContext<{ locale: Locale; t: Dictionary }>({ locale: "en", t: DICTIONARIES.en });

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={{ locale, t: DICTIONARIES[locale] }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  return useContext(Ctx);
}
