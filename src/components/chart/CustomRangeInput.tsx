"use client";

import { useState } from "react";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import {
  customInterval,
  customRange,
  customSessions,
  MAX_CUSTOM_SESSIONS,
  MIN_CUSTOM_SESSIONS,
  type HistoryRange,
} from "@/lib/market";

/**
 * Campo para digitar a quantidade de dias (pregões) do gráfico. Montado com `key={range}`, então
 * volta a mostrar o período atual sempre que ele muda.
 */
export function CustomRangeInput({ range, onChange }: { range: HistoryRange; onChange: (range: HistoryRange) => void }) {
  const { t } = useI18n();
  const c = t.customRange;
  const active = customSessions(range);
  const [draft, setDraft] = useState(active === null ? "" : String(active));
  const sessions = Number(draft);
  const valid = draft !== "" && customRange(sessions) !== null;
  const invalid = draft !== "" && !valid;

  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        const next = customRange(sessions);
        if (next) onChange(next);
      }}
      title={
        invalid
          ? fmt(c.invalid, { min: MIN_CUSTOM_SESSIONS, max: MAX_CUSTOM_SESSIONS })
          : valid
            ? fmt(c.valid, { n: sessions, interval: t.chart.intervals[customInterval(sessions)] })
            : c.idle
      }
    >
      <label className="sr-only" htmlFor="custom-range-days">
        {c.label}
      </label>
      <input
        id="custom-range-days"
        type="number"
        inputMode="numeric"
        min={MIN_CUSTOM_SESSIONS}
        max={MAX_CUSTOM_SESSIONS}
        step={1}
        placeholder={c.placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        aria-invalid={invalid}
        className={`w-16 rounded-md border px-2 py-1 text-xs tabular-nums ${
          invalid ? "border-negative" : active !== null ? "border-foreground bg-foreground text-background" : "border-border bg-surface"
        }`}
      />
      <button
        type="submit"
        disabled={!valid || sessions === active}
        className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-border/60 disabled:opacity-40"
      >
        {c.go}
      </button>
    </form>
  );
}
