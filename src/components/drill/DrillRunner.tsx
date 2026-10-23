"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n";
import { speak, speakTimes } from "@/lib/speech";
import { isCorrect, type ArrangeItem, type ChoiceItem, type Item, type TypeItem } from "@/lib/exam/items";
import { sentenceText, type Sentence } from "@/lib/bank";
import { Pinyin } from "../Hanzi";
import { SpeakButton } from "../SpeakButton";

export type Answer = number | string | undefined;
const LISTENING = new Set(["judge", "hearSentence", "hearWord"]);
const CHINESE_OPTIONS = new Set(["hearSentence", "hearWord", "gap", "order"]);

export const sentencePinyin = (s: Sentence) => s.p.filter(Boolean).join(" ");

function Speaker() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
      <path d="M3 6h2.5L9 3v10L5.5 10H3z" />
      <path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.5 3.5a6 6 0 0 1 0 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** The full sentence with pinyin and translation, shown after an answer and in the mistake review. */
export function SentenceCard({ s, className = "" }: { s: Sentence; className?: string }) {
  const { t, locale } = useI18n();
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="flex flex-wrap items-center gap-3">
        <span lang="zh-CN" className="han text-xl">{sentenceText(s)}</span>
        <SpeakButton text={sentenceText(s)} compact />
      </span>
      <Pinyin p={sentencePinyin(s)} className="text-sm font-normal text-muted" />
      {locale === "ru" && s.r ? (
        <span lang="ru" className="text-sm">{s.e}</span>
      ) : (
        <span lang="en" className="text-sm" title={locale === "ru" ? t.common.translationPending : undefined}>
          {s.e}
          {locale === "ru" && <span className="ml-1 align-super text-[0.65em] font-semibold text-muted">EN</span>}
        </span>
      )}
    </div>
  );
}

function answerText(item: Item, a: Answer) {
  if (a === undefined) return null;
  if (item.kind === "arrange" || item.kind === "typeChar") return String(a);
  return (item as ChoiceItem).options[a as number];
}

interface Props {
  items: Item[];
  /** practice: feedback after each answer; exam: no feedback, no replay, optional time limit */
  mode: "practice" | "exam";
  /** show pinyin under Chinese prompts and options (HSK 1–2 papers do) */
  pinyin: boolean;
  /** times each recording plays automatically */
  plays?: number;
  rate?: number;
  /** exam section time limit in seconds */
  seconds?: number;
  onDone: (answers: Answer[]) => void;
}

export function DrillRunner({ items, mode, pinyin, plays = 1, rate = 0.8, seconds, onDone }: Props) {
  const { t } = useI18n();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(() => items.map(() => undefined));
  const [checked, setChecked] = useState(false);
  const [left, setLeft] = useState(seconds ?? 0);
  const [playing, setPlaying] = useState(false);
  const nextRef = useRef<HTMLButtonElement>(null);
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  const doneRef = useRef(false);

  const item = items[i];
  const answer = answers[i];
  const exam = mode === "exam";
  const showFeedback = !exam && checked;

  const finish = (final: Answer[]) => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone(final);
  };

  // Section timer: when it reaches zero the section ends with whatever was answered.
  useEffect(() => {
    if (!seconds) return;
    const end = Date.now() + seconds * 1000;
    const id = setInterval(() => {
      const s = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) {
        clearInterval(id);
        finish(answersRef.current);
      }
    }, 500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  // Listening questions play by themselves, like the exam recording.
  useEffect(() => {
    if (!item || !LISTENING.has(item.kind)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlaying(true);
    return speakTimes(sentenceText(item.sentence), exam ? plays : 1, rate, () => setPlaying(false));
  }, [item, exam, plays, rate]);

  // Move focus to Next once a choice is made, so Enter continues (typed answers keep focus in the field).
  const choiceMade = exam && answer !== undefined && !!item && "options" in item;
  useEffect(() => {
    if (showFeedback || choiceMade) nextRef.current?.focus({ preventScroll: true });
  }, [showFeedback, choiceMade, i]);

  const setAnswer = (a: Answer) => setAnswers((prev) => prev.map((x, j) => (j === i ? a : x)));

  const choose = (k: number) => {
    if (showFeedback) return;
    setAnswer(k);
    if (!exam) setChecked(true);
  };

  const next = () => {
    if (i + 1 >= items.length) return finish(answersRef.current);
    setI(i + 1);
    setChecked(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!item || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement)?.closest("input, textarea")) return;
      if ("options" in item && !showFeedback && ["1", "2", "3", "4"].includes(e.key) && item.options[Number(e.key) - 1] !== undefined) choose(Number(e.key) - 1);
      else if (e.key === "Enter" && (showFeedback || (exam && answer !== undefined)) && e.target !== nextRef.current) {
        // Stop Enter from also pressing whichever option has focus.
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!item) return null;
  const right = showFeedback && isCorrect(item, answer);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div className="flex items-center justify-between gap-3 text-sm text-muted tabular-nums">
        <span>{fmt(t.drill.question, { i: i + 1, n: items.length })}</span>
        {seconds ? (
          <span role="timer" aria-label={t.drill.timeLeft} className={`font-semibold ${left < 60 ? "text-danger" : ""}`}>
            {t.drill.timeLeft} {mm}:{ss}
          </span>
        ) : null}
      </div>
      <div className="flex gap-1" aria-hidden="true">
        {items.map((x, j) => (
          <span key={x.key} className={`h-1.5 flex-1 rounded-full ${j < i || (j === i && answers[j] !== undefined) ? (exam ? "bg-muted" : isCorrect(x, answers[j]) ? "bg-ok" : "bg-danger") : j === i ? "bg-muted/50" : "bg-line"}`} />
        ))}
      </div>

      <div key={item.key} className="enter flex flex-col gap-4 rounded-xl border border-line bg-surface px-4 py-6">
        <span className="eyebrow">{t.drill.ask[item.kind]}</span>
        {LISTENING.has(item.kind) && (
          exam ? (
            <span className="inline-flex items-center gap-2 self-start text-sm text-muted" aria-live="polite">
              <Speaker /> {playing ? t.drill.playing : "—"}
            </span>
          ) : (
            <button type="button" onClick={() => speak(sentenceText(item.sentence), rate)} className="inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-line px-4 font-semibold hover:border-muted">
              <Speaker /> {t.drill.replay}
            </button>
          )
        )}
        <Prompt item={item} pinyin={pinyin} />
        {item.kind === "arrange" ? (
          <Arrange key={item.key} item={item} locked={showFeedback} onSubmit={(a) => { setAnswer(a); if (!exam) setChecked(true); }} exam={exam} />
        ) : item.kind === "typeChar" ? (
          <TypeChar key={item.key} item={item} locked={showFeedback} onSubmit={(a) => { setAnswer(a); if (!exam) setChecked(true); }} exam={exam} />
        ) : (
          <Options item={item} answer={answer as number | undefined} feedback={showFeedback} onPick={choose} />
        )}
      </div>

      {showFeedback && (
        <div role="status" className="flex flex-col gap-3">
          <p className={`font-semibold ${right ? "text-ok" : "text-danger"}`}>
            {right ? t.test.right : t.test.wrong}
          </p>
          <SentenceCard s={item.sentence} />
        </div>
      )}

      {(showFeedback || (exam && answer !== undefined)) && (
        <button ref={nextRef} type="button" onClick={next} className="min-h-11 self-start rounded-lg bg-accent px-5 font-semibold text-paper">
          {i + 1 === items.length ? t.test.finish : t.common.next} <kbd className="ml-1 text-xs">Enter</kbd>
        </button>
      )}
    </div>
  );
}

function Prompt({ item, pinyin }: { item: Item; pinyin: boolean }) {
  if (item.kind === "judge") {
    const shown = item.prompt!;
    return (
      <div className="flex flex-col gap-1 rounded-lg border border-line px-4 py-3">
        <span lang="zh-CN" className="han text-2xl">{shown}</span>
      </div>
    );
  }
  if (item.kind === "gap") {
    const s = item.sentence;
    return (
      <div className="flex flex-col gap-1">
        <span lang="zh-CN" className="han text-2xl leading-relaxed">{item.prompt}</span>
        {pinyin && <Pinyin p={s.p.map((p, j) => (j === item.blank ? "＿＿" : p)).filter(Boolean).join(" ")} className="text-sm font-normal text-muted" />}
      </div>
    );
  }
  if (item.kind === "meaning") {
    return (
      <div className="flex flex-col gap-1">
        <span lang="zh-CN" className="han text-2xl">{sentenceText(item.sentence)}</span>
        {pinyin && <Pinyin p={sentencePinyin(item.sentence)} className="text-sm font-normal text-muted" />}
      </div>
    );
  }
  if (item.kind === "typeChar") {
    const s = item.sentence;
    return (
      <p lang="zh-CN" className="han flex flex-wrap items-end gap-y-2 text-2xl">
        {s.s.map((tok, j) =>
          j !== item.token ? (
            <span key={j}>{tok}</span>
          ) : (
            [...tok].map((c, k) =>
              k === item.char ? (
                <span key={`${j}-${k}`} className="mx-1 inline-flex flex-col items-center">
                  <span lang="zh-Latn-pinyin" className="font-sans text-sm font-semibold text-accent">{item.pinyin}</span>
                  <span className="inline-block h-9 w-9 border-b-2 border-ink" aria-label="＿" />
                </span>
              ) : (
                <span key={`${j}-${k}`}>{c}</span>
              ),
            )
          ),
        )}
      </p>
    );
  }
  return null;
}

function Options({ item, answer, feedback, onPick }: { item: ChoiceItem; answer: number | undefined; feedback: boolean; onPick: (k: number) => void }) {
  const { t, locale } = useI18n();
  const judge = item.kind === "judge";
  const chinese = CHINESE_OPTIONS.has(item.kind);
  return (
    <div role="group" aria-label={t.drill.ask[item.kind]} className={`grid gap-2 ${judge ? "grid-cols-2" : item.kind === "hearWord" || item.kind === "gap" ? "grid-cols-2" : ""}`}>
      {item.options.map((o, k) => {
        const state = !feedback ? (answer === k ? "border-ink bg-ink/5" : "") : k === item.answer ? "border-ok bg-ok/10" : k === answer ? "border-danger bg-danger/10" : "opacity-60";
        return (
          <button
            key={k}
            type="button"
            data-option={k}
            aria-pressed={answer === k}
            disabled={feedback}
            onClick={() => onPick(k)}
            className={`flex min-h-14 items-center gap-3 rounded-lg border border-line bg-surface px-4 py-2 text-left hover:border-muted disabled:cursor-default ${state}`}
          >
            <span className="min-w-0 flex-1">
              {judge ? (
                <span className="font-semibold">{k === 0 ? `✓ ${t.drill.match}` : `✗ ${t.drill.noMatch}`}</span>
              ) : chinese ? (
                <span className="flex flex-col">
                  <span lang="zh-CN" className={`han ${item.kind === "hearWord" || item.kind === "gap" ? "text-2xl" : "text-lg"}`}>{o}</span>
                </span>
              ) : (
                <span lang="en">
                  {o}
                  {locale === "ru" && <span className="ml-1 align-super text-[0.65em] font-semibold text-muted">EN</span>}
                </span>
              )}
            </span>
            <kbd className="text-xs text-muted">{k + 1}</kbd>
          </button>
        );
      })}
    </div>
  );
}

function Arrange({ item, locked, exam, onSubmit }: { item: ArrangeItem; locked: boolean; exam: boolean; onSubmit: (a: string) => void }) {
  const { t } = useI18n();
  const [picked, setPicked] = useState<number[]>([]);
  const built = picked.map((k) => item.tiles[k]).join("");
  const complete = picked.length === item.tiles.length;
  useEffect(() => {
    // In the exam the answer is saved as soon as every tile is placed.
    if (exam && complete) onSubmit(built);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, complete, built]);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-14 flex-wrap items-center gap-2 rounded-lg border border-dashed border-line px-3 py-2" aria-live="polite">
        {picked.map((k, j) => (
          <button key={j} type="button" disabled={locked} onClick={() => setPicked(picked.filter((_, x) => x !== j))} className="han min-h-11 rounded-md border border-ink bg-ink px-3 text-xl text-paper" lang="zh-CN">
            {item.tiles[k]}
          </button>
        ))}
        {complete && <span lang="zh-CN" className="han text-xl">{item.end}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {item.tiles.map((tile, k) => (
          <button
            key={k}
            type="button"
            data-tile={k}
            disabled={locked || picked.includes(k)}
            onClick={() => setPicked([...picked, k])}
            className="han min-h-11 rounded-md border border-line bg-surface px-3 text-xl hover:border-muted disabled:opacity-30"
            lang="zh-CN"
          >
            {tile}
          </button>
        ))}
      </div>
      {!locked && (
        <div className="flex gap-2">
          {!exam && (
            <button type="button" disabled={!complete} onClick={() => onSubmit(built)} className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-paper disabled:opacity-50">
              {t.drill.check}
            </button>
          )}
          <button type="button" onClick={() => setPicked([])} className="min-h-11 rounded-lg border border-line px-4 text-sm font-semibold hover:border-muted">
            {t.drill.clear}
          </button>
        </div>
      )}
    </div>
  );
}

function TypeChar({ item, locked, exam, onSubmit }: { item: TypeItem; locked: boolean; exam: boolean; onSubmit: (a: string) => void }) {
  const { t } = useI18n();
  const [value, setValue] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus({ preventScroll: true }), []);
  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        {t.drill.typeLabel}
        <input
          ref={ref}
          lang="zh-CN"
          value={value}
          disabled={locked}
          maxLength={item.answer.length + 1}
          autoComplete="off"
          onChange={(e) => {
            setValue(e.target.value);
            if (exam) onSubmit(e.target.value.trim());
          }}
          className="han h-14 w-20 rounded-lg border border-line bg-paper text-center text-3xl"
        />
      </label>
      {!exam && !locked && (
        <button type="submit" disabled={!value.trim()} className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-paper disabled:opacity-50">
          {t.drill.check}
        </button>
      )}
      <p className="w-full text-xs text-muted">{t.drill.typeHint}</p>
    </form>
  );
}

/** Score, breakdown by question type and the mistakes with full sentences. */
export function DrillResults({ items, answers }: { items: Item[]; answers: Answer[] }) {
  const { t } = useI18n();
  const score = items.filter((it, j) => isCorrect(it, answers[j])).length;
  const kinds = [...new Set(items.map((it) => it.kind))];
  const wrong = items.map((it, j) => ({ it, a: answers[j] })).filter(({ it, a }) => !isCorrect(it, a));
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <h2 className="text-2xl font-semibold tabular-nums" data-testid="drill-result">{fmt(t.drill.result, { score, total: items.length })}</h2>
      {kinds.length > 1 && (
        <div className="flex flex-col gap-2">
          <span className="eyebrow">{t.drill.byKind}</span>
          <ul className="grid gap-2 sm:grid-cols-2">
            {kinds.map((k) => {
              const of = items.map((it, j) => ({ it, j })).filter(({ it }) => it.kind === k);
              const ok = of.filter(({ it, j }) => isCorrect(it, answers[j])).length;
              return (
                <li key={k} className="flex justify-between rounded-lg border border-line bg-surface px-3 py-2 text-sm">
                  <span>{t.drill.kinds[k]}</span>
                  <span className="font-semibold tabular-nums">{ok}/{of.length}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <span className="eyebrow">{t.drill.mistakes}</span>
        {wrong.length === 0 ? (
          <p className="text-muted">{t.drill.noMistakes}</p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {wrong.map(({ it, a }) => (
              <li key={it.key} className="flex flex-col gap-2 px-4 py-3">
                <span className="text-xs font-semibold text-muted">{t.drill.kinds[it.kind]}</span>
                <SentenceCard s={it.sentence} />
                <span className="text-sm text-danger">
                  {a === undefined ? t.drill.noAnswer : fmt(t.drill.yourAnswer, { a: it.kind === "judge" ? (a === 0 ? t.drill.match : t.drill.noMatch) : answerText(it, a) ?? "" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
