"use client";

import Link from "next/link";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { Bar } from "@/lib/drawings/types";
import type { WilliamsReading } from "@/lib/williamsR";

interface Props {
  bars: Bar[];
  period: number;
  reading: WilliamsReading | null;
  intraday: boolean;
  show: boolean;
  onShowChange: (show: boolean) => void;
}

/** Leitura do %R de Larry Williams no último candle, com as regras de Murphy (cap. 10). */
export function WilliamsRPanel({ bars, period, reading, intraday, show, onShowChange }: Props) {
  const { t, locale, href } = useI18n();
  const w = t.williamsR;
  const num = (v: number, digits = 2) => v.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const dateFormat = new Intl.DateTimeFormat(
    locale,
    intraday ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit", year: "2-digit" },
  );

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {w.title} {period} <span className="font-normal text-muted">{fmt(w.params, { n: period })}</span>
        </h3>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={show} onChange={(e) => onShowChange(e.target.checked)} />
          {t.signals.show}
        </label>
      </div>

      {!reading ? (
        <p className="text-sm text-muted">{w.insufficient}</p>
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
            <strong>{w.now}</strong> {fmt(w.value, { value: num(reading.value, 1) })}
            {w.zones[reading.zone]}
          </li>
          <li>
            <strong>{w.exit}</strong>{" "}
            {reading.lastExit ? (
              <>
                {fmt(reading.lastExit.kind === "sell" ? w.exitSell : w.exitBuy, {
                  date: dateFormat.format(new Date(bars[reading.lastExit.index].time * 1000)),
                  price: num(bars[reading.lastExit.index].close),
                })}
                {reading.lastExit.index === bars.length - 1 && w.open}
              </>
            ) : (
              w.noExit
            )}
          </li>
        </ul>
      )}

      <p className="text-[11px] text-muted">
        {w.footer}{" "}
        <Link href={href("/glossario/teorias/r-de-williams")} className="font-medium text-accent hover:underline">
          {w.link}
        </Link>
      </p>
    </div>
  );
}
