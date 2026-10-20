import { SYMBOL_PATTERN } from "@/lib/market";
import type { Bar } from "@/lib/drawings/types";
import { CURRENCIES, type Currency } from "@/lib/portfolioAccount";
import { MAX_PORTFOLIO_ASSETS } from "@/lib/portfolioAssets";
import { tradePlan, type TradePlan } from "@/lib/tradePlan";
import { getFxRates, getHistory, getLastPrices } from "@/lib/yahoo";

/** Ativos analisados ao mesmo tempo: o suficiente para ser rápido sem sobrecarregar o Yahoo. */
const CONCURRENCY = 4;
/** O semanal muda devagar: guardado por 30 minutos. */
const WEEKLY_TTL_MS = 30 * 60_000;
const weeklyCache = new Map<string, { bars: Bar[]; at: number }>();

async function weeklyBars(symbol: string): Promise<Bar[] | null> {
  const cached = weeklyCache.get(symbol);
  if (cached && Date.now() - cached.at < WEEKLY_TTL_MS) return cached.bars;
  try {
    const { bars } = await getHistory(symbol, "w2y");
    weeklyCache.set(symbol, { bars, at: Date.now() });
    return bars;
  } catch {
    return null;
  }
}

export interface PlanItem {
  symbol: string;
  plan?: TradePlan;
  currency?: string;
  /** Quanto vale 1 unidade da moeda do ativo na moeda da conta. */
  fx?: number;
  /** Candles diários (com o de hoje ao vivo), só dos ativos pedidos em `withBars` (posições abertas). */
  bars?: Bar[];
  error?: true;
}

/**
 * Plano de cada ativo da carteira (Murphy, cap. 16): tendência no diário e no semanal, entrada,
 * stop e alvo. A quantidade depende da conta e é calculada no navegador, assim como a gestão das
 * posições abertas (por isso os candles delas vão junto).
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const symbols = [...new Set((params.get("symbols") ?? "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean))];
  const currency = (params.get("currency") ?? "BRL") as Currency;
  const withBars = new Set((params.get("withBars") ?? "").split(",").map((s) => s.trim().toUpperCase()));
  if (symbols.length === 0 || symbols.length > MAX_PORTFOLIO_ASSETS || !symbols.every((s) => SYMBOL_PATTERN.test(s))) {
    return Response.json({ error: "Lista de ativos inválida.", code: "invalid_symbols" }, { status: 400 });
  }
  if (!CURRENCIES.includes(currency)) {
    return Response.json({ error: "Moeda inválida.", code: "invalid_currency" }, { status: 400 });
  }

  const prices = await getLastPrices(symbols).catch(() => ({}) as Awaited<ReturnType<typeof getLastPrices>>);
  const items: PlanItem[] = new Array(symbols.length);
  let next = 0;
  async function worker() {
    while (next < symbols.length) {
      const k = next++;
      const symbol = symbols[k];
      try {
        const [{ bars }, weekly] = await Promise.all([getHistory(symbol, "1y"), weeklyBars(symbol)]);
        // O candle de hoje com a cotação mais recente, para o plano acompanhar o pregão.
        const quote = prices[symbol];
        const last = bars[bars.length - 1];
        const live =
          quote && last
            ? [...bars.slice(0, -1), { ...last, close: quote.price, high: Math.max(last.high, quote.price), low: Math.min(last.low, quote.price) }]
            : bars;
        items[k] = { symbol, plan: tradePlan(live, weekly), currency: quote?.currency, ...(withBars.has(symbol) ? { bars: live } : {}) };
      } catch (error) {
        console.error("[api/plan]", symbol, error);
        items[k] = { symbol, error: true };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, symbols.length) }, worker));

  const rates = await getFxRates(
    items.flatMap((i) => (i.currency ? [i.currency] : [])),
    currency,
  ).catch(() => ({}) as Record<string, number>);
  for (const item of items) if (item.currency) item.fx = rates[item.currency];
  return Response.json({ items, checkedAt: new Date().toISOString() });
}
