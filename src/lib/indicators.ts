import { isSwing } from "./drawings/geometry";
import type { Bar } from "./drawings/types";

/**
 * On Balance Volume (Granville): soma o volume dos dias de alta e subtrai o dos dias de
 * baixa. A direção da linha mostra se o fluxo acompanha o preço.
 */
export function computeOBV(bars: Pick<Bar, "close" | "volume">[]): number[] {
  const obv: number[] = [];
  bars.forEach((bar, i) => {
    if (i === 0) {
      obv.push(0);
      return;
    }
    const prev = obv[i - 1];
    const change = bar.close - bars[i - 1].close;
    obv.push(change > 0 ? prev + bar.volume : change < 0 ? prev - bar.volume : prev);
  });
  return obv;
}

export type DivergenceKind = "bearish" | "bullish";

export interface Divergence {
  kind: DivergenceKind;
  /** Índices das barras do topo/fundo anterior e do novo. */
  from: number;
  to: number;
  priceFrom: number;
  priceTo: number;
  /** Extremo do OBV em torno de cada topo/fundo (ver OBV_SWING_TOLERANCE). */
  obvFrom: number;
  obvTo: number;
}

function obvExtreme(obv: number[], center: number, kind: "high" | "low"): number {
  const around = obv.slice(Math.max(0, center - OBV_SWING_TOLERANCE), center + OBV_SWING_TOLERANCE + 1);
  return kind === "high" ? Math.max(...around) : Math.min(...around);
}

/** Barras de cada lado para confirmar um topo/fundo. Mais largo que nos desenhos para filtrar ruído. */
export const DIVERGENCE_SWING_WINDOW = 5;
/**
 * O OBV costuma marcar o topo/fundo um ou dois candles antes ou depois do preço. Comparar só
 * no candle exato acusaria divergência onde o OBV de fato confirmou, então usamos o extremo
 * do OBV nesta janela em torno de cada topo/fundo.
 */
export const OBV_SWING_TOLERANCE = 2;
/** Divergência cujo novo topo/fundo está entre as últimas N barras gera alerta. */
export const RECENT_DIVERGENCE_BARS = 15;

/**
 * Compara topos (e fundos) consecutivos do preço com o OBV nos mesmos pontos:
 * - baixista: preço faz topo mais alto, OBV faz topo mais baixo (alta sem fluxo);
 * - altista: preço faz fundo mais baixo, OBV faz fundo mais alto (queda sem fluxo).
 * O OBV é comparado pelo seu extremo perto de cada topo/fundo (±OBV_SWING_TOLERANCE barras).
 * Um topo/fundo só é confirmado `window` barras depois, então o sinal tem esse atraso.
 */
export function findDivergences(bars: Bar[], obv: number[], window = DIVERGENCE_SWING_WINDOW): Divergence[] {
  const highs: number[] = [];
  const lows: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (isSwing(bars, i, "high", window)) highs.push(i);
    if (isSwing(bars, i, "low", window)) lows.push(i);
  }

  const result: Divergence[] = [];
  for (let k = 1; k < highs.length; k++) {
    const [a, b] = [highs[k - 1], highs[k]];
    const [obvA, obvB] = [obvExtreme(obv, a, "high"), obvExtreme(obv, b, "high")];
    if (bars[b].high > bars[a].high && obvB < obvA) {
      result.push({ kind: "bearish", from: a, to: b, priceFrom: bars[a].high, priceTo: bars[b].high, obvFrom: obvA, obvTo: obvB });
    }
  }
  for (let k = 1; k < lows.length; k++) {
    const [a, b] = [lows[k - 1], lows[k]];
    const [obvA, obvB] = [obvExtreme(obv, a, "low"), obvExtreme(obv, b, "low")];
    if (bars[b].low < bars[a].low && obvB > obvA) {
      result.push({ kind: "bullish", from: a, to: b, priceFrom: bars[a].low, priceTo: bars[b].low, obvFrom: obvA, obvTo: obvB });
    }
  }
  return result.sort((x, y) => x.to - y.to);
}

export function isRecent(divergence: Divergence, barCount: number, recentBars = RECENT_DIVERGENCE_BARS): boolean {
  return divergence.to >= barCount - 1 - recentBars;
}
