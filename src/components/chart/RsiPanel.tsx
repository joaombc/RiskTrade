"use client";

import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { Bar } from "@/lib/drawings/types";
import type { RsiReading, RsiSignal } from "@/lib/rsi";

interface Props {
  bars: Bar[];
  period: number;
  reading: RsiReading | null;
  intraday: boolean;
  show: boolean;
  onShowChange: (show: boolean) => void;
}

/** Leitura do IFR de Wilder no último candle, com as regras de Murphy (cap. 10). */
export function RsiPanel({ bars, period, reading, intraday, show, onShowChange }: Props) {
  const { t, locale } = useI18n();
  const r = t.rsi;
  const num = (v: number, digits = 2) => v.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const dateFormat = new Intl.DateTimeFormat(
    locale,
    intraday ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit", year: "2-digit" },
  );
  const describe = (signal: RsiSignal, sell: string, buy: string) => (
    <>
      {fmt(signal.kind === "sell" ? sell : buy, {
        date: dateFormat.format(new Date(bars[signal.index].time * 1000)),
        price: num(bars[signal.index].close),
      })}
      {signal.index === bars.length - 1 && r.open}
    </>
  );

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {r.title} {period} <span className="font-normal text-muted">{fmt(r.params, { n: period })}</span>
        </h3>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={show} onChange={(e) => onShowChange(e.target.checked)} />
          {t.signals.show}
        </label>
      </div>

      {!reading ? (
        <p className="text-sm text-muted">{r.insufficient}</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          <li
            className={
              reading.zone === "overbought"
                ? "rounded-lg border border-negative/40 bg-negative/10 p-3"
                : reading.zone === "oversold"
                  ? "rounded-lg border border-positive/40 bg-positive/10 p-3"
                  : undefined
            }
          >
            <strong>{r.now}</strong> {fmt(r.value, { value: num(reading.value, 1) })}
            {r.zones[reading.zone]}
          </li>
          <li>
            <strong>{r.exit}</strong> {reading.lastExit ? describe(reading.lastExit, r.exitSell, r.exitBuy) : r.noExit}
          </li>
          <li>
            <strong>{r.failure}</strong> {reading.lastFailure ? describe(reading.lastFailure, r.failureSell, r.failureBuy) : r.noFailure}
          </li>
        </ul>
      )}

      <p className="text-[11px] text-muted">{r.footer}</p>
    </div>
  );
}
