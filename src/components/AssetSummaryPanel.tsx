import type { AssetSummary, MarketStatus } from "@/lib/market";
import { PremarketButton } from "./premarket/PremarketButton";
import { FavoriteButton } from "./watchlist/FavoriteButton";

const STATUS_LABEL: Record<MarketStatus, { label: string; className: string }> = {
  open: { label: "Aberto", className: "bg-positive/15 text-positive" },
  pre: { label: "Pré-market", className: "bg-warning/15 text-warning" },
  post: { label: "After-hours", className: "bg-warning/15 text-warning" },
  closed: { label: "Fechado", className: "bg-muted/15 text-muted" },
};

function formatPrice(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency, maximumFractionDigits: value < 1 ? 6 : 2 }).format(value);
  } catch {
    return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  }
}

const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 2 });

export function AssetSummaryPanel({ summary }: { summary: AssetSummary }) {
  const status = STATUS_LABEL[summary.marketStatus];
  const up = summary.changePercent >= 0;
  const range = summary.dayHigh - summary.dayLow;
  const rangePosition = range > 0 ? ((summary.price - summary.dayLow) / range) * 100 : 50;
  const volumeRatio = summary.avgVolume20d ? summary.volume / summary.avgVolume20d : null;

  return (
    <section aria-label={`Resumo de ${summary.symbol}`} className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
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
        <span className="text-4xl font-semibold tabular-nums">{formatPrice(summary.price, summary.currency)}</span>
        <span className={`text-lg font-semibold tabular-nums ${up ? "text-positive" : "text-negative"}`}>
          {up ? "▲" : "▼"} {up ? "+" : ""}
          {summary.changePercent.toFixed(2)}%
        </span>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Trading range do dia</h3>
          <div className="relative mt-3 h-2 rounded-full bg-border">
            <div
              className="absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
              style={{ left: `${Math.min(100, Math.max(0, rangePosition))}%` }}
              aria-hidden
            />
          </div>
          <div className="mt-2 flex justify-between text-sm tabular-nums">
            <span>
              <span className="text-muted">Mín </span>
              {formatPrice(summary.dayLow, summary.currency)}
            </span>
            <span>
              <span className="text-muted">Máx </span>
              {formatPrice(summary.dayHigh, summary.currency)}
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Volume vs. média 20 dias</h3>
          <div className="mt-2 flex items-baseline gap-2 tabular-nums">
            <span className="text-xl font-semibold">{compact.format(summary.volume)}</span>
            {volumeRatio !== null && (
              <span className={`text-sm font-semibold ${volumeRatio >= 1 ? "text-positive" : "text-muted"}`}>
                {(volumeRatio * 100).toFixed(0)}% da média
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted tabular-nums">
            Média: {summary.avgVolume20d !== null ? compact.format(summary.avgVolume20d) : "histórico insuficiente"}
          </p>
          {summary.openInterest !== null && (
            <p className="mt-1 text-sm tabular-nums">
              <span className="text-muted">Interesse aberto: </span>
              {compact.format(summary.openInterest)} contratos <span className="text-muted">(vencimento atual)</span>
            </p>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-muted">
        Atualizado em {new Date(summary.updatedAt).toLocaleString("pt-BR")} · Fonte: Yahoo Finance
      </p>
    </section>
  );
}
