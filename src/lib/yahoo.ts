import "server-only";
import YahooFinance from "yahoo-finance2";
import { averageVolume, toMarketStatus, type AssetSummary, type SearchResult } from "./market";

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

// ~45 dias corridos cobrem 20 pregões mesmo com feriados.
const VOLUME_LOOKBACK_MS = 45 * 24 * 60 * 60 * 1000;

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
