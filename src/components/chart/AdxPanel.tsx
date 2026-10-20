"use client";

import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { ADX_PERIOD, type AdxReading } from "@/lib/adx";
import type { Bar } from "@/lib/drawings/types";

interface Props {
  bars: Bar[];
  reading: AdxReading | null;
  intraday: boolean;
  show: boolean;
  onShowChange: (show: boolean) => void;
}

/** Leitura do ADX, +DI e −DI no último candle, com as regras de Wilder (Murphy, cap. 15). */
export function AdxPanel({ bars, reading, intraday, show, onShowChange }: Props) {
  const { t, locale } = useI18n();
  const a = t.adx;
  const num = (v: number, digits = 2) => v.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const dateFormat = new Intl.DateTimeFormat(
    locale,
    intraday ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit", year: "2-digit" },
  );

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {a.title} <span className="font-normal text-muted">{fmt(a.params, { n: ADX_PERIOD })}</span>
        </h3>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={show} onChange={(e) => onShowChange(e.target.checked)} />
          {t.signals.show}
        </label>
      </div>

      {!reading ? (
        <p className="text-sm text-muted">{fmt(a.insufficient, { n: ADX_PERIOD * 2 })}</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          <li
            className={
              reading.strength === "strong"
                ? `rounded-lg border p-3 ${reading.direction === "up" ? "border-positive/40 bg-positive/10" : "border-negative/40 bg-negative/10"}`
                : undefined
            }
          >
            <strong>{a.now}</strong> {fmt(a.values, { adx: num(reading.adx, 1), plus: num(reading.plusDI, 1), minus: num(reading.minusDI, 1) })}
            {a.strength[reading.strength]}
            {a.slope[reading.slope]}
          </li>
          <li>
            <strong>{a.direction}</strong> {reading.direction === "up" ? a.up : a.down}
          </li>
          <li>
            <strong>{a.cross}</strong>{" "}
            {reading.lastCross ? (
              <>
                {fmt(reading.lastCross.dir === "up" ? a.crossUp : a.crossDown, {
                  date: dateFormat.format(new Date(bars[reading.lastCross.index].time * 1000)),
                  price: num(bars[reading.lastCross.index].close),
                })}
                {reading.lastCross.index === bars.length - 1 && a.open}
              </>
            ) : (
              a.noCross
            )}
          </li>
        </ul>
      )}

      <p className="text-[11px] text-muted">{a.footer}</p>
    </div>
  );
}
