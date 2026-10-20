import type { Bar } from "./drawings/types";
import { zeroCrossings, type ZeroCross } from "./momentum";

/**
 * Taxa de variação (ROC, rate of change; Murphy, cap. 10): a versão em proporção da linha de
 * momentum. Aqui em %: (fechamento ÷ fechamento de N períodos atrás − 1) × 100, oscilando em torno
 * de zero (na escala de Murphy, em torno de 100). Cálculos puros, a partir dos fechamentos.
 */

export const ROC_PERIODS = [10, 20, 40] as const;
export type RocPeriod = (typeof ROC_PERIODS)[number];

/** Candles comparados para dizer se o ROC está num extremo. */
const LOOKBACK = 120;
/** Fração do maior valor absoluto do período a partir da qual o ROC é extremo. */
const EXTREME_RATIO = 0.8;

type Values = (number | null)[];

/** ROC alinhado aos candles; os fechamentos de `warmup` adiantam o início da linha. */
export function roc(bars: Pick<Bar, "close">[], period: number, warmup: number[] = []): Values {
  const closes = [...warmup, ...bars.map((b) => b.close)];
  return closes.map((close, i) => (i >= period && closes[i - period] !== 0 ? (close / closes[i - period] - 1) * 100 : null)).slice(warmup.length);
}

export interface RocReading {
  value: number;
  /** Perto do maior valor (positivo ou negativo) dos últimos candles. */
  extreme: "high" | "low" | null;
  lastCross: ZeroCross | null;
}

/** Leitura do último candle; null sem ROC. */
export function readRoc(values: Values): RocReading | null {
  const value = values[values.length - 1];
  if (value === null || value === undefined) return null;
  const recent = values.slice(-LOOKBACK).filter((v): v is number => v !== null);
  const top = Math.max(...recent);
  const bottom = Math.min(...recent);
  return {
    value,
    extreme: value > 0 && value >= top * EXTREME_RATIO ? "high" : value < 0 && value <= bottom * EXTREME_RATIO ? "low" : null,
    lastCross: zeroCrossings(values).at(-1) ?? null,
  };
}

const STORAGE_KEY = "risktrade:roc:v1";

/** Período do ROC (vale para todos os ativos); null = desligado. Storage bloqueado: desligado. */
export function loadRocPeriod(): RocPeriod | null {
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    return (ROC_PERIODS as readonly number[]).includes(saved) ? (saved as RocPeriod) : null;
  } catch {
    return null;
  }
}

export function saveRocPeriod(period: RocPeriod | null): void {
  try {
    if (period) localStorage.setItem(STORAGE_KEY, String(period));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage bloqueado: a escolha vale só nesta sessão.
  }
}
