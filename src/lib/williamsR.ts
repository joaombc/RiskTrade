import type { Bar } from "./drawings/types";
import { zoneExits, type RsiSignal } from "./rsi";
import { fastK } from "./stochastic";

/**
 * %R de Larry Williams (Murphy, cap. 10): onde o fechamento está em relação à máxima da faixa dos
 * últimos N períodos, numa escala invertida de 0 (fechamento na máxima) a −100 (na mínima).
 * É o %K rápido do estocástico deslocado: %R = %K rápido − 100.
 */

/** 10 é o período de Williams; 14 e 20 são variações comuns. */
export const WILLIAMS_PERIODS = [10, 14, 20] as const;
export type WilliamsPeriod = (typeof WILLIAMS_PERIODS)[number];

export const OVERBOUGHT = -20;
export const OVERSOLD = -80;

type Values = (number | null)[];

/** %R = −100 × (máxima de N − fechamento) ÷ (máxima de N − mínima de N); −50 se a faixa for nula. */
export function williamsR(bars: Pick<Bar, "high" | "low" | "close">[], period: number): Values {
  return fastK(bars, period).map((k) => (k === null ? null : k - 100));
}

/** Saídas das zonas: abaixo de −20 depois de estar acima (venda); acima de −80 depois de estar abaixo (compra). */
export const williamsExits = (values: Values): RsiSignal[] => zoneExits(values, OVERBOUGHT, OVERSOLD);

export interface WilliamsReading {
  value: number;
  zone: "overbought" | "oversold" | "upper" | "lower";
  lastExit: RsiSignal | null;
}

/** Leitura do último candle; null se ainda não há %R. */
export function readWilliams(values: Values): WilliamsReading | null {
  const value = values.at(-1);
  if (value === null || value === undefined) return null;
  const zone = value >= OVERBOUGHT ? "overbought" : value <= OVERSOLD ? "oversold" : value >= -50 ? "upper" : "lower";
  return { value, zone, lastExit: williamsExits(values).at(-1) ?? null };
}

const STORAGE_KEY = "risktrade:williams-r:v1";

/** Período do %R (vale para todos os ativos); null = desligado. Storage bloqueado: desligado. */
export function loadWilliamsPeriod(): WilliamsPeriod | null {
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    return (WILLIAMS_PERIODS as readonly number[]).includes(saved) ? (saved as WilliamsPeriod) : null;
  } catch {
    return null;
  }
}

export function saveWilliamsPeriod(period: WilliamsPeriod | null): void {
  try {
    if (period) localStorage.setItem(STORAGE_KEY, String(period));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage bloqueado: a escolha vale só nesta sessão.
  }
}
