import { describe, expect, it } from "vitest";
import { getCandlePatterns } from "../candles/localize";
import { CANDLE_PATTERNS } from "../candles/patterns";
import { searchCandles } from "../candles/search";
import { LABELS_EN } from "./en/labels";
import { LESSON_LABELS_EN, LESSONS_EN } from "./en/lessons";
import { TERMS_EN } from "./en/terms";
import { getGlossary, getLessons } from "./localize";
import { LESSONS } from "./lessons";
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

describe("aulas em inglês", () => {
  it("em português devolve as aulas originais", async () => {
    expect(await getLessons("pt-BR")).toBe(LESSONS);
  });

  it("toda aula tem tradução com a mesma estrutura: seções, parágrafos, itens, legendas e resumo", () => {
    expect(Object.keys(LESSONS_EN).sort()).toEqual(LESSONS.map((l) => l.slug).sort());
    for (const lesson of LESSONS) {
      const en = LESSONS_EN[lesson.slug];
      expect(en.sections.length, lesson.slug).toBe(lesson.sections.length);
      expect(en.takeaways.length, lesson.slug).toBe(lesson.takeaways.length);
      lesson.sections.forEach((s, i) => {
        const where = `${lesson.slug} · seção ${i} (${s.heading})`;
        const t = en.sections[i];
        expect(!!t.heading, where).toBe(!!s.heading);
        expect(t.paragraphs.length, where).toBe(s.paragraphs.length);
        expect(t.bullets?.length, where).toBe(s.bullets?.length);
        expect(!!t.caption, where).toBe(!!s.diagram);
      });
    }
  });

  it("todo rótulo com palavras nos diagramas das aulas tem tradução", () => {
    const labels = { ...LABELS_EN, ...LESSON_LABELS_EN };
    const texts = LESSONS.flatMap((l) => l.sections.flatMap((s) => (s.diagram ? diagramTexts(s.diagram.diagram) : [])));
    // Letras soltas (ondas, pontos A-B-C, S1) e números não se traduzem.
    const missing = [...new Set(texts)].filter((text) => /[A-Za-zÀ-ú]{2,}/.test(text) && text !== "OBV" && !(text in labels));
    expect(missing).toEqual([]);
  });

  it("monta as aulas em inglês sem trocar o C de Dow pela cabeça do OCO", async () => {
    const en = await getLessons("en-US");
    const dow = en.find((l) => l.slug === "teoria-de-dow")!;
    expect(dow.title).toBe("Dow Theory");
    const failure = dow.sections.find((s) => s.diagram?.caption.startsWith("Failure swing"))!;
    expect(diagramTexts(failure.diagram!.diagram)).toEqual(expect.arrayContaining(["A", "B", "C", "S", "C fails to exceed A: stronger signal"]));
    const fourWeek = en.find((l) => l.slug === "regra-das-4-semanas")!;
    expect(diagramTexts(fourWeek.sections[1].diagram!.diagram)).toEqual(expect.arrayContaining(["4-wk high", "4-wk low"]));
  });
});
