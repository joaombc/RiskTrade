"use client";

import { useState } from "react";
import {
  addMovingAverage,
  applyCombo,
  ENVELOPE_PERCENTS,
  isComboActive,
  isValidPeriod,
  MA_COMBOS,
  MA_NAMES,
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
import { ENTRY_WEEKS, EXIT_WEEKS, type FourWeekSettings } from "@/lib/priceChannel";

interface Props {
  averages: MovingAverage[];
  onChange: (averages: MovingAverage[]) => void;
  /** Candles disponíveis para as médias, incluindo o aquecimento (null enquanto carrega). */
  barCount: number | null;
  colors: string[];
  bollinger: boolean;
  onBollingerChange: (enabled: boolean) => void;
  fourWeek: FourWeekSettings;
  onFourWeekChange: (settings: FourWeekSettings) => void;
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
  fourWeek,
  onFourWeekChange,
}: Props) {
  const [custom, setCustom] = useState<{ kind: MovingAverageKind; period: string } | null>(null);
  const full = averages.length >= MAX_MOVING_AVERAGES;
  const presets = MA_PRESETS.filter((p) => !averages.some((ma) => ma.id === maId(p.kind, p.period)));

  const customPeriod = custom ? Number(custom.period) : NaN;
  const customError = !custom
    ? null
    : !isValidPeriod(customPeriod)
      ? `Use um período inteiro de ${MIN_MA_PERIOD} a ${MAX_MA_PERIOD}.`
      : averages.some((ma) => ma.id === maId(custom.kind, customPeriod))
        ? "Essa média já está no gráfico."
        : null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div role="group" aria-label="Médias móveis" className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold">Médias móveis</span>

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
                    ? `Precisa de ${ma.period} candles; o Yahoo só tem ${barCount} neste intervalo. A linha começa no meio do gráfico.`
                    : `${MA_NAMES[ma.kind]} de ${ma.period} candles. Clique para ${ma.visible ? "ocultar" : "mostrar"}.`
                }
                className="flex items-center gap-1.5 py-1 pl-2.5 pr-1.5"
              >
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: ma.visible ? colors[ma.slot] : "transparent", border: `2px solid ${colors[ma.slot]}` }}
                />
                {maLabel(ma)}
                {short && ma.visible && <span className="text-warning">· poucos candles</span>}
              </button>
              <button
                type="button"
                onClick={() => onChange(averages.filter((m) => m.id !== ma.id))}
                aria-label={`Remover ${maLabel(ma)}`}
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
              + {maLabel(p)}
            </button>
          ))}

        {!full && !custom && (
          <button
            type="button"
            onClick={() => setCustom({ kind: "ema", period: "" })}
            className={`${chip} border-dashed border-border px-2.5 py-1 text-muted hover:bg-border/60 hover:text-foreground`}
          >
            + Personalizada
          </button>
        )}
        {full && <span className="text-xs text-muted">Limite de {MAX_MOVING_AVERAGES} médias: remova uma para adicionar outra.</span>}
      </div>

      {averages.some((ma) => ma.kind === "sma" && ma.visible) && (
        <div role="group" aria-label="Envelopes" className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span
            className="text-xs font-semibold"
            title="Linhas a uma porcentagem fixa acima e abaixo da média: mostram quando o preço esticou (Murphy, cap. 9)."
          >
            Envelopes
          </span>
          {averages
            .filter((ma) => ma.kind === "sma" && ma.visible)
            .map((ma) => (
              <span key={ma.id} className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 font-medium">
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[ma.slot] }} />
                  {maLabel(ma)}
                </span>
                {ENVELOPE_PERCENTS.map((percent) => (
                  <label key={percent} className="flex items-center gap-1 text-muted">
                    <input
                      type="checkbox"
                      checked={ma.envelopes?.includes(percent) ?? false}
                      onChange={() => onChange(toggleEnvelope(averages, ma.id, percent))}
                      aria-label={`Envelope de ${percent}% na ${maLabel(ma)}`}
                    />
                    {percent}%
                  </label>
                ))}
              </span>
            ))}
        </div>
      )}

      <label
        className="flex w-fit items-center gap-1.5 text-xs"
        title="Média de 20 períodos com bandas a 2 desvios-padrão acima e abaixo (Murphy, cap. 9)."
      >
        <input type="checkbox" checked={bollinger} onChange={(e) => onBollingerChange(e.target.checked)} />
        <span className="font-semibold">Bandas de Bollinger</span>
        <span className="text-muted">(MMS 20 ± 2 desvios)</span>
      </label>

      <div role="group" aria-label="Regra das 4 semanas" className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        <label
          className="flex items-center gap-1.5"
          title="Canal de preço de Donchian: compra no fechamento acima da máxima das semanas anteriores, venda abaixo da mínima (Murphy, cap. 9)."
        >
          <input
            type="checkbox"
            checked={fourWeek.enabled}
            onChange={(e) => onFourWeekChange({ ...fourWeek, enabled: e.target.checked })}
          />
          <span className="font-semibold">Regra das 4 semanas</span>
        </label>
        {fourWeek.enabled && (
          <>
            <label className="flex items-center gap-1 text-muted">
              Entrada
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
                    {w} semanas{w === 4 ? " (original)" : w === 8 ? " (filtra lateral)" : " (sensível)"}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1 text-muted">
              Saída
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
                <option value="continua">Contínua (inverte no canal de entrada)</option>
                {EXIT_WEEKS.filter((w) => w < fourWeek.entryWeeks).map((w) => (
                  <option key={w} value={w}>
                    Não contínua: {w} {w === 1 ? "semana" : "semanas"}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>

      <div role="group" aria-label="Combinações de médias" className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-semibold">Combinações</span>
        {MA_COMBOS.map((combo) => {
          const active = isComboActive(averages, combo);
          return (
            <button
              key={combo.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? [] : applyCombo(combo))}
              title={`${combo.description}. ${active ? "Clique para remover." : "Substitui as médias do gráfico."}`}
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
            Tipo
            <select
              value={custom.kind}
              onChange={(e) => setCustom({ ...custom, kind: e.target.value as MovingAverageKind })}
              className="rounded-md border border-border bg-surface px-2 py-1"
            >
              <option value="ema">{MA_NAMES.ema}</option>
              <option value="sma">{MA_NAMES.sma}</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            Período
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
            candles
          </label>
          <button
            type="submit"
            disabled={custom.period === "" || customError !== null}
            className="rounded-md bg-accent px-2.5 py-1 font-medium text-white hover:opacity-90 disabled:opacity-40"
          >
            Adicionar
          </button>
          <button type="button" onClick={() => setCustom(null)} className="font-medium text-muted hover:text-foreground">
            Cancelar
          </button>
          {custom.period !== "" && customError && <span className="w-full text-negative">{customError}</span>}
        </form>
      )}

      {averages.length > 0 && (
        <p className="text-xs text-muted">
          O período conta candles do gráfico: no 1D, uma MME 21 cobre 21 candles de 5 minutos; no 1A, 21 pregões.
        </p>
      )}
    </div>
  );
}
