import "server-only";
import YahooFinance from "yahoo-finance2";
import type { ChartResultArrayQuote } from "yahoo-finance2/modules/chart";
import type { Bar } from "./drawings/types";
import {
  averageVolume,
  HISTORY_RANGES,
  lastSessions,
  toMarketStatus,
  type AssetSummary,
  type ChartInterval,
  type HistoryRange,
  type HistoryRangeSpec,
  type SearchResult,
} from "./market";
import { SPARKLINE_SESSIONS, type WatchlistQuote } from "./watchlist";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

/** Ticker não encontrado no Yahoo Finance. */
export class AssetNotFoundError extends Error {
  constructor(symbol: string) {
    super(`Ativo "${symbol}" não encontrado`);
    this.name = "AssetNotFoundError";
  }
}

/**
 * O Yahoo responde "No data found, symbol may be delisted" quando o ticker não tem histórico
 * (inexistente ou fora de negociação). É o critério indicado pela própria biblioteca, já que
 * o erro não traz código nem status.
 */
function isNoDataError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("No data found");
}

/**
 * Histórico desde `period1` (diário por padrão); ticker sem dados vira AssetNotFoundError.
 * Só o pregão regular: sem pré e pós-mercado, como nos candles diários.
 */
async function fetchChart(symbol: string, period1: Date, interval: ChartInterval = "1d") {
  try {
    return await yahooFinance.chart(symbol, { period1, interval, includePrePost: false });
  } catch (error) {
    if (isNoDataError(error)) throw new AssetNotFoundError(symbol);
    throw error;
  }
}

export async function searchAssets(query: string): Promise<SearchResult[]> {
  const { quotes } = await yahooFinance.search(query, { quotesCount: 8, newsCount: 0 });

  return quotes.flatMap((q) => {
    if (!q.isYahooFinance) return [];
    return [
      {
        symbol: q.symbol,
        name: q.longname ?? q.shortname ?? q.symbol,
        exchange: q.exchDisp ?? q.exchange,
        type: q.typeDisp,
      },
    ];
  });
}

const DAY_MS = 24 * 60 * 60 * 1000;
// ~45 dias corridos cobrem 20 pregões (média de volume) e os 30 do sparkline, mesmo com feriados.
const VOLUME_LOOKBACK_MS = 45 * DAY_MS;

/**
 * Candles do período (diários ou intradiários, conforme o período), descartando barras sem
 * OHLC completo e mantendo só os últimos pregões quando o período pede (1D, 5D).
 */
export async function getHistory(symbol: string, range: HistoryRange): Promise<Bar[]> {
  const spec: HistoryRangeSpec = HISTORY_RANGES[range];
  const chart = await fetchChart(symbol, new Date(Date.now() - spec.days * DAY_MS), spec.interval);
  if (chart.quotes.length === 0) throw new AssetNotFoundError(symbol);

  const bars = toBars(chart.quotes);
  return spec.sessions ? lastSessions(bars, spec.sessions, chart.meta.gmtoffset) : bars;
}


/** Converte os candles do Yahoo, em ordem e sem horários repetidos (o gráfico exige isso). */
function toBars(quotes: ChartResultArrayQuote[]): Bar[] {
  const byTime = new Map<number, Bar>();
  for (const q of quotes) {
    if (q.open == null || q.high == null || q.low == null || q.close == null) continue;
    const time = Math.floor(q.date.getTime() / 1000);
    // O último candle do dia às vezes vem duplicado como "fechamento"; fica o mais recente.
    byTime.set(time, { time, open: q.open, high: q.high, low: q.low, close: q.close, volume: q.volume ?? 0 });
  }
  return [...byTime.values()].sort((a, b) => a.time - b.time);
}

/** Fechamentos diários desde `period1`. Sem histórico, devolve lista vazia em vez de falhar. */
async function recentCloses(symbol: string, period1: Date): Promise<number[]> {
  try {
    const chart = await fetchChart(symbol, period1);
    return chart.quotes.flatMap((bar) => (bar.close == null ? [] : [bar.close]));
  } catch {
    return [];
  }
}

/** Cotações da watchlist numa só chamada, mais os fechamentos recentes para o sparkline. */
export async function getWatchlistQuotes(symbols: string[]): Promise<WatchlistQuote[]> {
  const quotes = await yahooFinance.quote(symbols, { return: "array" });
  const period1 = new Date(Date.now() - VOLUME_LOOKBACK_MS);
  const priced = quotes.filter(
    (q): q is typeof q & { regularMarketPrice: number } => q.regularMarketPrice !== undefined,
  );

  return Promise.all(
    priced.map(async (q) => ({
      symbol: q.symbol,
      currency: q.currency ?? "",
      price: q.regularMarketPrice,
      changePercent: q.regularMarketChangePercent ?? 0,
      volume: q.regularMarketVolume ?? 0,
      sparkline: (await recentCloses(q.symbol, period1)).slice(-SPARKLINE_SESSIONS),
    })),
  );
}

export async function getAssetSummary(symbol: string): Promise<AssetSummary> {
  const quote = await yahooFinance.quote(symbol);
  if (!quote || quote.regularMarketPrice === undefined) {
    throw new AssetNotFoundError(symbol);
  }

  // Sem histórico o resumo ainda é útil (cotação do dia); só a média de volume fica indisponível.
  const history = await fetchChart(quote.symbol, new Date(Date.now() - VOLUME_LOOKBACK_MS)).catch((error) => {
    if (error instanceof AssetNotFoundError) return null;
    throw error;
  });

  return {
    symbol: quote.symbol,
    name: quote.longName ?? quote.shortName ?? quote.symbol,
    currency: quote.currency ?? "",
    exchange: quote.fullExchangeName,
    price: quote.regularMarketPrice,
    changePercent: quote.regularMarketChangePercent ?? 0,
    dayHigh: quote.regularMarketDayHigh ?? quote.regularMarketPrice,
    dayLow: quote.regularMarketDayLow ?? quote.regularMarketPrice,
    volume: quote.regularMarketVolume ?? 0,
    avgVolume20d: history ? averageVolume(history.quotes) : null,
    marketStatus: toMarketStatus(quote.marketState),
    updatedAt: (quote.regularMarketTime ?? new Date()).toISOString(),
  };
}
