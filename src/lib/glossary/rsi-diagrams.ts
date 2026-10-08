import { OVERBOUGHT, OVERSOLD, rsi, zoneExits } from "../rsi";
import { noise, plotter } from "./ma-diagrams";
import type { Diagram, DiagramPoint, Pt } from "./types";

/**
 * Diagramas da aula do IFR. Zonas e divergência são calculadas com a mesma função do gráfico
 * (rsi) sobre séries de preço sintéticas; o failure swing é um esquema, para mostrar A, B e C.
 */

const PERIOD = 14;
const bars = (closes: number[]) => closes.map((close) => ({ close }));
const x = (i: number, n: number) => +(10 + (180 * i) / (n - 1)).toFixed(1);
/** IFR na área principal do diagrama: 0 embaixo (y = 88), 100 em cima (y = 12). */
const mainY = (v: number) => +(88 - v * 0.76).toFixed(1);
/** IFR no painel inferior: 0 em y = 118, 100 em y = 98. */
const subY = (v: number) => +(118 - v * 0.2).toFixed(1);

/** Linha de nível; o rótulo fica no começo, onde o IFR ainda não existe (primeiros 14 candles). */
const levelLine = (value: number, tone: "resistance" | "support" | "muted", label: string, y = mainY) => ({
  from: [10, y(value)] as Pt,
  to: [190, y(value)] as Pt,
  tone,
  dashed: true,
  label,
  labelAt: "start" as const,
});

// ─── Zonas de sobrecompra e sobrevenda ─────────────────────────────────────────

function zonesDiagram(): Diagram {
  // Oscilações largas: o IFR passa de 70 nos topos e de 30 nos fundos.
  const closes = Array.from({ length: 90 }, (_, i) => 100 + 9 * Math.sin((i * 2 * Math.PI) / 34) + noise(i, 0.5));
  const values = rsi(bars(closes), PERIOD);
  const n = values.length;
  const path = values.flatMap((v, i): Pt[] => (v === null ? [] : [[x(i, n), mainY(v)]]));
  const exits = zoneExits(values);
  const sell = exits.find((s) => s.kind === "sell");
  const buy = exits.find((s) => s.kind === "buy");
  const points: DiagramPoint[] = [
    ...(sell ? [{ at: [x(sell.index, n), mainY(values[sell.index]!)] as Pt, label: "venda", placement: "above" as const }] : []),
    ...(buy ? [{ at: [x(buy.index, n), mainY(values[buy.index]!)] as Pt, label: "compra", placement: "below" as const }] : []),
  ];
  const price = plotter([closes], 99, 117);
  return {
    path,
    lines: [
      levelLine(OVERBOUGHT, "resistance", "70 sobrecompra"),
      levelLine(50, "muted", "50"),
      levelLine(OVERSOLD, "support", "30 sobrevenda"),
    ],
    points,
    sub: { path: price.path(closes), label: "preço" },
  };
}

// ─── Failure swing de topo (esquema) ───────────────────────────────────────────

function failureTopDiagram(): Diagram {
  const swing: [number, number][] = [
    [0, 52], [3, 64], [6, 78], [9, 66], [11, 61], [14, 69], [16, 72], [19, 63], [21, 57], [24, 50], [28, 44],
  ];
  const n = 29;
  const at = (i: number, v: number): Pt => [x(i, n), mainY(v)];
  return {
    path: swing.map(([i, v]) => at(i, v)),
    lines: [
      levelLine(OVERBOUGHT, "resistance", "70"),
      { from: at(11, 61), to: at(28, 61), tone: "support", dashed: true, label: "fundo B" },
    ],
    points: [
      { at: at(6, 78), label: "A", placement: "above" },
      { at: at(11, 61), label: "B", placement: "below" },
      { at: at(16, 72), label: "C", placement: "above" },
      { at: at(20.3, 61), label: "venda", placement: "right" },
    ],
    notes: [{ at: [190, 22], text: "C não supera A", tone: "resistance", anchor: "end" }],
  };
}

// ─── Divergência de baixa ──────────────────────────────────────────────────────

function divergenceDiagram(): Diagram {
  // Alta forte até o topo 1, recuo e alta lenta até um topo 2 mais alto: o IFR fica mais baixo.
  const closes = Array.from({ length: 80 }, (_, i) => {
    const trend = i <= 22 ? 100 + i * 1.1 : i <= 32 ? 124.2 - (i - 22) * 1 : i <= 58 ? 114.2 + (i - 32) * 0.5 : 127.2 - (i - 58) * 1.1;
    return trend + noise(i, 1.6);
  });
  const values = rsi(bars(closes), PERIOD);
  const peak = (from: number, to: number) => closes.slice(from, to).reduce((best, v, k) => (v > closes[from + best] ? k : best), 0) + from;
  const p1 = peak(15, 30);
  const p2 = peak(45, 65);
  const p = plotter([closes]);
  const n = closes.length;
  const sub = values.flatMap((v, i): Pt[] => (v === null ? [] : [[x(i, n), subY(v)]]));
  return {
    path: p.path(closes),
    lines: [{ from: p.at(closes, p1), to: p.at(closes, p2), tone: "resistance", dashed: true, label: "topo mais alto", labelAt: "start" }],
    points: [{ at: p.at(closes, p2), label: "Divergência", placement: "above" }],
    sub: {
      path: sub,
      label: "IFR 14",
      lines: [
        levelLine(OVERBOUGHT, "muted", "", subY),
        { from: [x(p1, n), subY(values[p1]!)], to: [x(p2, n), subY(values[p2]!)], tone: "resistance", dashed: true, label: "IFR mais baixo", labelAt: "start" },
      ],
    },
  };
}

export const RSI_DIAGRAMS = {
  zones: zonesDiagram(),
  failureTop: failureTopDiagram(),
  divergence: divergenceDiagram(),
};
