export type MarketStatus = "open" | "closed" | "pre" | "post";

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export interface AssetSummary {
  symbol: string;
  name: string;
  currency: string;
  exchange: string;
  price: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  avgVolume20d: number | null;
  marketStatus: MarketStatus;
  updatedAt: string;
}

export interface DailyBar {
  date: Date;
  volume: number | null;
}

/** Formato aceito para tickers do Yahoo (ex: AAPL, PETR4.SA, BTC-USD, ^BVSP, EURUSD=X). */
export const SYMBOL_PATTERN = /^[A-Za-z0-9.\-=^]{1,20}$/;

/** Períodos do gráfico diário: duração em dias corridos e rótulo exibido. */
export const HISTORY_RANGES = {
  "3m": { days: 92, label: "3M" },
  "6m": { days: 183, label: "6M" },
  "1y": { days: 365, label: "1A" },
  "2y": { days: 730, label: "2A" },
  "5y": { days: 1826, label: "5A" },
} as const;
export type HistoryRange = keyof typeof HISTORY_RANGES;

export const AVG_VOLUME_PERIOD = 20;

/**
 * Média de volume das últimas `period` sessões anteriores à sessão atual.
 * O último candle é a sessão corrente (o mesmo volume exibido como "atual"),
 * então ele fica de fora para a comparação não ser contaminada por si mesma.
 */
export function averageVolume(bars: DailyBar[], period = AVG_VOLUME_PERIOD): number | null {
  const previous = bars
    .slice(0, -1)
    .map((bar) => bar.volume)
    .filter((v): v is number => typeof v === "number" && v > 0)
    .slice(-period);

  if (previous.length < period) return null;
  return previous.reduce((sum, v) => sum + v, 0) / previous.length;
}

export function toMarketStatus(state: string | undefined): MarketStatus {
  switch (state) {
    case "REGULAR":
      return "open";
    case "PRE":
    case "PREPRE":
      return "pre";
    case "POST":
    case "POSTPOST":
      return "post";
    default:
      return "closed";
  }
}
