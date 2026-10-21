"use client";

import { useState } from "react";
import { speak } from "@/lib/speech";
import { useI18n } from "@/lib/i18n/client";

export function SpeakButton({ text, label, compact = false }: { text: string; label?: string; compact?: boolean }) {
  const { t } = useI18n();
  const [note, setNote] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => {
          const r = speak(text);
          setNote(r === "no-voice" ? t.common.noVoice : r === "unsupported" ? t.common.noSpeech : null);
        }}
        className={`inline-flex items-center gap-1.5 rounded-full border border-line font-medium hover:border-muted ${compact ? "h-9 w-9 justify-center" : "min-h-9 px-3.5 text-sm"}`}
        aria-label={compact ? `${label ?? t.common.listen}: ${text}` : undefined}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
          <path d="M3 6h2.5L9 3v10L5.5 10H3z" />
          <path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.5 3.5a6 6 0 0 1 0 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        {!compact && (label ?? t.common.listen)}
      </button>
      {note && (
        <span role="status" className="max-w-xs text-xs text-muted">
          {note}
        </span>
      )}
    </span>
  );
}
