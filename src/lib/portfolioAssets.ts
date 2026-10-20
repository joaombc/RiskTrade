/**
 * Ativos acompanhados na carteira e o grupo de cada um (Murphy, cap. 16): ativos do mesmo grupo
 * costumam andar juntos, então o limite por grupo e a diversificação olham para ele. Cálculos puros.
 */

/** Setores das ações (os do Yahoo) e grupos dos outros mercados. */
export const ASSET_GROUPS = [
  "technology",
  "financial",
  "energy",
  "materials",
  "consumerCyclical",
  "consumerDefensive",
  "healthcare",
  "industrials",
  "communication",
  "utilities",
  "realEstate",
  "stockIndex",
  "etf",
  "crypto",
  "currencies",
  "metals",
  "energyFutures",
  "grains",
  "softs",
  "livestock",
  "interestRates",
  "other",
] as const;
export type AssetGroup = (typeof ASSET_GROUPS)[number];

export interface PortfolioAsset {
  symbol: string;
  name: string;
  group: AssetGroup;
  /** Moeda da cotação (BRL, USD...); vazia se o Yahoo não informar. */
  currency: string;
  addedAt: number;
}

/** O que o servidor descobre de um ativo para classificá-lo. */
export interface AssetInfo {
  symbol: string;
  name: string;
  currency: string;
  /** EQUITY, ETF, FUTURE, CRYPTOCURRENCY, CURRENCY, INDEX... */
  quoteType: string;
  /** Setor em inglês, como o Yahoo devolve ("Technology"); só ações. */
  sector: string | null;
}

export const MAX_PORTFOLIO_ASSETS = 50;

const SECTORS: Record<string, AssetGroup> = {
  Technology: "technology",
  "Financial Services": "financial",
  Energy: "energy",
  "Basic Materials": "materials",
  "Consumer Cyclical": "consumerCyclical",
  "Consumer Defensive": "consumerDefensive",
  Healthcare: "healthcare",
  Industrials: "industrials",
  "Communication Services": "communication",
  Utilities: "utilities",
  "Real Estate": "realEstate",
};

/** Raiz do contrato futuro (ES=F → ES) e o grupo de cada uma. */
const FUTURES: Record<string, AssetGroup> = {
  ...Object.fromEntries(["GC", "SI", "HG", "PL", "PA", "MGC", "SIL"].map((r) => [r, "metals"])),
  ...Object.fromEntries(["CL", "NG", "HO", "RB", "BZ", "QM", "MCL"].map((r) => [r, "energyFutures"])),
  ...Object.fromEntries(["ZC", "ZS", "ZW", "ZM", "ZL", "ZO", "ZR", "KE"].map((r) => [r, "grains"])),
  ...Object.fromEntries(["KC", "CC", "SB", "CT", "OJ", "LBS"].map((r) => [r, "softs"])),
  ...Object.fromEntries(["LE", "HE", "GF"].map((r) => [r, "livestock"])),
  ...Object.fromEntries(["ZN", "ZB", "ZF", "ZT", "UB", "TN", "GE", "SR3"].map((r) => [r, "interestRates"])),
  ...Object.fromEntries(["ES", "NQ", "YM", "RTY", "MES", "MNQ", "MYM", "M2K", "NKD"].map((r) => [r, "stockIndex"])),
  ...Object.fromEntries(["6E", "6J", "6B", "6A", "6C", "6S", "6N", "6M", "6L", "DX"].map((r) => [r, "currencies"])),
};

/** Grupo inicial do ativo pelo tipo, pelo setor e pela raiz do futuro; o usuário pode trocar. */
export function inferGroup(info: Pick<AssetInfo, "symbol" | "quoteType" | "sector">): AssetGroup {
  switch (info.quoteType) {
    case "CRYPTOCURRENCY":
      return "crypto";
    case "CURRENCY":
      return "currencies";
    case "INDEX":
      return "stockIndex";
    case "ETF":
    case "MUTUALFUND":
      return "etf";
    case "FUTURE":
      return FUTURES[info.symbol.replace(/=F$/, "").replace(/[FGHJKMNQUVXZ]\d{2}\..*$/, "")] ?? "other";
    default:
      return (info.sector && SECTORS[info.sector]) || "other";
  }
}

export const isAssetGroup = (value: unknown): value is AssetGroup => (ASSET_GROUPS as readonly unknown[]).includes(value);

export function isPortfolioAsset(value: unknown): value is PortfolioAsset {
  if (!value || typeof value !== "object") return false;
  const a = value as Partial<PortfolioAsset>;
  return typeof a.symbol === "string" && typeof a.name === "string" && isAssetGroup(a.group) && typeof a.currency === "string" && typeof a.addedAt === "number";
}

export interface GroupSummary {
  group: AssetGroup;
  symbols: string[];
  /** Mais ativos do que o limite por grupo comporta em posições cheias. */
  crowded: boolean;
}

/**
 * Ativos por grupo, do maior para o menor. Um grupo fica "cheio" quando tem mais ativos do que
 * cabem no limite do grupo com cada um no limite por ativo (ex.: 25% ÷ 15% = 1 posição cheia).
 */
export function groupSummary(assets: PortfolioAsset[], maxPerGroup: number, maxPerAsset: number): GroupSummary[] {
  const fits = positionsPerGroup(maxPerGroup, maxPerAsset);
  const byGroup = new Map<AssetGroup, string[]>();
  for (const a of assets) byGroup.set(a.group, [...(byGroup.get(a.group) ?? []), a.symbol]);
  return [...byGroup.entries()]
    .map(([group, symbols]) => ({ group, symbols, crowded: group !== "other" && symbols.length > fits }))
    .sort((a, b) => b.symbols.length - a.symbols.length || ASSET_GROUPS.indexOf(a.group) - ASSET_GROUPS.indexOf(b.group));
}

/** Quantas posições cheias cabem num grupo. */
export const positionsPerGroup = (maxPerGroup: number, maxPerAsset: number) => Math.max(1, Math.floor(maxPerGroup / maxPerAsset));
