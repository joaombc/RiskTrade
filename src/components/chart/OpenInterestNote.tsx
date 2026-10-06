"use client";

import Link from "next/link";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { Bar } from "@/lib/drawings/types";
import { isIntraday, type HistoryRange } from "@/lib/market";
import { cotMarketFor, readOpenInterest, type OpenInterestReading, type OpenInterestSeries } from "@/lib/openInterest";

/** Tom de cada leitura de Murphy (cap. 7); os textos vêm do dicionário. */
const TONE: Record<OpenInterestReading, "positive" | "negative" | "muted"> = {
  "up-rising": "positive",
  "up-falling": "negative",
  "down-rising": "negative",
  "down-falling": "positive",
  "flat-rising": "muted",
  stable: "muted",
};

const TONE_CLASS = {
  positive: "border-positive/40 bg-positive/10",
  negative: "border-negative/40 bg-negative/10",
  muted: "border-border bg-background/60",
};

interface Props {
  symbol: string;
  range: HistoryRange;
  bars: Bar[];
  series: OpenInterestSeries | null;
  loading: boolean;
}

/** Explica o painel de interesse aberto (só para futuros) e aplica a leitura de Murphy às últimas semanas. */
export function OpenInterestNote({ symbol, range, bars, series, loading }: Props) {
  const { t, locale, href } = useI18n();
  const o = t.openInterest;
  const market = cotMarketFor(symbol);
  if (!market || loading) return null;

  const percent = (value: number) =>
    `${value >= 0 ? "+" : ""}${(value * 100).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  const glossaryLink = (
    <Link href={href("/glossario#interesse-aberto")} className="font-medium text-accent hover:underline">
      {o.link}
    </Link>
  );

  if (isIntraday(range) || !series) {
    return (
      <p className="mt-4 border-t border-border pt-4 text-sm text-muted">
        {isIntraday(range) ? o.intraday : o.unavailable} {glossaryLink}
      </p>
    );
  }

  const trend = readOpenInterest(bars, series.values);
  const reading = trend && o.readings[trend.reading];
  const lastReport = new Date(`${series.lastReport}T00:00:00Z`).toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <h3 className="text-sm font-semibold">{fmt(o.title, { name: o.marketNames[market.name] ?? market.name })}</h3>
      {trend && reading && (
        <div role="status" className={`rounded-lg border p-3 text-sm ${TONE_CLASS[TONE[trend.reading]]}`}>
          <strong>{reading.title}.</strong>{" "}
          {fmt(o.lastWeeks, { price: percent(trend.priceChange), oi: percent(trend.openInterestChange) })} {reading.text}
        </div>
      )}
      <p className="text-xs leading-relaxed text-muted">
        {fmt(o.footer, { date: lastReport })} {glossaryLink}
      </p>
    </div>
  );
}
