import "server-only";
import { cotMarketFor, parseCotRows, type OpenInterestPoint } from "./openInterest";

/** Relatório COT "Legacy – Futures Only" na API pública da CFTC (Socrata). */
const COT_URL = "https://publicreporting.cftc.gov/resource/6dca-aqww.json";
const DAY_MS = 24 * 60 * 60 * 1000;
/** O relatório sai uma vez por semana (sexta, com a posição de terça); algumas horas de cache bastam. */
const CACHE_MS = 6 * 60 * 60 * 1000;
const TIMEOUT_MS = 8000;

const cache = new Map<string, { at: number; points: Promise<OpenInterestPoint[]> }>();

async function fetchCot(code: string, from: string): Promise<OpenInterestPoint[]> {
  const params = new URLSearchParams({
    $select: "report_date_as_yyyy_mm_dd,open_interest_all",
    // O código vem da tabela fixa COT_MARKETS, nunca do usuário.
    $where: `cftc_contract_market_code='${code}' AND report_date_as_yyyy_mm_dd >= '${from}'`,
    $order: "report_date_as_yyyy_mm_dd",
    $limit: "1000",
  });
  const res = await fetch(`${COT_URL}?${params}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`CFTC respondeu ${res.status}`);
  return parseCotRows(await res.json());
}

/**
 * Interesse aberto semanal desde `since` (com uma semana de folga, para os primeiros candles
 * já terem valor). Devolve null quando o símbolo não é um futuro do relatório COT.
 */
export async function getOpenInterest(symbol: string, since: Date): Promise<OpenInterestPoint[] | null> {
  const market = cotMarketFor(symbol);
  if (!market) return null;

  const from = new Date(since.getTime() - 8 * DAY_MS).toISOString().slice(0, 10);
  const key = `${market.code}:${from}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.points;

  const points = fetchCot(market.code, from);
  cache.set(key, { at: Date.now(), points });
  // Uma falha não fica no cache: a próxima chamada tenta de novo.
  points.catch(() => cache.delete(key));
  return points;
}
