/** A button-like "Open →" label inside a card that is itself a link, so the card reads as something to press. */
export function OpenCue({ label }: { label: string }) {
  return (
    <span aria-hidden="true" className="mt-auto inline-flex min-h-9 items-center gap-1.5 self-start rounded-lg bg-accent px-3 text-sm font-semibold text-paper group-hover:opacity-90">
      {label} <span>→</span>
    </span>
  );
}
