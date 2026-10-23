"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n";
import { sentenceText, useBank, type Sentence } from "@/lib/bank";
import { speak } from "@/lib/speech";
import { shuffle } from "@/lib/random";
import { Choice } from "../Choice";
import { Pinyin } from "../Hanzi";
import { sentencePinyin } from "./DrillRunner";
import { VoiceCheck } from "./DrillPractice";
import { Coach } from "./Coach";
import { HSKK_QUESTIONS, hskkBand } from "@/data/hskk-questions";

type Mode = "read" | "repeat" | "answer";

// The Web Speech recognition API isn't in TypeScript's DOM types yet.
interface RecognitionResult { transcript: string }
interface RecognitionEvent { results: ArrayLike<ArrayLike<RecognitionResult>> }
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const DIGITS = "零一二三四五六七八九";
/** Recognisers write numbers as digits; the sentences use characters. Handles 0–99, which covers dates and times. */
function digitsToHanzi(s: string) {
  return s.replace(/\d+/g, (m) => {
    const n = Number(m);
    if (n >= 100) return [...m].map((d) => DIGITS[Number(d)]).join("");
    if (n < 10) return DIGITS[n];
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return `${tens > 1 ? DIGITS[tens] : ""}十${ones ? DIGITS[ones] : ""}`;
  });
}

const hanziOnly = (s: string) => [...s].filter((c) => /\p{Script=Han}/u.test(c));

/** Which target characters were recognised, by longest common subsequence. */
function matchChars(target: string[], heard: string[]): boolean[] {
  const m = target.length;
  const n = heard.length;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--) dp[i][j] = target[i] === heard[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const hit = new Array<boolean>(m).fill(false);
  for (let i = 0, j = 0; i < m && j < n; ) {
    if (target[i] === heard[j]) {
      hit[i] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return hit;
}

const MAX_LEN: Record<number, number> = { 1: 8, 2: 10, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28 };

export function Speaking({ level, slug }: { level: number; slug: string }) {
  const { t, locale } = useI18n();
  const questions = useMemo(() => shuffle(HSKK_QUESTIONS[hskkBand(level)]), [level]);
  const { bank, error } = useBank(slug);
  const pool = useMemo(() => (bank ? shuffle(bank.sentences.filter((s) => hanziOnly(sentenceText(s)).length <= MAX_LEN[level])) : []), [bank, level]);
  const [mode, setMode] = useState<Mode>("read");
  const [k, setK] = useState(0);
  const s: Sentence | undefined = pool[k % Math.max(pool.length, 1)];
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const rec = useRef<Recognition | null>(null);

  // Recorder fallback for browsers without recognition.
  const [recording, setRecording] = useState(false);
  const [clip, setClip] = useState<string | null>(null);
  const media = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(!!recognitionCtor());
  }, []);

  const question = questions[k % questions.length];
  useEffect(() => {
    if (s && mode === "repeat") speak(sentenceText(s));
    if (mode === "answer") speak(question.zh);
  }, [s, mode, question]);

  const reset = () => {
    setHeard(null);
    setProblem(null);
    setRevealed(false);
    setClip(null);
  };

  const listen = () => {
    const Ctor = recognitionCtor();
    if (!Ctor || !s) return;
    reset();
    const r = new Ctor();
    r.lang = "zh-CN";
    // An answer can run to several sentences; reading a sentence is one utterance.
    r.continuous = mode === "answer";
    r.interimResults = false;
    r.maxAlternatives = 3;
    r.onresult = (e) => {
      if (mode === "answer") {
        setHeard(Array.from(e.results).map((res) => res[0]?.transcript ?? "").join("，"));
        return;
      }
      const target = hanziOnly(sentenceText(s));
      const alts = Array.from(e.results[0] ?? []).map((a) => digitsToHanzi(a.transcript));
      // Keep the alternative that matches the target best.
      const best = alts.sort((a, b) => matchChars(target, hanziOnly(b)).filter(Boolean).length - matchChars(target, hanziOnly(a)).filter(Boolean).length)[0] ?? "";
      setHeard(best);
      if (mode === "repeat") setRevealed(true);
    };
    r.onerror = (e) => setProblem(e.error === "not-allowed" || e.error === "service-not-allowed" ? t.speaking.micDenied : e.error === "no-speech" ? t.speaking.nothing : null);
    r.onend = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  };

  const toggleRecord = async () => {
    if (recording) {
      media.current?.stop();
      return;
    }
    reset();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        setClip(URL.createObjectURL(new Blob(chunks, { type: mr.mimeType })));
        setRecording(false);
      };
      media.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      setProblem(t.speaking.micDenied);
    }
  };

  if (error) return <p role="alert" className="text-danger">{t.drill.loadError}</p>;
  if (!bank || !s) return <p className="text-muted">{t.drill.loading}</p>;

  const target = hanziOnly(sentenceText(s));
  const hits = heard !== null ? matchChars(target, hanziOnly(heard)) : null;
  const pct = hits ? Math.round((100 * hits.filter(Boolean).length) / target.length) : 0;
  const showText = mode === "read" || revealed;
  let ci = 0;

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <VoiceCheck />
      <Choice legend={t.drill.type} name="mode" value={mode} options={["read", "repeat", "answer"] as const} label={(o) => t.speaking.modes[o]} onChange={(m) => { setMode(m); reset(); }} />
      {!supported && <p role="note" className="rounded-lg border border-line bg-surface px-4 py-3 text-sm">{t.speaking.unsupported}</p>}

      {mode === "answer" ? (
        <div key={`q-${k}`} className="enter flex flex-col gap-4 rounded-xl border border-line bg-surface px-4 py-6">
          <span className="eyebrow">{t.coach.question}</span>
          <p lang="zh-CN" className="han text-2xl leading-relaxed" data-testid="hskk-question">{question.zh}</p>
          <span className="text-sm">{locale === "ru" ? question.ru : question.en}</span>
          <p className="text-sm text-muted">{t.coach.answerHint}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => speak(question.zh)} className="min-h-11 rounded-full border border-line px-4 font-semibold hover:border-muted">{t.speaking.model}</button>
            {supported && (
              <button type="button" onClick={listening ? () => rec.current?.stop() : listen} className="min-h-11 rounded-full bg-accent px-5 font-semibold text-paper">
                {listening ? t.speaking.stop : t.speaking.speak}
              </button>
            )}
          </div>
          {!supported && <p className="text-sm text-muted">{t.coach.noRecognition}</p>}
          <div role="status" className="flex flex-col gap-2 text-sm">
            {listening && <span className="font-semibold">{t.speaking.listeningNow}</span>}
            {problem && <span className="text-danger">{problem}</span>}
            {heard !== null && <span lang="zh-CN">{fmt(t.speaking.heard, { t: heard || "—" })}</span>}
          </div>
          {heard && <Coach key={heard} level={level} mode="answer" target={question.zh} heard={heard} />}
        </div>
      ) : (
      <div key={`${s.i}-${mode}`} className="enter flex flex-col gap-4 rounded-xl border border-line bg-surface px-4 py-6">
        {showText ? (
          <div className="flex flex-col gap-1">
            <p lang="zh-CN" className="han text-3xl leading-relaxed" data-testid="speak-target">
              {[...sentenceText(s)].map((c, j) => {
                if (!/\p{Script=Han}/u.test(c)) return <span key={j}>{c}</span>;
                const ok = hits ? hits[ci++] : true;
                return <span key={j} className={ok ? "" : "text-danger underline decoration-2 underline-offset-4"}>{c}</span>;
              })}
            </p>
            {(level <= 3 || revealed) && <Pinyin p={sentencePinyin(s)} className="text-base font-normal text-muted" />}
            {revealed && <span lang={s.r && locale === "ru" ? "ru" : "en"} className="text-sm">{s.e}</span>}
          </div>
        ) : (
          <button type="button" onClick={() => setRevealed(true)} className="self-start text-sm font-semibold text-accent hover:underline">{t.speaking.showText}</button>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => speak(sentenceText(s))} className="min-h-11 rounded-full border border-line px-4 font-semibold hover:border-muted">{t.speaking.model}</button>
          {supported ? (
            <button type="button" onClick={listening ? () => rec.current?.stop() : listen} className="min-h-11 rounded-full bg-accent px-5 font-semibold text-paper">
              {listening ? t.speaking.stop : t.speaking.speak}
            </button>
          ) : (
            <button type="button" onClick={toggleRecord} className="min-h-11 rounded-full bg-accent px-5 font-semibold text-paper">
              {recording ? t.speaking.stop : t.speaking.record}
            </button>
          )}
        </div>
        <div role="status" className="flex flex-col gap-1 text-sm">
          {listening && <span className="font-semibold">{t.speaking.listeningNow}</span>}
          {problem && <span className="text-danger">{problem}</span>}
          {heard !== null && (
            <>
              <span lang="zh-CN">{fmt(t.speaking.heard, { t: heard || "—" })}</span>
              <span className={`font-semibold ${pct >= 85 ? "text-ok" : pct >= 60 ? "" : "text-danger"}`}>
                {fmt(t.speaking.score, { n: pct })} · {pct >= 85 ? t.speaking.good : pct >= 60 ? t.speaking.mid : t.speaking.low}
              </span>
              {pct < 100 && <span className="text-muted">{t.speaking.missed}</span>}
            </>
          )}
          {heard !== null && <Coach key={heard} level={level} mode={mode} target={sentenceText(s)} heard={heard} />}
          {clip && (
            <span className="flex flex-wrap items-center gap-2">
              {t.speaking.playback}
              <audio controls src={clip} className="h-10" />
            </span>
          )}
        </div>
      </div>
      )}
      <button type="button" onClick={() => { reset(); setK(k + 1); }} className="min-h-11 self-start rounded-lg border border-line bg-surface px-5 font-semibold hover:border-muted">
        {t.speaking.next}
      </button>
      <p className="text-xs text-muted">{t.speaking.aiNote}</p>
      <p className="text-xs text-muted">{t.drill.source}</p>
    </div>
  );
}
