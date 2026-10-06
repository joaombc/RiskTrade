export type MarketStatus = "open" | "closed" | "pre" | "post";

/** Ação ou ETF negociado nos EUA: os ativos com relatório pré-market. */
export type USListing = "stock" | "etf";

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
  /** Ação ou ETF do mercado americano (o card mostra o botão do relatório pré-market); null nos demais. */
  usListing: USListing | null;
  /** Contratos em aberto do vencimento atual (só futuros e opções; null nos demais ativos). */
  openInterest: number | null;
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
/** Períodos dos botões do gráfico. */
export type PresetRange = keyof typeof HISTORY_RANGES;
/** Período digitado: os últimos N pregões ("n200"). */
export type CustomRange = `n${number}`;
export type HistoryRange = PresetRange | CustomRange;

export const MIN_CUSTOM_SESSIONS = 1;
/** Cerca de 20 anos de pregões. */
export const MAX_CUSTOM_SESSIONS = 5000;

/** Período personalizado com N pregões, ou null fora dos limites. */
export function customRange(sessions: number): CustomRange | null {
  return Number.isInteger(sessions) && sessions >= MIN_CUSTOM_SESSIONS && sessions <= MAX_CUSTOM_SESSIONS
    ? `n${sessions}`
    : null;
}

/** Quantidade de pregões de um período personalizado (null nos botões). */
export function customSessions(range: HistoryRange): number | null {
  const match = /^n(\d+)$/.exec(range);
  return match ? Number(match[1]) : null;
}

/** Valida um período vindo de fora (URL, API): botão conhecido ou "n" + pregões dentro dos limites. */
export function parseRange(value: string): HistoryRange | null {
  if (Object.hasOwn(HISTORY_RANGES, value)) return value as PresetRange;
  const match = /^n(\d{1,5})$/.exec(value);
  return match ? customRange(Number(match[1])) : null;
}

/**
 * Tamanho do candle de um período personalizado, na mesma lógica dos botões: 1 pregão em 5 min
 * (1D), até 5 em 15 min (5D), até 10 em 30 min (2S), até 22 em 1 h (1M) e daí em diante diário.
 */
export function customInterval(sessions: number): ChartInterval {
  if (sessions <= 1) return "5m";
  if (sessions <= 5) return "15m";
  if (sessions <= 10) return "30m";
  if (sessions <= 22) return "60m";
  return "1d";
}

/** Especificação de qualquer período, botão ou personalizado. */
export function rangeSpec(range: HistoryRange): HistoryRangeSpec {
  const sessions = customSessions(range);
  if (sessions === null) return HISTORY_RANGES[range as PresetRange];
  // Cerca de 7 dias corridos a cada 5 pregões, mais uma semana de folga para feriados.
  return { label: `${sessions}D`, interval: customInterval(sessions), days: Math.ceil((sessions * 7) / 5) + 7, sessions };
}

/** Máximo de fechamentos anteriores ao período enviados para aquecer as médias móveis. */
export const MAX_WARMUP_BARS = 400;

/**
 * Dias corridos buscados antes do período para ter até MAX_WARMUP_BARS candles de aquecimento.
 * Nos intradiários o limite é o histórico do Yahoo (cerca de 60 dias para 5 a 30 min): o 30m
 * fica em 40 dias para o total (2S + aquecimento) não passar disso.
 */
export const WARMUP_DAYS: Record<ChartInterval, number> = {
  "5m": 10,
  "15m": 25,
  "30m": 40,
  "60m": 90,
  "1d": 600,
};

/**
 * Máximo de dias corridos que o Yahoo devolve em cada intervalo intradiário (cerca de 60 dias de
 * 5 a 30 min e 730 de 1 h). Período + aquecimento não podem passar disso.
 */
export const MAX_LOOKBACK_DAYS: Partial<Record<ChartInterval, number>> = {
  "5m": 59,
  "15m": 59,
  "30m": 59,
  "60m": 729,
};

export const INTERVAL_LABELS: Record<ChartInterval, string> = {
  "5m": "candles de 5 min",
  "15m": "candles de 15 min",
  "30m": "candles de 30 min",
  "60m": "candles de 1 h",
  "1d": "candles diários",
};

export function isIntraday(range: HistoryRange): boolean {
  return rangeSpec(range).interval !== "1d";
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

type Candle = { time: number; open: number; high: number; low: number; close: number; volume: number };

/** Mesmos candles nas duas listas (horário, OHLC e volume): uma atualização que não mudou nada. */
export function sameBars(a: Candle[], b: Candle[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every(
    (x, i) =>
      x.time === b[i].time &&
      x.open === b[i].open &&
      x.high === b[i].high &&
      x.low === b[i].low &&
      x.close === b[i].close &&
      x.volume === b[i].volume,
  );
}
