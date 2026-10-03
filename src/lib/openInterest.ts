import type { Bar } from "./drawings/types";

/** Contrato no relatório Commitments of Traders (COT) da CFTC, versão Legacy, só futuros. */
export interface CotMarket {
  /** Código do contrato na CFTC (cftc_contract_market_code). */
  code: string;
  name: string;
}

/**
 * Futuros com interesse aberto histórico, pela raiz do símbolo no Yahoo (ES=F → ES). O relatório
 * soma todos os vencimentos do contrato, que é o número que Murphy recomenda acompanhar.
 */
export const COT_MARKETS: Record<string, CotMarket> = {
  // Índices de ações
  ES: { code: "13874A", name: "E-mini S&P 500" },
  NQ: { code: "209742", name: "E-mini Nasdaq-100" },
  YM: { code: "124603", name: "E-mini Dow ($5)" },
  RTY: { code: "239742", name: "E-mini Russell 2000" },
  // Energia
  CL: { code: "067651", name: "Petróleo WTI" },
  NG: { code: "023651", name: "Gás natural" },
  RB: { code: "111659", name: "Gasolina RBOB" },
  // Metais
  GC: { code: "088691", name: "Ouro" },
  SI: { code: "084691", name: "Prata" },
  HG: { code: "085692", name: "Cobre" },
  PL: { code: "076651", name: "Platina" },
  PA: { code: "075651", name: "Paládio" },
  // Juros (Treasuries)
  ZT: { code: "042601", name: "Treasury 2 anos" },
  ZF: { code: "044601", name: "Treasury 5 anos" },
  ZN: { code: "043602", name: "Treasury 10 anos" },
  ZB: { code: "020601", name: "Treasury Bond" },
  // Moedas
  "6E": { code: "099741", name: "Euro" },
  "6J": { code: "097741", name: "Iene" },
  "6B": { code: "096742", name: "Libra" },
  "6C": { code: "090741", name: "Dólar canadense" },
  "6A": { code: "232741", name: "Dólar australiano" },
  "6S": { code: "092741", name: "Franco suíço" },
  "6M": { code: "095741", name: "Peso mexicano" },
  "6L": { code: "102741", name: "Real" },
  DX: { code: "098662", name: "Índice do dólar (DXY)" },
  // Agrícolas e pecuária
  ZC: { code: "002602", name: "Milho" },
  ZS: { code: "005602", name: "Soja" },
  ZW: { code: "001602", name: "Trigo" },
  KC: { code: "083731", name: "Café" },
  SB: { code: "080732", name: "Açúcar" },
  CC: { code: "073732", name: "Cacau" },
  CT: { code: "033661", name: "Algodão" },
  LE: { code: "057642", name: "Boi gordo" },
  HE: { code: "054642", name: "Suíno magro" },
  // Cripto (CME)
  BTC: { code: "133741", name: "Bitcoin" },
  ETH: { code: "146021", name: "Ether" },
};

/** Contrato da CFTC de um futuro do Yahoo (ex.: "CL=F"), ou null quando não há dado. */
export function cotMarketFor(symbol: string): CotMarket | null {
  const root = /^([A-Z0-9]+)=F$/.exec(symbol.toUpperCase())?.[1];
  return root && Object.hasOwn(COT_MARKETS, root) ? COT_MARKETS[root] : null;
}

/** Interesse aberto de um relatório: data de referência (terça-feira) e contratos em aberto. */
export interface OpenInterestPoint {
  date: string;
  value: number;
}

/** Série do interesse aberto alinhada aos candles do gráfico (null antes do primeiro relatório). */
export interface OpenInterestSeries {
  values: (number | null)[];
  /** Data do relatório mais recente (AAAA-MM-DD). */
  lastReport: string;
}

/** Converte a resposta da API da CFTC em pontos ordenados por data, descartando linhas inválidas. */
export function parseCotRows(rows: unknown): OpenInterestPoint[] {
  if (!Array.isArray(rows)) return [];
  const byDate = new Map<string, number>();
  for (const row of rows) {
    const date = String(row?.report_date_as_yyyy_mm_dd ?? "").slice(0, 10);
    const value = Number(row?.open_interest_all);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(value) || value < 0) continue;
    byDate.set(date, value);
  }
  return [...byDate].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));
}

/**
 * Para cada candle, o relatório mais recente até o dia dele: a linha fica em degraus e o
 * painel usa exatamente os mesmos candles do preço. Os candles diários de futuros vêm à
 * meia-noite de Nova York (04:00 UTC), depois da meia-noite UTC da terça do relatório, então
 * o candle de terça já recebe o valor daquele relatório.
 */
export function alignToBars(bars: Bar[], points: OpenInterestPoint[]): OpenInterestSeries | null {
  if (points.length === 0) return null;
  const values: (number | null)[] = [];
  let current: number | null = null;
  let next = 0;
  for (const bar of bars) {
    while (next < points.length && Date.parse(`${points[next].date}T00:00:00Z`) / 1000 <= bar.time) {
      current = points[next].value;
      next++;
    }
    values.push(current);
  }
  if (values.every((v) => v === null)) return null;
  return { values, lastReport: points[Math.max(0, next - 1)].date };
}

/** Janela da leitura automática: cerca de 4 semanas de pregões, ou 4 relatórios da CFTC. */
export const OPEN_INTEREST_LOOKBACK_BARS = 20;
/** Variação mínima do interesse aberto para contar como alta ou queda (abaixo disso, estável). */
const OPEN_INTEREST_THRESHOLD = 0.02;
/** Variação mínima do preço para contar como tendência (abaixo disso, lateral). */
const PRICE_THRESHOLD = 0.01;

/**
 * As quatro combinações de Murphy (cap. 7); o preço lateral com acúmulo de contratos, que
 * fortalece o rompimento seguinte; e os casos sem sinal (interesse aberto estável ou preço
 * lateral sem acúmulo).
 */
export type OpenInterestReading =
  | "up-rising"
  | "up-falling"
  | "down-rising"
  | "down-falling"
  | "flat-rising"
  | "stable";

export interface OpenInterestTrend {
  reading: OpenInterestReading;
  priceChange: number;
  openInterestChange: number;
  /** Índices dos candles comparados. */
  from: number;
  to: number;
}

/**
 * Compara preço e interesse aberto entre o último candle com dado e o de ~4 semanas antes.
 * Devolve null quando a série é curta demais para a comparação.
 */
export function readOpenInterest(
  bars: Bar[],
  values: (number | null)[],
  lookback = OPEN_INTEREST_LOOKBACK_BARS,
): OpenInterestTrend | null {
  let to = Math.min(bars.length, values.length) - 1;
  while (to >= 0 && values[to] === null) to--;
  const from = to - lookback;
  if (from < 0) return null;
  const oiFrom = values[from];
  const oiTo = values[to];
  if (oiFrom === null || oiTo === null || oiFrom <= 0 || bars[from].close <= 0) return null;

  const priceChange = bars[to].close / bars[from].close - 1;
  const openInterestChange = oiTo / oiFrom - 1;
  const oi = Math.abs(openInterestChange) < OPEN_INTEREST_THRESHOLD ? "stable" : openInterestChange > 0 ? "rising" : "falling";
  const price = Math.abs(priceChange) < PRICE_THRESHOLD ? "flat" : priceChange > 0 ? "up" : "down";
  let reading: OpenInterestReading = "stable";
  if (price === "flat") reading = oi === "rising" ? "flat-rising" : "stable";
  else if (oi !== "stable") reading = `${price}-${oi}`;
  return { reading, priceChange, openInterestChange, from, to };
}
