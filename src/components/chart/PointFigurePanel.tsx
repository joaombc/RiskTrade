"use client";

import Link from "next/link";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { Bar } from "@/lib/drawings/types";
import type { PFReading, PointFigure } from "@/lib/pointFigure";

interface Props {
  bars: Bar[];
  pf: PointFigure;
  reading: PFReading | null;
  intraday: boolean;
}

/** Leitura do ponto e figura: coluna atual, último sinal e os níveis que dão o próximo sinal (Murphy, cap. 11). */
export function PointFigurePanel({ bars, pf, reading, intraday }: Props) {
  const { t, locale, href } = useI18n();
  const p = t.pointFigure;
  const { box } = pf;
  const decimals = box < 0.01 ? 4 : box < 1 ? 2 : box % 1 === 0 ? 0 : 2;
  const price = (v: number) => v.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const dateFormat = new Intl.DateTimeFormat(
    locale,
    intraday ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit", year: "2-digit" },
  );
  const dateOf = (i: number) => dateFormat.format(new Date(bars[i].time * 1000));

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <h3 className="text-sm font-semibold">
        {p.title} <span className="font-normal text-muted">{fmt(p.params, { box: price(box), n: pf.reversal })}</span>
      </h3>

      {!reading ? (
        <p className="text-sm text-muted">{p.insufficient}</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <strong>{p.now}</strong>{" "}
            {fmt(reading.current.kind === "X" ? p.currentX : p.currentO, {
              boxes: reading.current.high - reading.current.low + 1,
              from: price((reading.current.kind === "X" ? reading.current.low : reading.current.high) * box),
              to: price((reading.current.kind === "X" ? reading.current.high : reading.current.low) * box),
              columns: pf.columns.length,
            })}
          </li>
          <li
            role="status"
            className={`rounded-lg border p-3 ${
              !reading.lastSignal
                ? "border-border bg-background/60"
                : reading.lastSignal.kind === "buy"
                  ? "border-positive/40 bg-positive/10"
                  : "border-negative/40 bg-negative/10"
            }`}
          >
            <strong>{p.lastSignal}</strong>{" "}
            {reading.lastSignal
              ? fmt(reading.lastSignal.kind === "buy" ? p.buy : p.sell, {
                  price: price(reading.lastSignal.level * box),
                  date: dateOf(reading.lastSignal.index),
                })
              : p.noSignal}
          </li>
          <li>
            <strong>{p.next}</strong>{" "}
            {reading.buy && (reading.buy.triggered ? p.buyActive : fmt(p.buyTrigger, { price: price(reading.buy.price) }))}{" "}
            {reading.sell && (reading.sell.triggered ? p.sellActive : fmt(p.sellTrigger, { price: price(reading.sell.price) }))}
          </li>
        </ul>
      )}

      <p className="text-[11px] text-muted">
        {p.footer}{" "}
        <Link href={href("/ponto-e-figura")} className="font-medium text-accent hover:underline">
          {p.patternsLink}
        </Link>
      </p>
    </div>
  );
}
