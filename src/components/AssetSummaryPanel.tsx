"use client";

import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { AssetSummary, MarketStatus } from "@/lib/market";
import { PremarketButton } from "./premarket/PremarketButton";
import { FavoriteButton } from "./watchlist/FavoriteButton";

const STATUS_CLASS: Record<MarketStatus, string> = {
  open: "bg-positive/15 text-positive",
  pre: "bg-warning/15 text-warning",
  post: "bg-warning/15 text-warning",
  closed: "bg-muted/15 text-muted",
};

function formatPrice(value: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: value < 1 ? 6 : 2 }).format(value);
  } catch {
    return value.toLocaleString(locale, { maximumFractionDigits: 2 });
  }
}

export function AssetSummaryPanel({ summary }: { summary: AssetSummary }) {
  const { t, locale } = useI18n();
  const s = t.summary;
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 2 });
  const price = (value: number) => formatPrice(value, summary.currency, locale);
  const status = { label: s.status[summary.marketStatus], className: STATUS_CLASS[summary.marketStatus] };
  const up = summary.changePercent >= 0;
  const range = summary.dayHigh - summary.dayLow;
  const rangePosition = range > 0 ? ((summary.price - summary.dayLow) / range) * 100 : 50;
  const volumeRatio = summary.avgVolume20d ? summary.volume / summary.avgVolume20d : null;

  return (
    <section aria-label={fmt(s.label, { symbol: summary.symbol })} className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-mono text-2xl font-bold">{summary.symbol}</h2>
          <p className="truncate text-sm text-muted">
            {summary.name} · {summary.exchange}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {summary.usListing && <PremarketButton symbol={summary.symbol} />}
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
          <FavoriteButton symbol={summary.symbol} name={summary.name} />
        </div>
      </header>

      <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-4xl font-semibold tabular-nums">{price(summary.price)}</span>
        <span className={`text-lg font-semibold tabular-nums ${up ? "text-positive" : "text-negative"}`}>
          {up ? "▲" : "▼"} {up ? "+" : ""}
          {summary.changePercent.toFixed(2)}%
        </span>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{s.dayRange}</h3>
          <div className="relative mt-3 h-2 rounded-full bg-border">
            <div
              className="absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
              style={{ left: `${Math.min(100, Math.max(0, rangePosition))}%` }}
              aria-hidden
            />
          </div>
          <div className="mt-2 flex justify-between text-sm tabular-nums">
            <span>
              <span className="text-muted">{s.low} </span>
              {price(summary.dayLow)}
            </span>
            <span>
              <span className="text-muted">{s.high} </span>
              {price(summary.dayHigh)}
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{s.volumeVsAverage}</h3>
          <div className="mt-2 flex items-baseline gap-2 tabular-nums">
            <span className="text-xl font-semibold">{compact.format(summary.volume)}</span>
            {volumeRatio !== null && (
              <span className={`text-sm font-semibold ${volumeRatio >= 1 ? "text-positive" : "text-muted"}`}>
                {fmt(s.ofAverage, { percent: (volumeRatio * 100).toFixed(0) })}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted tabular-nums">
            {fmt(s.average, { value: summary.avgVolume20d !== null ? compact.format(summary.avgVolume20d) : s.insufficientHistory })}
          </p>
          {summary.openInterest !== null && (
            <p className="mt-1 text-sm tabular-nums">
              <span className="text-muted">{s.openInterest}</span>
              {fmt(s.contracts, { value: compact.format(summary.openInterest) })} <span className="text-muted">{s.currentContract}</span>
            </p>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-muted">
        {fmt(s.updated, { date: new Date(summary.updatedAt).toLocaleString(locale) })}
      </p>
    </section>
  );
}
