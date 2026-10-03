import { describe, expect, it } from "vitest";
import type { Bar } from "../drawings/types";
import { HISTORY_RANGES } from "../market";
import { resolveExample } from "./examples";
import { normalize, searchTerms } from "./search";
import { GLOSSARY } from "./terms";
import { CATEGORIES } from "./types";

describe("searchTerms", () => {
  it("encontra termos ignorando acentos e caixa", () => {
    expect(searchTerms(GLOSSARY, "gap de exaustao", null).map((t) => t.slug)[0]).toBe("gap-de-exaustao");
    expect(searchTerms(GLOSSARY, "LEQUE", null).map((t) => t.slug)).toContain("leque");
  });

  it("busca por apelidos e siglas", () => {
    expect(searchTerms(GLOSSARY, "OCO", null).map((t) => t.slug).slice(0, 2)).toEqual(["oco", "oco-invertido"]);
    expect(searchTerms(GLOSSARY, "fibonacci", null)[0].slug).toBe("retracoes");
    expect(searchTerms(GLOSSARY, "pullback", null)[0].slug).toBe("pullback");
  });

  it("filtra por categoria, com ou sem texto", () => {
    const gaps = searchTerms(GLOSSARY, "", "Gaps");
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps.every((t) => t.category === "Gaps")).toBe(true);
    expect(searchTerms(GLOSSARY, "OCO", "Gaps")).toEqual([]);
  });

  it("encontra bandeiras, flâmulas e cunhas como padrões de continuação", () => {
    expect(searchTerms(GLOSSARY, "bandeira", null)[0].slug).toBe("bandeira");
    expect(searchTerms(GLOSSARY, "flamula", null)[0].slug).toBe("flamula");
    expect(searchTerms(GLOSSARY, "pennant", null)[0].slug).toBe("flamula");
    expect(searchTerms(GLOSSARY, "cunha", null).map((t) => t.slug).slice(0, 2).sort()).toEqual(["cunha-ascendente", "cunha-descendente"]);
    const continuation = searchTerms(GLOSSARY, "", "Padrões de Continuação").map((t) => t.slug);
    expect(continuation).toEqual(expect.arrayContaining(["bandeira", "flamula", "cunha-ascendente", "cunha-descendente"]));
  });

  it("exige todas as palavras da busca", () => {
    expect(searchTerms(GLOSSARY, "triângulo ascendente", null).map((t) => t.slug)[0]).toBe("triangulo-ascendente");
    expect(searchTerms(GLOSSARY, "triangulo xyz", null)).toEqual([]);
  });

  it("normaliza acentos", () => {
    expect(normalize("  Exaustão ")).toBe("exaustao");
  });
});

describe("conteúdo do glossário", () => {
  it("cobre todas as categorias pedidas e usa slugs únicos", () => {
    const slugs = GLOSSARY.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const c of CATEGORIES) expect(GLOSSARY.some((t) => t.category === c)).toBe(true);
  });

  it("todo termo tem definição, regra de validação e diagrama", () => {
    for (const t of GLOSSARY) {
      expect(t.definition.length, t.slug).toBeGreaterThan(40);
      expect(t.validation.length, t.slug).toBeGreaterThan(40);
      expect(t.diagram.path ?? t.diagram.candles, t.slug).toBeDefined();
    }
  });

  it("exemplos apontam para um período válido e usam datas ISO", () => {
    for (const t of GLOSSARY.filter((t) => t.example)) {
      expect(Object.hasOwn(HISTORY_RANGES, t.example!.range), t.slug).toBe(true);
      const dates = [
        ...(t.example!.drawings ?? []).flatMap((d) => d.points.map((p) => p.date)),
        ...(t.example!.markers ?? []).map((m) => m.date),
        ...(t.example!.view ? [t.example!.view.from, t.example!.view.to] : []),
      ];
      expect(dates.length, t.slug).toBeGreaterThan(0);
      for (const d of dates) expect(d, t.slug).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe("resolveExample", () => {
  const day = (iso: string) => Date.parse(`${iso}T13:00:00Z`) / 1000;
  const bars: Bar[] = ["2025-03-03", "2025-03-04", "2025-03-05", "2025-03-07"].map((d, i) => ({
    time: day(d),
    open: 10 + i,
    high: 12 + i,
    low: 9 + i,
    close: 11 + i,
    volume: 100,
  }));

  it("usa o preço pedido do candle da data", () => {
    const { drawings } = resolveExample("x", { symbol: "X", range: "1y", description: "", drawings: [
      { kind: "trendline", points: [{ date: "2025-03-03", price: "low" }, { date: "2025-03-05", price: "high" }] },
    ] }, bars);
    expect(drawings[0].points).toEqual([
      { time: day("2025-03-03"), price: 9 },
      { time: day("2025-03-05"), price: 14 },
    ]);
    expect(drawings[0].options).toEqual({ extend: true });
  });

  it("aplica as opções do exemplo sobre as padrão da ferramenta", () => {
    const { drawings } = resolveExample("x", { symbol: "X", range: "1y", description: "", drawings: [
      { kind: "trendline", points: [{ date: "2025-03-03", price: "low" }, { date: "2025-03-05", price: "low" }], options: { extend: false } },
    ] }, bars);
    expect(drawings[0].options).toEqual({ extend: false });
  });

  it("cai no pregão seguinte quando a data não teve negócio", () => {
    const { markers } = resolveExample("x", { symbol: "X", range: "1y", description: "", markers: [
      { date: "2025-03-06", text: "Gap", position: "aboveBar" },
    ] }, bars);
    expect(markers).toEqual([{ time: day("2025-03-07"), text: "Gap", position: "aboveBar" }]);
  });

  it("descarta desenhos com datas fora do período carregado", () => {
    const { drawings } = resolveExample("x", { symbol: "X", range: "1y", description: "", drawings: [
      { kind: "horizontal", points: [{ date: "2030-01-01", price: 10 }] },
    ] }, bars);
    expect(drawings).toEqual([]);
  });
});

describe("exemplos cadastrados", () => {
  it("bandeira, flâmula e cunhas têm exemplo real", () => {
    for (const slug of ["bandeira", "flamula", "cunha-descendente", "cunha-ascendente"]) {
      expect(GLOSSARY.find((t) => t.slug === slug)?.example, slug).toBeDefined();
    }
  });

  it("cada exemplo pertence a um termo existente", async () => {
    const { EXAMPLES } = await import("./examples-data");
    const slugs = new Set(GLOSSARY.map((t) => t.slug));
    for (const slug of Object.keys(EXAMPLES)) expect(slugs.has(slug), slug).toBe(true);
    expect(GLOSSARY.filter((t) => t.example).length).toBe(Object.keys(EXAMPLES).length);
  });
});

describe("card ampliado", () => {
  it("todo termo tem as quatro seções de detalhe e a fonte", () => {
    for (const t of GLOSSARY) {
      expect(t.details, t.slug).toBeDefined();
      for (const key of ["market", "volume", "trading", "pitfalls", "source"] as const) {
        expect(t.details![key].length, `${t.slug}.${key}`).toBeGreaterThan(key === "source" ? 10 : 40);
      }
    }
  });
});

describe("modo banana", () => {
  it("todo termo tem cena, conceito, regra e moral com bananas", () => {
    for (const t of GLOSSARY) {
      expect(t.banana, t.slug).toBeDefined();
      for (const key of ["scene", "concept", "rule", "moral"] as const) {
        expect(t.banana![key].length, `${t.slug}.${key}`).toBeGreaterThan(key === "moral" ? 20 : 60);
      }
      const text = `${t.banana!.scene} ${t.banana!.concept}`.toLowerCase();
      expect(/banana|cacho|feira/.test(text), `${t.slug} sem bananas`).toBe(true);
    }
  });

  it("cada explicação pertence a um termo existente", async () => {
    const { BANANAS } = await import("./banana-data");
    const slugs = new Set(GLOSSARY.map((t) => t.slug));
    for (const slug of Object.keys(BANANAS)) expect(slugs.has(slug), slug).toBe(true);
  });
});

describe("aulas", () => {
  it("têm slugs únicos, seções com conteúdo e termos relacionados existentes", async () => {
    const { LESSONS } = await import("./lessons");
    const slugs = LESSONS.map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toEqual(expect.arrayContaining(["teoria-de-dow", "ondas-de-elliott"]));
    const termSlugs = new Set(GLOSSARY.map((t) => t.slug));
    for (const lesson of LESSONS) {
      expect(lesson.takeaways.length, lesson.slug).toBeGreaterThan(2);
      for (const slug of lesson.relatedTerms) expect(termSlugs.has(slug), `${lesson.slug} → ${slug}`).toBe(true);
      for (const section of lesson.sections) {
        expect(section.paragraphs.length + (section.bullets?.length ?? 0) + (section.diagram ? 1 : 0), lesson.slug).toBeGreaterThan(0);
      }
    }
  });
});
