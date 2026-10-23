"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n";
import { recordAnswer, recordTest, useProgress } from "@/lib/progress";
import { markSyllable, stripTones, syllables, type Tone } from "@/lib/pinyin";
import { hasChineseVoice, speak } from "@/lib/speech";
import { shuffle } from "@/lib/random";
import type { Example, Word } from "@/lib/types";
import { Hanzi, Pinyin } from "../Hanzi";
import { meaningText } from "../Meaning";
import { PASS } from "../LessonLinks";

export type PoolWord = Pick<Word, "id" | "h" | "p" | "en" | "ru">;
type Kind = "meaning" | "hanzi" | "pinyin" | "fromPinyin" | "listen" | "sentence";
interface Option { label: string; right: boolean }
interface Question { w: PoolWord; kind: Kind; options: Option[]; pick: number | null; ex?: Example }

/** Wrong pinyin options keep the syllables and change tones, the way the exam tests tone knowledge. */
function pinyinOptions(p: string, others: PoolWord[]): string[] {
  const set = new Set([p]);
  const syl = syllables(p).map(stripTones);
  for (let guard = 0; set.size < 4 && guard < 80; guard++) {
    set.add(syl.map((s) => markSyllable(s, (1 + Math.floor(Math.random() * 4)) as Tone)).join(" "));
  }
  for (const o of shuffle(others)) {
    if (set.size >= 4) break;
    set.add(o.p);
  }
  return shuffle([...set]);
}

/** Question types are dealt at random, so the same words come back in a different form each time. */
function dealKinds(n: number, sentences: boolean): Kind[] {
  const kinds: Kind[] = ["meaning", "hanzi", "pinyin", "fromPinyin"];
  // Gap-fill sentences count twice, so about a third of a lesson test is words in context.
  if (sentences) kinds.push("sentence", "sentence");
  if (hasChineseVoice()) kinds.push("listen");
  const out: Kind[] = [];
  while (out.length < n) out.push(...shuffle(kinds));
  return out.slice(0, n);
}

function build(words: PoolWord[], pool: PoolWord[], locale: string, examples: Record<string, Example[]>): Question[] {
  const all = [...words, ...pool];
  const kinds = dealKinds(words.length, Object.keys(examples).length > 0);
  return shuffle(words).map((w, i) => {
    const ex = examples[w.id] ? shuffle(examples[w.id])[0] : undefined;
    const kind = kinds[i] === "sentence" && !ex ? "meaning" : kinds[i];
    if (kind === "pinyin") return { w, kind, pick: null, options: pinyinOptions(w.p, all.filter((o) => o.id !== w.id)).map((label) => ({ label, right: label === w.p })) };
    const right = kind === "meaning" ? meaningText(w, locale) : w.h;
    const inSentence = new Set(kind === "sentence" ? ex!.s : []);
    const seen = new Set([right]);
    const wrong: string[] = [];
    for (const o of shuffle(all)) {
      if (wrong.length >= 3) break;
      const label = kind === "meaning" ? meaningText(o, locale) : o.h;
      // When the prompt is a sound, a homophone would also be a correct answer.
      const homophone = (kind === "fromPinyin" || kind === "listen") && stripTones(o.p) === stripTones(w.p);
      if (o.id === w.id || seen.has(label) || homophone || inSentence.has(label)) continue;
      seen.add(label);
      wrong.push(label);
    }
    return { w, kind, pick: null, ex: kind === "sentence" ? ex : undefined, options: shuffle([right, ...wrong]).map((label) => ({ label, right: label === right })) };
  });
}

const CHAR_OPTIONS: Kind[] = ["hanzi", "fromPinyin", "listen", "sentence"];

/** `onNewSet` replaces "New test" with a fresh random set (used by random practice). */
const NO_EXAMPLES: Record<string, Example[]> = {};

export function LessonTest({ words, pool, examples = NO_EXAMPLES, testKey, onNewSet }: { words: PoolWord[]; pool: PoolWord[]; examples?: Record<string, Example[]>; testKey: string; onNewSet?: () => void }) {
  const { t, locale } = useI18n();
  const prior = useProgress().tests[testKey];
  const [qs, setQs] = useState<Question[] | null>(null);
  const [i, setI] = useState(0);
  const nextRef = useRef<HTMLButtonElement>(null);
  const firstRef = useRef<HTMLButtonElement>(null);

  // Build on the client only, so the random order never mismatches server HTML.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQs(build(words, pool, locale, examples));
  }, [words, pool, locale, examples]);

  const q = qs?.[i];
  const answered = q?.pick != null;

  useEffect(() => {
    if (q?.kind === "listen") speak(q.w.h, 0.8, undefined, { py: q.w.p });
  }, [q?.kind, q?.w.h, q?.w.p, i]);

  const pick = (k: number) => {
    if (!qs || !q || answered) return;
    recordAnswer(q.w.id, q.options[k].right);
    setQs(qs.map((x, j) => (j === i ? { ...x, pick: k } : x)));
  };
  const next = () => {
    if (!qs) return;
    if (i + 1 === qs.length) recordTest(testKey, qs.filter((x) => x.pick != null && x.options[x.pick].right).length, qs.length);
    setI(i + 1);
  };

  useEffect(() => {
    (answered ? nextRef : firstRef).current?.focus({ preventScroll: true });
  }, [answered, i]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!q || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!answered && ["1", "2", "3", "4"].includes(e.key) && q.options[Number(e.key) - 1]) pick(Number(e.key) - 1);
      else if (answered && e.key === "Enter" && (e.target as HTMLElement)?.tagName !== "BUTTON") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!qs) return <p className="text-muted">{fmt(t.test.intro, { n: words.length })}</p>;

  const dots = (
    <div className="flex gap-1" aria-hidden="true">
      {qs.map((x, j) => (
        <span key={j} className={`h-1.5 flex-1 rounded-full ${x.pick == null ? (j === i ? "bg-muted" : "bg-line") : x.options[x.pick].right ? "bg-ok" : "bg-danger"}`} />
      ))}
    </div>
  );

  if (!q) {
    const score = qs.filter((x) => x.pick != null && x.options[x.pick].right).length;
    const pct = score / qs.length;
    return (
      <div className="flex max-w-2xl flex-col gap-5">
        {dots}
        <h2 className="text-2xl font-semibold tabular-nums" data-testid="test-result">{fmt(t.test.result, { score, total: qs.length })}</h2>
        <p className="text-muted">{pct >= 0.8 ? t.test.resultGood : pct >= 0.5 ? t.test.resultMid : t.test.resultLow}</p>
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {qs.map((x) => {
            const ok = x.pick != null && x.options[x.pick].right;
            return (
              <li key={x.w.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3">
                <Hanzi h={x.w.h} p={x.w.p} className="text-xl" />
                <Pinyin p={x.w.p} />
                <span className="min-w-0 flex-1 text-sm">{meaningText(x.w, locale)}</span>
                <span className={`text-sm font-semibold ${ok ? "text-ok" : "text-danger"}`}>{ok ? "✓" : "✗"}</span>
              </li>
            );
          })}
        </ul>
        <button type="button" onClick={() => { if (onNewSet) onNewSet(); else { setQs(build(words, pool, locale, examples)); setI(0); } }} className="min-h-11 self-start rounded-lg bg-accent px-5 font-semibold text-paper">
          {onNewSet ? t.practice.newSet : t.test.retry}
        </button>
      </div>
    );
  }

  const already = prior && i === 0 && !answered && !onNewSet && (
    <p data-testid="test-already" className={`rounded-lg border px-4 py-2 text-sm ${prior.best / prior.total >= PASS ? "border-ok bg-ok/10 text-ok" : "border-line text-muted"}`}>
      {prior.best / prior.total >= PASS && "✓ "}
      {fmt(t.test.already, { n: prior.best, total: prior.total })}
    </p>
  );
  const ask = { meaning: t.test.askMeaning, hanzi: t.test.askHanzi, pinyin: t.test.askPinyin, fromPinyin: t.test.askFromPinyin, listen: t.test.askListen, sentence: t.test.askSentence }[q.kind];
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      {already}
      {dots}
      <div key={i} className="enter flex flex-col items-center gap-2 rounded-xl border border-line bg-surface px-4 py-8 text-center">
        <span className="eyebrow">{fmt(t.test.question, { i: i + 1, n: qs.length })} · {ask}</span>
        {q.kind === "sentence" && q.ex ? (
          <span className="flex flex-col items-center gap-2">
            <span lang="zh-CN" className="han text-2xl leading-relaxed sm:text-3xl">
              {q.ex.s.map((tok, j) =>
                q.ex!.k[j] === q.w.id ? (
                  answered ? <span key={j} className="text-accent">{tok}</span> : <span key={j} className="mx-1 inline-block w-[2.5em] border-b-2 border-ink align-baseline"><span className="sr-only">___</span>&nbsp;</span>
                ) : (
                  tok
                ),
              )}
            </span>
            <span className="text-sm text-muted">{locale === "ru" && q.ex.r ? q.ex.r : q.ex.e}</span>
          </span>
        ) : q.kind === "hanzi" ? (
          <span className="text-2xl font-semibold">{meaningText(q.w, locale)}</span>
        ) : q.kind === "fromPinyin" ? (
          <Pinyin p={q.w.p} className="text-4xl" />
        ) : q.kind === "listen" ? (
          <button type="button" onClick={() => speak(q.w.h, 0.8, undefined, { py: q.w.p })} className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-full border border-line px-5 font-semibold hover:border-muted">
            <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
              <path d="M3 6h2.5L9 3v10L5.5 10H3z" />
              <path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.5 3.5a6 6 0 0 1 0 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            {t.test.play}
          </button>
        ) : (
          <span lang="zh-CN" className="han text-6xl">{q.w.h}</span>
        )}
      </div>
      <div role="group" aria-label={ask} className="grid gap-2 sm:grid-cols-2">
        {q.options.map((o, k) => {
          const state = !answered ? "" : o.right ? "border-ok bg-ok/10" : k === q.pick ? "border-danger bg-danger/10" : "opacity-60";
          return (
            <button
              key={k}
              ref={k === 0 ? firstRef : undefined}
              type="button"
              data-option={k}
              disabled={answered}
              onClick={() => pick(k)}
              className={`flex min-h-14 items-center gap-3 rounded-lg border border-line bg-surface px-4 text-left hover:border-muted disabled:cursor-default ${state}`}
            >
              <span className="min-w-0 flex-1">
                {CHAR_OPTIONS.includes(q.kind) ? <span lang="zh-CN" className="han text-2xl">{o.label}</span> : q.kind === "pinyin" ? <Pinyin p={o.label} className="text-lg" /> : o.label}
              </span>
              <kbd className="text-xs text-muted">{k + 1}</kbd>
            </button>
          );
        })}
      </div>
      <p role="status" className={`min-h-6 font-semibold ${answered ? (q.options[q.pick!].right ? "text-ok" : "text-danger") : ""}`}>
        {answered && (
          <>
            {q.options[q.pick!].right ? t.test.right : t.test.wrong} <span lang="zh-CN" className="han">{q.w.h}</span> · {q.w.p} · {meaningText(q.w, locale)}
          </>
        )}
      </p>
      {answered && (
        <button ref={nextRef} type="button" onClick={next} className="min-h-11 self-start rounded-lg bg-accent px-5 font-semibold text-paper">
          {i + 1 === qs.length ? t.test.finish : t.common.next} <kbd className="ml-1 text-xs">Enter</kbd>
        </button>
      )}
    </div>
  );
}
