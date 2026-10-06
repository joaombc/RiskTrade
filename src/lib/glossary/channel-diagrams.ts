import { channelSystem, FOUR_WEEKS, priceChannel } from "../priceChannel";
import { noise, plotter } from "./ma-diagrams";
import type { Diagram, DiagramPoint } from "./types";

/**
 * Diagramas da aula da regra das 4 semanas. Canais e sinais são calculados com as mesmas funções
 * testadas (priceChannel e channelSystem) sobre séries de preço sintéticas.
 */

const candles = (closes: number[], spread: number) => closes.map((close) => ({ close, high: close + spread, low: close - spread }));

const LABEL: Record<"buy" | "sell" | "exit", string> = { buy: "compra", sell: "venda", exit: "saída" };

// ─── Canal de 4 semanas e o rompimento ─────────────────────────────────────────

function breakoutDiagram(): Diagram {
  const closes = Array.from({ length: 70 }, (_, i) => (i < 38 ? 100 + 2.2 * Math.sin(i * 0.5) + noise(i, 0.8) : 101 + (i - 38) * 0.75 + noise(i, 1)));
  const bars = candles(closes, 0.6);
  const { upper, lower } = priceChannel(bars, FOUR_WEEKS);
  const p = plotter([closes, upper, lower]);
  const first = channelSystem(bars, FOUR_WEEKS)[0];
  const points: DiagramPoint[] = first ? [{ at: p.at(closes, first.index), label: LABEL[first.kind], placement: "below" }] : [];
  return {
    path: p.path(closes),
    curves: [
      { path: p.path(upper), tone: "resistance", dashed: true, label: "máx. 4 sem." },
      { path: p.path(lower), tone: "support", dashed: true, label: "mín. 4 sem.", labelPlacement: "below" },
    ],
    points,
  };
}

// ─── Versão não contínua: sai com o canal de 2 semanas ─────────────────────────

function nonContinuousDiagram(): Diagram {
  const closes = Array.from({ length: 75 }, (_, i) =>
    i < 25 ? 100 + 1.8 * Math.sin(i * 0.6) + noise(i, 0.6) : i < 52 ? 101 + (i - 25) * 0.9 + noise(i, 1) : 125 - (i - 52) * 0.8 + noise(i, 1),
  );
  const bars = candles(closes, 0.6);
  const four = priceChannel(bars, FOUR_WEEKS);
  const two = priceChannel(bars, FOUR_WEEKS / 2);
  const p = plotter([closes, four.upper, four.lower]);
  const signals = channelSystem(bars, FOUR_WEEKS, FOUR_WEEKS / 2).slice(0, 2);
  return {
    path: p.path(closes),
    curves: [
      { path: p.path(four.upper), tone: "resistance", dashed: true, label: "máx. 4 sem." },
      { path: p.path(four.lower), tone: "muted", dashed: true, label: "mín. 4 sem.", labelPlacement: "below" },
      { path: p.path(two.lower), tone: "support", label: "mín. 2 sem." },
    ],
    points: signals.map((s) => ({ at: p.at(closes, s.index), label: LABEL[s.kind], placement: s.kind === "buy" ? "below" : "above" })),
  };
}

// ─── Lateralidade: 4 semanas erra, 8 semanas filtra ────────────────────────────

/** Lateral com escapadas que passam o canal de 4 semanas, mas não o de 8 (o teste garante). */
export const FILTER_BARS = candles(
  Array.from({ length: 90 }, (_, i) => 100 + 3.5 * Math.sin(i * 0.19) + 1.6 * Math.sin(i * 0.9) + noise(i, 0.5)),
  0.4,
);

function filterDiagram(): Diagram {
  const bars = FILTER_BARS;
  const closes = bars.map((b) => b.close);
  const eight = priceChannel(bars, FOUR_WEEKS * 2);
  const p = plotter([closes, eight.upper, eight.lower], 22, 82);
  const false4 = channelSystem(bars, FOUR_WEEKS);
  return {
    path: p.path(closes),
    curves: [
      { path: p.path(eight.upper), tone: "resistance", label: "máx. 8 sem." },
      { path: p.path(eight.lower), tone: "support", label: "mín. 8 sem.", labelPlacement: "below" },
    ],
    points: false4.map((s) => ({ at: p.at(closes, s.index), label: "" })),
    notes: [{ at: [100, 12], text: "pontos: sinais falsos da regra de 4 semanas", tone: "muted" }],
  };
}

export const CHANNEL_DIAGRAMS = {
  breakout: breakoutDiagram(),
  nonContinuous: nonContinuousDiagram(),
  filter: filterDiagram(),
};
