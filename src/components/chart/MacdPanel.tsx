"use client";

import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { Bar } from "@/lib/drawings/types";
import type { MacdReading } from "@/lib/macd";

interface Props {
  bars: Bar[];
  reading: MacdReading | null;
  intraday: boolean;
  show: boolean;
  onShowChange: (show: boolean) => void;
}

/** Leitura do MACD e do histograma no último candle, com as regras de Murphy (cap. 10). */
export function MacdPanel({ bars, reading, intraday, show, onShowChange }: Props) {
  const { t, locale } = useI18n();
  const m = t.macd;
  const num = (v: number) => v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dateFormat = new Intl.DateTimeFormat(
    locale,
    intraday ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit", year: "2-digit" },
  );
  const dateOf = (i: number) => dateFormat.format(new Date(bars[i].time * 1000));

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {m.title} <span className="font-normal text-muted">{m.params}</span>
        </h3>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={show} onChange={(e) => onShowChange(e.target.checked)} />
          {t.signals.show}
        </label>
      </div>

      {!reading ? (
        <p className="text-sm text-muted">{m.insufficient}</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <strong>{m.now}</strong> {fmt(m.values, { macd: num(reading.macd), signal: num(reading.signal), histogram: num(reading.histogram) })}
            {reading.histogram >= 0 ? m.above : m.below}
            {reading.macd >= 0 ? m.positive : m.negative}
          </li>
          <li
            role="status"
            className={`rounded-lg border p-3 ${reading.widening ? "border-border bg-background/60" : "border-target/40 bg-target/10"}`}
          >
            <strong>{reading.widening ? m.widening : m.narrowing}</strong>{" "}
            {fmt(reading.widening ? m.wideningText : m.narrowingText, { n: reading.streak })}
          </li>
          <li>
            <strong>{m.cross}</strong>{" "}
            {reading.lastCross ? (
              <>
                {fmt(reading.lastCross.dir === "up" ? m.crossUp : m.crossDown, {
                  date: dateOf(reading.lastCross.index),
                  price: num(bars[reading.lastCross.index].close),
                  zone: reading.lastCross.aboveZero ? m.zoneAbove : m.zoneBelow,
                })}
                {reading.lastCross.index === bars.length - 1 && m.open}
              </>
            ) : (
              m.noCross
            )}
          </li>
          <li>
            <strong>{m.zero}</strong>{" "}
            {reading.lastZeroCross
              ? fmt(reading.lastZeroCross.dir === "up" ? m.zeroUp : m.zeroDown, { date: dateOf(reading.lastZeroCross.index) })
              : m.noZero}
          </li>
        </ul>
      )}

      <p className="text-[11px] text-muted">{m.footer}</p>
    </div>
  );
}
