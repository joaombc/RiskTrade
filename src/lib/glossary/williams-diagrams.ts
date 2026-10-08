import { OVERBOUGHT, OVERSOLD, williamsExits, williamsR } from "../williamsR";
import { noise, plotter } from "./ma-diagrams";
import type { Diagram, DiagramCandle, DiagramPoint, Pt } from "./types";

/**
 * Diagramas da aula do %R de Williams, calculados com a mesma função do gráfico (williamsR) sobre
 * séries de preço sintéticas.
 */

const PERIOD = 10;
const candles = (closes: number[], spread: number) => closes.map((close) => ({ close, high: close + spread, low: close - spread }));
const x = (i: number, n: number) => +(10 + (180 * i) / (n - 1)).toFixed(1);
/** %R na área principal: 0 em cima (y = 12), −100 embaixo (y = 88). */
const mainY = (v: number) => +(12 - v * 0.76).toFixed(1);
/** %R no painel inferior: 0 em y = 98, −100 em y = 118. */
const subY = (v: number) => +(98 - v * 0.2).toFixed(1);
const toPath = (values: (number | null)[], y: (v: number) => number): Pt[] =>
  values.flatMap((v, i) => (v === null ? [] : [[x(i, values.length), y(v)] as Pt]));

/** Linha de nível; o rótulo fica no começo, onde o %R ainda não existe. */
const levelLine = (value: number, tone: "resistance" | "support" | "muted", label: string, y = mainY) => ({
  from: [10, y(value)] as Pt,
  to: [190, y(value)] as Pt,
  tone,
  dashed: true,
  label,
  labelAt: "start" as const,
});

// ─── Onde o fechamento cai na faixa ────────────────────────────────────────────

function rangeDiagram(): Diagram {
  // Dez candles [abertura, máxima, mínima, fechamento]: o último fecha perto da máxima da faixa.
  const rows: [number, number, number, number][] = [
    [50, 53, 47, 52], [52, 55, 50, 51], [51, 52, 45, 46], [46, 48, 42, 44], [44, 49, 43, 48],
    [48, 54, 47, 53], [53, 58, 52, 57], [57, 60, 54, 55], [55, 57, 51, 53], [53, 59, 52, 58],
  ];
  const high = Math.max(...rows.map((r) => r[1]));
  const low = Math.min(...rows.map((r) => r[2]));
  const py = (price: number) => +(86 - ((price - low) / (high - low)) * 68).toFixed(1);
  const bars = rows.map(([, h, l, c]) => ({ high: h, low: l, close: c }));
  const r = williamsR(bars, PERIOD).at(-1)!;
  const n = rows.length;
  const lastX = 10 + (180 / n) * (n - 0.5);
  const diagramCandles: DiagramCandle[] = rows.map(([o, h, l, c]) => ({ o: py(o), h: py(h), l: py(l), c: py(c) }));
  return {
    candles: diagramCandles,
    lines: [
      { from: [10, py(high)], to: [190, py(high)], tone: "resistance", dashed: true, label: "máxima de 10", labelAt: "start" },
      { from: [10, py(low)], to: [190, py(low)], tone: "support", dashed: true, label: "mínima de 10", labelAt: "start" },
      // A distância até a máxima, que o %R mede (a fórmula vai na nota de baixo).
      { from: [lastX + 6, py(high)], to: [lastX + 6, py(rows[n - 1][3])], tone: "target" },
    ],
    points: [{ at: [lastX, py(rows[n - 1][3])], label: "fechamento", placement: "left" }],
    notes: [
      { at: [100, 96], text: "%R = −100 × (máx. − fech.) ÷ (máx. − mín.)", tone: "target" },
      // Valor calculado pela mesma função do gráfico (com sinal de menos tipográfico).
      { at: [190, 80], text: `%R = ${Math.round(r).toString().replace("-", "−")}`, tone: "target", anchor: "end" },
    ],
  };
}

// ─── Zonas e saídas ────────────────────────────────────────────────────────────

function zonesDiagram(): Diagram {
  const closes = Array.from({ length: 90 }, (_, i) => 100 + 7 * Math.sin((i * 2 * Math.PI) / 30) + noise(i, 0.8));
  const values = williamsR(candles(closes, 0.8), PERIOD);
  const n = closes.length;
  // Pula o começo, onde ficam os rótulos das linhas de nível.
  const exits = williamsExits(values).filter((e) => e.index > n * 0.3);
  const sell = exits.find((s) => s.kind === "sell");
  const buy = exits.find((s) => s.kind === "buy");
  const point = (index: number, label: string, placement: DiagramPoint["placement"]): DiagramPoint => ({
    at: [x(index, n), mainY(values[index]!)],
    label,
    placement,
  });
  const price = plotter([closes], 99, 117);
  return {
    path: toPath(values, mainY),
    lines: [levelLine(OVERBOUGHT, "resistance", "−20 sobrecompra"), levelLine(-50, "muted", "−50"), levelLine(OVERSOLD, "support", "−80 sobrevenda")],
    points: [...(sell ? [point(sell.index, "venda", "above")] : []), ...(buy ? [point(buy.index, "compra", "below")] : [])],
    sub: { path: price.path(closes), label: "preço" },
  };
}

// ─── Divergência de baixa ──────────────────────────────────────────────────────

function divergenceDiagram(): Diagram {
  // Alta forte até o topo 1, recuo raso e alta lenta até um topo 2 mais alto: o %R não chega a −20.
  const closes = Array.from({ length: 80 }, (_, i) => {
    const trend = i <= 22 ? 100 + i * 1.1 : i <= 32 ? 124.2 - (i - 22) * 0.5 : i <= 58 ? 119.2 + (i - 32) * 0.3 : 127 - (i - 58) * 1.1;
    return trend + noise(i, 1.2);
  });
  const values = williamsR(candles(closes, 1), PERIOD);
  // Média de 3 candles do %R em volta de cada topo: o %R oscila muito para comparar um candle só.
  const smoothAt = (i: number) => (values[i - 1]! + values[i]! + values[i + 1]!) / 3;
  const peak = (from: number, to: number) => closes.slice(from, to).reduce((best, v, k) => (v > closes[from + best] ? k : best), 0) + from;
  const p1 = peak(15, 30);
  const p2 = peak(45, 65);
  const p = plotter([closes]);
  const n = closes.length;
  return {
    path: p.path(closes),
    lines: [{ from: p.at(closes, p1), to: p.at(closes, p2), tone: "resistance", dashed: true, label: "topo mais alto", labelAt: "start" }],
    points: [{ at: p.at(closes, p2), label: "Divergência", placement: "above" }],
    sub: {
      path: toPath(values, subY),
      label: "%R 10",
      lines: [
        levelLine(OVERBOUGHT, "muted", "", subY),
        { from: [x(p1, n), subY(smoothAt(p1))], to: [x(p2, n), subY(smoothAt(p2))], tone: "resistance", dashed: true, label: "%R mais baixo", labelAt: "start" },
      ],
    },
  };
}

export const WILLIAMS_DIAGRAMS = {
  range: rangeDiagram(),
  zones: zonesDiagram(),
  divergence: divergenceDiagram(),
};
