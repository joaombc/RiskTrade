import type { Category, GlossaryTerm } from "./types";

/** Minúsculas e sem acentos: "Exaustão" e "exaustao" se encontram. */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/**
 * Filtra por categoria e por texto. Todas as palavras da busca precisam aparecer no nome,
 * nos apelidos ou na definição. Resultados com a busca no nome/apelido vêm primeiro.
 */
export function searchTerms(terms: GlossaryTerm[], query: string, category: Category | null): GlossaryTerm[] {
  const inCategory = category ? terms.filter((t) => t.category === category) : terms;
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return inCategory;

  const scored = inCategory.flatMap((term) => {
    const title = normalize([term.name, ...term.aliases].join(" "));
    const body = normalize(term.definition);
    if (!words.every((w) => title.includes(w) || body.includes(w))) return [];
    const titleHits = words.filter((w) => title.includes(w)).length;
    return [{ term, score: titleHits }];
  });
  return scored.sort((a, b) => b.score - a.score).map((s) => s.term);
}
