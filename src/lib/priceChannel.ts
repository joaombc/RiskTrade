/**
 * Canal de preço e a regra das 4 semanas de Richard Donchian (Murphy, cap. 9). Quatro semanas
 * equivalem a cerca de 20 pregões, como no canal de 20 dias dos gráficos.
 */

type Values = (number | null)[];

/** Pregões da regra das 4 semanas. */
export const FOUR_WEEKS = 20;

/**
 * Máxima e mínima dos `period` candles anteriores. O candle atual não entra: é com ele que o
 * preço rompe (ou não) o canal. Null enquanto não há candles suficientes.
 */
export function priceChannel(bars: { high: number; low: number }[], period: number): { upper: Values; lower: Values } {
  const upper: Values = [];
  const lower: Values = [];
  bars.forEach((_, i) => {
    if (i < period) {
      upper.push(null);
      lower.push(null);
      return;
    }
    const window = bars.slice(i - period, i);
    upper.push(Math.max(...window.map((b) => b.high)));
    lower.push(Math.min(...window.map((b) => b.low)));
  });
  return { upper, lower };
}

/** buy/sell abrem posição (na versão contínua, também invertem a anterior); exit zera a posição. */
export type ChannelSignalKind = "buy" | "sell" | "exit";

export interface ChannelSignal {
  index: number;
  kind: ChannelSignalKind;
}

/**
 * A regra das 4 semanas pelo fechamento: entra comprado quando o fechamento passa a máxima do
 * canal de entrada e vendido quando perde a mínima. Com `exitPeriod` igual a `entryPeriod`, é a
 * versão contínua (sempre posicionada: o sinal contrário inverte a posição). Com um canal de
 * saída mais curto (1 ou 2 semanas), é a não contínua: a posição é zerada no rompimento contrário
 * do canal curto, e o sistema fica de fora até o próximo rompimento do canal de entrada.
 */
export function channelSystem(
  bars: { high: number; low: number; close: number }[],
  entryPeriod = FOUR_WEEKS,
  exitPeriod = entryPeriod,
): ChannelSignal[] {
  const entry = priceChannel(bars, entryPeriod);
  const exit = priceChannel(bars, exitPeriod);
  const continuous = exitPeriod >= entryPeriod;
  const signals: ChannelSignal[] = [];
  let position: -1 | 0 | 1 = 0;

  bars.forEach(({ close }, i) => {
    const [up, down, exitUp, exitDown] = [entry.upper[i], entry.lower[i], exit.upper[i], exit.lower[i]];
    if (up === null || down === null) return;
    if (position === 1) {
      if (continuous && close < down) {
        signals.push({ index: i, kind: "sell" });
        position = -1;
      } else if (!continuous && exitDown !== null && close < exitDown) {
        signals.push({ index: i, kind: "exit" });
        position = 0;
      }
      return;
    }
    if (position === -1) {
      if (continuous && close > up) {
        signals.push({ index: i, kind: "buy" });
        position = 1;
      } else if (!continuous && exitUp !== null && close > exitUp) {
        signals.push({ index: i, kind: "exit" });
        position = 0;
      }
      return;
    }
    if (close > up) {
      signals.push({ index: i, kind: "buy" });
      position = 1;
    } else if (close < down) {
      signals.push({ index: i, kind: "sell" });
      position = -1;
    }
  });
  return signals;
}
