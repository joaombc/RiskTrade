import { describe, expect, it } from "vitest";
import { PNF_PATTERNS_EN } from "./en";
import { getPnfPatterns, searchPnfPatterns } from "./localize";
import { PNF_PATTERNS, type PnfVariant } from "./patterns";

/** Os nomes da lista de Murphy (fundos e topos). */
const MURPHY_BOTTOMS = ["Fulcrum", "Compound Fulcrum", "Delayed Ending", "Head & Shoulders", "V Formation", "V Extended", "Duplex Horizontal", "Saucer"];

const highs = (v: PnfVariant) => v.columns.map(([from, to]) => Math.max(from, to));
const lows = (v: PnfVariant) => v.columns.map(([from, to]) => Math.min(from, to));

describe("padrões de reversão do ponto e figura", () => {
  it("cobre os 8 padrões da lista, com slugs únicos", () => {
    expect(PNF_PATTERNS.map((p) => p.englishName)).toEqual(MURPHY_BOTTOMS);
    const slugs = PNF_PATTERNS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("colunas alternam X e O, e cada uma começa uma caixa depois do fim da anterior", () => {
    for (const p of PNF_PATTERNS) {
      for (const v of p.variants) {
        v.columns.forEach(([from, to], k) => {
          expect(from, `${p.slug}/${v.side}`).not.toBe(to);
          if (k === 0) return;
          const [prevFrom, prevTo] = v.columns[k - 1];
          const prevUp = prevTo > prevFrom;
          expect(to > from, `${p.slug}/${v.side} coluna ${k}`).toBe(!prevUp);
          expect(from, `${p.slug}/${v.side} coluna ${k}`).toBe(prevUp ? prevTo - 1 : prevTo + 1);
        });
      }
    }
  });

  it("fundo vem depois de queda e rompe para cima no fim; o topo é o espelho", () => {
    for (const p of PNF_PATTERNS) {
      const [bottom, top] = p.variants;
      expect(bottom.side).toBe("bottom");
      expect(top.side).toBe("top");
      // A tendência anterior desce até o padrão.
      expect(bottom.columns[0][0], p.slug).toBeGreaterThan(bottom.columns[0][1]);
      // A primeira coluna de X da base que passa a linha do rompimento está no fim do padrão (depois da base).
      const xs = bottom.columns.map(([from, to], k) => ({ k, up: to > from, high: Math.max(from, to) })).filter((c) => c.up && c.k >= bottom.context);
      const breakoutColumn = xs.find((c) => c.high > bottom.breakout);
      expect(breakoutColumn, p.slug).toBeDefined();
      expect(breakoutColumn!.k, p.slug).toBeGreaterThanOrEqual(bottom.columns.length - 3);
      expect(highs(bottom).at(-1)!, p.slug).toBeGreaterThan(bottom.breakout);
      // Topo = fundo espelhado.
      expect(highs(top)).toEqual(lows(bottom).map((l) => 16 - l));
      expect(top.breakout).toBe(16 - bottom.breakout);
    }
  });

  it("todo padrão tem os textos e a fonte", () => {
    for (const p of PNF_PATTERNS) {
      expect(p.recognition.length, p.slug).toBeGreaterThanOrEqual(3);
      expect(p.psychology.length, p.slug).toBeGreaterThan(80);
      expect(p.confirmation.length, p.slug).toBeGreaterThan(80);
      expect(p.source, p.slug).toMatch(/cap\. 11/);
    }
  });

  it("inglês: todos os padrões traduzidos, com o mesmo número de itens", async () => {
    const en = await getPnfPatterns("en-US");
    for (const p of PNF_PATTERNS) {
      const t = PNF_PATTERNS_EN[p.slug];
      expect(t, p.slug).toBeDefined();
      expect(t.recognition.length, p.slug).toBe(p.recognition.length);
    }
    const fulcrum = en.find((p) => p.slug === "fulcro")!;
    expect(fulcrum.name).toBe("Fulcrum");
    expect(fulcrum.variants.map((v) => v.name)).toEqual(["Fulcrum (bottom)", "Inverse fulcrum (top)"]);
    expect(fulcrum.source).toMatch(/ch\. 11/);
  });

  it("busca por nome, nome original e versões, sem acentos", () => {
    expect(searchPnfPatterns(PNF_PATTERNS, "pires").map((p) => p.slug)).toEqual(["pires"]);
    expect(searchPnfPatterns(PNF_PATTERNS, "inverse saucer").map((p) => p.slug)).toEqual(["pires"]);
    expect(searchPnfPatterns(PNF_PATTERNS, "cabeca").map((p) => p.slug)).toEqual(["oco"]);
    expect(searchPnfPatterns(PNF_PATTERNS, "fulcro").map((p) => p.slug)).toEqual(["fulcro", "fulcro-composto", "final-retardado"]);
    expect(searchPnfPatterns(PNF_PATTERNS, "")).toHaveLength(8);
  });
});
