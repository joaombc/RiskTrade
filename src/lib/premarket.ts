import { isSwing } from "./drawings/geometry";
import type { Bar } from "./drawings/types";
import { computeOBV, findDivergences } from "./indicators";
import type { MarketStatus } from "./market";
import { computeMovingAverage, findCrossSignals, type CrossSignalKind } from "./movingAverages";

/**
 * Relatório pré-market de uma ação americana: cálculos puros a partir da cotação e do
 * histórico diário. Mostra fatos e níveis a observar; não recomenda compra nem venda.
 */

// ─── Abertura esperada ─────────────────────────────────────────────────────────

/** Campos da cotação do Yahoo usados para medir o movimento fora do pregão. */
export interface QuoteSnapshot {
  marketState?: string;
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketOpen?: number;
  regularMarketTime?: Date;
  preMarketPrice?: number;
  preMarketTime?: Date;
  postMarketPrice?: number;
  postMarketTime?: Date;
}

/**
 * pre: pré-mercado de hoje; open: o pregão já abriu (gap real da abertura); after: after-hours
 * depois do último fechamento, como prévia do próximo pregão.
 */
export type OpeningPhase = "pre" | "open" | "after";

export interface OpeningMove {
  phase: OpeningPhase;
  /** Preço do movimento (pré-mercado, abertura ou after-hours). */
  price: number;
  /** Fechamento com que ele é comparado. */
  reference: number;
  change: number;
  changePercent: number;
  /** Horário da cotação (ISO), quando o Yahoo informa. */
  time: string | null;
}

const isNewer = (a: Date | undefined, b: Date | undefined) => !!a && (!b || a.getTime() > b.getTime());

/**
 * O movimento que interessa em cada fase do mercado. No pré-mercado, o "fechamento" é o
 * regularMarketPrice (o último pregão); com o pregão aberto, compara a abertura de hoje com o
 * fechamento anterior. Devolve null quando não há negócio fora do pregão a mostrar.
 */
export function openingMove(q: QuoteSnapshot): OpeningMove | null {
  const move = (phase: OpeningPhase, price: number, reference: number, time: Date | undefined): OpeningMove => ({
    phase,
    price,
    reference,
    change: price - reference,
    changePercent: ((price - reference) / reference) * 100,
    time: time ? time.toISOString() : null,
  });

  if (q.marketState === "REGULAR") {
    if (q.regularMarketOpen && q.regularMarketPreviousClose) {
      return move("open", q.regularMarketOpen, q.regularMarketPreviousClose, q.regularMarketTime);
    }
    return null;
  }
  if (!q.regularMarketPrice) return null;
  if (q.preMarketPrice && isNewer(q.preMarketTime, q.regularMarketTime)) {
    return move("pre", q.preMarketPrice, q.regularMarketPrice, q.preMarketTime);
  }
  if (q.postMarketPrice && isNewer(q.postMarketTime, q.regularMarketTime)) {
    return move("after", q.postMarketPrice, q.regularMarketPrice, q.postMarketTime);
  }
  return null;
}

// ─── Volatilidade ──────────────────────────────────────────────────────────────

export const ATR_PERIOD = 14;

/** Average True Range: a oscilação média por pregão, incluindo os gaps entre um dia e outro. */
export function atr(bars: Bar[], period = ATR_PERIOD): number | null {
  if (bars.length < period + 1) return null;
  let sum = 0;
  for (let i = bars.length - period; i < bars.length; i++) {
    const { high, low } = bars[i];
    const prevClose = bars[i - 1].close;
    sum += Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
  }
  return sum / period;
}

export type GapSize = "small" | "moderate" | "large";

/** Tamanho do gap em ATRs: até meia oscilação normal é pequeno; acima de uma, grande. */
export function classifyGap(change: number, range: number | null): { atrs: number; size: GapSize } | null {
  if (!range) return null;
  const atrs = Math.abs(change) / range;
  return { atrs, size: atrs < 0.5 ? "small" : atrs <= 1 ? "moderate" : "large" };
}

// ─── Mapa técnico ──────────────────────────────────────────────────────────────

/** Um ano de pregões: a janela das 52 semanas e dos topos e fundos considerados. */
const YEAR_BARS = 252;
/** Candles de cada lado para confirmar um topo ou fundo (como nas divergências). */
export const LEVEL_SWING_WINDOW = 5;

export interface Level {
  price: number;
  /** Data do topo ou fundo (ISO, dia). */
  date: string;
}

const day = (bar: Bar) => new Date(bar.time * 1000).toISOString().slice(0, 10);

/**
 * Resistência mais próxima acima de `price` (topo confirmado) e suporte mais próximo abaixo
 * (fundo confirmado), no último ano.
 */
export function nearestLevels(bars: Bar[], price: number, window = LEVEL_SWING_WINDOW) {
  const recent = bars.slice(-YEAR_BARS);
  let resistance: Level | null = null;
  let support: Level | null = null;
  recent.forEach((bar, i) => {
    if (isSwing(recent, i, "high", window) && bar.high > price && (!resistance || bar.high < resistance.price)) {
      resistance = { price: bar.high, date: day(bar) };
    }
    if (isSwing(recent, i, "low", window) && bar.low < price && (!support || bar.low > support.price)) {
      support = { price: bar.low, date: day(bar) };
    }
  });
  return { support: support as Level | null, resistance: resistance as Level | null };
}

/** Nível atravessado entre o fechamento e o preço fora do pregão (possível gap de rompimento). */
export function crossedLevel(
  reference: number,
  price: number,
  levels: { support: Level | null; resistance: Level | null },
): { kind: "resistance" | "support"; level: Level } | null {
  if (levels.resistance && price > levels.resistance.price) return { kind: "resistance", level: levels.resistance };
  if (levels.support && price < levels.support.price) return { kind: "support", level: levels.support };
  return null;
}

export interface TechnicalMap {
  /** Fechamento do último pregão completo. */
  close: number;
  closeDate: string;
  sma50: number | null;
  sma200: number | null;
  range52w: { high: number; low: number; fromHighPercent: number; fromLowPercent: number };
  volume: { last: number; average: number; ratio: number } | null;
  /** Cruzamento duplo de ações (Murphy, cap. 9). */
  cross: {
    last: { kind: CrossSignalKind; date: string; close: number } | null;
    /** MMS 10 acima (above) ou abaixo (below) da MMS 50 no último pregão. */
    position: "above" | "below" | null;
  };
  divergence: { kind: "bearish" | "bullish"; date: string; barsAgo: number } | null;
}

/** Divergências mais antigas que isso não entram no relatório. */
const DIVERGENCE_MAX_AGE = 30;

/**
 * Mapa técnico sobre os candles diários de pregões completos (sem o de hoje, se o pregão está
 * aberto). `warmup` são fechamentos anteriores, para a MMS 200 já valer no início.
 */
export function technicalMap(bars: Bar[], warmup: number[] = []): TechnicalMap | null {
  if (bars.length < 2) return null;
  const last = bars[bars.length - 1];
  const sma = (period: number) => computeMovingAverage(bars, { kind: "sma", period }, warmup);
  const sma10 = sma(10);
  const sma50 = sma(50);
  const sma200 = sma(200);

  const year = bars.slice(-YEAR_BARS);
  const high = Math.max(...year.map((b) => b.high));
  const low = Math.min(...year.map((b) => b.low));

  const previous = bars.slice(-21, -1).map((b) => b.volume).filter((v) => v > 0);
  const average = previous.length ? previous.reduce((a, b) => a + b, 0) / previous.length : 0;

  const signals = findCrossSignals([
    { period: 10, values: sma10 },
    { period: 50, values: sma50 },
  ]);
  const lastSignal = signals[signals.length - 1];
  const [s10, s50] = [sma10[sma10.length - 1], sma50[sma50.length - 1]];

  const divergences = findDivergences(bars, computeOBV(bars));
  const lastDivergence = divergences[divergences.length - 1];
  const divergenceAge = lastDivergence ? bars.length - 1 - lastDivergence.to : Infinity;

  return {
    close: last.close,
    closeDate: day(last),
    sma50: sma50[sma50.length - 1],
    sma200: sma200[sma200.length - 1],
    range52w: {
      high,
      low,
      fromHighPercent: ((last.close - high) / high) * 100,
      fromLowPercent: ((last.close - low) / low) * 100,
    },
    volume: average > 0 ? { last: last.volume, average, ratio: last.volume / average } : null,
    cross: {
      last: lastSignal
        ? { kind: lastSignal.kind, date: day(bars[lastSignal.index]), close: bars[lastSignal.index].close }
        : null,
      position: s10 === null || s50 === null ? null : s10 > s50 ? "above" : "below",
    },
    divergence:
      lastDivergence && divergenceAge <= DIVERGENCE_MAX_AGE
        ? { kind: lastDivergence.kind, date: day(bars[lastDivergence.to]), barsAgo: divergenceAge }
        : null,
  };
}

// ─── Relatório ─────────────────────────────────────────────────────────────────

export interface AnalystAction {
  date: string;
  firm: string;
  action: string;
  fromGrade: string | null;
  toGrade: string;
  priceTarget: number | null;
  priorPriceTarget: number | null;
}

export interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  time: string;
  /** Quantos tickers a notícia cita: menos = mais focada no ativo. */
  tickers: number;
}

export interface MarketContextItem {
  symbol: string;
  label: string;
  price: number;
  changePercent: number;
}

export interface PremarketReport {
  symbol: string;
  name: string;
  currency: string;
  generatedAt: string;
  marketStatus: MarketStatus;
  opening: OpeningMove | null;
  atr: number | null;
  gap: { atrs: number; size: GapSize } | null;
  levels: { support: Level | null; resistance: Level | null };
  crossed: { kind: "resistance" | "support"; level: Level } | null;
  technical: TechnicalMap | null;
  earnings: { date: string; estimate: boolean; daysAway: number } | null;
  analysts: AnalystAction[];
  news: NewsItem[];
  context: MarketContextItem[];
}

/** Notícias que citam o ticker, das mais focadas (menos tickers) para as menos; entre iguais, as mais novas. */
export function pickNews(
  items: { title: string; publisher: string; link: string; time: Date; relatedTickers?: string[] }[],
  symbol: string,
  limit = 5,
): NewsItem[] {
  return items
    .filter((n) => n.relatedTickers?.includes(symbol))
    .map((n) => ({
      title: n.title,
      publisher: n.publisher,
      link: n.link,
      time: n.time.toISOString(),
      tickers: n.relatedTickers!.length,
    }))
    .sort((a, b) => a.tickers - b.tickers || b.time.localeCompare(a.time))
    .slice(0, limit);
}

/** Preço-alvo de analista; o Yahoo manda 0 quando não há alvo, o que vira null. */
export function priceTargetOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}
