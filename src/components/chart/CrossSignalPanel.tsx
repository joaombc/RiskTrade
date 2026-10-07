"use client";

import type { Dictionary } from "@/i18n/dictionary";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { Bar } from "@/lib/drawings/types";
import { maLabel, RECENT_CROSS_BARS, type CrossSignal, type MovingAverage } from "@/lib/movingAverages";

const MAX_LISTED = 5;

const TONE: Record<CrossSignal["kind"], string> = {
  buy: "bg-positive/15 text-positive",
  sell: "bg-negative/15 text-negative",
  "buy-alert": "bg-positive/10 text-positive",
  "sell-alert": "bg-negative/10 text-negative",
};

/** O que aconteceu em cada sinal, com os nomes das médias (curta, do meio e longa). */
function explain(kind: CrossSignal["kind"], names: string[], c: Dictionary["cross"]): string {
  const [short, long] = [names[0], names[names.length - 1]];
  if (names.length === 2) return fmt(kind === "buy" ? c.doubleUp : c.doubleDown, { short, long });
  const vars = { short, mid: names[1], long };
  switch (kind) {
    case "buy":
      return fmt(c.tripleBuy, vars);
    case "sell":
      return fmt(c.tripleSell, vars);
    case "buy-alert":
      return fmt(c.buyAlert, vars);
    case "sell-alert":
      return fmt(c.sellAlert, vars);
  }
}

interface Props {
  bars: Bar[];
  /** Médias visíveis, já ordenadas pelo período (da curta para a longa). */
  averages: MovingAverage[];
  /** Último valor de cada média visível, na mesma ordem. */
  lastValues: (number | null)[];
  signals: CrossSignal[];
  intraday: boolean;
  show: boolean;
  onShowChange: (show: boolean) => void;
}

/**
 * Painel dos sinais de cruzamento (Murphy, cap. 9): qual par ou trio está sendo lido, a posição
 * atual das médias, um alerta para cruzamentos recentes e a lista dos últimos sinais.
 */
export function CrossSignalPanel({ bars, averages, lastValues, signals, intraday, show, onShowChange }: Props) {
  const { t, locale } = useI18n();
  const c = t.cross;
  if (averages.length < 2) return null;

  const dateFormat = new Intl.DateTimeFormat(
    locale,
    intraday
      ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "2-digit", year: "2-digit" },
  );
  const dateOf = (s: CrossSignal) => dateFormat.format(new Date(bars[s.index].time * 1000));
  const price = (value: number) => value.toLocaleString(locale, { maximumFractionDigits: 2 });
  const names = averages.map((ma) => maLabel(ma, t.ma.short));

  if (averages.length > 3) {
    return (
      <div className="mt-4 border-t border-border pt-4 text-sm text-muted">
        <h3 className="mb-1 text-sm font-semibold text-foreground">{c.title}</h3>
        {fmt(c.tooMany, { count: averages.length })}
      </div>
    );
  }

  const latest = signals[signals.length - 1];
  const recent = latest && bars.length - 1 - latest.index < RECENT_CROSS_BARS ? latest : null;
  const listed = signals.slice(-MAX_LISTED).reverse();
  const [short, long] = [lastValues[0], lastValues[lastValues.length - 1]];
  const position =
    short === null || long === null
      ? null
      : fmt(short > long ? c.positionBuy : c.positionSell, { short: names[0], long: names[names.length - 1] });

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {c.title} <span className="font-normal text-muted">· {names.join(" × ")}</span>
        </h3>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={show} onChange={(e) => onShowChange(e.target.checked)} />
          {t.signals.show}
        </label>
      </div>

      {recent ? (
        <div
          role="alert"
          className={`rounded-lg border p-3 text-sm ${recent.kind.startsWith("buy") ? "border-positive/40 bg-positive/10 text-positive" : "border-negative/40 bg-negative/10 text-negative"}`}
        >
          <strong>{fmt(t.signals.at, { label: c.labels[recent.kind], date: dateOf(recent) })}</strong>{" "}
          {explain(recent.kind, names, c)} {fmt(t.signals.close, { price: price(bars[recent.index].close) })}.
          {recent.index === bars.length - 1 && <span className="mt-1 block text-xs opacity-80">{t.signals.openCandle}</span>}
        </div>
      ) : (
        <p className="text-sm text-muted">
          {fmt(c.noneRecent, { count: RECENT_CROSS_BARS })}
          {position && fmt(c.now, { position })}
        </p>
      )}

      {listed.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs font-medium text-muted">{fmt(t.signals.inPeriod, { count: signals.length })}</summary>
          <ul className="mt-2 flex flex-col gap-2">
            {listed.map((s) => (
              <li key={`${s.kind}-${s.index}`} className="flex gap-2">
                <span className={`mt-0.5 h-fit shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE[s.kind]}`}>
                  {c.labels[s.kind]}
                </span>
                <span className="text-muted">
                  {dateOf(s)}: {explain(s.kind, names, c)} {fmt(t.signals.close, { price: price(bars[s.index].close) })}.
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="text-[11px] text-muted">{c.footer}</p>
    </div>
  );
}
