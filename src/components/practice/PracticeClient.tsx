"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n";
import { isDue, useProgress, type ProgressState } from "@/lib/progress";
import { shuffle } from "@/lib/random";
import { ToneScope } from "../ToneScope";
import { Flashcards, type CardFront, type CardWord } from "../lesson/Flashcards";
import { LessonTest } from "../lesson/LessonTest";
import { Choice } from "../Choice";

type Mode = "cards" | "test";
type Source = "all" | "studied" | "weak" | "fresh";
interface Session { n: number; words: CardWord[]; pool: CardWord[] }

const SIZES = [10, 20, 30, 50];
const SOURCES: Source[] = ["all", "studied", "weak", "fresh"];
const FRONTS: CardFront[] = ["hanzi", "meaning", "mixed"];
const RECENT_KEY = "hsk-master:practice-recent:v1";

function matches(source: Source, id: string, p: ProgressState["words"], now: number) {
  const w = p[id];
  if (source === "studied") return !!w;
  if (source === "fresh") return !w;
  if (source === "weak") return !!w && (w.wrong > 0 || isDue(w, now));
  return true;
}

function readRecent(level: number): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "{}")[level] ?? [];
  } catch {
    return [];
  }
}

function writeRecent(level: number, ids: string[]) {
  try {
    const all = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "{}");
    localStorage.setItem(RECENT_KEY, JSON.stringify({ ...all, [level]: ids }));
  } catch {
    // Storage can be unavailable (private mode); sets are still random, just without the hold-back.
  }
}

/**
 * Draws `size` words at random. Words from the last few sets are held back while
 * enough other words remain, so consecutive sets don't repeat.
 */
function draw(level: number, candidates: CardWord[], size: number): CardWord[] {
  const recent = new Set(readRecent(level));
  const fresh = shuffle(candidates.filter((w) => !recent.has(w.id)));
  const picked = fresh.length >= size ? fresh.slice(0, size) : [...fresh, ...shuffle(candidates.filter((w) => recent.has(w.id)))].slice(0, size);
  // Remember up to half the candidates, so the hold-back never empties the pool.
  const keep = Math.floor(candidates.length / 2);
  writeRecent(level, [...picked.map((w) => w.id), ...readRecent(level)].slice(0, keep));
  return picked;
}

export function PracticeClient({ level, slug }: { level: number; slug: string }) {
  const { t, locale } = useI18n();
  const progress = useProgress();
  const [words, setWords] = useState<CardWord[] | null>(null);
  // "Due" is judged at load time; Date.now() can't be read during render.
  const [loadedAt, setLoadedAt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<Mode>("cards");
  const [size, setSize] = useState(20);
  const [source, setSource] = useState<Source>("all");
  const [front, setFront] = useState<CardFront>("mixed");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/data/words/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((ws: CardWord[]) => {
        if (!live) return;
        setLoadedAt(Date.now());
        setWords(ws);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [slug]);

  const counts = useMemo(() => {
    return Object.fromEntries(SOURCES.map((s) => [s, words ? words.filter((w) => matches(s, w.id, progress.words, loadedAt)).length : 0])) as Record<Source, number>;
  }, [words, progress.words, loadedAt]);

  const start = () => {
    if (!words) return;
    const now = Date.now();
    const candidates = words.filter((w) => matches(source, w.id, progress.words, now));
    if (!candidates.length) return;
    const picked = draw(level, candidates, size);
    const chosen = new Set(picked.map((w) => w.id));
    // Wrong answers in tests come from the whole level, not just the drawn set.
    const pool = shuffle(words.filter((w) => !chosen.has(w.id))).slice(0, 150);
    setSession((s) => ({ n: (s?.n ?? 0) + 1, words: picked, pool }));
  };

  if (failed) return <p role="alert" className="text-danger">{t.practice.loadError}</p>;
  if (!words) return <p className="text-muted">{t.practice.loading}</p>;

  if (session) {
    return (
      <ToneScope className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted tabular-nums" data-testid="set-info">
            {fmt(t.practice.setInfo, { n: session.words.length, source: t.practice.sources[source] })}
          </span>
          <span className="flex flex-wrap gap-2">
            <button type="button" onClick={start} className="min-h-10 rounded-lg border border-line bg-surface px-4 text-sm font-semibold hover:border-muted">
              {t.practice.newSet}
            </button>
            <button type="button" onClick={() => setSession(null)} className="min-h-10 rounded-lg border border-line bg-surface px-4 text-sm font-semibold hover:border-muted">
              {t.practice.change}
            </button>
          </span>
        </div>
        {mode === "cards" ? (
          <Flashcards key={session.n} words={session.words} order="random" front={front} onNewSet={start} />
        ) : (
          <LessonTest key={session.n} words={session.words} pool={session.pool} testKey={`3-${level}-practice`} onNewSet={start} />
        )}
      </ToneScope>
    );
  }

  const available = counts[source];
  return (
    <form
      className="flex max-w-2xl flex-col gap-6 rounded-xl border border-line bg-surface p-5"
      onSubmit={(e) => {
        e.preventDefault();
        start();
      }}
    >
      <Choice legend={t.practice.mode} name="mode" value={mode} options={["cards", "test"] as const} label={(o) => t.practice.modes[o]} onChange={setMode} />
      <Choice legend={t.practice.size} name="size" value={size} options={SIZES} label={String} onChange={setSize} />
      <Choice legend={t.practice.source} name="source" value={source} options={SOURCES} label={(o) => `${t.practice.sources[o]} · ${counts[o].toLocaleString(locale)}`} onChange={setSource} />
      {mode === "cards" && <Choice legend={t.practice.front} name="front" value={front} options={FRONTS} label={(o) => t.practice.fronts[o]} onChange={setFront} />}
      {available === 0 ? (
        <p role="status" className="text-muted">{t.practice.empty}</p>
      ) : (
        <button type="submit" className="min-h-12 self-start rounded-lg bg-accent px-6 font-semibold text-paper">
          {t.practice.start}
        </button>
      )}
    </form>
  );
}
