"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n";
import { useBank } from "@/lib/bank";
import { hasChineseVoice } from "@/lib/speech";
import { recordTest, useProgress } from "@/lib/progress";
import { indexBank, isCorrect, makeSet, recentSentences, rememberSentences, SECTION_KINDS, type Item, type Kind, type Section } from "@/lib/exam/items";
import { Choice } from "../Choice";
import { DrillResults, DrillRunner, type Answer } from "./DrillRunner";

const COUNTS = [10, 20];

/** Shows a warning when the device has no Mandarin voice (voices can arrive a moment after load). */
export function VoiceCheck() {
  const { t } = useI18n();
  const [ok, setOk] = useState(true);
  useEffect(() => {
    const check = () => setOk(hasChineseVoice());
    const id = setTimeout(check, 800);
    window.speechSynthesis?.addEventListener?.("voiceschanged", check);
    return () => {
      clearTimeout(id);
      window.speechSynthesis?.removeEventListener?.("voiceschanged", check);
    };
  }, []);
  if (ok) return null;
  return <p role="note" className="rounded-lg border border-line bg-surface px-4 py-3 text-sm">{t.common.noVoice}</p>;
}

export const testKey = (level: number, section: Section) => `3-${level}-${section}`;

export function DrillPractice({ level, slug, sections }: { level: number; slug: string; sections: Section[] }) {
  const { t } = useI18n();
  const { tests } = useProgress();
  const { bank, error } = useBank(slug);
  const ix = useMemo(() => (bank ? indexBank(bank) : null), [bank]);
  const [section, setSection] = useState<Section>(sections[0]);
  const [kind, setKind] = useState<Kind | "mixed">("mixed");
  const [count, setCount] = useState(10);
  const [slow, setSlow] = useState(false);
  const [run, setRun] = useState<{ n: number; items: Item[]; answers?: Answer[] } | null>(null);

  const start = () => {
    if (!bank || !ix) return;
    const scope = `${level}-${section}`;
    const items = makeSet(bank, ix, kind === "mixed" ? SECTION_KINDS[section] : [kind], count, recentSentences(scope));
    rememberSentences(scope, items.map((it) => it.sentence.i), Math.floor(bank.sentences.length / 2));
    setRun((r) => ({ n: (r?.n ?? 0) + 1, items }));
  };

  const finish = (answers: Answer[]) => {
    if (!run) return;
    const score = run.items.filter((it, j) => isCorrect(it, answers[j])).length;
    recordTest(testKey(level, section), Math.round((100 * score) / run.items.length), 100);
    setRun({ ...run, answers });
  };

  if (error) return <p role="alert" className="text-danger">{t.drill.loadError}</p>;
  if (!bank) return <p className="text-muted">{t.drill.loading}</p>;

  if (run) {
    return (
      <div className="flex flex-col gap-5">
        {section === "listening" && <VoiceCheck />}
        {run.answers ? (
          <>
            <DrillResults items={run.items} answers={run.answers} />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={start} className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-paper">{t.drill.newSet}</button>
              <button type="button" onClick={() => setRun(null)} className="min-h-11 rounded-lg border border-line bg-surface px-4 font-semibold hover:border-muted">{t.drill.change}</button>
            </div>
          </>
        ) : (
          <DrillRunner key={run.n} items={run.items} mode="practice" pinyin={level <= 2} rate={slow ? 0.55 : 0.8} onDone={finish} />
        )}
      </div>
    );
  }

  const best = tests[testKey(level, section)];
  return (
    <div className="flex flex-col gap-5">
      {section === "listening" && <VoiceCheck />}
      <form
        className="flex max-w-2xl flex-col gap-6 rounded-xl border border-line bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          start();
        }}
      >
        {sections.length > 1 && (
          <Choice legend={t.reading.section} name="section" value={section} options={sections} label={(o) => t.reading.sections[o as "reading" | "writing"]} onChange={(v) => { setSection(v); setKind("mixed"); }} />
        )}
        <Choice legend={t.drill.type} name="kind" value={kind} options={["mixed", ...SECTION_KINDS[section]] as (Kind | "mixed")[]} label={(o) => (o === "mixed" ? t.drill.mixed : t.drill.kinds[o])} onChange={setKind} />
        <Choice legend={t.drill.count} name="count" value={count} options={COUNTS} label={String} onChange={setCount} />
        {section === "listening" && (
          <Choice legend={t.listening.speed} name="speed" value={slow ? "slow" : "normal"} options={["normal", "slow"] as const} label={(o) => t.listening.speeds[o]} onChange={(v) => setSlow(v === "slow")} />
        )}
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className="min-h-12 rounded-lg bg-accent px-6 font-semibold text-paper">{t.drill.start}</button>
          {best && <span className="text-sm text-muted tabular-nums">{fmt(t.drill.best, { n: best.best })}</span>}
        </div>
      </form>
      <p className="max-w-2xl text-xs text-muted">{t.drill.source}</p>
    </div>
  );
}
