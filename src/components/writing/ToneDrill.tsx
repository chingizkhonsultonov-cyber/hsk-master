"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n";
import { CONTOURS, markSyllable, stripTones, toneOf } from "@/lib/pinyin";
import { SpeakButton } from "../SpeakButton";
import { Hanzi } from "../Hanzi";
import type { CharEntry } from "./WritingClient";

function Contour({ tone }: { tone: 1 | 2 | 3 | 4 }) {
  const y = (l: number) => 52 - (l - 1) * 11;
  const pts = CONTOURS[tone];
  const xs = pts.length === 2 ? [22, 92] : [22, 52, 92];
  const d = pts.map((l, i) => `${i ? "L" : "M"}${xs[i]} ${y(l)}`).join(" ");
  return (
    <svg viewBox="0 0 100 64" className="w-full rounded-md bg-paper" role="img" aria-label={`${tone}: ${pts.join("")}`}>
      {[1, 2, 3, 4, 5].map((l) => (
        <g key={l}>
          <line x1="16" x2="96" y1={y(l)} y2={y(l)} stroke="var(--line)" strokeWidth="1" />
          <text x="4" y={y(l) + 3} fontSize="9" fill="var(--muted)">{l}</text>
        </g>
      ))}
      <path d={d} fill="none" stroke={`var(--t${tone})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ToneDrill({ chars }: { chars: CharEntry[] }) {
  const { t } = useI18n();
  const pool = chars.filter((c) => toneOf(c.s) < 5);
  const [idx, setIdx] = useState<number | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState({ r: 0, n: 0 });
  const nextRef = useRef<HTMLButtonElement>(null);

  // Random start chosen on the client so server and client HTML match.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIdx(Math.floor(Math.random() * pool.length));
  }, [pool.length]);

  useEffect(() => {
    if (pick != null) nextRef.current?.focus({ preventScroll: true });
  }, [pick]);

  if (idx == null || !pool.length) return null;
  const item = pool[idx % pool.length];
  const tone = toneOf(item.s) as 1 | 2 | 3 | 4;
  const bare = stripTones(item.s);

  const answer = (k: number) => {
    if (pick != null) return;
    setPick(k);
    setScore((s) => ({ r: s.r + (k === tone ? 1 : 0), n: s.n + 1 }));
  };
  const next = () => {
    let j = idx;
    while (pool.length > 1 && j % pool.length === idx % pool.length) j = Math.floor(Math.random() * pool.length);
    setIdx(j);
    setPick(null);
  };

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-surface p-5 text-center" data-testid="tone-drill">
        <span className="eyebrow">{fmt(t.writing.toneQ, { ch: item.c })}</span>
        {pick == null ? <span lang="zh-CN" className="han text-7xl leading-none">{item.c}</span> : <Hanzi h={item.c} p={item.s} className="text-7xl leading-none" />}
        <span className="text-xl font-semibold">{pick == null ? bare : <span className={`tone-${tone}`}>{item.s}</span>}</span>
        <SpeakButton text={item.c} />
        <div role="group" aria-label={t.writing.tonesTitle} className="grid w-full grid-cols-4 gap-2">
          {([1, 2, 3, 4] as const).map((k) => (
            <button
              key={k}
              type="button"
              data-tone={k}
              disabled={pick != null}
              onClick={() => answer(k)}
              className={`flex min-h-14 flex-col items-center justify-center rounded-lg border border-line font-semibold ${pick != null && k === tone ? "border-ok bg-ok/10" : pick === k ? "border-danger bg-danger/10" : ""}`}
            >
              <span className={`tone-${k} text-lg`}>{markSyllable(bare, k)}</span>
              <span className="text-xs font-normal text-muted">{k}</span>
            </button>
          ))}
        </div>
        <p role="status" className={`min-h-6 text-sm font-semibold ${pick == null ? "" : pick === tone ? "text-ok" : "text-danger"}`}>
          {pick != null && fmt(pick === tone ? t.writing.toneRight : t.writing.toneWrong, { syl: item.s, t: tone, word: `${item.w} (${item.wp})` })}
        </p>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted tabular-nums">{fmt(t.writing.score, { r: score.r, n: score.n })}</span>
          {pick != null && (
            <button ref={nextRef} type="button" onClick={next} className="min-h-10 rounded-lg bg-accent px-4 font-semibold text-paper">
              {t.common.next}
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-4 gap-2">
          {([1, 2, 3, 4] as const).map((k) => (
            <div key={k} className="flex flex-col gap-1 text-center text-xs">
              <Contour tone={k} />
              <span className={`tone-${k} text-base font-semibold`}>{markSyllable("ma", k)}</span>
              <span className="text-muted">{t.writing.toneNames[k - 1]}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted">{t.writing.sandhi}</p>
      </div>
    </div>
  );
}
