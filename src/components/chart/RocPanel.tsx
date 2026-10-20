"use client";

import Link from "next/link";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { Bar } from "@/lib/drawings/types";
import type { RocReading } from "@/lib/roc";

interface Props {
  bars: Bar[];
  period: number;
  reading: RocReading | null;
  intraday: boolean;
  show: boolean;
  onShowChange: (show: boolean) => void;
}

/** Leitura da taxa de variação no último candle, com as regras de Murphy (cap. 10). */
export function RocPanel({ bars, period, reading, intraday, show, onShowChange }: Props) {
  const { t, locale, href } = useI18n();
  const r = t.roc;
  const num = (v: number) => v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (v: number) => `${num(v)}%`;
  const dateFormat = new Intl.DateTimeFormat(
    locale,
    intraday ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit", year: "2-digit" },
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
              reading.extreme === "high"
                ? "rounded-lg border border-negative/40 bg-negative/10 p-3"
                : reading.extreme === "low"
                  ? "rounded-lg border border-positive/40 bg-positive/10 p-3"
                  : undefined
            }
          >
            <strong>{r.now}</strong>{" "}
            {fmt(reading.value >= 0 ? r.positive : r.negative, { value: pct(reading.value), abs: pct(Math.abs(reading.value)), n: period })}
            {reading.extreme === "high" ? r.extremeHigh : reading.extreme === "low" ? r.extremeLow : ""}
          </li>
          <li>
            <strong>{r.cross}</strong>{" "}
            {reading.lastCross ? (
              <>
                {fmt(reading.lastCross.dir === "up" ? r.crossUp : r.crossDown, {
                  date: dateFormat.format(new Date(bars[reading.lastCross.index].time * 1000)),
                  price: num(bars[reading.lastCross.index].close),
                })}
                {reading.lastCross.index === bars.length - 1 && r.open}
              </>
            ) : (
              r.noCross
            )}
          </li>
        </ul>
      )}

      <p className="text-[11px] text-muted">
        {r.footer}{" "}
        <Link href={href("/glossario#linha-de-momentum")} className="font-medium text-accent hover:underline">
          {r.link}
        </Link>
      </p>
    </div>
  );
}
