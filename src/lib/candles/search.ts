import { normalize } from "../glossary/search";
import type { Bias, CandleKind, CandlePattern } from "./types";

export interface CandleFilters {
  query: string;
  kind: CandleKind | null;
  bias: Exclude<Bias, "neutral"> | null;
  count: number | null;
}

/**
 * Busca por nome em português, nome original e apelidos (sem acentos), com filtros por tipo,
 * direção (alguma versão de alta ou de baixa) e número de velas.
 */
export function searchCandles(patterns: CandlePattern[], { query, kind, bias, count }: CandleFilters): CandlePattern[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return patterns.filter((p) => {
    if (kind && p.kind !== kind) return false;
    if (bias && !p.variants.some((v) => v.bias === bias)) return false;
    if (count && p.candleCount !== count) return false;
    if (words.length === 0) return true;
    const haystack = normalize([p.name, p.englishName, ...p.aliases, ...p.variants.map((v) => v.name)].join(" "));
    return words.every((w) => haystack.includes(w));
  });
}
