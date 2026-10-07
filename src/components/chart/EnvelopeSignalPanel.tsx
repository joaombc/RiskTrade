"use client";

import type { Dictionary } from "@/i18n/dictionary";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { Bar } from "@/lib/drawings/types";
import { maLabel, RECENT_CROSS_BARS, type EnvelopeRegime, type EnvelopeSignal, type MovingAverage } from "@/lib/movingAverages";

const MAX_LISTED = 5;

const TONE: Record<EnvelopeSignal["kind"], string> = {
  buy: "bg-positive/15 text-positive",
  sell: "bg-negative/15 text-negative",
  exit: "bg-target/15 text-target",
};

/** O que aconteceu em cada sinal, segundo as táticas da aula de médias móveis. */
function explain(s: EnvelopeSignal, label: string, percent: number, e: Dictionary["envelope"]): string {
  const band = (side: "upper" | "lower") => fmt(side === "upper" ? e.bandUpper : e.bandLower, { percent });
  switch (s.regime) {
    case "lateral":
      return s.kind === "sell" ? fmt(e.lateralSell, { band: band("upper"), label }) : fmt(e.lateralBuy, { band: band("lower"), label });
    case "up":
      return s.kind === "buy" ? fmt(e.upBuy, { label, band: band("upper") }) : fmt(e.upExit, { band: band("upper") });
    case "down":
      return s.kind === "sell" ? fmt(e.downSell, { label, band: band("lower") }) : fmt(e.downExit, { band: band("lower") });
  }
}

interface Props {
  bars: Bar[];
  average: MovingAverage;
  percent: number;
  signals: EnvelopeSignal[];
  /** Contexto no último candle (null enquanto a média não tem histórico suficiente). */
  regime: EnvelopeRegime | null;
  intraday: boolean;
  show: boolean;
  onShowChange: (show: boolean) => void;
}

/** Painel dos sinais dos envelopes: envelope usado, contexto atual, alerta recente e lista. */
export function EnvelopeSignalPanel({ bars, average, percent, signals, regime, intraday, show, onShowChange }: Props) {
  const { t, locale } = useI18n();
  const e = t.envelope;
  const label = maLabel(average, t.ma.short);
  const dateFormat = new Intl.DateTimeFormat(
    locale,
    intraday
      ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "2-digit", year: "2-digit" },
  );
  const dateOf = (s: EnvelopeSignal) => dateFormat.format(new Date(bars[s.index].time * 1000));
  const price = (value: number) => value.toLocaleString(locale, { maximumFractionDigits: 2 });

  const latest = signals[signals.length - 1];
  const recent = latest && bars.length - 1 - latest.index < RECENT_CROSS_BARS ? latest : null;
  const listed = signals.slice(-MAX_LISTED).reverse();
  const recentTone = !recent
    ? ""
    : recent.kind === "buy"
      ? "border-positive/40 bg-positive/10 text-positive"
      : recent.kind === "sell"
        ? "border-negative/40 bg-negative/10 text-negative"
        : "border-target/40 bg-target/10 text-target";

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {e.title}{" "}
          <span className="font-normal text-muted">
            · {label} ± {percent}%
          </span>
        </h3>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={show} onChange={(ev) => onShowChange(ev.target.checked)} />
          {t.signals.show}
        </label>
      </div>

      <p className="text-sm">
        {regime ? (
          <>
            {e.contextNow} <strong>{e.regime[regime]}</strong>. {e.tactic} {e.playbook[regime]}.
          </>
        ) : (
          <span className="text-muted">{e.noHistory}</span>
        )}
      </p>

      {recent ? (
        <div role="alert" className={`rounded-lg border p-3 text-sm ${recentTone}`}>
          <strong>{fmt(t.signals.at, { label: e.labels[recent.kind], date: dateOf(recent) })}</strong>{" "}
          {explain(recent, label, percent, e)} {fmt(t.signals.close, { price: price(bars[recent.index].close) })}.
          {recent.index === bars.length - 1 && <span className="mt-1 block text-xs opacity-80">{t.signals.openCandle}</span>}
        </div>
      ) : (
        <p className="text-sm text-muted">{fmt(e.noneRecent, { count: RECENT_CROSS_BARS })}</p>
      )}

      {listed.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs font-medium text-muted">{fmt(t.signals.inPeriod, { count: signals.length })}</summary>
          <ul className="mt-2 flex flex-col gap-2">
            {listed.map((s) => (
              <li key={`${s.kind}-${s.index}`} className="flex gap-2">
                <span className={`mt-0.5 h-fit shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE[s.kind]}`}>
                  {e.labels[s.kind]}
                </span>
                <span className="text-muted">
                  {dateOf(s)}: {explain(s, label, percent, e)} {fmt(t.signals.close, { price: price(bars[s.index].close) })}.
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="text-[11px] text-muted">{e.footer}</p>
    </div>
  );
}
