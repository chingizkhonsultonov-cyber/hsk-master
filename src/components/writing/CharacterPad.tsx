"use client";

import { useEffect, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";
import { useI18n } from "@/lib/i18n/client";
import { count, fmt } from "@/lib/i18n";
import { recordWriting, useProgress } from "@/lib/progress";
import { Tianzige } from "../Tianzige";
import { Hanzi, Pinyin } from "../Hanzi";
import { SpeakButton } from "../SpeakButton";
import type { CharEntry } from "./WritingClient";
import { BASE } from "@/lib/base";

type Status = { tone: "neutral" | "good" | "bad"; text: string };

function css(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function CharacterPad({ entry }: { entry: CharEntry }) {
  const { t, locale } = useI18n();
  const { writing } = useProgress();
  const target = useRef<HTMLDivElement>(null);
  const writer = useRef<HanziWriter | null>(null);
  const [strokes, setStrokes] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>({ tone: "neutral", text: "" });
  const [error, setError] = useState(false);
  const best = writing[entry.c];

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const size = () => Math.floor(el.getBoundingClientRect().width);
    const w = HanziWriter.create(el, entry.c, {
      width: size(),
      height: size(),
      padding: Math.round(size() * 0.06),
      showOutline: true,
      showCharacter: true,
      strokeColor: css("--ink"),
      radicalColor: css("--accent"),
      outlineColor: css("--line"),
      highlightColor: css("--accent"),
      drawingColor: css("--danger"),
      drawingWidth: 16,
      strokeAnimationSpeed: 1.1,
      delayBetweenStrokes: 220,
      showHintAfterMisses: 2,
      charDataLoader: (char, onLoad, onError) => {
        fetch(`${BASE}/hanzi/${char.codePointAt(0)!.toString(16)}.json`)
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
          .then(onLoad)
          .catch(onError);
      },
      onLoadCharDataSuccess: (d) => setStrokes(d.strokes.length),
      onLoadCharDataError: () => setError(true),
    });
    writer.current = w;
    const ro = new ResizeObserver(() => {
      const s = size();
      if (s > 0) w.updateDimensions({ width: s, height: s, padding: Math.round(s * 0.06) });
    });
    ro.observe(el);
    // Follow theme switches without recreating the writer.
    const mo = new MutationObserver(() => {
      w.updateColor("strokeColor", css("--ink"));
      w.updateColor("outlineColor", css("--line"));
      w.updateColor("radicalColor", css("--accent"));
      w.updateColor("highlightColor", css("--accent"));
      w.updateColor("drawingColor", css("--danger"));
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      ro.disconnect();
      mo.disconnect();
      el.innerHTML = "";
      writer.current = null;
    };
  }, [entry.c]);

  const n = strokes ?? 0;
  const watch = () => {
    const w = writer.current;
    if (!w) return;
    setStatus({ tone: "neutral", text: "" });
    w.showCharacter();
    w.animateCharacter({ onComplete: () => setStatus({ tone: "neutral", text: fmt(t.writing.animDone, { n }) }) });
  };
  const practise = () => {
    const w = writer.current;
    if (!w) return;
    setStatus({ tone: "neutral", text: fmt(t.writing.drawStroke, { i: 1, n }) });
    w.quiz({
      onCorrectStroke: (d) =>
        setStatus({ tone: "good", text: d.strokesRemaining ? fmt(t.writing.goodStroke, { i: d.strokeNum + 2, n }) : "" }),
      onMistake: (d) =>
        setStatus({ tone: "bad", text: fmt(d.mistakesOnStroke >= 2 ? t.writing.mistakeHint : t.writing.mistake, { i: d.strokeNum + 1 }) }),
      onComplete: (d) => {
        recordWriting(entry.c, d.totalMistakes);
        setStatus({ tone: d.totalMistakes ? "neutral" : "good", text: d.totalMistakes ? fmt(t.writing.doneWith, { n: d.totalMistakes }) : t.writing.perfect });
      },
    });
  };

  return (
    <div className="grid items-start gap-6 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <div className="flex flex-col gap-3">
        <Tianzige diagonals className="w-full max-w-[22rem] touch-none select-none">
          <div ref={target} data-testid="writer" className="absolute inset-0" role="img" aria-label={entry.c} />
        </Tianzige>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={watch} disabled={error || !strokes} className="min-h-11 rounded-lg border border-line bg-surface px-4 font-semibold hover:border-muted disabled:opacity-50">
            ▶ {t.writing.watch}
          </button>
          <button type="button" onClick={practise} disabled={error || !strokes} className="min-h-11 rounded-lg bg-accent px-4 font-semibold text-paper disabled:opacity-50">
            ✎ {t.writing.practise}
          </button>
        </div>
        <p role="status" data-testid="writer-status" className={`min-h-6 font-semibold ${status.tone === "good" ? "text-ok" : status.tone === "bad" ? "text-danger" : ""}`}>
          {error ? t.writing.loadError : status.text}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-4">
          <Hanzi h={entry.c} p={entry.s} className="text-6xl leading-none" />
          <Pinyin p={entry.s} className="text-2xl" />
          {strokes != null && <span className="text-muted tabular-nums">{count(t.writing.strokes, strokes, locale)}</span>}
        </div>
        <p className="flex flex-wrap items-baseline gap-2">
          <span className="text-muted">{t.writing.inWord}</span>
          <Hanzi h={entry.w} p={entry.wp} className="text-2xl" />
          <Pinyin p={entry.wp} />
          <span>· {entry.m}</span>
        </p>
        <div>
          <SpeakButton text={entry.w} py={entry.wp} />
        </div>
        {best && (
          <p className="text-sm text-muted">{best.best === 0 ? t.writing.bestPerfect : fmt(t.writing.best, { n: best.best })}</p>
        )}
      </div>
    </div>
  );
}
