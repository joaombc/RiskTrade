import { describe, expect, it } from "vitest";
import { ptBR } from "@/i18n/dictionaries/pt-BR";
import { ankiBack, ankiDeckFile, ankiFront, candleDeck, glossaryDeck, pnfDeck, standaloneSvg } from "./anki";
import { CANDLE_PATTERNS } from "./candles/patterns";
import { GLOSSARY } from "./glossary/terms";
import { PNF_ALL } from "./pnfPatterns/localize";

const a = ptBR.anki;
const fakeSvg = '<svg viewBox="0 0 10 10" class="h-auto w-full" role="img" aria-label="Engolfo"><title>Compra</title><g class="text-positive"><path stroke="var(--accent)"/></g></svg>';

/** Linhas de cartões de um arquivo (sem o cabeçalho). */
const cards = (file: string) =>
  file
    .trimEnd()
    .split("\n")
    .filter((l) => !l.startsWith("#"))
    .map((l) => l.split("\t"));

describe("SVG para o Anki", () => {
  it("troca classes e variáveis por cores fixas e tira o que entregaria a resposta", () => {
    const svg = standaloneSvg(fakeSvg, { maxWidth: 300 });
    expect(svg).not.toMatch(/class=|var\(--|<title>|aria-label|role=/);
    expect(svg).toContain('<g style="color:#059669">');
    expect(svg).toContain('stroke="#2563eb"');
    expect(svg).toMatch(/^<svg viewBox="0 0 10 10" style="width:100%;max-width:300px;height:auto;background:#ffffff">/);
  });

  it("velas: altura fixa; desenhos com max-width: tamanho natural ampliado", () => {
    expect(standaloneSvg('<svg viewBox="0 0 30 110" class="h-48 w-auto"></svg>', { height: 200 })).toMatch(/style="height:200px;width:auto;max-width:100%/);
    expect(standaloneSvg('<svg viewBox="0 0 216 240" style="max-width:216px"></svg>', { maxWidth: 360, scale: 1.4 })).toContain("max-width:302px");
  });
});

describe("frente, verso e arquivo", () => {
  it("frente com id (frente única), desenho e pergunta; verso com nome, selo e seções escapadas", () => {
    expect(ankiFront("rt-x", "<svg></svg>", "Qual?")).toMatch(/^<!--rt-x--><div[^>]*><svg><\/svg><\/div>.*Qual\?<\/div>$/);
    const back = ankiBack("A < B", [{ text: "Reversão", color: "#059669" }], [["Por quê", "x & y"], ["Vazio", ""]]);
    expect(back).toContain("A &lt; B");
    expect(back).toContain("x &amp; y");
    expect(back).not.toContain("Vazio");
  });

  it("arquivo: cabeçalho do Anki e uma linha por cartão, sem tabulação nem quebra dentro dos campos", () => {
    const file = ankiDeckFile("RiskTrade::Teste", [{ front: "a\tb", back: "c\nd", tags: ["t1", "t2"] }]);
    expect(file.split("\n").slice(0, 4)).toEqual(["#separator:tab", "#html:true", "#deck:RiskTrade::Teste", "#tags column:3"]);
    expect(cards(file)).toEqual([["a b", "c d", "t1 t2"]]);
  });
});

describe("baralhos", () => {
  it("glossário: um cartão por termo, com a categoria no idioma da página", () => {
    const rows = cards(glossaryDeck(GLOSSARY, () => fakeSvg, a, (c) => ptBR.glossary.categories[c]));
    expect(rows).toHaveLength(GLOSSARY.length);
    expect(new Set(rows.map((r) => r[0])).size).toBe(rows.length);
    expect(rows[0][1]).toContain(GLOSSARY[0].name);
  });

  it("candles: um cartão por versão, com a classificação e a direção", () => {
    const rows = cards(candleDeck(CANDLE_PATTERNS, () => fakeSvg, a));
    expect(rows).toHaveLength(CANDLE_PATTERNS.reduce((n, p) => n + p.variants.length, 0));
    const engolfo = rows.filter((r) => r[1].includes("Engolfo de"));
    expect(engolfo.map((r) => /Padrão de reversão de (alta|baixa)/.exec(r[1])?.[0])).toEqual(["Padrão de reversão de alta", "Padrão de reversão de baixa"]);
    expect(engolfo[0][2]).toBe("risktrade candles reversal bullish");
  });

  it("ponto e figura: fundo e topo separados, cada um com o reconhecimento do seu lado", () => {
    const rows = cards(pnfDeck(PNF_ALL, () => fakeSvg, a));
    expect(rows).toHaveLength(PNF_ALL.length * 2);
    const [bottom, top] = rows.filter((r) => r[0].startsWith("<!--rt-pnf-fulcro-"));
    expect(bottom[1]).toContain("Fulcro (fundo)");
    expect(bottom[1]).not.toContain("No topo");
    expect(top[1]).toContain("Fulcro invertido (topo)");
    expect(top[1]).toContain("No topo (fulcro invertido)");
    expect(top[1]).toContain("explicado na versão de fundo");
    expect(top[2]).toBe("risktrade ponto_e_figura reversao baixa");
  });
});
