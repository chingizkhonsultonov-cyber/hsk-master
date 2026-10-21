"use client";

import { useSettings } from "@/lib/settings";

/** Turns tone colouring on for its children when the learner has it enabled. */
export function ToneScope({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { toneColours } = useSettings();
  return <div className={`${toneColours ? "tones" : ""} ${className}`}>{children}</div>;
}
