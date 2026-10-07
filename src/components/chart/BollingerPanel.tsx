"use client";

import Link from "next/link";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { BANDWIDTH_LOOKBACK, STRONG_TREND_BARS, type BollingerReading } from "@/lib/bollinger";
import type { Bar } from "@/lib/drawings/types";

interface Props {
  bars: Bar[];
  reading: BollingerReading | null;
  intraday: boolean;
}

/** Leitura das bandas de Bollinger no último candle, com as regras de Murphy (cap. 9). */
export function BollingerPanel({ bars, reading, intraday }: Props) {
  const { t, locale, href } = useI18n();
  const b = t.bollinger;
  const num = (v: number) => v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dateFormat = new Intl.DateTimeFormat(
    locale,
    intraday ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit", year: "2-digit" },
  );
  const dateOf = (i: number) => dateFormat.format(new Date(bars[i].time * 1000));

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <h3 className="text-sm font-semibold">
        {b.title} <span className="font-normal text-muted">{b.params}</span>
      </h3>

      {!reading ? (
        <p className="text-sm text-muted">{b.insufficient}</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <strong>{b.position}</strong>{" "}
            {fmt(b.positionText, { close: num(reading.close), lower: num(reading.lower), upper: num(reading.upper), b: num(reading.percentB) })}
            {reading.percentB >= 1
              ? b.aboveUpper
              : reading.percentB <= 0
                ? b.belowLower
                : reading.percentB >= 0.5
                  ? b.upperHalf
                  : b.lowerHalf}
          </li>

          {reading.touch && (
            <li
              role="status"
              className={`rounded-lg border p-3 ${reading.touch.band === "upper" ? "border-negative/40 bg-negative/10" : "border-positive/40 bg-positive/10"}`}
            >
              <strong>{reading.touch.band === "upper" ? b.overbought : b.oversold}</strong>{" "}
              {fmt(reading.touch.band === "upper" ? b.touchUpper : b.touchLower, { date: dateOf(reading.touch.index) })}
              {reading.strongTrend === (reading.touch.band === "upper" ? "up" : "down") && b.touchStrong}
            </li>
          )}

          <li>
            <strong>{b.target}</strong>{" "}
            {reading.target ? (
              <>
                {fmt(reading.target.direction === "up" ? b.crossedUp : b.crossedDown, { date: dateOf(reading.target.crossIndex) })}
                {reading.target.fromBand && (reading.target.direction === "up" ? b.fromLower : b.fromUpper)}
                {b.thenTarget} <strong>{reading.target.direction === "up" ? b.upperBand : b.lowerBand}</strong>
                {fmt(b.today, { price: num(reading.target.price) })}
                {reading.target.crossIndex === bars.length - 1 && b.crossOpen}
              </>
            ) : (
              b.noCross
            )}
          </li>

          {reading.strongTrend && (
            <li>
              <strong>{reading.strongTrend === "up" ? b.strongUp : b.strongDown}</strong>{" "}
              {fmt(reading.strongTrend === "up" ? b.strongUpText : b.strongDownText, { n: STRONG_TREND_BARS, middle: num(reading.middle) })}
            </li>
          )}

          <li>
            <strong>{b.width}</strong> {fmt(b.widthText, { width: num(reading.width.current) })}
            {reading.width.state === "squeeze" ? (
              <>
                {fmt(b.squeezePrefix, { n: BANDWIDTH_LOOKBACK })} <strong>{b.squeeze}</strong>
                {b.squeezeText}
              </>
            ) : reading.width.state === "wide" ? (
              <>
                {fmt(b.widePrefix, { n: BANDWIDTH_LOOKBACK })} <strong>{b.wide}</strong>
                {b.wideText}
              </>
            ) : (
              fmt(b.normal, { n: BANDWIDTH_LOOKBACK })
            )}
          </li>
        </ul>
      )}

      <p className="text-[11px] text-muted">
        {b.footer}{" "}
        <Link href={href("/glossario#bandas-de-bollinger")} className="font-medium text-accent hover:underline">
          {b.link}
        </Link>
      </p>
    </div>
  );
}
