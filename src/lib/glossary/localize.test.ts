import { describe, expect, it } from "vitest";
import { getCandlePatterns } from "../candles/localize";
import { CANDLE_PATTERNS } from "../candles/patterns";
import { searchCandles } from "../candles/search";
import { LABELS_EN } from "./en/labels";
import { TERMS_EN } from "./en/terms";
import { getGlossary } from "./localize";
import { searchTerms } from "./search";
import { GLOSSARY } from "./terms";
import type { Diagram } from "./types";

/** Todos os textos que um diagrama mostra. */
function diagramTexts(d: Diagram): string[] {
  return [
    ...(d.lines ?? []).map((l) => l.label),
    ...(d.points ?? []).map((p) => p.label),
    ...(d.curves ?? []).map((c) => c.label),
    ...(d.notes ?? []).map((n) => n.text),
    d.sub?.label,
    ...(d.sub?.lines ?? []).map((l) => l.label),
  ].filter((t): t is string => !!t);
}

/** Rótulos sem palavras a traduzir (números, frações, siglas usadas nos dois idiomas). */
const NEUTRAL = /^([\d/%+−–\s.σ]+|OBV)$/;

describe("glossário em inglês", () => {
  it("em português devolve o glossário original", async () => {
    expect(await getGlossary("pt-BR")).toBe(GLOSSARY);
  });

  it("todo termo tem tradução, com card ampliado e exemplo quando o original tem", () => {
    for (const term of GLOSSARY) {
      const en = TERMS_EN[term.slug];
      expect(en, term.slug).toBeDefined();
      expect(!!en.details, `${term.slug}: details`).toBe(!!term.details);
      expect(!!en.example, `${term.slug}: example`).toBe(!!term.example);
    }
    expect(Object.keys(TERMS_EN).sort()).toEqual(GLOSSARY.map((t) => t.slug).sort());
  });

  it("todo rótulo de diagrama e marcador de exemplo tem tradução", () => {
    const texts = GLOSSARY.flatMap((t) => [...diagramTexts(t.diagram), ...(t.example?.markers ?? []).map((m) => m.text)]);
    const missing = [...new Set(texts)].filter((text) => !NEUTRAL.test(text) && !(text in LABELS_EN));
    expect(missing).toEqual([]);
  });

  it("monta os termos com os textos e rótulos em inglês", async () => {
    const en = await getGlossary("en-US");
    const hs = en.find((t) => t.slug === "oco")!;
    expect(hs.name).toBe("Head and Shoulders");
    expect(hs.details?.source).toContain("ch. 5");
    expect(diagramTexts(hs.diagram)).toEqual(expect.arrayContaining(["neckline", "Target", "LS", "H", "RS", "Breakout"]));
    const doubleTop = en.find((t) => t.slug === "topo-duplo")!;
    expect(doubleTop.example?.markers?.map((m) => m.text)).toEqual(["Peak 1", "Peak 2", "Breakout"]);
    // O desenho em si não muda.
    expect(hs.diagram.path).toEqual(GLOSSARY.find((t) => t.slug === "oco")!.diagram.path);
  });

  it("a busca em inglês encontra os nomes de Murphy (e ainda aceita os em português)", async () => {
    const en = await getGlossary("en-US");
    const first = (q: string) => searchTerms(en, q, null)[0]?.slug;
    expect(first("head and shoulders")).toBe("oco");
    expect(first("flag")).toBe("bandeira");
    expect(first("pennant")).toBe("flamula");
    expect(first("ascending triangle")).toBe("triangulo-ascendente");
    expect(first("exhaustion gap")).toBe("gap-de-exaustao");
    expect(first("OCO")).toBe("oco");
  });
});

describe("candles em inglês", () => {
  it("em português devolve os padrões originais", async () => {
    expect(await getCandlePatterns("pt-BR")).toBe(CANDLE_PATTERNS);
  });

  it("todo padrão tem tradução, com um nome para cada variante", async () => {
    const en = await getCandlePatterns("en-US");
    expect(en).toHaveLength(CANDLE_PATTERNS.length);
    for (const [i, p] of en.entries()) {
      expect(p.name, p.slug).toBe(CANDLE_PATTERNS[i].englishName);
      expect(p.variants.every((v) => v.name), p.slug).toBe(true);
      expect(p.recognition.length, p.slug).toBe(CANDLE_PATTERNS[i].recognition.length);
      expect(p.source, p.slug).toMatch(/^Murphy, .*ch\. 12/);
      expect(p.variants.map((v) => v.candles)).toEqual(CANDLE_PATTERNS[i].variants.map((v) => v.candles));
    }
  });

  it("a busca em inglês encontra os padrões pelo nome original", async () => {
    const en = await getCandlePatterns("en-US");
    const find = (query: string) => searchCandles(en, { query, kind: null, bias: null, count: null }).map((p) => p.slug);
    expect(find("engulfing")).toContain("engolfo");
    expect(find("hanging man")).toEqual(["martelo-enforcado"]);
    expect(find("evening star")).toContain("estrela-da-manha-tarde");
  });
});
