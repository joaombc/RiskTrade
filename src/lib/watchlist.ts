export interface WatchlistEntry {
  symbol: string;
  name: string;
  tags: string[];
  addedAt: number;
}

export interface WatchlistQuote {
  symbol: string;
  currency: string;
  price: number;
  changePercent: number;
  volume: number;
  /** Fechamentos diários recentes, do mais antigo ao mais novo. */
  sparkline: number[];
}

export type SortKey = "change" | "volume" | "alpha";

export const SORT_LABELS: Record<SortKey, string> = {
  change: "Maior variação",
  volume: "Maior volume",
  alpha: "Ordem alfabética",
};

/** Sugestões de cenário operacional; o usuário também pode criar etiquetas livres. */
export const SCENARIO_TAGS = [
  "Teste de Suporte",
  "Teste de Resistência",
  "Aguardando Rompimento",
  "Rompimento Confirmado",
  "OCO",
  "OCO Invertido",
  "Triângulo",
  "Canal de Alta",
  "Canal de Baixa",
];

export const MAX_TAG_LENGTH = 30;
export const MAX_WATCHLIST_SIZE = 50;
export const SPARKLINE_SESSIONS = 30;

export function normalizeTag(tag: string): string {
  return tag.trim().replace(/\s+/g, " ").slice(0, MAX_TAG_LENGTH);
}

/**
 * Ordena a watchlist. Ativos ainda sem cotação (carregando ou com erro) vão para o fim
 * nas ordenações por variação/volume, mantendo a ordem alfabética entre si.
 */
export function sortEntries(
  entries: WatchlistEntry[],
  quotes: Record<string, WatchlistQuote | undefined>,
  key: SortKey,
): WatchlistEntry[] {
  const alpha = (a: WatchlistEntry, b: WatchlistEntry) => a.symbol.localeCompare(b.symbol);
  if (key === "alpha") return [...entries].sort(alpha);

  const metric = (e: WatchlistEntry) => {
    const q = quotes[e.symbol];
    if (!q) return undefined;
    return key === "change" ? q.changePercent : q.volume;
  };
  return [...entries].sort((a, b) => {
    const ma = metric(a);
    const mb = metric(b);
    if (ma === undefined && mb === undefined) return alpha(a, b);
    if (ma === undefined) return 1;
    if (mb === undefined) return -1;
    return mb - ma || alpha(a, b);
  });
}

export function isWatchlistEntry(value: unknown): value is WatchlistEntry {
  if (!value || typeof value !== "object") return false;
  const e = value as Partial<WatchlistEntry>;
  return (
    typeof e.symbol === "string" &&
    typeof e.name === "string" &&
    Array.isArray(e.tags) &&
    e.tags.every((t) => typeof t === "string") &&
    typeof e.addedAt === "number"
  );
}
