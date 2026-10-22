"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { speak } from "@/lib/speech";
import { SpeakButton } from "../SpeakButton";
import type { Dialogue, Topic } from "@/data/dialogues";

/** Topics with their dialogues. Pinyin and translation can be hidden to test yourself. */
export function DialogueList({ topics }: { topics: Topic[] }) {
  const { t } = useI18n();
  const [pinyin, setPinyin] = useState(true);
  const [trans, setTrans] = useState(true);
  const toggle = (on: boolean, set: (v: boolean) => void, label: string) => (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => set(!on)}
      className={`min-h-9 rounded-full border px-3.5 text-sm font-medium ${on ? "border-accent bg-accent-soft" : "border-line"}`}
    >
      {on ? "✓ " : ""}
      {label}
    </button>
  );
  return (
    <div className="flex flex-col gap-8">
      <nav aria-label={t.dialogues.topics} className="flex flex-wrap gap-2">
        {topics.map((x) => (
          <a key={x.id} href={`#${x.id}`} className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm hover:border-accent">
            <TopicTitle topic={x} /> <span className="text-muted tabular-nums">· {x.d.length}</span>
          </a>
        ))}
      </nav>
      <div className="sticky top-[calc(57px+env(safe-area-inset-top))] z-10 -mx-1 flex flex-wrap items-center gap-2 bg-paper/95 px-1 py-2 backdrop-blur">
        <span className="text-sm text-muted">{t.dialogues.show}</span>
        {toggle(pinyin, setPinyin, t.dialogues.pinyin)}
        {toggle(trans, setTrans, t.dialogues.translation)}
      </div>
      {topics.map((x) => (
        <section key={x.id} id={x.id} className="flex scroll-mt-32 flex-col gap-4">
          <h2 className="text-2xl font-semibold">
            <TopicTitle topic={x} />
          </h2>
          {x.d.map((d, k) => (
            <DialogueCard key={k} id={`${x.id}-${k + 1}`} n={k + 1} d={d} pinyin={pinyin} trans={trans} />
          ))}
        </section>
      ))}
    </div>
  );
}

function TopicTitle({ topic }: { topic: Topic }) {
  const { locale } = useI18n();
  return <>{topic.t[locale === "ru" ? 1 : 0]}</>;
}

function DialogueCard({ id, n, d, pinyin, trans }: { id: string; n: number; d: Dialogue; pinyin: boolean; trans: boolean }) {
  const { t, locale } = useI18n();
  const L = locale === "ru" ? 4 : 3;
  const [playing, setPlaying] = useState<number | null>(null);
  const stopped = useRef(false);

  useEffect(() => () => {
    stopped.current = true;
  }, []);

  const playFrom = (i: number) => {
    if (stopped.current || i >= d.l.length) return setPlaying(null);
    setPlaying(i);
    const r = speak(d.l[i][1], 0.8, () => setTimeout(() => playFrom(i + 1), 500));
    if (r === "unsupported") setPlaying(null);
  };
  const stop = () => {
    stopped.current = true;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setPlaying(null);
  };

  return (
    <article id={id} className="flex scroll-mt-32 flex-col gap-4 rounded-xl border border-line bg-surface p-5 sm:p-6">
      <header className="flex flex-wrap items-center gap-3">
        <h3 className="mr-auto text-lg font-semibold">
          <span className="text-muted tabular-nums">{n}.</span> {d.t[L - 3]}
        </h3>
        <button
          type="button"
          onClick={() => {
            if (playing !== null) return stop();
            stopped.current = false;
            playFrom(0);
          }}
          className="min-h-9 rounded-full border border-line px-3.5 text-sm font-medium hover:border-muted"
        >
          {playing !== null ? `■ ${t.dialogues.stop}` : `▶ ${t.dialogues.play}`}
        </button>
      </header>
      <ol className="flex flex-col gap-3">
        {d.l.map((line, i) => {
          const [who] = d.s[line[0]] ?? ["?", ""];
          const right = line[0] % 2 === 1;
          return (
            <li key={i} className={`flex gap-3 ${right ? "sm:pl-10" : "sm:pr-10"}`}>
              <div className={`flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg border-l-4 px-3 py-1.5 ${right ? "border-accent" : "border-line"} ${playing === i ? "bg-accent-soft" : ""}`}>
                <span className="text-xs font-semibold text-muted">
                  <span lang="zh-CN" className="han">{who}</span> · {d.s[line[0]]?.[1]}
                </span>
                <span lang="zh-CN" className="han text-xl leading-snug">{line[1]}</span>
                {pinyin && <span className="text-sm text-muted">{line[2]}</span>}
                {trans && <span className="text-[15px]">{line[L]}</span>}
              </div>
              <span className="mt-1 shrink-0">
                <SpeakButton text={line[1]} compact />
              </span>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
