"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n";
import { useBank } from "@/lib/bank";
import { recordTest, useProgress } from "@/lib/progress";
import { indexBank, isCorrect, makeSet, recentSentences, rememberSentences, SECTION_KINDS, type Item, type Section } from "@/lib/exam/items";
import { DrillResults, DrillRunner, type Answer } from "./DrillRunner";
import { VoiceCheck } from "./DrillPractice";

interface Part { section: Section; questions: number; minutes: number }

/**
 * Section sizes follow the new HSK papers (approximate, from published sample papers).
 * Where the real paper has essays (HSK 5–6, 7–9) the writing section uses
 * sentence-building tasks instead, and the intro says essays aren't scored.
 */
export const EXAM_PLAN: Record<number, Part[]> = {
  1: [{ section: "listening", questions: 20, minutes: 15 }, { section: "reading", questions: 20, minutes: 17 }],
  2: [{ section: "listening", questions: 25, minutes: 20 }, { section: "reading", questions: 25, minutes: 25 }, { section: "writing", questions: 10, minutes: 15 }],
  3: [{ section: "listening", questions: 30, minutes: 25 }, { section: "reading", questions: 30, minutes: 35 }, { section: "writing", questions: 10, minutes: 20 }],
  4: [{ section: "listening", questions: 32, minutes: 25 }, { section: "reading", questions: 32, minutes: 40 }, { section: "writing", questions: 6, minutes: 20 }],
  5: [{ section: "listening", questions: 35, minutes: 30 }, { section: "reading", questions: 35, minutes: 50 }, { section: "writing", questions: 6, minutes: 15 }],
  6: [{ section: "listening", questions: 40, minutes: 35 }, { section: "reading", questions: 40, minutes: 55 }, { section: "writing", questions: 6, minutes: 15 }],
  7: [{ section: "listening", questions: 40, minutes: 30 }, { section: "reading", questions: 47, minutes: 60 }, { section: "writing", questions: 6, minutes: 15 }],
};
export const PASS = 60;
export const playsFor = (level: number) => (level <= 3 ? 2 : 1);
export const mockKey = (level: number) => `3-${level}-mock`;

type Stage = { at: "intro" } | { at: "section"; k: number } | { at: "between"; k: number } | { at: "results" };

export function MockExam({ level, slug }: { level: number; slug: string }) {
  const { t } = useI18n();
  const { tests } = useProgress();
  const { bank, error } = useBank(slug);
  const ix = useMemo(() => (bank ? indexBank(bank) : null), [bank]);
  const plan = EXAM_PLAN[level];
  const [stage, setStage] = useState<Stage>({ at: "intro" });
  const [paper, setPaper] = useState<Item[][]>([]);
  const [answers, setAnswers] = useState<Answer[][]>([]);
  const sectionName = (s: Section) => (s === "listening" ? t.hub.modules.listening.title : t.reading.sections[s]);

  const begin = () => {
    if (!bank || !ix) return;
    const scope = `${level}-mock`;
    const avoid = recentSentences(scope);
    const sets = plan.map((p) => makeSet(bank, ix, SECTION_KINDS[p.section], p.questions, avoid));
    rememberSentences(scope, sets.flat().map((it) => it.sentence.i), Math.floor(bank.sentences.length / 2));
    setPaper(sets);
    setAnswers([]);
    setStage({ at: "section", k: 0 });
  };

  const endSection = (k: number, a: Answer[]) => {
    const all = [...answers];
    all[k] = a;
    setAnswers(all);
    if (k + 1 < plan.length) setStage({ at: "between", k });
    else {
      const total = paper.flat().length;
      const right = paper.reduce((n, items, j) => n + items.filter((it, q) => isCorrect(it, all[j]?.[q])).length, 0);
      recordTest(mockKey(level), Math.round((100 * right) / total), 100);
      setStage({ at: "results" });
    }
  };

  if (error) return <p role="alert" className="text-danger">{t.drill.loadError}</p>;
  if (!bank) return <p className="text-muted">{t.drill.loading}</p>;

  if (stage.at === "section") {
    const p = plan[stage.k];
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{sectionName(p.section)}</h2>
        <DrillRunner key={stage.k} items={paper[stage.k]} mode="exam" pinyin={level <= 2} plays={playsFor(level)} seconds={p.minutes * 60} onDone={(a) => endSection(stage.k, a)} />
      </div>
    );
  }

  if (stage.at === "between") {
    const next = plan[stage.k + 1];
    return (
      <div className="flex max-w-2xl flex-col items-start gap-4 rounded-xl border border-line bg-surface p-5">
        <p className="text-lg font-semibold">{fmt(t.exam.sectionDone, { section: sectionName(plan[stage.k].section) })}</p>
        <p className="text-muted tabular-nums">{sectionName(next.section)} · {fmt(t.exam.plan, { q: next.questions, m: next.minutes })}</p>
        <button type="button" onClick={() => setStage({ at: "section", k: stage.k + 1 })} className="min-h-12 rounded-lg bg-accent px-6 font-semibold text-paper">
          {fmt(t.exam.next, { section: sectionName(next.section) })}
        </button>
      </div>
    );
  }

  if (stage.at === "results") {
    const rows = plan.map((p, j) => {
      const right = paper[j].filter((it, q) => isCorrect(it, answers[j]?.[q])).length;
      return { p, right, total: paper[j].length };
    });
    const right = rows.reduce((n, r) => n + r.right, 0);
    const total = rows.reduce((n, r) => n + r.total, 0);
    const pct = Math.round((100 * right) / total);
    const pass = pct >= PASS;
    return (
      <div className="flex max-w-2xl flex-col gap-5">
        <div className="flex flex-col gap-1">
          <span className="eyebrow">{t.exam.resultTitle}</span>
          <p className="text-3xl font-semibold tabular-nums" data-testid="mock-total">{pct}%</p>
          <p className={`font-semibold ${pass ? "text-ok" : "text-danger"}`}>{pass ? t.exam.passed : t.exam.notPassed} · {fmt(t.exam.passLine, { n: PASS })}</p>
        </div>
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {rows.map(({ p, right, total }) => (
            <li key={p.section} className="flex items-center justify-between gap-3 px-4 py-3">
              <span>{sectionName(p.section)}</span>
              <span className="font-semibold tabular-nums">{right}/{total} · {Math.round((100 * right) / total)}%</span>
            </li>
          ))}
          <li className="flex items-center justify-between gap-3 px-4 py-3 font-semibold">
            <span>{t.exam.total}</span>
            <span className="tabular-nums">{right}/{total}</span>
          </li>
        </ul>
        {rows.map(({ p }, j) => (
          <details key={p.section} className="rounded-xl border border-line bg-surface p-4">
            <summary className="cursor-pointer font-semibold">{sectionName(p.section)} · {t.drill.mistakes}</summary>
            <div className="mt-4">
              <DrillResults items={paper[j]} answers={answers[j] ?? []} />
            </div>
          </details>
        ))}
        <button type="button" onClick={begin} className="min-h-12 self-start rounded-lg bg-accent px-6 font-semibold text-paper">{t.exam.again}</button>
      </div>
    );
  }

  const best = tests[mockKey(level)];
  const totalMin = plan.reduce((n, p) => n + p.minutes, 0);
  const totalQ = plan.reduce((n, p) => n + p.questions, 0);
  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <VoiceCheck />
      <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
        {plan.map((p) => (
          <li key={p.section} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="font-semibold">{sectionName(p.section)}</span>
            <span className="text-sm text-muted tabular-nums">{fmt(t.exam.plan, { q: p.questions, m: p.minutes })}</span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-3 px-4 py-3 font-semibold">
          <span>{t.exam.total}</span>
          <span className="tabular-nums">{fmt(t.exam.plan, { q: totalQ, m: totalMin })}</span>
        </li>
      </ul>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
        {t.exam.rules.map((r) => <li key={r}>{fmt(r, { n: playsFor(level) })}</li>)}
      </ul>
      <div className="flex flex-col gap-2 text-sm text-muted">
        <p>{t.exam.formatNote}</p>
        {level >= 3 && <p>{t.exam.noteSpeaking}</p>}
        {level >= 5 && <p>{t.exam.noteEssay}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={begin} className="min-h-12 rounded-lg bg-accent px-6 font-semibold text-paper">{t.exam.start}</button>
        {best && <span className="text-sm text-muted tabular-nums">{fmt(t.exam.best, { n: best.best })}</span>}
      </div>
    </div>
  );
}
