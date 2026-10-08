import { macd, macdCrosses } from "../macd";
import { noise, plotter } from "./ma-diagrams";
import type { Diagram, DiagramLine, DiagramPoint } from "./types";

/**
 * Diagramas da aula do MACD, calculados com a mesma função do gráfico (macd) sobre séries de
 * preço sintéticas.
 */

const bars = (closes: number[]) => closes.map((close) => ({ close }));
const x = (i: number, n: number) => +(10 + (180 * i) / (n - 1)).toFixed(1);

/** Legenda no topo: os rótulos no fim das curvas se sobrepunham. */
const LEGEND: Diagram["notes"] = [
  { at: [190, 8], text: "sinal", tone: "target", anchor: "end" },
  { at: [160, 8], text: "MACD", tone: "primary", anchor: "end" },
];

/** Ciclos de alta e baixa com uma leve tendência: o MACD cruza o sinal várias vezes. */
const cycles = Array.from({ length: 110 }, (_, i) => 100 + 8 * Math.sin((i * 2 * Math.PI) / 40) + i * 0.05 + noise(i, 0.5));

// ─── Linhas e cruzamentos ──────────────────────────────────────────────────────

function linesDiagram(): Diagram {
  const lines = macd(bars(cycles));
  const p = plotter([lines.macd, lines.signal], 16, 86);
  const n = cycles.length;
  // Pula o começo, onde ficam os rótulos e as linhas ainda estão se formando.
  const crosses = macdCrosses(lines).filter((c) => c.index > n * 0.35);
  const buy = crosses.find((c) => c.dir === "up");
  const sell = crosses.find((c) => c.dir === "down");
  const point = (index: number, label: string, placement: DiagramPoint["placement"]): DiagramPoint => ({
    at: p.at(lines.macd, index),
    label,
    placement,
  });
  const price = plotter([cycles], 99, 117);
  return {
    curves: [
      { path: p.path(lines.macd), tone: "primary" },
      { path: p.path(lines.signal), tone: "target", dashed: true },
    ],
    notes: LEGEND,
    lines: [{ from: [10, p.y(0)], to: [190, p.y(0)], tone: "muted", dashed: true, label: "zero", labelAt: "start" }],
    points: [...(buy ? [point(buy.index, "compra", "below")] : []), ...(sell ? [point(sell.index, "venda", "above")] : [])],
    sub: { path: price.path(cycles), label: "preço" },
  };
}

// ─── O histograma vira antes do cruzamento ─────────────────────────────────────

function histogramDiagram(): Diagram {
  const lines = macd(bars(cycles));
  const p = plotter([lines.macd, lines.signal], 16, 86);
  const n = cycles.length;
  const crosses = macdCrosses(lines);
  // Uma alta completa: do cruzamento para cima até o cruzamento para baixo seguinte.
  const up = crosses.find((c) => c.dir === "up" && c.index > n * 0.35);
  const down = up && crosses.find((c) => c.dir === "down" && c.index > up.index);
  const hist = lines.histogram;
  const max = Math.max(...hist.map((v) => Math.abs(v ?? 0)));
  const zero = 108;
  const hy = (v: number) => +(zero - (v / max) * 9).toFixed(1);
  const bars_: DiagramLine[] = hist.flatMap((v, i): DiagramLine[] =>
    v === null ? [] : [{ from: [x(i, n), zero], to: [x(i, n), hy(v)], tone: v >= 0 ? "support" : "resistance" }],
  );
  const points: DiagramPoint[] = [];
  if (up && down) {
    const peak = hist.slice(up.index, down.index).reduce<number>((best, v, k) => ((v ?? 0) > (hist[up.index + best] ?? 0) ? k : best), 0) + up.index;
    points.push(
      { at: [x(peak, n), hy(hist[peak]!)], label: "histograma vira", placement: "above" },
      { at: p.at(lines.macd, down.index), label: "cruzamento", placement: "above" },
    );
  }
  return {
    curves: [
      { path: p.path(lines.macd), tone: "primary" },
      { path: p.path(lines.signal), tone: "target", dashed: true },
    ],
    notes: LEGEND,
    points,
    sub: { path: [[10, zero], [190, zero]], label: "histograma", lines: bars_ },
  };
}

// ─── Divergência de baixa ──────────────────────────────────────────────────────

function divergenceDiagram(): Diagram {
  // Alta forte até o topo 1, recuo e alta lenta até um topo 2 mais alto: o MACD fica mais baixo.
  const closes = Array.from({ length: 90 }, (_, i) => {
    const trend = i <= 30 ? 100 + i * 1 : i <= 40 ? 130 - (i - 30) * 0.8 : i <= 70 ? 122 + (i - 40) * 0.35 : 132.5 - (i - 70) * 1.1;
    return trend + noise(i, 0.6);
  });
  const lines = macd(bars(closes));
  const peak = (values: (number | null)[], from: number, to: number) =>
    values.slice(from, to).reduce<number>((best, v, k) => ((v ?? -Infinity) > (values[from + best] ?? -Infinity) ? k : best), 0) + from;
  const p1 = peak(closes, 22, 38);
  const p2 = peak(closes, 55, 75);
  const m1 = peak(lines.macd, p1 - 6, p1 + 3);
  const m2 = peak(lines.macd, p2 - 6, p2 + 3);
  const p = plotter([closes]);
  const n = closes.length;
  const sub = plotter([lines.macd], 99, 117);
  return {
    path: p.path(closes),
    lines: [{ from: p.at(closes, p1), to: p.at(closes, p2), tone: "resistance", dashed: true, label: "topo mais alto", labelAt: "start" }],
    points: [{ at: p.at(closes, p2), label: "Divergência", placement: "above" }],
    sub: {
      path: sub.path(lines.macd),
      label: "MACD",
      lines: [
        { from: [x(m1, n), sub.y(lines.macd[m1]!)], to: [x(m2, n), sub.y(lines.macd[m2]!)], tone: "resistance", dashed: true, label: "MACD mais baixo", labelAt: "start" },
      ],
    },
  };
}

export const MACD_DIAGRAMS = {
  lines: linesDiagram(),
  histogram: histogramDiagram(),
  divergence: divergenceDiagram(),
};
