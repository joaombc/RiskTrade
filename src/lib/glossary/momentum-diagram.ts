import { noise, plotter } from "./ma-diagrams";
import type { Diagram, Pt } from "./types";

/**
 * Diagrama da linha de momentum (Murphy, cap. 10): uma alta que perde velocidade e vira. O
 * momentum de 10 períodos (fechamento menos o de 10 atrás) faz o pico e cruza a linha zero antes
 * do topo do preço.
 */

const PERIOD = 10;

// Alta em "S": começa devagar, acelera, desacelera até o topo (candle 55) e cai. O momentum faz o
// pico no meio da alta e cai enquanto o preço ainda sobe.
const TOP = 55;
const prices = Array.from({ length: 80 }, (_, i) => {
  const trend = i <= TOP ? 100 + 15 * (1 - Math.cos((Math.PI * i) / TOP)) : 130 - (i - TOP) * 0.8;
  return trend + noise(i, 0.4);
});
const values = prices.map((close, i) => (i >= PERIOD ? close - prices[i - PERIOD] : null));

/** Painel inferior do diagrama: y de 98 (alto) a 118 (baixo), com o zero no meio. */
const ZERO_Y = 108;
const subY = (v: number) => {
  const scale = Math.max(...values.map((v) => Math.abs(v ?? 0)));
  return +(ZERO_Y - (v / scale) * 9).toFixed(1);
};

function momentumDiagram(): Diagram {
  // Espaço no alto para a nota.
  const p = plotter([prices], 24);
  const sub: Pt[] = values.flatMap((v, i) => (v === null ? [] : [[p.x(i), subY(v)] as Pt]));
  const peak = values.reduce<number>((best, v, i) => ((v ?? -Infinity) > (values[best] ?? -Infinity) ? i : best), 0);
  const top = prices.reduce((best, v, i) => (v > prices[best] ? i : best), 0);
  const cross = values.findIndex((v, i) => i > peak && v !== null && v < 0);
  return {
    path: p.path(prices),
    points: [
      { at: p.at(prices, top), label: "topo do preço", placement: "above" },
      { at: [p.x(peak), subY(values[peak]!)], label: "pico do momentum", placement: "above" },
      ...(cross > 0 ? [{ at: [p.x(cross), ZERO_Y] as Pt, label: "venda", placement: "below" as const }] : []),
    ],
    notes: [{ at: [12, 14], text: "o momentum vira antes do preço", tone: "target", anchor: "start" }],
    sub: {
      path: sub,
      label: "Momentum 10",
      lines: [{ from: [10, ZERO_Y], to: [190, ZERO_Y], tone: "muted", dashed: true }],
    },
  };
}

export const MOMENTUM_DIAGRAM = momentumDiagram();
