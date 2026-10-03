import { describe, expect, it } from "vitest";
import { CANDLE_PATTERNS } from "./patterns";
import { searchCandles } from "./search";
import type { CandlePattern, Ohlc } from "./types";

const find = (slug: string): CandlePattern => {
  const p = CANDLE_PATTERNS.find((x) => x.slug === slug);
  if (!p) throw new Error(slug);
  return p;
};
const variant = (slug: string, bias: "bullish" | "bearish") => find(slug).variants.find((v) => v.bias === bias)!.candles;
const top = (x: Ohlc) => Math.max(x.o, x.c);
const bottom = (x: Ohlc) => Math.min(x.o, x.c);
const body = (x: Ohlc) => top(x) - bottom(x);
const mid = (x: Ohlc) => (x.o + x.c) / 2;

/** Nomes da tabela de padrões do capítulo 12 (Morris). */
const MORRIS_LIST = [
  "Long White Body", "Long Black Body", "Hammer", "Hanging Man", "Inverted Hammer", "Shooting Star", "Belt Hold",
  "Engulfing", "Harami", "Harami Cross", "Piercing Line", "Dark Cloud Cover", "Doji Star", "Meeting Lines",
  "Three White Soldiers", "Three Black Crows", "Morning Star", "Evening Star", "Morning Doji Star", "Evening Doji Star",
  "Abandoned Baby", "Tri-Star", "Breakaway", "Three Inside Up", "Three Inside Down", "Three Outside Up",
  "Three Outside Down", "Kicking", "Unique Three River Bottom", "Ladder Top", "Three Stars in the South", "Matching High",
  "Concealing Baby Swallow", "Upside Gap Two Crows", "Stick Sandwich", "Identical Three Crows", "Homing Pigeon",
  "Deliberation", "Ladder Bottom", "Advance Block", "Matching Low", "Two Crows", "Separating Lines",
  "Rising Three Methods", "Falling Three Methods", "Upside Tasuki Gap", "Downside Tasuki Gap", "Side-by-Side White Lines",
  "Three Line Strike", "Upside Gap Three Methods", "Downside Gap Three Methods", "On Neck", "In Neck",
];

describe("biblioteca de padrões", () => {
  it("cobre todos os padrões da tabela do capítulo 12", () => {
    const names = CANDLE_PATTERNS.map((p) => p.englishName.toLowerCase()).join(" | ");
    for (const name of MORRIS_LIST) expect(names, name).toContain(name.toLowerCase());
  });

  it("tem slugs únicos e velas válidas (mínima ≤ abertura/fechamento ≤ máxima)", () => {
    const slugs = CANDLE_PATTERNS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const p of CANDLE_PATTERNS) {
      for (const v of p.variants) {
        expect(v.candles.length, `${p.slug}/${v.name}`).toBe(p.candleCount);
        for (const c of v.candles) {
          expect(c.l, `${p.slug}/${v.name}`).toBeLessThanOrEqual(Math.min(c.o, c.c));
          expect(c.h, `${p.slug}/${v.name}`).toBeGreaterThanOrEqual(Math.max(c.o, c.c));
        }
      }
    }
  });

  it("todo padrão tem reconhecimento, psicologia, confirmação e fonte", () => {
    for (const p of CANDLE_PATTERNS) {
      expect(p.recognition.length, p.slug).toBeGreaterThan(0);
      expect(p.psychology.length, p.slug).toBeGreaterThan(40);
      expect(p.confirmation.length, p.slug).toBeGreaterThan(20);
      expect(p.source, p.slug).toMatch(/cap\. 12/);
    }
  });

  it("reversões de alta aparecem após queda; de baixa, após alta; continuações seguem a tendência", () => {
    for (const p of CANDLE_PATTERNS) {
      for (const v of p.variants) {
        if (p.kind === "reversal") expect(v.context, p.slug).toBe(v.bias === "bullish" ? "down" : "up");
        if (p.kind === "continuation") expect(v.context, p.slug).toBe(v.bias === "bullish" ? "up" : "down");
        if (p.kind === "basic") expect(v.context, p.slug).toBe("none");
      }
    }
  });
});

describe("regras dos padrões nos diagramas", () => {
  it("martelo e estrela cadente: sombra de pelo menos 2× o corpo", () => {
    const [hammer] = variant("martelo-enforcado", "bullish");
    expect(bottom(hammer) - hammer.l).toBeGreaterThanOrEqual(2 * body(hammer));
    const [star] = variant("martelo-invertido-estrela-cadente", "bearish");
    expect(star.h - top(star)).toBeGreaterThanOrEqual(2 * body(star));
  });

  it("engolfo: o corpo da segunda vela envolve o da primeira", () => {
    for (const bias of ["bullish", "bearish"] as const) {
      const [a, b] = variant("engolfo", bias);
      expect(top(b)).toBeGreaterThan(top(a));
      expect(bottom(b)).toBeLessThan(bottom(a));
    }
  });

  it("harami: o corpo da segunda vela fica dentro do da primeira", () => {
    const [a, b] = variant("harami", "bullish");
    expect(top(b)).toBeLessThan(top(a));
    expect(bottom(b)).toBeGreaterThan(bottom(a));
  });

  it("linha de perfuração e nuvem negra: abrem além do extremo e fecham além do meio do corpo", () => {
    const [a, b] = variant("linha-de-perfuracao-nuvem-negra", "bullish");
    expect(b.o).toBeLessThan(a.l);
    expect(b.c).toBeGreaterThan(mid(a));
    const [c, d] = variant("linha-de-perfuracao-nuvem-negra", "bearish");
    expect(d.o).toBeGreaterThan(c.h);
    expect(d.c).toBeLessThan(mid(c));
  });

  it("estrela da manhã: estrela com gap e terceira vela acima do meio da primeira", () => {
    const [a, star, c] = variant("estrela-da-manha-tarde", "bullish");
    expect(top(star)).toBeLessThan(bottom(a));
    expect(c.c).toBeGreaterThan(mid(a));
  });

  it("três métodos de alta: descanso dentro do corpo da primeira e rompimento numa nova máxima", () => {
    const [first, ...rest] = variant("tres-metodos", "bullish");
    const last = rest.pop()!;
    for (const x of rest) {
      expect(top(x)).toBeLessThanOrEqual(top(first));
      expect(bottom(x)).toBeGreaterThanOrEqual(bottom(first));
    }
    expect(last.c).toBeGreaterThan(first.h);
  });
});

describe("searchCandles", () => {
  const none = { query: "", kind: null, bias: null, count: null };

  it("encontra pelo nome em português (sem acento) e pelo nome em inglês", () => {
    expect(searchCandles(CANDLE_PATTERNS, { ...none, query: "estrela da manha" })[0].slug).toBe("estrela-da-manha-tarde");
    expect(searchCandles(CANDLE_PATTERNS, { ...none, query: "engulfing" }).map((p) => p.slug)).toEqual(["engolfo"]);
    expect(searchCandles(CANDLE_PATTERNS, { ...none, query: "enforcado" })[0].slug).toBe("martelo-enforcado");
  });

  it("filtra por tipo, direção e número de velas", () => {
    const bearish3 = searchCandles(CANDLE_PATTERNS, { ...none, kind: "reversal", bias: "bearish", count: 3 });
    expect(bearish3.length).toBeGreaterThan(0);
    for (const p of bearish3) {
      expect(p.kind).toBe("reversal");
      expect(p.candleCount).toBe(3);
      expect(p.variants.some((v) => v.bias === "bearish")).toBe(true);
    }
  });
});
