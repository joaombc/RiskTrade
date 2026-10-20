import type { Bar } from "./drawings/types";
import { zoneExits, type RsiSignal } from "./rsi";

/**
 * CCI (Commodity Channel Index) de Donald Lambert: quanto o preço típico se afasta da sua média,
 * em unidades do desvio médio. (preço típico − média) ÷ (0,015 × desvio médio), com preço típico =
 * (máxima + mínima + fechamento) ÷ 3. Cerca de 70 a 80% dos valores ficam entre −100 e +100.
 * Cálculos puros.
 */

export const CCI_PERIOD = 20;
export const CCI_OVERBOUGHT = 100;
export const CCI_OVERSOLD = -100;
const LAMBERT = 0.015;

type Values = (number | null)[];

/** CCI alinhado aos candles (null nos primeiros `period − 1`). */
export function cci(bars: Pick<Bar, "high" | "low" | "close">[], period = CCI_PERIOD): Values {
  const typical = bars.map((b) => (b.high + b.low + b.close) / 3);
  return typical.map((tp, i) => {
    if (i < period - 1) return null;
    const window = typical.slice(i - period + 1, i + 1);
    const mean = window.reduce((a, b) => a + b, 0) / period;
    const deviation = window.reduce((a, b) => a + Math.abs(b - mean), 0) / period;
    return deviation === 0 ? 0 : (tp - mean) / (LAMBERT * deviation);
  });
}

/** Saídas das zonas: venda ao voltar abaixo de +100, compra ao voltar acima de −100. */
export const cciExits = (values: Values): RsiSignal[] => zoneExits(values, CCI_OVERBOUGHT, CCI_OVERSOLD);

export interface CciReading {
  value: number;
  zone: "overbought" | "oversold" | "neutral";
  lastExit: RsiSignal | null;
}

/** Leitura do último candle; null sem CCI. */
export function readCci(values: Values): CciReading | null {
  const value = values[values.length - 1];
  if (value === null || value === undefined) return null;
  return {
    value,
    zone: value >= CCI_OVERBOUGHT ? "overbought" : value <= CCI_OVERSOLD ? "oversold" : "neutral",
    lastExit: cciExits(values).at(-1) ?? null,
  };
}

const STORAGE_KEY = "risktrade:cci:v1";

/** CCI ligado no gráfico (vale para todos os ativos). Storage bloqueado: desligado. */
export function loadCciEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveCciEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage bloqueado: a escolha vale só nesta sessão.
  }
}
