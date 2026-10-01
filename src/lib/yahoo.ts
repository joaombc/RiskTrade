import "server-only";
import YahooFinance from "yahoo-finance2";
import type { Bar } from "./drawings/types";
import {
  averageVolume,
  HISTORY_RANGES,
  toMarketStatus,
  type AssetSummary,
  type HistoryRange,
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

/** Candles diários do período, descartando barras sem OHLC completo. */
export async function getHistory(symbol: string, range: HistoryRange): Promise<Bar[]> {
  const chart = await yahooFinance.chart(symbol, {
    period1: new Date(Date.now() - HISTORY_RANGES[range].days * DAY_MS),
    interval: "1d",
  });
  if (chart.quotes.length === 0) throw new AssetNotFoundError(symbol);

  return chart.quotes.flatMap((q) =>
    q.open == null || q.high == null || q.low == null || q.close == null
      ? []
      : [
          {
            time: Math.floor(q.date.getTime() / 1000),
            open: q.open,
            high: q.high,
            low: q.low,
            close: q.close,
            volume: q.volume ?? 0,
          },
        ],
  );
}

/** Fechamentos diários desde `period1`. Sem histórico, devolve lista vazia em vez de falhar. */
async function recentCloses(symbol: string, period1: Date): Promise<number[]> {
  try {
    const chart = await yahooFinance.chart(symbol, { period1, interval: "1d" });
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

  const chart = await yahooFinance.chart(quote.symbol, {
    period1: new Date(Date.now() - VOLUME_LOOKBACK_MS),
    interval: "1d",
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
    avgVolume20d: averageVolume(chart.quotes),
    marketStatus: toMarketStatus(quote.marketState),
    updatedAt: (quote.regularMarketTime ?? new Date()).toISOString(),
  };
}
