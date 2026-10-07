"use client";

import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { formatPrice } from "@/lib/drawings/geometry";
import type { Bar } from "@/lib/drawings/types";
import { DIVERGENCE_SWING_WINDOW, isRecent, RECENT_DIVERGENCE_BARS, type Divergence } from "@/lib/indicators";

const MAX_LISTED = 5;

interface Props {
  bars: Bar[];
  divergences: Divergence[];
  show: boolean;
  onShowChange: (show: boolean) => void;
}

export function DivergencePanel({ bars, divergences, show, onShowChange }: Props) {
  const { t, locale } = useI18n();
  const d = t.divergence;
  const dateFormat = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "2-digit" });
  const dateOf = (index: number) => dateFormat.format(new Date(bars[index].time * 1000));
  const describe = (div: Divergence) =>
    fmt(div.kind === "bearish" ? d.bearishText : d.bullishText, {
      from: formatPrice(div.priceFrom, locale),
      fromDate: dateOf(div.from),
      to: formatPrice(div.priceTo, locale),
      toDate: dateOf(div.to),
    });

  const latest = divergences[divergences.length - 1];
  const recent = latest && isRecent(latest, bars.length) ? latest : null;
  const listed = divergences.slice(-MAX_LISTED).reverse();

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{d.title}</h3>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={show} onChange={(e) => onShowChange(e.target.checked)} />
          {d.show}
        </label>
      </div>

      {recent ? (
        <div
          role="alert"
          className={`rounded-lg border p-3 text-sm ${recent.kind === "bearish" ? "border-negative/40 bg-negative/10 text-negative" : "border-positive/40 bg-positive/10 text-positive"}`}
        >
          <strong>{recent.kind === "bearish" ? d.recentBearish : d.recentBullish}</strong> {describe(recent)}
        </div>
      ) : (
        <p className="text-sm text-muted">{fmt(d.none, { count: RECENT_DIVERGENCE_BARS })}</p>
      )}

      {listed.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs font-medium text-muted">{fmt(d.inPeriod, { count: divergences.length })}</summary>
          <ul className="mt-2 flex flex-col gap-2">
            {listed.map((div) => (
              <li key={`${div.kind}-${div.to}`} className="flex gap-2">
                <span
                  className={`mt-0.5 h-fit shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${div.kind === "bearish" ? "bg-negative/15 text-negative" : "bg-positive/15 text-positive"}`}
                >
                  {div.kind === "bearish" ? d.bearish : d.bullish}
                </span>
                <span className="text-muted">{describe(div)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="text-[11px] text-muted">{fmt(d.footer, { n: DIVERGENCE_SWING_WINDOW })}</p>
    </div>
  );
}
