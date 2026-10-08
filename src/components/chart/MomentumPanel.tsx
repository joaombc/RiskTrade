"use client";

import Link from "next/link";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { Bar } from "@/lib/drawings/types";
import { MOMENTUM_LOOKBACK, SLOPE_BARS, type MomentumReading } from "@/lib/momentum";

interface Props {
  bars: Bar[];
  period: number;
  reading: MomentumReading | null;
  intraday: boolean;
  show: boolean;
  onShowChange: (show: boolean) => void;
}

/** Leitura da linha de momentum no último candle, com as regras de Murphy (cap. 10). */
export function MomentumPanel({ bars, period, reading, intraday, show, onShowChange }: Props) {
  const { t, locale, href } = useI18n();
  const mo = t.momentum;
  const num = (v: number) => v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const signed = (v: number) => `${v > 0 ? "+" : ""}${num(v)}`;
  const dateFormat = new Intl.DateTimeFormat(
    locale,
    intraday ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit", year: "2-digit" },
  );
  const dateOf = (i: number) => dateFormat.format(new Date(bars[i].time * 1000));

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {mo.title} {period} <span className="font-normal text-muted">{fmt(mo.params, { n: period })}</span>
        </h3>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={show} onChange={(e) => onShowChange(e.target.checked)} />
          {t.signals.show}
        </label>
      </div>

      {!reading ? (
        <p className="text-sm text-muted">{mo.insufficient}</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <strong>{mo.position}</strong>{" "}
            {fmt(reading.value >= 0 ? mo.positive : mo.negative, {
              value: signed(reading.value),
              percent: `${signed(reading.percent)}%`,
              n: period,
            })}
            {fmt(mo[reading.slope], { k: SLOPE_BARS })}
          </li>

          {reading.extreme && (
            <li
              role="status"
              className={`rounded-lg border p-3 ${reading.extreme === "high" ? "border-negative/40 bg-negative/10" : "border-positive/40 bg-positive/10"}`}
            >
              <strong>{reading.extreme === "high" ? mo.extremeHigh : mo.extremeLow}</strong>{" "}
              {fmt(reading.extreme === "high" ? mo.extremeHighText : mo.extremeLowText, { lookback: MOMENTUM_LOOKBACK })}
            </li>
          )}

          <li>
            <strong>{mo.cross}</strong>{" "}
            {reading.lastCross ? (
              <>
                {fmt(reading.lastCross.dir === "up" ? mo.crossUp : mo.crossDown, {
                  date: dateOf(reading.lastCross.index),
                  price: num(bars[reading.lastCross.index].close),
                })}
                {reading.lastCross.index === bars.length - 1 && mo.crossOpen}
              </>
            ) : (
              mo.noCross
            )}
          </li>
        </ul>
      )}

      <p className="text-[11px] text-muted">
        {mo.footer}{" "}
        <Link href={href("/glossario#linha-de-momentum")} className="font-medium text-accent hover:underline">
          {mo.link}
        </Link>
      </p>
    </div>
  );
}
