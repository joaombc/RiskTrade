"use client";

import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { Bar } from "@/lib/drawings/types";
import type { MaOscillatorReading } from "@/lib/maOscillator";

interface Props {
  bars: Bar[];
  /** Rótulos das médias, já no idioma da página (ex.: "MMS 10"). */
  fast: string;
  slow: string;
  reading: MaOscillatorReading | null;
  intraday: boolean;
  show: boolean;
  onShowChange: (show: boolean) => void;
}

/** Leitura da diferença entre duas médias (oscilador de Murphy, cap. 10) no último candle. */
export function MaOscillatorPanel({ bars, fast, slow, reading, intraday, show, onShowChange }: Props) {
  const { t, locale } = useI18n();
  const o = t.maOscillator;
  const num = (v: number) => v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dateFormat = new Intl.DateTimeFormat(
    locale,
    intraday ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit", year: "2-digit" },
  );
  const names = { fast, slow };

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {o.title} <span className="font-normal text-muted">{fmt(o.params, names)}</span>
        </h3>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={show} onChange={(e) => onShowChange(e.target.checked)} />
          {o.showHistogram}
        </label>
      </div>

      {!reading ? (
        <p className="text-sm text-muted">{o.insufficient}</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <strong>{o.now}</strong>{" "}
            {fmt(reading.value >= 0 ? o.above : o.below, {
              ...names,
              value: num(Math.abs(reading.value)),
              percent: `${num(Math.abs(reading.percent))}%`,
            })}
          </li>
          <li
            role="status"
            className={`rounded-lg border p-3 ${reading.widening ? "border-border bg-background/60" : "border-target/40 bg-target/10"}`}
          >
            <strong>{reading.widening ? o.widening : o.narrowing}</strong>{" "}
            {fmt(reading.widening ? o.wideningText : o.narrowingText, { n: reading.streak })}
          </li>
          <li>
            <strong>{o.cross}</strong>{" "}
            {reading.lastCross ? (
              <>
                {fmt(reading.lastCross.dir === "up" ? o.crossUp : o.crossDown, {
                  ...names,
                  date: dateFormat.format(new Date(bars[reading.lastCross.index].time * 1000)),
                })}
                {reading.lastCross.index === bars.length - 1 && o.crossOpen}
              </>
            ) : (
              o.noCross
            )}
          </li>
        </ul>
      )}

      <p className="text-[11px] text-muted">{o.footer}</p>
    </div>
  );
}
