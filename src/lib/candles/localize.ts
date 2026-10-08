import type { Locale } from "@/i18n/config";
import type { PatternTranslation } from "./en";
import { CANDLE_PATTERNS, CH12_DETAIL, CLASSIC } from "./patterns";
import type { CandlePattern } from "./types";

/** O padrão em inglês: nome original, textos traduzidos e o mesmo desenho das velas. */
export function localizePattern(pattern: CandlePattern, text: PatternTranslation, sources: Record<string, string>): CandlePattern {
  return {
    ...pattern,
    name: pattern.englishName,
    summary: text.summary,
    recognition: text.recognition,
    psychology: text.psychology,
    confirmation: text.confirmation,
    variants: pattern.variants.map((v, i) => ({ ...v, name: text.variants[i] })),
    source: pattern.source === CH12_DETAIL ? sources.detailed : pattern.source === CLASSIC ? sources.classic : pattern.source,
  };
}

/** Padrões no idioma pedido. O inglês só é carregado quando necessário (no servidor). */
export async function getCandlePatterns(locale: Locale): Promise<CandlePattern[]> {
  if (locale === "pt-BR") return CANDLE_PATTERNS;
  const { PATTERNS_EN, SOURCES_EN } = await import("./en");
  return CANDLE_PATTERNS.map((p) => (PATTERNS_EN[p.slug] ? localizePattern(p, PATTERNS_EN[p.slug], SOURCES_EN) : p));
}
