"use client";

let voice: SpeechSynthesisVoice | null = null;

/** Higher is better: neural "Natural"/"Online" voices (Edge), Google's Mandarin voice (Chrome), then Apple's Premium/Enhanced. */
function score(v: SpeechSynthesisVoice): number {
  const n = v.name;
  let s = /^zh[-_]CN/i.test(v.lang) ? 10 : 0;
  if (/Natural|Neural/i.test(n)) s += 50;
  else if (/Online/i.test(n)) s += 40;
  else if (/Google/i.test(n)) s += 35;
  else if (/Premium/i.test(n)) s += 30;
  else if (/Enhanced/i.test(n)) s += 20;
  if (/Xiaoxiao|Yunxi|Xiaoyi|Lilian|Tingting|Yu-?shu/i.test(n)) s += 5;
  return s;
}

function pickVoice() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const zh = window.speechSynthesis
    .getVoices()
    .filter((v) => /^zh/i.test(v.lang) && !/HK|TW|yue/i.test(v.lang));
  voice = zh.sort((a, b) => score(b) - score(a))[0] ?? null;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  pickVoice();
  window.speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
}

/** True when the device has a Mandarin voice, so listening questions can be asked. */
export function hasChineseVoice(): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  if (!voice) pickVoice();
  return !!voice;
}

export type SpeakResult = "ok" | "no-voice" | "unsupported";

/** Speaks Mandarin text with the device's own voice. Returns whether a Chinese voice was available. */
export function speak(text: string, rate = 0.8, onEnd?: () => void): SpeakResult {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return "unsupported";
  if (!voice) pickVoice();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = rate;
  if (voice) u.voice = voice;
  if (onEnd) u.onend = () => onEnd();
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  return voice ? "ok" : "no-voice";
}

/** Plays text `times` times with a pause between, the way exam recordings repeat. Returns a cancel function. */
export function speakTimes(text: string, times: number, rate = 0.8, onDone?: () => void): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const play = (left: number) => {
    if (cancelled) return;
    const r = speak(text, rate, () => {
      if (left > 1) timer = setTimeout(() => play(left - 1), 1500);
      else onDone?.();
    });
    if (r === "unsupported") onDone?.();
  };
  play(times);
  return () => {
    cancelled = true;
    clearTimeout(timer);
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  };
}
