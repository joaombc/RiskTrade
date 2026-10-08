/**
 * Pesquisa semanal de sentimento da AAII (American Association of Individual Investors): % de
 * investidores que esperam alta, estabilidade ou queda das ações nos próximos 6 meses. É um
 * indicador de opinião contrária: pessimismo extremo costuma aparecer perto de fundos, e otimismo
 * extremo, perto de topos.
 */

export const AAII_URL = "https://www.aaii.com/sentimentsurvey/sent_results";

/** Médias históricas publicadas pela AAII (desde 1987), em pontos percentuais. */
export const AAII_AVERAGES = { bullish: 37.5, neutral: 31.5, bearish: 31, spread: 6.5 };

/** Faixas do spread (otimistas − pessimistas) que a AAII cita como pessimismo acentuado e otimismo excessivo. */
export const AAII_PESSIMISTIC_SPREAD = -10;
export const AAII_OPTIMISTIC_SPREAD = 30;

export interface AaiiWeek {
  /** Data de divulgação (YYYY-MM-DD). */
  date: string;
  bullish: number;
  neutral: number;
  bearish: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 24 * 60 * 60 * 1000;

const ROW =
  /<td[^>]*>\s*([A-Z][a-z]{2})\s+(\d{1,2})\s*<\/td>\s*<td[^>]*>\s*([\d.]+)%\s*<\/td>\s*<td[^>]*>\s*([\d.]+)%\s*<\/td>\s*<td[^>]*>\s*([\d.]+)%\s*<\/td>/g;

/**
 * Semanas da tabela de resultados da AAII, da mais nova para a mais antiga. A tabela traz só mês e
 * dia: o ano é deduzido de `now`, voltando um ano sempre que a data "sobe" em relação à linha anterior.
 */
export function parseAaiiSentiment(html: string, now: Date): AaiiWeek[] {
  const weeks: AaiiWeek[] = [];
  let year = now.getUTCFullYear();
  let previous = now.getTime() + 7 * DAY_MS;
  for (const [, mon, day, bullish, neutral, bearish] of html.matchAll(ROW)) {
    const month = MONTHS.indexOf(mon);
    if (month < 0) continue;
    let time = Date.UTC(year, month, Number(day));
    if (time > previous) time = Date.UTC(--year, month, Number(day));
    previous = time;
    weeks.push({
      date: new Date(time).toISOString().slice(0, 10),
      bullish: Number(bullish),
      neutral: Number(neutral),
      bearish: Number(bearish),
    });
  }
  return weeks;
}

/** pessimistic/optimistic: spread nas faixas extremas citadas pela AAII; normal: entre elas. */
export type AaiiMood = "pessimistic" | "optimistic" | "normal";

export interface AaiiSentiment extends AaiiWeek {
  /** Otimistas − pessimistas. */
  spread: number;
  /** Variação contra a semana anterior, em pontos percentuais. */
  change: { bullish: number; neutral: number; bearish: number } | null;
  mood: AaiiMood;
  /** Últimas semanas, da mais antiga para a mais nova, para o mini-histórico. */
  history: AaiiWeek[];
}

const round1 = (v: number) => Math.round(v * 10) / 10;

export function aaiiMood(spread: number): AaiiMood {
  if (spread <= AAII_PESSIMISTIC_SPREAD) return "pessimistic";
  if (spread >= AAII_OPTIMISTIC_SPREAD) return "optimistic";
  return "normal";
}

/** Leitura da semana mais recente; null se a tabela veio vazia. */
export function readAaii(weeks: AaiiWeek[], historyLength = 8): AaiiSentiment | null {
  const [last, previous] = weeks;
  if (!last) return null;
  const spread = round1(last.bullish - last.bearish);
  return {
    ...last,
    spread,
    change: previous
      ? {
          bullish: round1(last.bullish - previous.bullish),
          neutral: round1(last.neutral - previous.neutral),
          bearish: round1(last.bearish - previous.bearish),
        }
      : null,
    mood: aaiiMood(spread),
    history: weeks.slice(0, historyLength).reverse(),
  };
}

/** A pesquisa sai uma vez por semana: guarda a página por algumas horas. */
const CACHE_MS = 6 * 60 * 60 * 1000;
let cache: { at: number; value: AaiiSentiment } | null = null;

/** Busca e lê a pesquisa no site da AAII (só no servidor). */
export async function getAaiiSentiment(now = new Date()): Promise<AaiiSentiment | null> {
  if (cache && now.getTime() - cache.at < CACHE_MS) return cache.value;
  const res = await fetch(AAII_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)" },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`AAII respondeu ${res.status}`);
  const value = readAaii(parseAaiiSentiment(await res.text(), now));
  if (value) cache = { at: now.getTime(), value };
  return value;
}
