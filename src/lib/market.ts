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
