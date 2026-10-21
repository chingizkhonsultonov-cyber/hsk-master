import { alignHanzi, syllables, toneOf } from "@/lib/pinyin";

/** Characters coloured by tone (colours apply only inside a `.tones` container). */
export function Hanzi({ h, p, className = "" }: { h: string; p: string; className?: string }) {
  return (
    <span lang="zh-CN" className={`han ${className}`}>
      {alignHanzi(h, p).map((c, i) => (
        <span key={i} className={`tone-${c.tone}`}>
          {c.ch}
        </span>
      ))}
    </span>
  );
}

export function Pinyin({ p, className = "" }: { p: string; className?: string }) {
  const syl = syllables(p);
  return (
    <span lang="zh-Latn-pinyin" className={`font-semibold ${className}`}>
      {syl.map((s, i) => (
        <span key={i} className={`tone-${toneOf(s)}`}>
          {s}
          {i < syl.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
