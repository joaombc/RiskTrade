import { describe, expect, it } from "vitest";
import { PNF_PATTERNS_EN } from "./en";
import { getPnfPatterns, PNF_ALL, searchPnfPatterns } from "./localize";
import { PNF_PATTERNS, PNF_SIGNALS, type PnfLine, type PnfVariant } from "./patterns";

/** Os nomes das listas de Murphy (reversões de Wheelan e sinais do gráfico de 3 caixas). */
const MURPHY_REVERSALS = ["Fulcrum", "Compound Fulcrum", "Delayed Ending", "Head & Shoulders", "V Formation", "V Extended", "Duplex Horizontal", "Saucer"];
const MURPHY_SIGNALS = [
  ["Simple bullish buy signal", "Simple sell signal"],
  ["Simple buy signal with a rising bottom", "Simple sell signal with a declining top"],
  ["Breakout of a triple top", "Breakout of a triple bottom"],
  ["Ascending triple top", "Descending triple bottom"],
  ["Spread triple top", "Spread triple bottom"],
  ["Upside breakout above a bullish triangle", "Downside breakout of a bearish triangle"],
  ["Upside breakout above a bullish resistance line", "Downside breakout below a bearish support line"],
  ["Upside breakout above a bearish resistance line", "Downside breakout below a bullish support line"],
];

const highs = (v: PnfVariant) => v.columns.map(([from, to]) => Math.max(from, to));
const lows = (v: PnfVariant) => v.columns.map(([from, to]) => Math.min(from, to));
const rising = (v: PnfVariant, k: number) => v.columns[k][1] > v.columns[k][0];
const lineAt = ({ from, to }: PnfLine, column: number) => from[1] + ((to[1] - from[1]) * (column - from[0])) / (to[0] - from[0]);

describe("padrões do ponto e figura", () => {
  it("cobre as duas listas de Murphy, com slugs únicos", async () => {
    expect(PNF_PATTERNS.map((p) => p.englishName)).toEqual(MURPHY_REVERSALS);
    const en = await getPnfPatterns("en-US");
    expect(en.filter((p) => p.group === "signal").map((p) => p.variants.map((v) => v.name))).toEqual(MURPHY_SIGNALS);
    const slugs = PNF_ALL.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("colunas alternam X e O, e cada uma começa uma caixa depois do fim da anterior", () => {
    for (const p of PNF_ALL) {
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

  it("a versão de baixa é a de alta espelhada (colunas, linhas e sinal)", () => {
    for (const p of PNF_ALL) {
      const [bottom, top] = p.variants;
      expect([bottom.side, top.side]).toEqual(["bottom", "top"]);
      expect(highs(top), p.slug).toEqual(lows(bottom).map((l) => 16 - l));
      expect(top.breakout, p.slug).toBe(bottom.breakout === null ? null : 16 - bottom.breakout);
      expect(top.signal, p.slug).toEqual([bottom.signal[0], 16 - bottom.signal[1]]);
      expect(top.lines.map((l) => [l.from[1], l.to[1]]), p.slug).toEqual(bottom.lines.map((l) => [16 - l.from[1], 16 - l.to[1]]));
    }
  });

  it("o ponto do sinal está numa caixa da coluna certa: X na compra, O na venda", () => {
    for (const p of PNF_ALL) {
      for (const v of p.variants) {
        const [column, level] = v.signal;
        expect(rising(v, column), `${p.slug}/${v.side}`).toBe(v.side === "bottom");
        expect(level, `${p.slug}/${v.side}`).toBeGreaterThanOrEqual(lows(v)[column]);
        expect(level, `${p.slug}/${v.side}`).toBeLessThanOrEqual(highs(v)[column]);
      }
    }
  });

  it("reversões: a queda vem antes, e a compra é a primeira caixa acima da linha de rompimento, no fim da base", () => {
    for (const p of PNF_PATTERNS) {
      const bottom = p.variants[0];
      expect(bottom.columns[0][0], p.slug).toBeGreaterThan(bottom.columns[0][1]);
      expect(bottom.signal[1], p.slug).toBe(Math.ceil(bottom.breakout!));
      expect(bottom.signal[0], p.slug).toBeGreaterThanOrEqual(bottom.columns.length - 3);
      // Nenhuma coluna de X da base passa a linha antes da coluna do sinal.
      for (let k = bottom.context; k < bottom.signal[0]; k++) {
        if (rising(bottom, k)) expect(highs(bottom)[k], `${p.slug} coluna ${k}`).toBeLessThan(bottom.breakout!);
      }
    }
  });

  it("sinais: colunas de pelo menos 3 caixas, e a compra passa o X anterior ou a linha de 45°", () => {
    for (const p of PNF_SIGNALS) {
      const bottom = p.variants[0];
      bottom.columns.slice(1).forEach(([from, to], k) => expect(Math.abs(to - from) + 1, `${p.slug} coluna ${k + 1}`).toBeGreaterThanOrEqual(3));
      const [column, level] = bottom.signal;
      if (bottom.breakout !== null) {
        // Rompimento horizontal: uma caixa acima do topo da coluna de X anterior.
        expect(level, p.slug).toBe(Math.ceil(bottom.breakout));
        expect(highs(bottom)[column - 2], p.slug).toBe(Math.floor(bottom.breakout));
      } else {
        // Linha inclinada: a primeira caixa acima dela, e nenhuma coluna de X antes a passou.
        const line = bottom.lines[0];
        expect(level, p.slug).toBeGreaterThan(lineAt(line, column));
        expect(level - 1, p.slug).toBeLessThanOrEqual(lineAt(line, column));
        for (let k = line.from[0]; k < column; k++) {
          if (rising(bottom, k)) expect(highs(bottom)[k], `${p.slug} coluna ${k}`).toBeLessThanOrEqual(lineAt(line, k));
        }
      }
    }
  });

  it("todo padrão tem os textos e a fonte do grupo", () => {
    for (const p of PNF_ALL) {
      expect(p.recognition.length, p.slug).toBeGreaterThanOrEqual(3);
      expect(p.psychology.length, p.slug).toBeGreaterThan(80);
      expect(p.confirmation.length, p.slug).toBeGreaterThan(80);
      expect(p.source, p.slug).toMatch(p.group === "reversal" ? /Wheelan/ : /3 caixas/);
    }
  });

  it("inglês: todos os padrões traduzidos, com o mesmo número de itens", async () => {
    const en = await getPnfPatterns("en-US");
    for (const p of PNF_ALL) {
      const t = PNF_PATTERNS_EN[p.slug];
      expect(t, p.slug).toBeDefined();
      expect(t.recognition.length, p.slug).toBe(p.recognition.length);
    }
    const fulcrum = en.find((p) => p.slug === "fulcro")!;
    expect(fulcrum.name).toBe("Fulcrum");
    expect(fulcrum.variants.map((v) => v.name)).toEqual(["Fulcrum (bottom)", "Inverse fulcrum (top)"]);
    expect(fulcrum.source).toMatch(/ch\. 11/);
    expect(en.find((p) => p.slug === "triangulo")!.source).toMatch(/3-box/);
  });

  it("busca por nome, nome original, apelidos e versões, sem acentos", () => {
    const slugs = (q: string) => searchPnfPatterns(PNF_ALL, q).map((p) => p.slug);
    expect(slugs("pires")).toEqual(["pires"]);
    expect(slugs("inverse saucer")).toEqual(["pires"]);
    expect(slugs("cabeca")).toEqual(["oco"]);
    expect(slugs("fulcro")).toEqual(["fulcro", "fulcro-composto", "final-retardado"]);
    expect(slugs("triplo")).toEqual(["topo-triplo", "topo-triplo-ascendente", "topo-triplo-espalhado"]);
    expect(slugs("linha de 45")).toEqual(["linha-resistencia-baixa"]);
    expect(slugs("")).toHaveLength(16);
  });
});
