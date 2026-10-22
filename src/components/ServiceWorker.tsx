"use client";

import { useEffect } from "react";
import { BASE } from "@/lib/base";

export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(`${BASE}/sw.js`).catch(() => {});
  }, []);
  return null;
}
