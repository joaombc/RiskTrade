"use client";

import { useState } from "react";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import {
  addMovingAverage,
  applyCombo,
  ENVELOPE_PERCENTS,
  isComboActive,
  isValidPeriod,
  MA_COMBOS,
  MA_PRESETS,
  maId,
  maLabel,
  MAX_MA_PERIOD,
  MAX_MOVING_AVERAGES,
  MIN_MA_PERIOD,
  toggleEnvelope,
  type MovingAverage,
  type MovingAverageKind,
} from "@/lib/movingAverages";
import { MOMENTUM_PERIODS, type MomentumPeriod } from "@/lib/momentum";
import { RSI_PERIODS, type RsiPeriod } from "@/lib/rsi";
import { STOCHASTIC_PERIODS, type StochasticPeriod } from "@/lib/stochastic";
import { TREND_DEGREES, TREND_WINDOWS, type TrendDegree } from "@/lib/trend";
import { WILLIAMS_PERIODS, type WilliamsPeriod } from "@/lib/williamsR";
import { ENTRY_WEEKS, EXIT_WEEKS, type FourWeekSettings } from "@/lib/priceChannel";

interface Props {
  averages: MovingAverage[];
  onChange: (averages: MovingAverage[]) => void;
  /** Candles disponíveis para as médias, incluindo o aquecimento (null enquanto carrega). */
  barCount: number | null;
  colors: string[];
  bollinger: boolean;
  onBollingerChange: (enabled: boolean) => void;
  macd: boolean;
  onMacdChange: (enabled: boolean) => void;
  fourWeek: FourWeekSettings;
  onFourWeekChange: (settings: FourWeekSettings) => void;
  /** Período da linha de momentum; null = desligada. */
  momentum: MomentumPeriod | null;
  onMomentumChange: (period: MomentumPeriod | null) => void;
  /** Período do IFR; null = desligado. */
  rsi: RsiPeriod | null;
  onRsiChange: (period: RsiPeriod | null) => void;
  /** Período do estocástico lento; null = desligado. */
  stochastic: StochasticPeriod | null;
  onStochasticChange: (period: StochasticPeriod | null) => void;
  /** Período do %R de Williams; null = desligado. */
  williamsR: WilliamsPeriod | null;
  onWilliamsRChange: (period: WilliamsPeriod | null) => void;
  /** Prazo da tendência (Murphy, cap. 4) mostrado no gráfico; null = desligada. */
  trend: TrendDegree | null;
  onTrendChange: (degree: TrendDegree | null) => void;
}

const chip = "flex items-center rounded-full border text-xs font-medium";

/** Barra das médias móveis: atalhos, média personalizada e os chips das médias ativas. */
export function MovingAverageBar({
  averages,
  onChange,
  barCount,
  colors,
  bollinger,
  onBollingerChange,
  macd,
  onMacdChange,
  fourWeek,
  onFourWeekChange,
  momentum,
  onMomentumChange,
  rsi,
  onRsiChange,
  stochastic,
  onStochasticChange,
  williamsR,
  onWilliamsRChange,
  trend,
  onTrendChange,
}: Props) {
  const { t, locale } = useI18n();
  const m = t.ma;
  const label = (ma: Pick<MovingAverage, "kind" | "period">) => maLabel(ma, m.short);
  const [custom, setCustom] = useState<{ kind: MovingAverageKind; period: string } | null>(null);
  const full = averages.length >= MAX_MOVING_AVERAGES;
  const presets = MA_PRESETS.filter((p) => !averages.some((ma) => ma.id === maId(p.kind, p.period)));

  const customPeriod = custom ? Number(custom.period) : NaN;
  const customError = !custom
    ? null
    : !isValidPeriod(customPeriod)
      ? fmt(m.invalidPeriod, { min: MIN_MA_PERIOD, max: MAX_MA_PERIOD })
      : averages.some((ma) => ma.id === maId(custom.kind, customPeriod))
        ? m.duplicate
        : null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div role="group" aria-label={m.title} className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold">{m.title}</span>

        {averages.map((ma) => {
          const short = barCount !== null && barCount < ma.period;
          return (
            <span
              key={ma.id}
              className={`${chip} ${ma.visible ? "border-border bg-surface" : "border-dashed border-border text-muted"}`}
            >
              <button
                type="button"
                aria-pressed={ma.visible}
                onClick={() => onChange(averages.map((m) => (m.id === ma.id ? { ...m, visible: !m.visible } : m)))}
                title={
                  short
                    ? fmt(m.fewCandlesHint, { period: ma.period, count: barCount })
                    : fmt(m.chipHint, { name: m.names[ma.kind], period: ma.period, action: ma.visible ? m.hide : m.show })
                }
                className="flex items-center gap-1.5 py-1 pl-2.5 pr-1.5"
              >
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: ma.visible ? colors[ma.slot] : "transparent", border: `2px solid ${colors[ma.slot]}` }}
                />
                {label(ma)}
                {short && ma.visible && <span className="text-warning">{m.fewCandles}</span>}
              </button>
              <button
                type="button"
                onClick={() => onChange(averages.filter((m) => m.id !== ma.id))}
                aria-label={fmt(m.remove, { label: label(ma) })}
                className="rounded-full py-1 pl-1 pr-2.5 text-muted hover:text-foreground"
              >
                ×
              </button>
            </span>
          );
        })}

        {!full &&
          presets.map((p) => (
            <button
              key={maId(p.kind, p.period)}
              type="button"
              onClick={() => onChange(addMovingAverage(averages, p.kind, p.period))}
              className={`${chip} border-dashed border-border px-2.5 py-1 text-muted hover:bg-border/60 hover:text-foreground`}
            >
              + {label(p)}
            </button>
          ))}

        {!full && !custom && (
          <button
            type="button"
            onClick={() => setCustom({ kind: "ema", period: "" })}
            className={`${chip} border-dashed border-border px-2.5 py-1 text-muted hover:bg-border/60 hover:text-foreground`}
          >
            {m.custom}
          </button>
        )}
        {full && <span className="text-xs text-muted">{fmt(m.limit, { max: MAX_MOVING_AVERAGES })}</span>}
      </div>

      {averages.some((ma) => ma.kind === "sma" && ma.visible) && (
        <div role="group" aria-label={m.envelopes} className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="text-xs font-semibold" title={m.envelopesHint}>
            {m.envelopes}
          </span>
          {averages
            .filter((ma) => ma.kind === "sma" && ma.visible)
            .map((ma) => (
              <span key={ma.id} className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 font-medium">
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[ma.slot] }} />
                  {label(ma)}
                </span>
                {ENVELOPE_PERCENTS.map((percent) => (
                  <label key={percent} className="flex items-center gap-1 text-muted">
                    <input
                      type="checkbox"
                      checked={ma.envelopes?.includes(percent) ?? false}
                      onChange={() => onChange(toggleEnvelope(averages, ma.id, percent))}
                      aria-label={fmt(m.envelopeOf, { percent, label: label(ma) })}
                    />
                    {percent}%
                  </label>
                ))}
              </span>
            ))}
        </div>
      )}

      <label className="flex w-fit items-center gap-1.5 text-xs" title={m.bollingerHint}>
        <input type="checkbox" checked={bollinger} onChange={(e) => onBollingerChange(e.target.checked)} />
        <span className="font-semibold">{m.bollinger}</span>
        <span className="text-muted">{m.bollingerParams}</span>
      </label>

      <label className="flex w-fit items-center gap-1.5 text-xs" title={m.macdHint}>
        <input type="checkbox" checked={macd} onChange={(e) => onMacdChange(e.target.checked)} />
        <span className="font-semibold">{m.macd}</span>
        <span className="text-muted">{m.macdParams}</span>
      </label>

      <div role="group" aria-label={m.fourWeek} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        <label className="flex items-center gap-1.5" title={m.fourWeekHint}>
          <input
            type="checkbox"
            checked={fourWeek.enabled}
            onChange={(e) => onFourWeekChange({ ...fourWeek, enabled: e.target.checked })}
          />
          <span className="font-semibold">{m.fourWeek}</span>
        </label>
        {fourWeek.enabled && (
          <>
            <label className="flex items-center gap-1 text-muted">
              {m.entry}
              <select
                value={fourWeek.entryWeeks}
                onChange={(e) => {
                  const entryWeeks = Number(e.target.value) as FourWeekSettings["entryWeeks"];
                  // A saída precisa ser mais curta que a entrada; senão, vira contínua.
                  const exitWeeks = fourWeek.exitWeeks !== null && fourWeek.exitWeeks < entryWeeks ? fourWeek.exitWeeks : null;
                  onFourWeekChange({ ...fourWeek, entryWeeks, exitWeeks });
                }}
                className="rounded-md border border-border bg-surface px-1.5 py-0.5"
              >
                {ENTRY_WEEKS.map((w) => (
                  <option key={w} value={w}>
                    {m.entryOption[String(w) as keyof typeof m.entryOption]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1 text-muted">
              {m.exit}
              <select
                value={fourWeek.exitWeeks ?? "continua"}
                onChange={(e) =>
                  onFourWeekChange({
                    ...fourWeek,
                    exitWeeks: e.target.value === "continua" ? null : (Number(e.target.value) as FourWeekSettings["exitWeeks"]),
                  })
                }
                className="rounded-md border border-border bg-surface px-1.5 py-0.5"
              >
                <option value="continua">{m.continuous}</option>
                {EXIT_WEEKS.filter((w) => w < fourWeek.entryWeeks).map((w) => (
                  <option key={w} value={w}>
                    {m.exitOption[String(w) as keyof typeof m.exitOption]}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>

      {/* Um período por vez; clicar no ativo desliga a linha. */}
      <div role="group" aria-label={m.trend} className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold" title={m.trendHint}>
          {m.trend}
        </span>
        {TREND_DEGREES.map((degree) => {
          const active = trend === degree;
          return (
            <button
              key={degree}
              type="button"
              aria-pressed={active}
              onClick={() => onTrendChange(active ? null : degree)}
              title={fmt(m.trendDegree, { degree: m.trendDegrees[degree].toLocaleLowerCase(locale), n: TREND_WINDOWS[degree], action: active ? m.hide : m.show })}
              className={`${chip} px-2.5 py-1 ${
                active ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:bg-border/60 hover:text-foreground"
              }`}
            >
              {m.trendDegrees[degree]}
            </button>
          );
        })}
      </div>

      <div role="group" aria-label={m.momentum} className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold" title={m.momentumHint}>
          {m.momentum}
        </span>
        {MOMENTUM_PERIODS.map((period) => {
          const active = momentum === period;
          return (
            <button
              key={period}
              type="button"
              aria-pressed={active}
              onClick={() => onMomentumChange(active ? null : period)}
              title={fmt(m.momentumPeriod, { n: period, action: active ? m.hide : m.show })}
              className={`${chip} px-2.5 py-1 tabular-nums ${
                active ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:bg-border/60 hover:text-foreground"
              }`}
            >
              {period}
            </button>
          );
        })}
      </div>

      <div role="group" aria-label={m.rsi} className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold" title={m.rsiHint}>
          {m.rsi}
        </span>
        {RSI_PERIODS.map((period) => {
          const active = rsi === period;
          return (
            <button
              key={period}
              type="button"
              aria-pressed={active}
              onClick={() => onRsiChange(active ? null : period)}
              title={fmt(m.rsiPeriod, { n: period, action: active ? m.hide : m.show })}
              className={`${chip} px-2.5 py-1 tabular-nums ${
                active ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:bg-border/60 hover:text-foreground"
              }`}
            >
              {period}
            </button>
          );
        })}
      </div>

      <div role="group" aria-label={m.stochastic} className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold" title={m.stochasticHint}>
          {m.stochastic}
        </span>
        {STOCHASTIC_PERIODS.map((period) => {
          const active = stochastic === period;
          return (
            <button
              key={period}
              type="button"
              aria-pressed={active}
              onClick={() => onStochasticChange(active ? null : period)}
              title={fmt(m.stochasticPeriod, { n: period, action: active ? m.hide : m.show })}
              className={`${chip} px-2.5 py-1 tabular-nums ${
                active ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:bg-border/60 hover:text-foreground"
              }`}
            >
              {period}
            </button>
          );
        })}
      </div>

      <div role="group" aria-label={m.williamsR} className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold" title={m.williamsRHint}>
          {m.williamsR}
        </span>
        {WILLIAMS_PERIODS.map((period) => {
          const active = williamsR === period;
          return (
            <button
              key={period}
              type="button"
              aria-pressed={active}
              onClick={() => onWilliamsRChange(active ? null : period)}
              title={fmt(m.williamsRPeriod, { n: period, action: active ? m.hide : m.show })}
              className={`${chip} px-2.5 py-1 tabular-nums ${
                active ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:bg-border/60 hover:text-foreground"
              }`}
            >
              {period}
            </button>
          );
        })}
      </div>

      <div role="group" aria-label={m.combosLabel} className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold">{m.combos}</span>
        {MA_COMBOS.map((combo) => {
          const active = isComboActive(averages, combo);
          return (
            <button
              key={combo.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? [] : applyCombo(combo))}
              title={`${m.comboDescriptions[combo.id as keyof typeof m.comboDescriptions] ?? combo.description}. ${active ? m.comboRemove : m.comboReplace}`}
              className={`${chip} px-2.5 py-1 tabular-nums ${
                active ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:bg-border/60 hover:text-foreground"
              }`}
            >
              {combo.label}
            </button>
          );
        })}
      </div>

      {custom && !full && (
        <form
          className="flex flex-wrap items-center gap-2 text-xs"
          onSubmit={(e) => {
            e.preventDefault();
            if (customError) return;
            onChange(addMovingAverage(averages, custom.kind, customPeriod));
            setCustom(null);
          }}
        >
          <label className="flex items-center gap-1.5">
            {m.type}
            <select
              value={custom.kind}
              onChange={(e) => setCustom({ ...custom, kind: e.target.value as MovingAverageKind })}
              className="rounded-md border border-border bg-surface px-2 py-1"
            >
              <option value="ema">{m.names.ema}</option>
              <option value="sma">{m.names.sma}</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            {m.period}
            <input
              type="number"
              inputMode="numeric"
              min={MIN_MA_PERIOD}
              max={MAX_MA_PERIOD}
              step={1}
              autoFocus
              value={custom.period}
              onChange={(e) => setCustom({ ...custom, period: e.target.value })}
              className="w-20 rounded-md border border-border bg-surface px-2 py-1 tabular-nums"
            />
            {m.candles}
          </label>
          <button
            type="submit"
            disabled={custom.period === "" || customError !== null}
            className="rounded-md bg-accent px-2.5 py-1 font-medium text-white hover:opacity-90 disabled:opacity-40"
          >
            {m.add}
          </button>
          <button type="button" onClick={() => setCustom(null)} className="font-medium text-muted hover:text-foreground">
            {m.cancel}
          </button>
          {custom.period !== "" && customError && <span className="w-full text-negative">{customError}</span>}
        </form>
      )}

      {averages.length > 0 && (
        <p className="text-xs text-muted">{m.periodNote}</p>
      )}
    </div>
  );
}
