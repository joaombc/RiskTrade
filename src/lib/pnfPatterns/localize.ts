import type { Locale } from "@/i18n/config";
import { normalize } from "../glossary/search";
import { PNF_PATTERNS, type PnfPattern } from "./patterns";

/** Padrões no idioma pedido. O inglês só é carregado quando necessário (no servidor). */
export async function getPnfPatterns(locale: Locale): Promise<PnfPattern[]> {
  if (locale === "pt-BR") return PNF_PATTERNS;
  const { PNF_PATTERNS_EN, PNF_SOURCE_EN } = await import("./en");
  return PNF_PATTERNS.map((p) => {
    const text = PNF_PATTERNS_EN[p.slug];
    if (!text) return p;
    return {
      ...p,
      name: p.englishName,
      summary: text.summary,
      recognition: text.recognition,
      psychology: text.psychology,
      confirmation: text.confirmation,
      variants: [
        { ...p.variants[0], name: text.variants[0] },
        { ...p.variants[1], name: text.variants[1] },
      ],
      source: PNF_SOURCE_EN,
    };
  });
}

/** Busca por nome, nome original, apelidos e nomes das versões (sem acentos). */
export function searchPnfPatterns(patterns: PnfPattern[], query: string): PnfPattern[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return patterns;
  return patterns.filter((p) => {
    const haystack = normalize([p.name, p.englishName, ...p.aliases, ...p.variants.map((v) => v.name)].join(" "));
    return words.every((w) => haystack.includes(w));
  });
}
