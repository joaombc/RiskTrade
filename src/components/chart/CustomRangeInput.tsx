"use client";

import { useState } from "react";
import {
  customInterval,
  customRange,
  customSessions,
  INTERVAL_LABELS,
  MAX_CUSTOM_SESSIONS,
  MIN_CUSTOM_SESSIONS,
  type HistoryRange,
} from "@/lib/market";

/**
 * Campo para digitar a quantidade de dias (pregões) do gráfico. Montado com `key={range}`, então
 * volta a mostrar o período atual sempre que ele muda.
 */
export function CustomRangeInput({ range, onChange }: { range: HistoryRange; onChange: (range: HistoryRange) => void }) {
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
          ? `Use um número inteiro de ${MIN_CUSTOM_SESSIONS} a ${MAX_CUSTOM_SESSIONS} pregões.`
          : valid
            ? `Últimos ${sessions} pregões, em ${INTERVAL_LABELS[customInterval(sessions)]}.`
            : "Digite a quantidade de dias (pregões) e confirme."
      }
    >
      <label className="sr-only" htmlFor="custom-range-days">
        Quantidade de dias (pregões)
      </label>
      <input
        id="custom-range-days"
        type="number"
        inputMode="numeric"
        min={MIN_CUSTOM_SESSIONS}
        max={MAX_CUSTOM_SESSIONS}
        step={1}
        placeholder="Dias"
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
        Ir
      </button>
    </form>
  );
}
