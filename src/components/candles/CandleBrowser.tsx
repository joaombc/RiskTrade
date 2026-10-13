"use client";

import { useId, useState } from "react";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { candleDeck } from "@/lib/anki";
import { searchCandles, type CandleFilters } from "@/lib/candles/search";
import type { Bias, CandleKind, CandlePattern } from "@/lib/candles/types";
import { AnkiDownloadButton } from "../anki/AnkiDownloadButton";
import { useHashSlug } from "../glossary/useHashSlug";
import { CandleCard } from "./CandleCard";
import { CandleDiagram } from "./CandleDiagram";
import { CandleDialog } from "./CandleDialog";

const KINDS: CandleKind[] = ["basic", "reversal", "continuation"];
const SIDES: Exclude<Bias, "neutral">[] = ["bullish", "bearish"];

/** O padrão só com as versões de uma direção (null se não tiver nenhuma). */
function onlySide(pattern: CandlePattern, bias: Exclude<Bias, "neutral">): CandlePattern | null {
  const variants = pattern.variants.filter((v) => v.bias === bias);
  return variants.length > 0 ? { ...pattern, variants } : null;
}

const grid = "grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3";

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

/** Recebe os padrões já no idioma da página (montados no servidor). */
export function CandleBrowser({ patterns }: { patterns: CandlePattern[] }) {
  const counts = [...new Set(patterns.map((p) => p.candleCount))].sort((a, b) => a - b);
  const { t } = useI18n();
  const c = t.candleUi;
  const [filters, setFilters] = useState<CandleFilters>({ query: "", kind: null, bias: null, count: null });
  const set = (patch: Partial<CandleFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const inputId = useId();
  const results = searchCandles(patterns, filters);
  const [openSlug, close] = useHashSlug();
  const open = patterns.find((p) => p.slug === openSlug) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <label htmlFor={inputId} className="sr-only">
          {c.searchLabel}
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
            placeholder={c.searchPlaceholder}
            autoComplete="off"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted"
          />
        </div>

        <div className="flex flex-col gap-2 text-xs">
          <div role="group" aria-label={c.type} className="flex flex-wrap items-center gap-1.5">
            <span className="w-16 text-muted">{c.type}</span>
            <Chip active={filters.kind === null} onClick={() => set({ kind: null })}>
              {c.allKinds}
            </Chip>
            {KINDS.map((kind) => (
              <Chip key={kind} active={filters.kind === kind} onClick={() => set({ kind })}>
                {c.kinds[kind]}
              </Chip>
            ))}
          </div>
          <div role="group" aria-label={c.direction} className="flex flex-wrap items-center gap-1.5">
            <span className="w-16 text-muted">{c.direction}</span>
            <Chip active={filters.bias === null} onClick={() => set({ bias: null })}>
              {c.all}
            </Chip>
            <Chip active={filters.bias === "bullish"} onClick={() => set({ bias: "bullish" })}>
              {c.bullish}
            </Chip>
            <Chip active={filters.bias === "bearish"} onClick={() => set({ bias: "bearish" })}>
              {c.bearish}
            </Chip>
          </div>
          <div role="group" aria-label={c.candleCount} className="flex flex-wrap items-center gap-1.5">
            <span className="w-16 text-muted">{c.candles}</span>
            <Chip active={filters.count === null} onClick={() => set({ count: null })}>
              {c.all}
            </Chip>
            {counts.map((n) => (
              <Chip key={n} active={filters.count === n} onClick={() => set({ count: n })}>
                {n}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted" aria-live="polite">
          {results.length === 0
            ? c.noResults
            : fmt(results.length === 1 ? c.countOne : c.countMany, { n: results.length })}
        </p>
        <AnkiDownloadButton fileName={t.anki.files.candles} build={(render) => candleDeck(patterns, (v) => render(<CandleDiagram variant={v} large />), t.anki)} />
      </div>

      {/* Seções por tipo; reversão e continuação divididas em alta e baixa. Um padrão com as duas
          versões aparece nas duas divisões, cada card só com o desenho daquela direção. */}
      {KINDS.map((kind) => {
        const items = results.filter((p) => p.kind === kind);
        if (items.length === 0) return null;
        return (
          <section key={kind} aria-labelledby={`candles-${kind}`} className="flex flex-col gap-4">
            <h3 id={`candles-${kind}`} className="text-lg font-semibold">
              {c.sections[kind]} <span className="font-normal text-muted">({items.length})</span>
            </h3>
            {kind === "basic" ? (
              <div className={grid}>
                {items.map((p) => (
                  <CandleCard key={p.slug} pattern={p} heading="h4" />
                ))}
              </div>
            ) : (
              SIDES.filter((side) => filters.bias === null || filters.bias === side).map((side) => {
                const sided = items.flatMap((p) => onlySide(p, side) ?? []);
                if (sided.length === 0) return null;
                return (
                  <div key={side} className="flex flex-col gap-3">
                    <h4 className={`text-sm font-semibold ${side === "bullish" ? "text-positive" : "text-negative"}`}>
                      {side === "bullish" ? c.bullish : c.bearish} <span className="font-normal text-muted">({sided.length})</span>
                    </h4>
                    <div className={grid}>
                      {sided.map((p) => (
                        <CandleCard key={`${p.slug}-${side}`} pattern={p} variantNames heading="h5" />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </section>
        );
      })}

      <CandleDialog pattern={open} onClose={close} />
    </div>
  );
}
