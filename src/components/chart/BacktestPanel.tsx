"use client";

import { useEffect, useMemo, useState } from "react";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import {
  backtest,
  loadBacktestSettings,
  optimize,
  PARAM_GRID,
  sameParams,
  saveBacktestSettings,
  SYSTEM_IDS,
  systemSignals,
  type BacktestResult,
  type BacktestSettings,
  type SystemId,
  type SystemParams,
  type TradeMode,
} from "@/lib/backtest";
import type { Bar } from "@/lib/drawings/types";

interface Props {
  bars: Bar[];
  warmup: number[];
  intraday: boolean;
  /** Aberto ou fechado: fica com o gráfico, para o painel continuar aberto ao trocar de período. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COSTS = [0, 0.05, 0.1, 0.25, 0.5];
/** Operações mostradas antes de "ver todas". */
const RECENT_TRADES = 8;

const button = "rounded-full border px-2.5 py-1 text-xs font-medium";
const pressed = (active: boolean) =>
  `${button} ${active ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:bg-border/60 hover:text-foreground"}`;

/** Teste de sistemas (Murphy, cap. 15): backtest de um sistema pronto e otimização dos parâmetros. */
export function BacktestPanel({ bars, warmup, intraday, open, onOpenChange }: Props) {
  const { t, locale } = useI18n();
  const b = t.backtest;
  const [settings, setSettings] = useState<BacktestSettings>(loadBacktestSettings);
  const [showOptimization, setShowOptimization] = useState(false);
  const [allTrades, setAllTrades] = useState(false);
  const { system, params, options } = settings;

  useEffect(() => {
    saveBacktestSettings(settings);
  }, [settings]);

  const result = useMemo(
    () => (open ? backtest(bars, systemSignals(system, params[system], bars, warmup), options) : null),
    [open, bars, warmup, system, params, options],
  );
  const rows = useMemo(
    () => (open && showOptimization ? optimize(system, bars, warmup, options) : null),
    [open, showOptimization, system, bars, warmup, options],
  );

  const num = (v: number, digits = 2) => v.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const pct = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${num(Math.abs(v))}%`;
  const drawdown = (v: number) => (v > 0 ? `−${num(v)}%` : `${num(0)}%`);
  const dateFormat = new Intl.DateTimeFormat(
    locale,
    intraday ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit", year: "2-digit" },
  );
  const dateOf = (i: number) => dateFormat.format(new Date(bars[i].time * 1000));

  const paramLabel = <K extends SystemId>(id: K, p: SystemParams[K]): string => {
    const l = b.paramLabels;
    if (id === "fourWeek") {
      const { entry, exit } = p as SystemParams["fourWeek"];
      return fmt(exit >= entry ? l.fourWeekContinuous : l.fourWeek, { entry, exit });
    }
    if (id === "sar") {
      const { step, max } = p as SystemParams["sar"];
      return fmt(l.sar, { step: num(step), max: num(max) });
    }
    return fmt(l[id as "maCross" | "macd"], p as unknown as Record<string, number>);
  };
  const setParams = (p: SystemParams[SystemId]) => setSettings((s) => ({ ...s, params: { ...s.params, [s.system]: p } }));

  if (!open) {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <div>
          <h3 className="text-sm font-semibold">
            {b.title} <span className="font-normal text-muted">{b.subtitle}</span>
          </h3>
          <p className="text-xs text-muted">{b.intro}</p>
        </div>
        <button type="button" onClick={() => onOpenChange(true)} className={`${button} border-foreground bg-foreground text-background`}>
          {b.open}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {b.title} <span className="font-normal text-muted">{b.subtitle}</span>
        </h3>
        <button type="button" onClick={() => onOpenChange(false)} className={pressed(false)}>
          {b.close}
        </button>
      </div>
      <p className="text-xs text-muted">{b.intro}</p>

      <div role="group" aria-label={b.system} className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold">{b.system}</span>
        {SYSTEM_IDS.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={system === id}
            title={b.systemHints[id]}
            onClick={() => setSettings((s) => ({ ...s, system: id }))}
            className={pressed(system === id)}
          >
            {b.systems[id]}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted">{b.systemHints[system]}</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <label className="flex items-center gap-1.5">
          <span className="font-semibold">{b.params}</span>
          <select
            value={PARAM_GRID[system].findIndex((p) => sameParams(p, params[system]))}
            onChange={(e) => setParams(PARAM_GRID[system][Number(e.target.value)])}
            className="rounded-md border border-border bg-surface px-2 py-1"
          >
            {PARAM_GRID[system].map((p, k) => (
              <option key={k} value={k}>
                {paramLabel(system, p)}
              </option>
            ))}
          </select>
        </label>
        <div role="group" aria-label={b.mode} className="flex items-center gap-1.5">
          <span className="font-semibold">{b.mode}</span>
          {(["longShort", "longOnly"] as TradeMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={options.mode === mode}
              onClick={() => setSettings((s) => ({ ...s, options: { ...s.options, mode } }))}
              className={pressed(options.mode === mode)}
            >
              {b.modes[mode]}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5" title={b.costHint}>
          <span className="font-semibold">{b.cost}</span>
          <select
            value={options.costPercent}
            onChange={(e) => setSettings((s) => ({ ...s, options: { ...s.options, costPercent: Number(e.target.value) } }))}
            className="rounded-md border border-border bg-surface px-2 py-1"
          >
            {COSTS.map((c) => (
              <option key={c} value={c}>
                {num(c)}%
              </option>
            ))}
          </select>
        </label>
      </div>

      {bars.length > 0 && (
        <p className="text-xs text-muted">
          {fmt(b.sample, { count: bars.length.toLocaleString(locale), from: dateOf(0), to: dateOf(bars.length - 1) })}
          {result && result.trades.length < 10 && b.sampleHint}
        </p>
      )}

      {result && result.trades.length === 0 && <p className="text-sm text-muted">{b.noTrades}</p>}
      {result && result.trades.length > 0 && (
        <>
          <Stats result={result} pct={pct} num={num} />
          <p className="text-sm">
            {fmt(result.totalReturn >= result.buyHoldReturn ? b.beat : b.lost, {
              diff: `${num(Math.abs(result.totalReturn - result.buyHoldReturn))} p.p.`,
            })}
          </p>
          <EquityCurve result={result} />

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-semibold">{b.tradesTitle}</h4>
              {result.trades.length > RECENT_TRADES && (
                <button type="button" onClick={() => setAllTrades((v) => !v)} className="text-xs font-medium text-accent hover:underline">
                  {allTrades ? b.showLess : fmt(b.showAll, { n: result.trades.length })}
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-auto rounded-lg border border-border">
              <table className="w-full text-xs tabular-nums">
                <thead className="sticky top-0 bg-surface text-left text-muted">
                  <tr>
                    <th className="px-2 py-1.5 font-medium">{b.columns.direction}</th>
                    <th className="px-2 py-1.5 font-medium">{b.columns.entry}</th>
                    <th className="px-2 py-1.5 font-medium">{b.columns.exit}</th>
                    <th className="px-2 py-1.5 text-right font-medium">{b.columns.result}</th>
                  </tr>
                </thead>
                <tbody>
                  {(allTrades ? result.trades : result.trades.slice(-RECENT_TRADES))
                    .slice()
                    .reverse()
                    .map((trade) => (
                      <tr key={trade.entryIndex} className="border-t border-border">
                        <td className={`px-2 py-1.5 font-medium ${trade.direction === 1 ? "text-positive" : "text-negative"}`}>
                          {trade.direction === 1 ? b.long : b.short}
                        </td>
                        <td className="px-2 py-1.5">
                          {dateOf(trade.entryIndex)} · {num(trade.entryPrice)}
                        </td>
                        <td className="px-2 py-1.5">
                          {trade.open ? <span className="text-muted">{b.openTrade}</span> : dateOf(trade.exitIndex)} · {num(trade.exitPrice)}
                        </td>
                        <td className={`px-2 py-1.5 text-right font-medium ${trade.returnPercent > 0 ? "text-positive" : "text-negative"}`}>
                          {pct(trade.returnPercent)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col gap-2">
        <button type="button" aria-pressed={showOptimization} onClick={() => setShowOptimization((v) => !v)} className={`w-fit ${pressed(showOptimization)}`}>
          {b.optimize}
        </button>
        {rows && (
          <>
            <p className="text-xs text-muted">{b.optimizeIntro}</p>
            <div className="max-h-80 overflow-auto rounded-lg border border-border">
              <table className="w-full text-xs tabular-nums">
                <thead className="sticky top-0 bg-surface text-left text-muted">
                  <tr>
                    <th className="px-2 py-1.5 font-medium">{b.params}</th>
                    <th className="px-2 py-1.5 text-right font-medium">{b.stats.system}</th>
                    <th className="px-2 py-1.5 text-right font-medium">{b.stats.trades}</th>
                    <th className="px-2 py-1.5 text-right font-medium">{b.stats.winRate}</th>
                    <th className="px-2 py-1.5 text-right font-medium">{b.stats.profitFactor}</th>
                    <th className="px-2 py-1.5 text-right font-medium">{b.stats.maxDrawdown}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ params: p, result: r }) => {
                    const current = sameParams(p, params[system]);
                    return (
                      <tr
                        key={JSON.stringify(p)}
                        onClick={() => setParams(p)}
                        className={`cursor-pointer border-t border-border hover:bg-border/40 ${current ? "bg-accent/10 font-semibold" : ""}`}
                      >
                        <td className="px-2 py-1.5">
                          {paramLabel(system, p)}
                          {current && <span className="ml-1 font-normal text-muted">({b.current})</span>}
                        </td>
                        <td className={`px-2 py-1.5 text-right ${r.totalReturn >= 0 ? "text-positive" : "text-negative"}`}>{pct(r.totalReturn)}</td>
                        <td className="px-2 py-1.5 text-right">{r.trades.length}</td>
                        <td className="px-2 py-1.5 text-right">{r.winRate === null ? "—" : `${num(r.winRate, 0)}%`}</td>
                        <td className="px-2 py-1.5 text-right">{r.profitFactor === null ? "—" : num(r.profitFactor)}</td>
                        <td className="px-2 py-1.5 text-right">{drawdown(r.maxDrawdown)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="rounded-lg border border-border bg-border/30 p-3 text-xs">{b.warning}</p>
          </>
        )}
      </div>

      <p className="text-[11px] text-muted">{b.footer}</p>
    </div>
  );
}

function Stats({ result, pct, num }: { result: BacktestResult; pct: (v: number) => string; num: (v: number, digits?: number) => string }) {
  const { t } = useI18n();
  const s = t.backtest.stats;
  const tone = (v: number) => (v >= 0 ? "text-positive" : "text-negative");
  const items: { label: string; value: string; className?: string; hint?: string }[] = [
    { label: s.system, value: pct(result.totalReturn), className: tone(result.totalReturn) },
    { label: s.buyHold, value: pct(result.buyHoldReturn), className: tone(result.buyHoldReturn) },
    { label: s.trades, value: String(result.trades.length) },
    { label: s.winRate, value: result.winRate === null ? "—" : `${num(result.winRate, 0)}%` },
    { label: s.avgWin, value: result.avgWin === null ? "—" : pct(result.avgWin), className: "text-positive" },
    { label: s.avgLoss, value: result.avgLoss === null ? "—" : pct(result.avgLoss), className: "text-negative" },
    {
      label: s.profitFactor,
      value: result.profitFactor === null ? t.backtest.noLosses : num(result.profitFactor),
      hint: t.backtest.profitFactorHint,
    },
    { label: s.maxDrawdown, value: `−${num(result.maxDrawdown)}%`, className: "text-negative", hint: t.backtest.drawdownHint },
    { label: s.exposure, value: `${num(result.exposure * 100, 0)}%` },
  ];
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} title={item.hint} className="rounded-lg border border-border p-2">
          <dt className="text-[11px] text-muted">{item.label}</dt>
          <dd className={`text-sm font-semibold tabular-nums ${item.className ?? ""}`}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Capital do sistema contra comprar e segurar, na mesma escala (começam em 1). */
function EquityCurve({ result }: { result: BacktestResult }) {
  const { t } = useI18n();
  const b = t.backtest;
  const [width, height] = [600, 140];
  const all = [...result.equity, ...result.buyHold];
  const [min, max] = [Math.min(...all), Math.max(...all)];
  const span = max - min || 1;
  const path = (values: number[]) =>
    values
      .map((v, i) => `${i === 0 ? "M" : "L"}${((i / Math.max(values.length - 1, 1)) * width).toFixed(1)},${(height - ((v - min) / span) * height).toFixed(1)}`)
      .join(" ");
  const base = height - ((1 - min) / span) * height;
  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="flex flex-wrap items-center gap-3 text-xs">
        <span className="font-semibold">{b.equity}</span>
        <span className="flex items-center gap-1 text-accent">
          <span className="inline-block h-0.5 w-4 bg-current" /> {b.stats.system}
        </span>
        <span className="flex items-center gap-1 text-muted">
          <span className="inline-block h-0.5 w-4 bg-current" /> {b.stats.buyHold}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-36 w-full rounded-lg border border-border" role="img" aria-label={b.equity}>
        <line x1={0} x2={width} y1={base} y2={base} className="stroke-border" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        <path d={path(result.buyHold)} fill="none" className="stroke-muted" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        <path d={path(result.equity)} fill="none" className="stroke-accent" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
    </figure>
  );
}
