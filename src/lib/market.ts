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

export type ChartInterval = "5m" | "15m" | "30m" | "60m" | "1d";

export interface HistoryRangeSpec {
  label: string;
  /** Duração de cada candle. */
  interval: ChartInterval;
  /** Dias corridos buscados no Yahoo. */
  days: number;
  /** Se definido, mostra só os últimos N pregões (1D, 5D), e não todos os dias buscados. */
  sessions?: number;
}

/**
 * Períodos do gráfico, do mais curto ao mais longo. Os curtos usam candles intradiários
 * (o Yahoo guarda candles de 5 a 30 min só por cerca de 60 dias).
 */
export const HISTORY_RANGES = {
  "1d": { label: "1D", interval: "5m", days: 7, sessions: 1 },
  "5d": { label: "5D", interval: "15m", days: 12, sessions: 5 },
  "2w": { label: "2S", interval: "30m", days: 14 },
  "3w": { label: "3S", interval: "60m", days: 21 },
  "1mo": { label: "1M", interval: "60m", days: 31 },
  "3m": { label: "3M", interval: "1d", days: 92 },
  "6m": { label: "6M", interval: "1d", days: 183 },
  "1y": { label: "1A", interval: "1d", days: 365 },
  "2y": { label: "2A", interval: "1d", days: 730 },
  "5y": { label: "5A", interval: "1d", days: 1826 },
} as const satisfies Record<string, HistoryRangeSpec>;
export type HistoryRange = keyof typeof HISTORY_RANGES;

export const INTERVAL_LABELS: Record<ChartInterval, string> = {
  "5m": "candles de 5 min",
  "15m": "candles de 15 min",
  "30m": "candles de 30 min",
  "60m": "candles de 1 h",
  "1d": "candles diários",
};

export function isIntraday(range: HistoryRange): boolean {
  return HISTORY_RANGES[range].interval !== "1d";
}

/** Pausa a partir da qual consideramos que o pregão terminou (mercados com horário). */
const SESSION_GAP_SECONDS = 3 * 60 * 60;

/**
 * Mantém só os últimos `n` pregões de candles intradiários. Em mercados com horário, um
 * pregão é um dia no fuso da bolsa (`gmtoffset`, em segundos). Em mercados 24 h (cripto),
 * sem pausas, "pregão" vira janelas de 24 horas a partir do último candle.
 */
export function lastSessions<T extends { time: number }>(bars: T[], n: number, gmtoffset: number): T[] {
  if (bars.length === 0) return bars;
  const continuous = bars.every((b, i) => i === 0 || b.time - bars[i - 1].time <= SESSION_GAP_SECONDS);
  if (continuous) {
    const from = bars[bars.length - 1].time - n * 86_400;
    return bars.filter((b) => b.time > from);
  }
  const day = (b: T) => Math.floor((b.time + gmtoffset) / 86_400);
  const days = [...new Set(bars.map(day))];
  const keep = new Set(days.slice(-n));
  return bars.filter((b) => keep.has(day(b)));
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
