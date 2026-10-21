"use client";

let voice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices();
  voice =
    voices.find((v) => /^zh[-_]CN/i.test(v.lang)) ??
    voices.find((v) => /^zh/i.test(v.lang) && !/HK|TW/i.test(v.lang)) ??
    null;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  pickVoice();
  window.speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
}

export type SpeakResult = "ok" | "no-voice" | "unsupported";

/** Speaks Mandarin text with the device's own voice. Returns whether a Chinese voice was available. */
export function speak(text: string, rate = 0.8): SpeakResult {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return "unsupported";
  if (!voice) pickVoice();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN";
  u.rate = rate;
  if (voice) u.voice = voice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
  return voice ? "ok" : "no-voice";
}
