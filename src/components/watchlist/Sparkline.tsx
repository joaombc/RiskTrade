"use client";

import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";

const WIDTH = 80;
const HEIGHT = 28;
const PAD = 2;

/** Mini-gráfico de linha dos fechamentos recentes, verde se o período fecha em alta. */
export function Sparkline({ values }: { values: number[] }) {
  const { t, locale } = useI18n();
  if (values.length < 2) {
    return <div aria-hidden className="h-7 w-20" />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = PAD + (i / (values.length - 1)) * (WIDTH - PAD * 2);
      const y = PAD + (1 - (v - min) / span) * (HEIGHT - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const first = values[0];
  const last = values[values.length - 1];
  const up = last >= first;
  const change = ((last - first) / first) * 100;

  return (
    <svg
      role="img"
      aria-label={fmt(t.watchlist.sparkline, {
        sessions: values.length,
        direction: up ? t.watchlist.sparkUp : t.watchlist.sparkDown,
        percent: Math.abs(change).toLocaleString(locale, { maximumFractionDigits: 1 }),
      })}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={`h-7 w-20 shrink-0 ${up ? "text-positive" : "text-negative"}`}
    >
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
