"use client";

import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { CCI_PERIOD, type CciReading } from "@/lib/cci";
import type { Bar } from "@/lib/drawings/types";

interface Props {
  bars: Bar[];
  reading: CciReading | null;
  intraday: boolean;
  show: boolean;
  onShowChange: (show: boolean) => void;
}

/** Leitura do CCI de Lambert no último candle (Murphy, cap. 15). */
export function CciPanel({ bars, reading, intraday, show, onShowChange }: Props) {
  const { t, locale } = useI18n();
  const c = t.cci;
  const num = (v: number, digits = 2) => v.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const dateFormat = new Intl.DateTimeFormat(
    locale,
    intraday ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit", year: "2-digit" },
  );

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {c.title} <span className="font-normal text-muted">{fmt(c.params, { n: CCI_PERIOD })}</span>
        </h3>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={show} onChange={(e) => onShowChange(e.target.checked)} />
          {t.signals.show}
        </label>
      </div>

      {!reading ? (
        <p className="text-sm text-muted">{c.insufficient}</p>
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
            <strong>{c.now}</strong> {fmt(c.value, { value: num(reading.value, 0) })}
            {c.zones[reading.zone]}
          </li>
          <li>
            <strong>{c.exit}</strong>{" "}
            {reading.lastExit ? (
              <>
                {fmt(reading.lastExit.kind === "sell" ? c.exitSell : c.exitBuy, {
                  date: dateFormat.format(new Date(bars[reading.lastExit.index].time * 1000)),
                  price: num(bars[reading.lastExit.index].close),
                })}
                {reading.lastExit.index === bars.length - 1 && c.open}
              </>
            ) : (
              c.noExit
            )}
          </li>
        </ul>
      )}

      <p className="text-[11px] text-muted">{c.footer}</p>
    </div>
  );
}
