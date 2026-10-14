import { noise, plotter } from "./ma-diagrams";
import type { Diagram, DiagramLine, DiagramPoint } from "./types";

/**
 * Diagramas da aula de ciclos de tempo (Murphy, cap. 14), calculados a partir de ciclos sintéticos:
 * ondas de período conhecido, somadas a uma tendência quando o desenho pede.
 */

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
/** Ciclo com fundo no início de cada período: 0 no fundo, 1 no topo. */
const cycle = (i: number, period: number) => (1 - Math.cos((2 * Math.PI * i) / period)) / 2;

// ─── Anatomia: período (de fundo a fundo) e amplitude ──────────────────────────

function anatomyDiagram(): Diagram {
  const n = 101;
  const values = range(n).map((i) => 30 + 40 * cycle(i, 40));
  const p = plotter([values], 14, 68);
  const bottom = p.y(30);
  return {
    path: p.path(values),
    // A linha do período fica abaixo dos rótulos dos fundos, com o nome centralizado embaixo dela.
    lines: [
      { from: [p.x(40), bottom + 13], to: [p.x(80), bottom + 13], tone: "primary" },
      { from: [p.x(60), bottom], to: [p.x(60), p.y(70)], tone: "target", dashed: true, label: "amplitude", labelAt: "start" },
    ],
    notes: [{ at: [p.x(60), bottom + 21], text: "período", tone: "primary", anchor: "middle" }],
    points: [
      { at: p.at(values, 40), label: "fundo", placement: "below" },
      { at: p.at(values, 80), label: "fundo", placement: "below" },
    ],
  };
}

// ─── Soma, harmonia e sincronismo: um ciclo longo e um com metade do período ──

function summationDiagram(): Diagram {
  const n = 121;
  const long = range(n).map((i) => 50 + 16 * cycle(i, 60));
  const short = range(n).map((i) => 6 * cycle(i, 30));
  const sum = long.map((v, i) => v + short[i]);
  const p = plotter([sum, long], 14, 86);
  const sub = plotter([short], 99, 117);
  // Os fundos coincidem a cada 60 candles: o curto tem metade do período do longo.
  const troughs: DiagramPoint[] = [60, 120].map((i) => ({ at: p.at(sum, i), label: i === 60 ? "fundos juntos" : "", placement: "below" }));
  return {
    path: p.path(sum),
    curves: [{ path: p.path(long), tone: "muted", dashed: true, label: "ciclo longo", labelPlacement: "below" }],
    points: troughs.filter((t) => t.label),
    sub: { path: sub.path(short), label: "ciclo curto" },
  };
}

// ─── Translação: o topo depois (alta) ou antes (baixa) do meio do ciclo ────────

/** Ciclo assimétrico: sobe até `crest` (fração do período) e depois cai até o fundo seguinte. */
const skewed = (i: number, period: number, crest: number) => {
  const phase = (i % period) / period;
  return phase < crest ? (1 - Math.cos((Math.PI * phase) / crest)) / 2 : (1 + Math.cos((Math.PI * (phase - crest)) / (1 - crest))) / 2;
};

function translationDiagram(direction: "right" | "left"): Diagram {
  const period = 30;
  const n = period * 3 + 1;
  const crest = direction === "right" ? 0.72 : 0.28;
  const slope = direction === "right" ? 0.22 : -0.22;
  const values = range(n).map((i) => 50 + slope * i + 12 * skewed(i, period, crest));
  const p = plotter([values], 16, 86);
  const middles: DiagramLine[] = [0, 1, 2].map((k) => {
    const x = p.x(k * period + period / 2);
    return { from: [x, 12], to: [x, 90], tone: "muted", dashed: true, label: k === 0 ? "meio do ciclo" : undefined, labelAt: "start" };
  });
  const crests: DiagramPoint[] = [0, 1, 2].map((k) => {
    const i = k * period + Math.round(crest * period);
    return { at: p.at(values, i), label: k === 0 ? (direction === "right" ? "topo à direita" : "topo à esquerda") : "", placement: "above" };
  });
  return {
    path: p.path(values),
    lines: middles,
    points: crests.filter((c) => c.label),
  };
}

// ─── Oscilador sem tendência: preço − média centrada ───────────────────────────

function detrendDiagram(): Diagram {
  const n = 120;
  const period = 20;
  const values = range(n).map((i) => 50 + 0.3 * i + 7 * cycle(i, period) + noise(i, 0.6));
  // Média com o comprimento do ciclo, centrada: cada ponto é a média dos 10 candles de cada lado.
  const half = period / 2;
  const centered = values.map((_, i) => (i < half || i >= n - half ? null : values.slice(i - half, i + half + 1).reduce((a, b) => a + b, 0) / (period + 1)));
  const detrended = values.map((v, i) => (centered[i] === null ? null : v - centered[i]!));
  const p = plotter([values], 14, 86);
  const sub = plotter([detrended, [0]], 99, 117);
  return {
    path: p.path(values),
    curves: [{ path: p.path(centered), tone: "target", dashed: true }],
    // O rótulo da média fica numa área livre, abaixo dela (o preço com tendência de alta fica acima).
    notes: [{ at: [150, 76], text: "média centrada", tone: "target", anchor: "middle" }],
    sub: {
      path: sub.path(detrended),
      label: "preço − média",
      lines: [{ from: [10, sub.y(0)], to: [190, sub.y(0)], tone: "muted", dashed: true, label: "zero" }],
    },
  };
}

export const CYCLE_DIAGRAMS = {
  anatomy: anatomyDiagram(),
  summation: summationDiagram(),
  rightTranslation: translationDiagram("right"),
  leftTranslation: translationDiagram("left"),
  detrend: detrendDiagram(),
};
