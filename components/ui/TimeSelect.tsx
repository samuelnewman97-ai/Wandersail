"use client";

interface Props {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  minuteStep?: number;
  className?: string;
}

/**
 * A predictable hour/minute picker: two native <select>s so "00" is always
 * at the top of the dropdown list (unlike the browser's native time input,
 * which can render as a confusing wheel/spinner).
 *
 * Value format: "HH:mm" (e.g. "09:30"), or undefined for cleared.
 */
export function TimeSelect({ value, onChange, minuteStep = 5, className = "" }: Props) {
  const [h, m] = value ? value.split(":") : ["", ""];

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) =>
    (i * minuteStep).toString().padStart(2, "0")
  );

  const update = (nextH: string, nextM: string) => {
    if (!nextH && !nextM) {
      onChange(undefined);
      return;
    }
    onChange(`${nextH || "00"}:${nextM || "00"}`);
  };

  const clear = () => onChange(undefined);

  return (
    <div className={`flex items-stretch gap-1 ${className}`}>
      <select
        value={h}
        onChange={(e) => update(e.target.value, m)}
        className="field-input flex-1 px-2 text-center font-mono"
        aria-label="Hour"
      >
        <option value="">--</option>
        {hours.map((hh) => (
          <option key={hh} value={hh}>
            {hh}
          </option>
        ))}
      </select>
      <span className="self-center font-mono text-sm">:</span>
      <select
        value={m}
        onChange={(e) => update(h, e.target.value)}
        className="field-input flex-1 px-2 text-center font-mono"
        aria-label="Minute"
      >
        <option value="">--</option>
        {minutes.map((mm) => (
          <option key={mm} value={mm}>
            {mm}
          </option>
        ))}
      </select>
      {value && (
        <button
          type="button"
          onClick={clear}
          className="px-2 border-2 border-ink bg-cream hover:bg-cream-dark stamp text-[10px]"
          aria-label="Clear time"
        >
          ×
        </button>
      )}
    </div>
  );
}
