import { fastK, OVERBOUGHT, OVERSOLD, stochastic, stochasticCrosses } from "../stochastic";
import { noise, plotter } from "./ma-diagrams";
import type { Diagram, DiagramPoint, Pt } from "./types";

/**
 * Diagramas da aula do estocástico, calculados com as mesmas funções do gráfico (fastK e
 * stochastic) sobre séries de preço sintéticas, com máxima e mínima em volta do fechamento.
 */

const PERIOD = 14;
const candles = (closes: number[], spread: number) => closes.map((close) => ({ close, high: close + spread, low: close - spread }));
const x = (i: number, n: number) => +(10 + (180 * i) / (n - 1)).toFixed(1);
/** Estocástico na área principal: 0 embaixo (y = 88), 100 em cima (y = 12). */
const mainY = (v: number) => +(88 - v * 0.76).toFixed(1);
/** Estocástico no painel inferior: 0 em y = 118, 100 em y = 98. */
const subY = (v: number) => +(118 - v * 0.2).toFixed(1);
const toPath = (values: (number | null)[], y: (v: number) => number): Pt[] =>
  values.flatMap((v, i) => (v === null ? [] : [[x(i, values.length), y(v)] as Pt]));

/** Linha de nível; o rótulo fica no começo, onde o estocástico ainda não existe. */
const levelLine = (value: number, tone: "resistance" | "support" | "muted", label: string, y = mainY) => ({
  from: [10, y(value)] as Pt,
  to: [190, y(value)] as Pt,
  tone,
  dashed: true,
  label,
  labelAt: "start" as const,
});

// ─── Zonas e cruzamentos do %K com o %D ────────────────────────────────────────

function crossesDiagram(): Diagram {
  const closes = Array.from({ length: 90 }, (_, i) => 100 + 8 * Math.sin((i * 2 * Math.PI) / 32) + noise(i, 0.6));
  const lines = stochastic(candles(closes, 0.8), PERIOD);
  const n = closes.length;
  const signals = stochasticCrosses(lines).filter((c) => c.signal);
  const buy = signals.find((c) => c.signal === "buy");
  const sell = signals.find((c) => c.signal === "sell");
  const point = (index: number, label: string, placement: DiagramPoint["placement"]): DiagramPoint => ({
    at: [x(index, n), mainY(lines.k[index]!)],
    label,
    placement,
  });
  const price = plotter([closes], 99, 117);
  return {
    path: toPath(lines.k, mainY),
    curves: [{ path: toPath(lines.d, mainY), tone: "resistance", dashed: true, label: "%D" }],
    lines: [levelLine(OVERBOUGHT, "resistance", "80 sobrecompra"), levelLine(50, "muted", "50"), levelLine(OVERSOLD, "support", "20 sobrevenda")],
    points: [...(sell ? [point(sell.index, "venda", "above")] : []), ...(buy ? [point(buy.index, "compra", "below")] : [])],
    sub: { path: price.path(closes), label: "preço" },
  };
}

// ─── Rápido e lento ────────────────────────────────────────────────────────────

function fastSlowDiagram(): Diagram {
  // Oscilação pequena e muito ruído: o rápido salta a cada candle, o lento mostra o ciclo.
  const closes = Array.from({ length: 70 }, (_, i) => 100 + 3 * Math.sin((i * 2 * Math.PI) / 28) + noise(i, 2.2));
  const bars = candles(closes, 0.8);
  const fast = fastK(bars, PERIOD);
  const slow = stochastic(bars, PERIOD).k;
  return {
    curves: [
      { path: toPath(fast, mainY), tone: "muted" },
      { path: toPath(slow, mainY), tone: "primary" },
    ],
    lines: [levelLine(OVERBOUGHT, "muted", "80"), levelLine(OVERSOLD, "muted", "20")],
    // Legenda no topo: os rótulos no fim das curvas se sobrepunham.
    notes: [
      { at: [190, 6], text: "%K rápido", tone: "muted", anchor: "end" },
      { at: [140, 6], text: "%K lento", tone: "primary", anchor: "end" },
    ],
  };
}

// ─── Divergência de baixa com o %D acima de 80 ─────────────────────────────────

function divergenceDiagram(): Diagram {
  // Alta forte até o topo 1, recuo e alta lenta até um topo 2 mais alto: o %D fica mais baixo.
  const closes = Array.from({ length: 80 }, (_, i) => {
    const trend = i <= 22 ? 100 + i * 1.1 : i <= 32 ? 124.2 - (i - 22) * 1 : i <= 58 ? 114.2 + (i - 32) * 0.5 : 127.2 - (i - 58) * 1.1;
    return trend + noise(i, 1.6);
  });
  const { d } = stochastic(candles(closes, 1), PERIOD);
  const peak = (values: (number | null)[], from: number, to: number) =>
    values.slice(from, to).reduce<number>((best, v, k) => ((v ?? -Infinity) > (values[from + best] ?? -Infinity) ? k : best), 0) + from;
  const p1 = peak(closes, 15, 30);
  const p2 = peak(closes, 45, 65);
  const d1 = peak(d, p1 - 4, p1 + 5);
  const d2 = peak(d, p2 - 4, p2 + 5);
  const p = plotter([closes]);
  const n = closes.length;
  return {
    path: p.path(closes),
    lines: [{ from: p.at(closes, p1), to: p.at(closes, p2), tone: "resistance", dashed: true, label: "topo mais alto", labelAt: "start" }],
    points: [{ at: p.at(closes, p2), label: "Divergência", placement: "above" }],
    sub: {
      path: toPath(d, subY),
      label: "%D",
      lines: [
        levelLine(OVERBOUGHT, "muted", "", subY),
        { from: [x(d1, n), subY(d[d1]!)], to: [x(d2, n), subY(d[d2]!)], tone: "resistance", dashed: true, label: "%D mais baixo", labelAt: "start" },
      ],
    },
  };
}

export const STOCHASTIC_DIAGRAMS = {
  crosses: crossesDiagram(),
  fastSlow: fastSlowDiagram(),
  divergence: divergenceDiagram(),
};
