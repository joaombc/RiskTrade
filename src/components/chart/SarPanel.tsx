"use client";

import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { Bar } from "@/lib/drawings/types";
import type { SarReading } from "@/lib/parabolicSar";

interface Props {
  bars: Bar[];
  reading: SarReading | null;
  intraday: boolean;
  show: boolean;
  onShowChange: (show: boolean) => void;
}

/** Leitura do SAR parabólico no último candle: posição, stop e última virada (Murphy, cap. 15). */
export function SarPanel({ bars, reading, intraday, show, onShowChange }: Props) {
  const { t, locale } = useI18n();
  const s = t.sar;
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
          {s.title} <span className="font-normal text-muted">{s.params}</span>
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
          <li className={`rounded-lg border p-3 ${reading.long ? "border-positive/40 bg-positive/10" : "border-negative/40 bg-negative/10"}`}>
            <strong>{s.now}</strong>{" "}
            {fmt(reading.long ? s.long : s.short, {
              date: dateOf(reading.since),
              sar: num(reading.sar),
              distance: `${reading.distance.toLocaleString(locale, { maximumFractionDigits: 2 })}%`,
            })}
          </li>
          <li>
            <strong>{s.flip}</strong>{" "}
            {reading.lastFlip ? (
              <>
                {fmt(reading.lastFlip.kind === "buy" ? s.flipBuy : s.flipSell, {
                  date: dateOf(reading.lastFlip.index),
                  price: num(bars[reading.lastFlip.index].close),
                })}
                {reading.lastFlip.index === bars.length - 1 && s.open}
              </>
            ) : (
              s.noFlip
            )}
          </li>
        </ul>
      )}

      <p className="text-[11px] text-muted">{s.footer}</p>
    </div>
  );
}
