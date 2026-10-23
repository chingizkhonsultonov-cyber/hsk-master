"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n";
import { getProgress, intervalDays, rateWord, type Grade } from "@/lib/progress";
import { updateSettings, useSettings } from "@/lib/settings";
import type { Word } from "@/lib/types";
import { shuffle } from "@/lib/random";
import { checkPinyin } from "@/lib/pinyin";
import { Hanzi, Pinyin } from "../Hanzi";
import { Meaning } from "../Meaning";
import { SpeakButton } from "../SpeakButton";
import { Tianzige } from "../Tianzige";

const GRADES: Grade[] = ["again", "hard", "good", "easy"];

export type CardWord = Pick<Word, "id" | "h" | "p" | "en" | "ru">;
/** Which side is shown first: the characters, the meaning, or a random mix per card. */
export type CardFront = "hanzi" | "meaning" | "mixed";

/** Due and new words first, then the rest of the lesson; Again puts a card back three places later. */
function buildQueue(words: CardWord[], order: "smart" | "random") {
  if (order === "random") return shuffle(words).map((w) => w.id);
  const p = getProgress().words;
  const now = Date.now();
  const rank = (w: CardWord) => (p[w.id] ? (p[w.id].due <= now ? 0 : 2) : 1);
  return [...words].sort((a, b) => rank(a) - rank(b)).map((w) => w.id);
}

function dealFronts(words: CardWord[], front: CardFront): Record<string, "hanzi" | "meaning"> {
  return Object.fromEntries(words.map((w) => [w.id, front === "mixed" ? (Math.random() < 0.5 ? "hanzi" : "meaning") : front]));
}

export function Flashcards({ words, order = "smart", front = "hanzi", onNewSet }: { words: CardWord[]; order?: "smart" | "random"; front?: CardFront; onNewSet?: () => void }) {
  const { t } = useI18n();
  const { pinyinFront, cardMode } = useSettings();
  const typing = cardMode !== "flip";
  const byId = useMemo(() => Object.fromEntries(words.map((w) => [w.id, w])), [words]);
  const [queue, setQueue] = useState<string[]>(() => buildQueue(words, order));
  const [fronts] = useState(() => dealFronts(words, front));
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);
  const [typed, setTyped] = useState("");
  const [verdict, setVerdict] = useState<"right" | "tones" | "wrong" | null>(null);
  const showRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const gradeRefs = useRef<Partial<Record<Grade, HTMLButtonElement | null>>>({});
  const w = queue.length ? byId[queue[0]] : null;
  const prog = w ? getProgress().words[w.id] : undefined;
  const meaningFirst = !!w && (typing ? cardMode === "hanzi" : fronts[w.id] === "meaning");
  // The grade the typed answer suggests; it gets focus so Enter accepts it.
  const suggested: Grade = verdict === "wrong" ? "again" : verdict === "tones" ? "hard" : "good";

  const reveal = () => setRevealed(true);
  const check = () => {
    if (!w) return;
    setVerdict(cardMode === "pinyin" ? checkPinyin(typed, w.p) : typed.replace(/\s/g, "") === w.h ? "right" : "wrong");
    setRevealed(true);
  };
  const rate = (g: Grade) => {
    if (!w) return;
    rateWord(w.id, g);
    setDone((d) => d + 1);
    setRevealed(false);
    setTyped("");
    setVerdict(null);
    setQueue((q) => {
      const rest = q.slice(1);
      if (g === "again") rest.splice(Math.min(3, rest.length), 0, w.id);
      return rest;
    });
  };

  useEffect(() => {
    (revealed ? gradeRefs.current[suggested] : typing ? inputRef.current : showRef.current)?.focus({ preventScroll: true });
  }, [revealed, w?.id, typing, suggested]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!w || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement)?.closest("input, select, textarea, details")) return;
      if (!revealed && e.key === " ") {
        e.preventDefault();
        reveal();
      } else if (revealed && ["1", "2", "3", "4"].includes(e.key)) {
        rate(GRADES[Number(e.key) - 1]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const label = (g: Grade) => {
    const d = intervalDays(prog, g);
    if (d < 1 / 24) return fmt(t.cards.minutes, { n: Math.round(d * 1440) });
    if (d < 1) return fmt(t.cards.hours, { n: Math.round(d * 24) });
    return fmt(t.cards.days, { n: Math.round(d) });
  };

  if (!w) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-line bg-surface px-5 py-12 text-center">
        <span aria-hidden="true" className="han text-5xl text-accent">好</span>
        <h2 className="text-xl font-semibold">{onNewSet ? t.practice.done : t.cards.done}</h2>
        <p className="max-w-md text-muted">{onNewSet ? t.practice.doneBody : t.cards.doneBody}</p>
        <button
          type="button"
          onClick={() => { if (onNewSet) onNewSet(); else { setQueue(buildQueue(words, order)); setDone(0); } }}
          className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-paper"
        >
          {onNewSet ? t.practice.newSet : t.cards.restart}
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_16rem]">
      <article key={w.id + String(revealed)} className="enter flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="flex justify-between text-sm text-muted tabular-nums">
          <span>{prog ? t.cards.review : t.cards.newWord}</span>
          <span data-testid="remaining">{fmt(t.cards.remaining, { n: queue.length })}</span>
        </div>
        <div className="flex flex-col items-center gap-4 text-center" aria-live="polite">
          {meaningFirst && !revealed ? (
            <div className="flex min-h-44 flex-col items-center justify-center gap-3 sm:min-h-52">
              <Meaning w={w} className="max-w-md text-2xl font-semibold" />
              {cardMode === "hanzi" && typing && <Pinyin p={w.p} className="text-2xl" />}
            </div>
          ) : (
            <Tianzige className="grid w-44 place-items-center sm:w-52">
              {revealed ? <Hanzi h={w.h} p={w.p} className={`relative ${[...w.h].length > 2 ? "text-4xl" : [...w.h].length > 1 ? "text-6xl" : "text-8xl"}`} /> : (
                <span lang="zh-CN" className={`han relative ${[...w.h].length > 2 ? "text-4xl" : [...w.h].length > 1 ? "text-6xl" : "text-8xl"}`}>{w.h}</span>
              )}
            </Tianzige>
          )}
          {(revealed || (pinyinFront && !meaningFirst && !typing)) && <Pinyin p={w.p} className="text-2xl" />}
          {revealed ? (
            <>
              <Meaning w={w} className="max-w-md text-lg" />
              <SpeakButton text={w.h} py={w.p} />
            </>
          ) : typing ? (
            <>
              {cardMode === "pinyin" && <Meaning w={w} className="max-w-md text-lg" />}
              <p className="text-sm text-muted">{cardMode === "pinyin" ? t.cards.promptPinyin : t.cards.promptHanzi}</p>
            </>
          ) : (
            <p className="text-sm text-muted">{meaningFirst ? t.cards.promptMeaning : t.cards.prompt}</p>
          )}
        </div>
        {revealed && verdict && (
          <p role="status" data-testid="card-verdict" className={`text-center font-semibold ${verdict === "right" ? "text-ok" : verdict === "tones" ? "text-accent" : "text-danger"}`}>
            {verdict === "right" ? t.cards.right : verdict === "tones" ? t.cards.tones : t.cards.wrong}{" "}
            {verdict !== "right" && (cardMode === "pinyin" ? <Pinyin p={w.p} /> : <span lang="zh-CN" className="han">{w.h}</span>)}
            {verdict !== "right" && typed.trim() && <span className="block text-sm font-normal text-muted">{typed}</span>}
          </p>
        )}
        {revealed ? (
          <div role="group" aria-label={t.cards.rateLabel} className="grid grid-cols-4 gap-2">
            {GRADES.map((g, i) => (
              <button
                key={g}
                ref={(el) => { gradeRefs.current[g] = el; }}
                type="button"
                data-grade={g}
                onClick={() => rate(g)}
                className={`flex min-h-14 flex-col items-center justify-center rounded-lg border px-1 text-sm font-semibold hover:border-muted ${g === "again" ? "border-danger/50" : g === "good" ? "border-accent/60" : "border-line"}`}
              >
                {t.cards[g]}
                <span className="text-xs font-normal text-muted tabular-nums">
                  {label(g)} · <kbd className="font-sans">{i + 1}</kbd>
                </span>
              </button>
            ))}
          </div>
        ) : typing ? (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              check();
            }}
          >
            <input
              ref={inputRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              lang={cardMode === "hanzi" ? "zh-CN" : undefined}
              aria-label={cardMode === "pinyin" ? t.cards.promptPinyin : t.cards.promptHanzi}
              placeholder={cardMode === "pinyin" ? t.cards.pinyinHint : t.cards.hanziHint}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className={`min-h-12 min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 ${cardMode === "hanzi" ? "han text-2xl" : "text-lg"}`}
            />
            <button type="submit" className="min-h-12 rounded-lg bg-accent px-5 font-semibold text-paper">
              {t.cards.check}
            </button>
          </form>
        ) : (
          <button ref={showRef} type="button" onClick={reveal} className="min-h-12 rounded-lg bg-accent font-semibold text-paper">
            {t.cards.show} <kbd className="ml-1 rounded border border-current px-1 text-xs">Space</kbd>
          </button>
        )}
      </article>
      <aside className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
          <span className="text-sm text-muted tabular-nums">{done} / {done + queue.length}</span>
          <span className="h-1.5 overflow-hidden rounded-full bg-line">
            <span className="block h-full bg-accent" style={{ width: `${(100 * done) / (done + queue.length)}%` }} />
          </span>
        </div>
        <fieldset className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-4 text-sm">
          <legend className="sr-only">{t.cards.mode}</legend>
          <span aria-hidden="true" className="mb-1 text-xs font-semibold text-muted">{t.cards.mode}</span>
          {(["flip", "pinyin", "hanzi"] as const).map((m) => (
            <label key={m} className="flex min-h-8 cursor-pointer items-center gap-2">
              <input type="radio" name="card-mode" value={m} className="h-4 w-4 accent-[var(--accent)]" checked={cardMode === m} onChange={() => { updateSettings({ cardMode: m }); setRevealed(false); setTyped(""); setVerdict(null); }} />
              {t.cards.modes[m]}
            </label>
          ))}
        </fieldset>
        {!typing && <label htmlFor="pinyin-front" className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface p-4 text-sm">
          <input id="pinyin-front" type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={pinyinFront} onChange={(e) => updateSettings({ pinyinFront: e.target.checked })} />
          {t.cards.showPinyin}
        </label>}
        <p className="px-1 text-xs text-muted">
          {t.common.keys}: {typing ? <kbd>Enter</kbd> : <kbd>Space</kbd>}, <kbd>1</kbd>–<kbd>4</kbd>
        </p>
      </aside>
    </div>
  );
}
