"use client";

/** A row of radio buttons styled as segmented buttons. */
export function Choice<T extends string | number>({ legend, name, value, options, label, onChange }: { legend: string; name: string; value: T; options: readonly T[]; label: (o: T) => string; onChange: (v: T) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="eyebrow mb-2">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o} className="cursor-pointer">
            <input type="radio" name={name} className="peer sr-only" checked={value === o} onChange={() => onChange(o)} />
            <span className="flex min-h-11 items-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
              {label(o)}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
