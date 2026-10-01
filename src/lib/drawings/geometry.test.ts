import { describe, expect, it } from "vitest";
import {
  analyzeHeadShoulders,
  analyzeTriangle,
  buildShapes,
  fanLines,
  roleSegments,
  type DataPoint,
} from "./geometry";
import { createTimeAxis } from "./timeAxis";
import type { Bar, Drawing } from "./types";

const DAY = 86_400;

/** Barras diárias a partir dos fechamentos; máxima/mínima a ±0,5 do fechamento. */
function barsFromCloses(closes: number[]): Bar[] {
  return closes.map((close, i) => ({
    time: i * DAY,
    open: close,
    high: close + 0.5,
    low: close - 0.5,
    close,
    volume: 1000,
  }));
}

const p = (logical: number, price: number): DataPoint => ({ logical, price });

describe("createTimeAxis", () => {
  const axis = createTimeAxis([{ time: 0 }, { time: DAY }, { time: 2 * DAY }, { time: 5 * DAY }]);

  it("mapeia horários das barras para o índice", () => {
    expect(axis.toLogical(DAY)).toBe(1);
    expect(axis.toLogical(5 * DAY)).toBe(3);
  });

  it("interpola dentro de lacunas (fim de semana)", () => {
    expect(axis.toLogical(3.5 * DAY)).toBe(2.5);
  });

  it("extrapola além dos dados pelo espaçamento mediano", () => {
    expect(axis.toLogical(7 * DAY)).toBe(5);
    expect(axis.toTime(5)).toBe(7 * DAY);
    expect(axis.toTime(-1)).toBe(-DAY);
  });
});

describe("fanLines", () => {
  // Alta: linha 1 = 10 + i. Rompe em 11, fundo em 13; linha 2 rompe em 17, fundo em 19; linha 3 rompe em 23.
  const closes = [
    ...Array.from({ length: 11 }, (_, i) => 10.5 + i),
    15, 14, 13, 14, 15, 16,
    12, 11, 10, 11, 12, 12.5,
    5,
  ];
  const bars = barsFromCloses(closes);

  it("gera as linhas 2 e 3 a partir dos fundos após cada rompimento e sinaliza a reversão", () => {
    const result = fanLines(bars, p(0, 10), p(5, 15));
    expect(result.through).toEqual([p(5, 15), p(13, 12.5), p(19, 9.5)]);
    expect(result.reversal).toEqual(p(23, 5));
  });

  it("cada nova linha do leque é mais plana que a anterior", () => {
    const origin = p(0, 10);
    const slopes = fanLines(bars, origin, p(5, 15)).through.map(
      (t) => (t.price - origin.price) / (t.logical - origin.logical),
    );
    expect(slopes[0]).toBeGreaterThan(slopes[1]);
    expect(slopes[1]).toBeGreaterThan(slopes[2]);
  });

  it("mantém só a linha principal enquanto ela não é rompida", () => {
    const result = fanLines(bars.slice(0, 11), p(0, 10), p(5, 15));
    expect(result.through).toHaveLength(1);
    expect(result.reversal).toBeUndefined();
  });
});

describe("roleSegments", () => {
  it("inverte o papel só após rompimento confirmado (>1%)", () => {
    const bars = barsFromCloses([105, 104, 100.5, 98, 100.5, 102]);
    expect(roleSegments(bars, 100)).toEqual([
      { from: 0, to: 3, role: "support" },
      { from: 3, to: 5, role: "resistance" },
      { from: 5, to: 5, role: "support" },
    ]);
  });
});

describe("analyzeTriangle", () => {
  const consolidation = barsFromCloses([...Array(11).fill(105), 106, 112]);

  it("classifica ascendente e projeta a altura a partir do rompimento", () => {
    const t = analyzeTriangle(consolidation, [p(0, 110), p(10, 110)], [p(0, 100), p(10, 105)]);
    expect(t.type).toBe("ascending");
    expect(t.height).toBe(10);
    expect(t.apex).toBe(20);
    expect(t.breakout).toEqual({ logical: 12, price: 110, direction: "up" });
    expect(t.target).toBe(120);
  });

  it("ignora fechamentos menos de 1% além da linha (falso rompimento)", () => {
    const bars = barsFromCloses([...Array(11).fill(105), 106, 110.5]);
    const t = analyzeTriangle(bars, [p(0, 110), p(10, 110)], [p(0, 100), p(10, 105)]);
    expect(t.breakout).toBeUndefined();
  });

  it("classifica simétrico e descendente", () => {
    expect(analyzeTriangle([], [p(0, 110), p(10, 106)], [p(0, 100), p(10, 104)]).type).toBe("symmetric");
    expect(analyzeTriangle([], [p(0, 110), p(10, 104)], [p(0, 100), p(10, 100)]).type).toBe("descending");
  });

  it("sem rompimento, oferece alvos potenciais para os dois lados", () => {
    const t = analyzeTriangle(barsFromCloses(Array(13).fill(107)), [p(0, 110), p(10, 110)], [p(0, 100), p(10, 105)]);
    expect(t.breakout).toBeUndefined();
    expect(t.potentialTargets).toEqual({ up: 120, down: 95 });
  });
});

describe("analyzeHeadShoulders", () => {
  it("OCO de topo: alvo = linha de pescoço no rompimento − altura da cabeça", () => {
    const bars = barsFromCloses([...Array(11).fill(103), 101, 98]);
    const hs = analyzeHeadShoulders(bars, [p(2, 105), p(4, 100), p(6, 110), p(8, 100), p(10, 105)]);
    expect(hs.inverse).toBe(false);
    expect(hs.height).toBe(10);
    expect(hs.breakout).toEqual(p(12, 100));
    expect(hs.target).toBe(90);
  });

  it("OCO invertido sem rompimento projeta a partir do ombro direito", () => {
    const bars = barsFromCloses(Array(13).fill(97));
    const hs = analyzeHeadShoulders(bars, [p(2, 95), p(4, 100), p(6, 90), p(8, 100), p(10, 95)]);
    expect(hs.inverse).toBe(true);
    expect(hs.breakout).toBeUndefined();
    expect(hs.projectedFrom).toEqual(p(10, 100));
    expect(hs.target).toBe(110);
  });
});

describe("buildShapes", () => {
  const bars = barsFromCloses(Array(20).fill(150));
  const axis = createTimeAxis(bars);
  const drawing = (kind: Drawing["kind"], points: [number, number][]): Drawing => ({
    id: "d",
    kind,
    points: points.map(([i, price]) => ({ time: i * DAY, price })),
    options: {},
  });

  it("Fibonacci traça 38,2%, 50% e 61,8% do movimento", () => {
    const labels = buildShapes(drawing("fibonacci", [[0, 100], [10, 200]]), bars, axis).flatMap((s) =>
      s.type === "label" ? [s.text] : [],
    );
    expect(labels).toEqual(["0% · 200,00", "38,2% · 161,80", "50% · 150,00", "61,8% · 138,20", "100% · 100,00"]);
  });

  it("Terços (Gann) traça 33%, 50% e 66%", () => {
    const labels = buildShapes(drawing("thirds", [[0, 100], [10, 400]]), bars, axis).flatMap((s) =>
      s.type === "label" ? [s.text] : [],
    );
    expect(labels).toEqual(["0% · 400,00", "33,3% · 300,00", "50% · 250,00", "66,7% · 200,00", "100% · 100,00"]);
  });

  it("canal desenha a paralela passando pelo terceiro ponto", () => {
    const [base, parallel] = buildShapes(drawing("channel", [[0, 100], [10, 110], [5, 120]]), bars, axis);
    expect(base).toMatchObject({ from: p(0, 100), to: p(10, 110) });
    expect(parallel).toMatchObject({ from: p(0, 115), to: p(10, 125) });
  });

  it("linhas de velocidade passam por 1/3 e 2/3 do movimento", () => {
    const shapes = buildShapes(drawing("speedLines", [[0, 100], [9, 190]]), bars, axis);
    const throughPrices = shapes.flatMap((s) => (s.type === "label" ? [s.at.price] : []));
    expect(throughPrices).toEqual([160, 130]);
  });

  it("desenho incompleto mostra só os pontos clicados", () => {
    const shapes = buildShapes(drawing("headShoulders", [[0, 100], [2, 95]]), bars, axis);
    expect(shapes).toHaveLength(1);
    expect(shapes[0]).toMatchObject({ type: "line", dashed: true });
  });
});
