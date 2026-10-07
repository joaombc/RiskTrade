"use client";

import Link from "next/link";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { Bar } from "@/lib/drawings/types";
import type { ChannelSignal, ChannelSystemState, FourWeekSettings } from "@/lib/priceChannel";

const MAX_LISTED = 5;
const RECENT_BARS = 5;

const TONE: Record<ChannelSignal["kind"], string> = {
  buy: "bg-positive/15 text-positive",
  sell: "bg-negative/15 text-negative",
  exit: "bg-target/15 text-target",
};

interface Props {
  bars: Bar[];
  settings: FourWeekSettings;
  /** null nos períodos intradiários: a regra só vale em candles diários. */
  system: {
    state: ChannelSystemState;
    /** Níveis com que o fechamento do último candle é comparado: canal de entrada e, na versão não contínua, o de saída. */
    upper: number | null;
    lower: number | null;
    exitUpper: number | null;
    exitLower: number | null;
  } | null;
  show: boolean;
  onShowChange: (show: boolean) => void;
}

/** Painel da regra das 4 semanas: posição do sistema, níveis do próximo pregão e sinais recentes. */
export function FourWeekPanel({ bars, settings, system, show, onShowChange }: Props) {
  const { t, locale, href } = useI18n();
  const f = t.fourWeekPanel;
  const num = (v: number) => v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const weeks = (n: number) => fmt(n === 1 ? f.weekOne : f.weekMany, { n });

  const title = (
    <h3 className="text-sm font-semibold">
      {f.title}{" "}
      <span className="font-normal text-muted">
        · {fmt(f.entryIn, { weeks: weeks(settings.entryWeeks) })},{" "}
        {settings.exitWeeks === null ? f.continuous : fmt(f.exitIn, { weeks: weeks(settings.exitWeeks) })}
      </span>
    </h3>
  );

  if (!system) {
    return (
      <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
        {title}
        <p className="text-muted">{f.dailyOnly}</p>
      </div>
    );
  }

  const { state, upper, lower, exitUpper, exitLower } = system;
  const date = (i: number) => new Date(bars[i].time * 1000).toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "2-digit" });
  const latest = state.signals.at(-1);
  const recent = latest && bars.length - 1 - latest.index < RECENT_BARS ? latest : null;
  const listed = state.signals.slice(-MAX_LISTED).reverse();
  const continuous = settings.exitWeeks === null;
  const entry = weeks(settings.entryWeeks);

  const explain = (s: ChannelSignal) => {
    const close = num(bars[s.index].close);
    if (s.kind === "buy") return fmt(f.explainBuy, { close, weeks: entry });
    if (s.kind === "sell") return fmt(f.explainSell, { close, weeks: entry });
    return fmt(f.explainExit, { close, weeks: weeks(settings.exitWeeks ?? settings.entryWeeks) });
  };

  /** Uma linha de nível: "Compra se fechar acima de <strong>X</strong> (máxima de N semanas)." */
  const level = (text: string, value: number, note: string, n: string) => (
    <li>
      {text} <strong>{num(value)}</strong> {fmt(note, { weeks: n })}
    </li>
  );

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {title}
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={show} onChange={(e) => onShowChange(e.target.checked)} />
          {t.signals.show}
        </label>
      </div>

      <p className="text-sm">
        <strong>{f.position}</strong>{" "}
        {state.position === "flat" || state.since === null
          ? f.flat
          : fmt(f.since, {
              side: state.position === "long" ? f.long : f.short,
              date: date(state.since),
              price: num(bars[state.since].close),
            })}
      </p>

      {upper !== null && lower !== null && (
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
          {/* De fora: os dois rompimentos de entrada valem. */}
          {state.position === "flat" && (
            <>
              {level(f.buyAbove, upper, f.highOf, entry)}
              {level(f.sellBelow, lower, f.lowOf, entry)}
            </>
          )}
          {/* Contínua: o rompimento contrário do canal de entrada inverte a posição. */}
          {continuous && state.position === "long" && level(f.flipToSell, lower, f.lowOf, entry)}
          {continuous && state.position === "short" && level(f.flipToBuy, upper, f.highOf, entry)}
          {/* Não contínua: a posição sai pelo canal curto; depois, só um novo rompimento de entrada abre outra. */}
          {!continuous && state.position === "long" && exitLower !== null && level(f.exitLong, exitLower, f.lowOf, weeks(settings.exitWeeks!))}
          {!continuous && state.position === "short" && exitUpper !== null && level(f.exitShort, exitUpper, f.highOf, weeks(settings.exitWeeks!))}
        </ul>
      )}

      {recent ? (
        <div
          role="alert"
          className={`rounded-lg border p-3 text-sm ${recent.kind === "buy" ? "border-positive/40 bg-positive/10 text-positive" : recent.kind === "sell" ? "border-negative/40 bg-negative/10 text-negative" : "border-target/40 bg-target/10 text-target"}`}
        >
          <strong>{fmt(t.signals.at, { label: f.labels[recent.kind], date: date(recent.index) })}</strong> {explain(recent)}.
          {recent.index === bars.length - 1 && <span className="mt-1 block text-xs opacity-80">{t.signals.openCandle}</span>}
        </div>
      ) : (
        <p className="text-sm text-muted">{fmt(f.noneRecent, { count: RECENT_BARS })}</p>
      )}

      {listed.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs font-medium text-muted">{fmt(t.signals.inPeriod, { count: state.signals.length })}</summary>
          <ul className="mt-2 flex flex-col gap-2">
            {listed.map((s) => (
              <li key={`${s.kind}-${s.index}`} className="flex gap-2">
                <span className={`mt-0.5 h-fit shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE[s.kind]}`}>
                  {f.labels[s.kind]}
                </span>
                <span className="text-muted">
                  {date(s.index)}: {explain(s)}.
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="text-[11px] text-muted">
        {f.footer}{" "}
        <Link href={href("/glossario/teorias/regra-das-4-semanas")} className="font-medium text-accent hover:underline">
          {f.link}
        </Link>
      </p>
    </div>
  );
}
