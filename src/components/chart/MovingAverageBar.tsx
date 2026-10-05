"use client";

import { useState } from "react";
import {
  addMovingAverage,
  isValidPeriod,
  MA_NAMES,
  MA_PRESETS,
  maId,
  maLabel,
  MAX_MA_PERIOD,
  MAX_MOVING_AVERAGES,
  MIN_MA_PERIOD,
  type MovingAverage,
  type MovingAverageKind,
} from "@/lib/movingAverages";

interface Props {
  averages: MovingAverage[];
  onChange: (averages: MovingAverage[]) => void;
  /** Candles disponíveis para as médias, incluindo o aquecimento (null enquanto carrega). */
  barCount: number | null;
  colors: string[];
}

const chip = "flex items-center rounded-full border text-xs font-medium";

/** Barra das médias móveis: atalhos, média personalizada e os chips das médias ativas. */
export function MovingAverageBar({ averages, onChange, barCount, colors }: Props) {
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
