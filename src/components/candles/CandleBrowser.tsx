"use client";

import { useId, useState } from "react";
import { CANDLE_PATTERNS } from "@/lib/candles/patterns";
import { searchCandles, type CandleFilters } from "@/lib/candles/search";
import { KIND_LABELS, type CandleKind } from "@/lib/candles/types";
import { useHashSlug } from "../glossary/useHashSlug";
import { CandleCard } from "./CandleCard";
import { CandleDialog } from "./CandleDialog";

const KINDS = Object.keys(KIND_LABELS) as CandleKind[];
const COUNTS = [...new Set(CANDLE_PATTERNS.map((p) => p.candleCount))].sort((a, b) => a - b);

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium ${active ? "bg-accent text-white" : "bg-border/60 text-muted hover:bg-border"}`}
    >
      {children}
    </button>
  );
}

export function CandleBrowser() {
  const [filters, setFilters] = useState<CandleFilters>({ query: "", kind: null, bias: null, count: null });
  const set = (patch: Partial<CandleFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const inputId = useId();
  const results = searchCandles(CANDLE_PATTERNS, filters);
  const [openSlug, close] = useHashSlug();
  const open = CANDLE_PATTERNS.find((p) => p.slug === openSlug) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <label htmlFor={inputId} className="sr-only">
          Buscar padrão
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
          <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="9" cy="9" r="6" />
            <path d="m14 14 4 4" strokeLinecap="round" />
          </svg>
          <input
            id={inputId}
            type="search"
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="Buscar padrão — ex: martelo, engolfo, estrela da manhã, harami"
            autoComplete="off"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted"
          />
        </div>

        <div className="flex flex-col gap-2 text-xs">
          <div role="group" aria-label="Tipo" className="flex flex-wrap items-center gap-1.5">
            <span className="w-16 text-muted">Tipo</span>
            <Chip active={filters.kind === null} onClick={() => set({ kind: null })}>
              Todos
            </Chip>
            {KINDS.map((kind) => (
              <Chip key={kind} active={filters.kind === kind} onClick={() => set({ kind })}>
                {KIND_LABELS[kind]}
              </Chip>
            ))}
          </div>
          <div role="group" aria-label="Direção" className="flex flex-wrap items-center gap-1.5">
            <span className="w-16 text-muted">Direção</span>
            <Chip active={filters.bias === null} onClick={() => set({ bias: null })}>
              Todas
            </Chip>
            <Chip active={filters.bias === "bullish"} onClick={() => set({ bias: "bullish" })}>
              De alta
            </Chip>
            <Chip active={filters.bias === "bearish"} onClick={() => set({ bias: "bearish" })}>
              De baixa
            </Chip>
          </div>
          <div role="group" aria-label="Número de velas" className="flex flex-wrap items-center gap-1.5">
            <span className="w-16 text-muted">Velas</span>
            <Chip active={filters.count === null} onClick={() => set({ count: null })}>
              Todas
            </Chip>
            {COUNTS.map((n) => (
              <Chip key={n} active={filters.count === n} onClick={() => set({ count: n })}>
                {n}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted" aria-live="polite">
        {results.length === 0
          ? "Nenhum padrão encontrado com esses filtros."
          : `${results.length} ${results.length === 1 ? "padrão" : "padrões"}`}
      </p>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {results.map((p) => (
          <CandleCard key={p.slug} pattern={p} />
        ))}
      </div>

      <CandleDialog pattern={open} onClose={close} />
    </div>
  );
}
