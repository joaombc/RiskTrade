"use client";

import Link from "next/link";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { Bar } from "@/lib/drawings/types";
import { TREND_DEGREES, TREND_WINDOWS, type Trend, type TrendDegree, type TrendReading } from "@/lib/trend";

interface Props {
  bars: Bar[];
  readings: Record<TrendDegree, TrendReading | null>;
  /** Prazo mostrado no gráfico. */
  degree: TrendDegree;
  onDegreeChange: (degree: TrendDegree) => void;
  intraday: boolean;
}

const BADGE: Record<Trend, string> = {
  up: "border-positive/40 bg-positive/10 text-positive",
  down: "border-negative/40 bg-negative/10 text-negative",
  lateral: "border-border bg-border/40 text-muted",
};

/** Tendência pelos topos e fundos (Murphy, cap. 4) nos três prazos, com a leitura do prazo do gráfico. */
export function TrendPanel({ bars, readings, degree, onDegreeChange, intraday }: Props) {
  const { t, locale, href } = useI18n();
  const tr = t.trend;
  const num = (v: number) => v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dateFormat = new Intl.DateTimeFormat(
    locale,
    intraday ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit", year: "2-digit" },
  );
  const dateOf = (i: number) => dateFormat.format(new Date(bars[i].time * 1000));
  const reading = readings[degree];
  const lower = (d: TrendDegree) => t.ma.trendDegrees[d].toLocaleLowerCase(locale);
  const degreeName = lower(degree);

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <h3 className="text-sm font-semibold">
        {tr.title} <span className="font-normal text-muted">{tr.params}</span>
      </h3>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="pb-1 font-medium">{tr.degree}</th>
            <th className="pb-1 font-medium">{tr.trendCol}</th>
            <th className="pb-1 font-medium">{tr.since}</th>
          </tr>
        </thead>
        <tbody>
          {TREND_DEGREES.map((d) => {
            const r = readings[d];
            const active = d === degree;
            return (
              <tr key={d} className={`border-t border-border ${active ? "bg-border/30" : ""}`}>
                <td className="py-1.5 pr-2">
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => onDegreeChange(d)}
                    title={fmt(tr.select, { degree: lower(d) })}
                    className="text-left hover:underline"
                  >
                    <span className="font-medium">{t.ma.trendDegrees[d]}</span>
                    {active && <span className="ml-1.5 text-xs text-muted">· {tr.selected}</span>}
                  </button>
                  <span className="block text-[11px] text-muted">{fmt(tr.window, { n: TREND_WINDOWS[d] })}</span>
                </td>
                <td className="py-1.5 pr-2">
                  {r ? (
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${BADGE[r.trend]}`}>
                      {tr.trends[r.trend]}
                    </span>
                  ) : (
                    <span className="text-xs text-muted">{tr.insufficient}</span>
                  )}
                </td>
                <td className="py-1.5 tabular-nums text-muted">{r ? dateOf(r.since) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {!reading ? (
        <p className="text-sm">
          <strong>{fmt(tr.now, { degree: degreeName })}</strong> {tr.insufficientText}
        </p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <strong>{fmt(tr.now, { degree: degreeName })}</strong>{" "}
            {reading.lastHigh && reading.lastLow
              ? fmt(tr.reading[reading.trend], {
                  high: num(reading.lastHigh.price),
                  highDate: dateOf(reading.lastHigh.index),
                  low: num(reading.lastLow.price),
                  lowDate: dateOf(reading.lastLow.index),
                })
              : tr.trends[reading.trend]}
          </li>
          {reading.broken && (
            <li role="status" className="rounded-lg border border-target/40 bg-target/10 p-3">
              {fmt(tr.broken[reading.broken], {
                low: reading.lastLow ? num(reading.lastLow.price) : "—",
                high: reading.lastHigh ? num(reading.lastHigh.price) : "—",
              })}
            </li>
          )}
          <li>
            <strong>{tr.watch}</strong>{" "}
            {fmt(tr.invalidation[reading.trend], {
              low: reading.invalidation.below !== null ? num(reading.invalidation.below) : "—",
              high: reading.invalidation.above !== null ? num(reading.invalidation.above) : "—",
            })}
          </li>
        </ul>
      )}

      <p className="text-[11px] text-muted">{tr.legend}</p>
      <p className="text-[11px] text-muted">
        {tr.footer}{" "}
        <Link href={href("/glossario/teorias/teoria-de-dow")} className="font-medium text-accent hover:underline">
          {tr.link}
        </Link>
      </p>
    </div>
  );
}
