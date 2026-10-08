import "server-only";
import YahooFinance from "yahoo-finance2";
import type { ChartResultArrayQuote } from "yahoo-finance2/modules/chart";
import { getAaiiSentiment } from "./aaii";
import type { Bar } from "./drawings/types";
import {
  averageVolume,
  lastSessions,
  MAX_LOOKBACK_DAYS,
  MAX_WARMUP_BARS,
  rangeSpec,
  WARMUP_DAYS,
  toMarketStatus,
  type AssetSummary,
  type ChartInterval,
  type HistoryRange,
  type HistoryRangeSpec,
  type SearchResult,
  type USListing,
} from "./market";
import {
  atr,
  classifyGap,
  crossedLevel,
  nearestLevels,
  openingMove,
  pickNews,
  priceTargetOrNull,
  technicalMap,
  type AnalystAction,
  type MarketContextItem,
  type PremarketReport,
  type QuoteSnapshot,
} from "./premarket";
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

export interface History {
  bars: Bar[];
  /** Fechamentos anteriores ao período (até MAX_WARMUP_BARS), só para aquecer as médias móveis. */
  warmup: number[];
}

/**
 * Candles do período (diários ou intradiários, conforme o período), descartando barras sem
 * OHLC completo e mantendo só os últimos pregões quando o período pede (1D, 5D). Busca também
 * um trecho anterior, para que uma MMS 200 já comece na borda esquerda do gráfico.
 */
export async function getHistory(symbol: string, range: HistoryRange): Promise<History> {
  const spec: HistoryRangeSpec = rangeSpec(range);
  const start = Date.now() - spec.days * DAY_MS;
  // Período + aquecimento, sem passar do histórico que o Yahoo guarda para o intervalo.
  const lookback = Math.min(spec.days + WARMUP_DAYS[spec.interval], MAX_LOOKBACK_DAYS[spec.interval] ?? Infinity);
  const chart = await fetchChart(symbol, new Date(Date.now() - lookback * DAY_MS), spec.interval);

  const all = toBars(chart.quotes);
  const bars = spec.sessions
    ? lastSessions(all, spec.sessions, chart.meta.gmtoffset)
    : all.filter((b) => b.time * 1000 >= start);
  if (bars.length === 0) throw new AssetNotFoundError(symbol);

  const first = bars[0].time;
  const warmup = all.filter((b) => b.time < first).slice(-MAX_WARMUP_BARS).map((b) => b.close);
  return { bars, warmup };
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
    usListing: usListing(quote),
    openInterest: quote.openInterest ?? null,
    marketStatus: toMarketStatus(quote.marketState),
    updatedAt: (quote.regularMarketTime ?? new Date()).toISOString(),
  };
}

// ─── Relatório pré-market ──────────────────────────────────────────────────────

/** Ativo fora do escopo do relatório pré-market (só ações e ETFs americanos). */
export class NotUSListedError extends Error {
  constructor(symbol: string) {
    super(`"${symbol}" não é uma ação nem um ETF do mercado americano`);
    this.name = "NotUSListedError";
  }
}

function usListing(quote: { market?: string; quoteType?: string }): USListing | null {
  if (quote.market !== "us_market") return null;
  if (quote.quoteType === "EQUITY") return "stock";
  if (quote.quoteType === "ETF") return "etf";
  return null;
}

/** Contexto do mercado americano mostrado no relatório. */
const MARKET_CONTEXT: { symbol: string; label: string }[] = [
  { symbol: "ES=F", label: "S&P 500 futuro" },
  { symbol: "NQ=F", label: "Nasdaq 100 futuro" },
  { symbol: "DX-Y.NYB", label: "Índice do dólar (DXY)" },
  { symbol: "^VIX", label: "VIX (volatilidade)" },
];

const ANALYST_WINDOW_DAYS = 30;
const MAX_ANALYST_ACTIONS = 5;

async function marketContext(): Promise<MarketContextItem[]> {
  const quotes = await yahooFinance.quote(
    MARKET_CONTEXT.map((c) => c.symbol),
    { return: "array" },
  );
  return MARKET_CONTEXT.flatMap((c) => {
    const q = quotes.find((x) => x.symbol === c.symbol);
    if (!q || q.regularMarketPrice === undefined) return [];
    return [{ symbol: c.symbol, label: c.label, price: q.regularMarketPrice, changePercent: q.regularMarketChangePercent ?? 0 }];
  });
}

async function events(symbol: string) {
  const summary = await yahooFinance.quoteSummary(symbol, { modules: ["calendarEvents", "upgradeDowngradeHistory"] });
  const now = Date.now();

  const next = summary.calendarEvents?.earnings?.earningsDate?.find((d) => d.getTime() > now);
  const earnings = next
    ? {
        date: next.toISOString(),
        estimate: Boolean(summary.calendarEvents?.earnings?.isEarningsDateEstimate),
        daysAway: Math.ceil((next.getTime() - now) / DAY_MS),
      }
    : null;

  const since = now - ANALYST_WINDOW_DAYS * DAY_MS;
  const analysts: AnalystAction[] = (summary.upgradeDowngradeHistory?.history ?? [])
    .filter((h) => h.epochGradeDate.getTime() >= since)
    .slice(0, MAX_ANALYST_ACTIONS)
    .map((h) => {
      // Os preços-alvo vêm na resposta, mas nem toda versão dos tipos da biblioteca os declara.
      const extra = h as unknown as { currentPriceTarget?: number; priorPriceTarget?: number };
      return {
        date: h.epochGradeDate.toISOString(),
        firm: h.firm,
        action: h.action,
        fromGrade: h.fromGrade || null,
        toGrade: h.toGrade,
        priceTarget: priceTargetOrNull(extra.currentPriceTarget),
        priorPriceTarget: priceTargetOrNull(extra.priorPriceTarget),
      };
    });
  return { earnings, analysts };
}

async function news(symbol: string) {
  const { news: items } = await yahooFinance.search(symbol, { quotesCount: 0, newsCount: 15 });
  return pickNews(
    items.map((n) => ({
      title: n.title,
      publisher: n.publisher,
      link: n.link,
      time: n.providerPublishTime,
      relatedTickers: n.relatedTickers,
    })),
    symbol,
  );
}

/** Campos de pré e pós-mercado da cotação. Nem toda variante do tipo Quote os declara, então são lidos um a um. */
function quoteSnapshot(quote: object): QuoteSnapshot {
  const q = quote as Record<string, unknown>;
  const num = (k: string) => (typeof q[k] === "number" ? (q[k] as number) : undefined);
  const date = (k: string) => (q[k] instanceof Date ? (q[k] as Date) : undefined);
  return {
    marketState: typeof q.marketState === "string" ? q.marketState : undefined,
    regularMarketPrice: num("regularMarketPrice"),
    regularMarketPreviousClose: num("regularMarketPreviousClose"),
    regularMarketOpen: num("regularMarketOpen"),
    regularMarketTime: date("regularMarketTime"),
    preMarketPrice: num("preMarketPrice"),
    preMarketTime: date("preMarketTime"),
    postMarketPrice: num("postMarketPrice"),
    postMarketTime: date("postMarketTime"),
  };
}

/** Valor de uma parte opcional do relatório; se ela falhar, o resto continua. */
async function optional<T>(label: string, task: Promise<T>, fallback: T): Promise<T> {
  try {
    return await task;
  } catch (error) {
    console.error(`[premarket] ${label}`, error);
    return fallback;
  }
}

/**
 * Relatório pré-market de uma ação ou ETF americano. Cotação e histórico são obrigatórios;
 * balanço, analistas, notícias, contexto do mercado e sentimento da AAII são opcionais. ETF não tem balanço nem
 * analistas, então essa parte nem é buscada.
 */
export async function getPremarketReport(symbol: string): Promise<PremarketReport> {
  const quote = await yahooFinance.quote(symbol);
  if (!quote || quote.regularMarketPrice === undefined) throw new AssetNotFoundError(symbol);
  const kind = usListing(quote);
  if (!kind) throw new NotUSListedError(quote.symbol);

  const noEvents = { earnings: null, analysts: [] as AnalystAction[] };
  const [history, ev, newsItems, context, sentiment] = await Promise.all([
    getHistory(quote.symbol, "1y"),
    kind === "stock" ? optional("eventos", events(quote.symbol), noEvents) : noEvents,
    optional("notícias", news(quote.symbol), []),
    optional("contexto", marketContext(), []),
    optional("sentimento AAII", getAaiiSentiment(), null),
  ]);

  // Com o pregão aberto, o candle de hoje está incompleto: o mapa técnico usa só pregões fechados.
  const sessionOpen = quote.marketState === "REGULAR";
  const bars = sessionOpen ? history.bars.slice(0, -1) : history.bars;
  const technical = technicalMap(bars, history.warmup);
  const opening = openingMove(quoteSnapshot(quote));
  const reference = opening?.reference ?? technical?.close ?? quote.regularMarketPrice;
  const range = atr(bars);
  const levels = nearestLevels(bars, reference);

  return {
    symbol: quote.symbol,
    kind,
    name: quote.longName ?? quote.shortName ?? quote.symbol,
    currency: quote.currency ?? "USD",
    generatedAt: new Date().toISOString(),
    marketStatus: toMarketStatus(quote.marketState),
    opening,
    atr: range,
    gap: opening ? classifyGap(opening.change, range) : null,
    levels,
    crossed: opening ? crossedLevel(reference, opening.price, levels) : null,
    technical,
    earnings: ev.earnings,
    analysts: ev.analysts,
    news: newsItems,
    context,
    sentiment,
  };
}
