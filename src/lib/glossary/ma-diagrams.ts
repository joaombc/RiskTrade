import { ema, sma } from "../indicators";
import type { Diagram, DiagramPoint, Pt } from "./types";

/**
 * Diagramas da aula de médias móveis. As curvas são calculadas com as mesmas funções do
 * gráfico (sma/ema) sobre séries de preço sintéticas, então mostram o comportamento real de
 * cada média: atraso, cruzamentos, bandas.
 */

type Series = (number | null)[];

/** Oscilação determinística, para as séries parecerem preço sem sortear nada. */
const noise = (i: number, amplitude: number) => amplitude * (Math.sin(i * 1.3) * 0.6 + Math.sin(i * 0.55 + 1) * 0.4);

/** Converte séries em coordenadas do viewBox, com uma escala vertical comum a todas. */
function plotter(series: Series[], top = 14, bottom = 88) {
  const all = series.flat().filter((v): v is number => v !== null);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const n = Math.max(...series.map((s) => s.length));
  const x = (i: number) => +(10 + (180 * i) / (n - 1)).toFixed(1);
  const y = (v: number) => +(bottom - ((v - min) / (max - min)) * (bottom - top)).toFixed(1);
  return {
    x,
    y,
    path: (s: Series): Pt[] => s.flatMap((v, i) => (v === null ? [] : [[x(i), y(v)] as Pt])),
    at: (s: Series, i: number): Pt => [x(i), y(s[i]!)],
  };
}

/** Índices em que `fast` cruza `slow` para cima (up) ou para baixo (down). */
function crossings(fast: Series, slow: Series) {
  const result: { i: number; dir: "up" | "down" }[] = [];
  for (let i = 1; i < fast.length; i++) {
    const [a0, b0, a1, b1] = [fast[i - 1], slow[i - 1], fast[i], slow[i]];
    if (a0 === null || b0 === null || a1 === null || b1 === null) continue;
    if (a0 <= b0 && a1 > b1) result.push({ i, dir: "up" });
    if (a0 >= b0 && a1 < b1) result.push({ i, dir: "down" });
  }
  return result;
}

/** Primeiro cruzamento para cima e o primeiro para baixo depois dele. */
function firstSignals(fast: Series, slow: Series) {
  const all = crossings(fast, slow);
  const buy = all.find((c) => c.dir === "up");
  const sell = buy && all.find((c) => c.dir === "down" && c.i > buy.i);
  return { buy, sell };
}

function rollingStd(values: number[], period: number): Series {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    const window = values.slice(i - period + 1, i + 1);
    const mean = window.reduce((a, b) => a + b, 0) / period;
    return Math.sqrt(window.reduce((a, b) => a + (b - mean) ** 2, 0) / period);
  });
}

// ─── Simples × exponencial ──────────────────────────────────────────────────────

const turnPrices = Array.from({ length: 70 }, (_, i) => (i < 40 ? 50 + i : 90 - (i - 40) * 1.3) + noise(i, 2.5));

function typesDiagram(): Diagram {
  const simple = sma(turnPrices, 20);
  const exponential = ema(turnPrices, 20);
  const p = plotter([turnPrices, simple, exponential]);
  return {
    path: p.path(turnPrices),
    curves: [
      // Na queda, a simples (mais atrasada) fica acima da exponencial.
      { path: p.path(simple), tone: "primary", label: "MMS 20" },
      { path: p.path(exponential), tone: "target", label: "MME 20", labelPlacement: "below" },
    ],
    notes: [{ at: [120, 10], text: "a MME vira antes e fica mais perto do preço", tone: "target" }],
  };
}

// ─── Uma média: cruzamentos do preço ───────────────────────────────────────────

const swingPrices = Array.from(
  { length: 70 },
  (_, i) => (i < 22 ? 80 - i * 1.2 : i < 50 ? 53.6 + (i - 22) * 1.4 : 92.8 - (i - 50) * 1.5) + noise(i, 1.2),
);

function singleDiagram(): Diagram {
  const average = sma(swingPrices, 10);
  const p = plotter([swingPrices, average]);
  const { buy, sell } = firstSignals(swingPrices, average);
  const points: DiagramPoint[] = [];
  if (buy) points.push({ at: p.at(swingPrices, buy.i), label: "compra", placement: "below" });
  if (sell) points.push({ at: p.at(swingPrices, sell.i), label: "venda", placement: "above" });
  return {
    path: p.path(swingPrices),
    curves: [{ path: p.path(average), tone: "primary", label: "MMS 10" }],
    points,
  };
}

// ─── Duas médias: cruzamento duplo ─────────────────────────────────────────────

function doubleDiagram(): Diagram {
  const fast = sma(swingPrices, 5);
  const slow = sma(swingPrices, 20);
  const p = plotter([swingPrices, fast, slow]);
  const { buy, sell } = firstSignals(fast, slow);
  const points: DiagramPoint[] = [];
  if (buy) points.push({ at: p.at(fast, buy.i), label: "compra", placement: "below" });
  if (sell) points.push({ at: p.at(fast, sell.i), label: "venda", placement: "above" });
  return {
    path: p.path(swingPrices),
    curves: [
      { path: p.path(slow), tone: "support", label: "MMS 20" },
      { path: p.path(fast), tone: "target", label: "MMS 5" },
    ],
    points,
  };
}

// ─── Mercado lateral: violinadas ───────────────────────────────────────────────

const sidewaysPrices = Array.from({ length: 70 }, (_, i) => 60 + 6 * Math.sin(i * 0.42) + noise(i, 1.5));

function sidewaysDiagram(): Diagram {
  const average = sma(sidewaysPrices, 10);
  const p = plotter([sidewaysPrices, average], 24, 80);
  const points: DiagramPoint[] = crossings(sidewaysPrices, average).map((c) => ({
    at: p.at(sidewaysPrices, c.i),
    label: "",
  }));
  return {
    path: p.path(sidewaysPrices),
    curves: [{ path: p.path(average), tone: "primary", label: "MMS 10" }],
    points,
    notes: [{ at: [100, 12], text: "cada cruzamento é um sinal falso (violinada)", tone: "resistance" }],
  };
}

// ─── Envelopes ─────────────────────────────────────────────────────────────────

const trendPrices = Array.from({ length: 80 }, (_, i) => 92 + i * 0.22 + 3.2 * Math.sin(i * 0.33) + noise(i, 0.6));

function envelopeDiagram(): Diagram {
  const average = sma(trendPrices, 21);
  const upper = average.map((v) => (v === null ? null : v * 1.03));
  const lower = average.map((v) => (v === null ? null : v * 0.97));
  const p = plotter([trendPrices, upper, lower]);
  // Onde o preço mais se afastou para cima da média: o ponto "esticado".
  let stretched = -1;
  trendPrices.forEach((v, i) => {
    const u = upper[i];
    if (u !== null && v >= u * 0.995 && (stretched < 0 || v - u > trendPrices[stretched] - upper[stretched]!)) stretched = i;
  });
  return {
    path: p.path(trendPrices),
    curves: [
      { path: p.path(upper), tone: "resistance", dashed: true, label: "+3%" },
      { path: p.path(average), tone: "primary", label: "MMS 21" },
      { path: p.path(lower), tone: "support", dashed: true, label: "−3%" },
    ],
    points: stretched >= 0 ? [{ at: p.at(trendPrices, stretched), label: "esticado", placement: "above" }] : [],
  };
}

// ─── Bandas de Bollinger ───────────────────────────────────────────────────────

const squeezePrices = Array.from({ length: 80 }, (_, i) =>
  i < 45 ? 100 + 0.9 * Math.sin(i * 0.9) + noise(i, 0.4) : 100 + (i - 45) * 0.75 + noise(i, 2.2),
);

function bollingerDiagram(): Diagram {
  const average = sma(squeezePrices, 20);
  const deviation = rollingStd(squeezePrices, 20);
  const upper = average.map((v, i) => (v === null ? null : v + 2 * deviation[i]!));
  const lower = average.map((v, i) => (v === null ? null : v - 2 * deviation[i]!));
  const p = plotter([squeezePrices, upper, lower]);
  return {
    path: p.path(squeezePrices),
    curves: [
      { path: p.path(upper), tone: "resistance", dashed: true, label: "+2σ", labelPlacement: "below" },
      { path: p.path(average), tone: "primary", label: "MMS 20" },
      { path: p.path(lower), tone: "support", dashed: true, label: "−2σ" },
    ],
    notes: [
      { at: [p.x(30), p.y(upper[30]!) - 10], text: "aperto: volatilidade baixa", tone: "muted" },
      { at: [190, 90], text: "expansão no rompimento", tone: "muted", anchor: "end" },
    ],
  };
}

export const MA_DIAGRAMS = {
  types: typesDiagram(),
  single: singleDiagram(),
  double: doubleDiagram(),
  sideways: sidewaysDiagram(),
  envelope: envelopeDiagram(),
  bollinger: bollingerDiagram(),
};
