"use client";

import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n";
import type { Example, Word } from "@/lib/types";
import { Hanzi, Pinyin } from "../Hanzi";
import { Meaning } from "../Meaning";
import { SpeakButton } from "../SpeakButton";

export function WordList({ words, examples = {} }: { words: Word[]; examples?: Record<string, Example[]> }) {
  const { t, locale } = useI18n();
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {words.map((w) => (
        <li key={w.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-1 p-4 sm:grid-cols-[7rem_10rem_minmax(0,1fr)_auto] sm:items-center">
          <Hanzi h={w.h} p={w.p} className="row-span-3 text-3xl leading-tight sm:row-span-1" />
          <Pinyin p={w.p} className="text-lg" />
          <span className="flex min-w-0 flex-col gap-0.5">
            <Meaning w={w} className="text-ink" />
            <span className="flex flex-wrap gap-x-3 text-xs text-muted">
              {w.cl.length > 0 && <span>{fmt(t.lesson.measure, { m: w.cl.join("、") })}</span>}
              {w.t !== w.h && <span lang="zh-TW">{fmt(t.lesson.traditional, { t: w.t })}</span>}
              {w.label && <span lang="zh-CN">{fmt(t.lesson.syllabusForm, { f: w.label })}</span>}
            </span>
            {w.dict.length > 0 && (
              <details className="text-xs text-muted">
                <summary className="cursor-pointer select-none">{t.lesson.more}</summary>
                <span lang="en">{w.dict.join("; ")}</span>
              </details>
            )}
          </span>
          <span className="col-start-2 sm:col-start-auto">
            <SpeakButton text={w.h} py={w.p} compact />
          </span>
          {examples[w.id] && (
            <ul aria-label={t.lesson.examples} className="col-span-full mt-2 flex flex-col gap-2 border-l-2 border-line pl-3">
              {examples[w.id].map((x) => (
                <li key={x.s.join("")} className="flex items-start gap-3">
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span lang="zh-CN" className="han text-lg leading-snug">
                      {x.s.map((tok, j) => (x.k[j] === w.id ? <mark key={j} className="bg-transparent font-semibold text-accent">{tok}</mark> : tok))}
                    </span>
                    <span className="text-xs text-muted">{x.p.filter(Boolean).join(" ")}</span>
                    <span lang={locale === "ru" && x.r ? "ru" : "en"} className="text-sm">{locale === "ru" && x.r ? x.r : x.e}</span>
                  </span>
                  <SpeakButton text={x.s.join("")} compact />
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
