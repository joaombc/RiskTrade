"use client";

import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { Bar } from "@/lib/drawings/types";
import type { StochasticCross, StochasticReading } from "@/lib/stochastic";

interface Props {
  bars: Bar[];
  period: number;
  reading: StochasticReading | null;
  intraday: boolean;
  show: boolean;
  onShowChange: (show: boolean) => void;
}

/** Leitura do estocástico lento de Lane no último candle, com as regras de Murphy (cap. 10). */
export function StochasticPanel({ bars, period, reading, intraday, show, onShowChange }: Props) {
  const { t, locale } = useI18n();
  const s = t.stochastic;
  const num = (v: number, digits = 2) => v.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const dateFormat = new Intl.DateTimeFormat(
    locale,
    intraday ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit", year: "2-digit" },
  );
  const describe = (cross: StochasticCross, text: string) => (
    <>
      {fmt(text, { date: dateFormat.format(new Date(bars[cross.index].time * 1000)), price: num(bars[cross.index].close) })}
      {cross.index === bars.length - 1 && s.open}
    </>
  );

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {s.title} <span className="font-normal text-muted">{fmt(s.params, { n: period })}</span>
        </h3>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={show} onChange={(e) => onShowChange(e.target.checked)} />
          {t.signals.show}
        </label>
      </div>

      {!reading ? (
        <p className="text-sm text-muted">{s.insufficient}</p>
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
            <strong>{s.now}</strong> {fmt(s.values, { k: num(reading.k, 1), d: num(reading.d, 1) })}
            {s.zones[reading.zone]}
            {reading.k >= reading.d ? s.kAbove : s.kBelow}
          </li>
          <li>
            <strong>{s.cross}</strong>{" "}
            {reading.lastCross ? describe(reading.lastCross, reading.lastCross.dir === "up" ? s.crossUp : s.crossDown) : s.noCross}
          </li>
          <li>
            <strong>{s.signal}</strong>{" "}
            {reading.lastSignal ? describe(reading.lastSignal, reading.lastSignal.signal === "buy" ? s.signalBuy : s.signalSell) : s.noSignal}
          </li>
        </ul>
      )}

      <p className="text-[11px] text-muted">{s.footer}</p>
    </div>
  );
}
