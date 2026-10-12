import { SYMBOL_PATTERN } from "@/lib/market";
import { analyzeSignals, type RadarItem } from "@/lib/radar";
import { MAX_WATCHLIST_SIZE } from "@/lib/watchlist";
import { getHistory } from "@/lib/yahoo";

/** Ativos analisados ao mesmo tempo: o suficiente para ser rápido sem sobrecarregar o Yahoo. */
const CONCURRENCY = 4;

/**
 * Radar de sinais dos favoritos: candles diários de 1 ano de cada ativo e os sinais recentes de
 * todos os indicadores. A falha de um ativo não derruba os outros.
 */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("symbols") ?? "";
  const symbols = [...new Set(raw.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean))];
  if (symbols.length === 0 || symbols.length > MAX_WATCHLIST_SIZE || !symbols.every((s) => SYMBOL_PATTERN.test(s))) {
    return Response.json({ error: "Lista de ativos inválida.", code: "invalid_symbols" }, { status: 400 });
  }

  const items: RadarItem[] = new Array(symbols.length);
  let next = 0;
  async function worker() {
    while (next < symbols.length) {
      const k = next++;
      const symbol = symbols[k];
      try {
        const { bars, warmup } = await getHistory(symbol, "1y");
        items[k] = { symbol, analysis: analyzeSignals(bars, warmup) };
      } catch (error) {
        console.error("[api/radar]", symbol, error);
        items[k] = { symbol, error: true };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, symbols.length) }, worker));
  return Response.json({ items, checkedAt: new Date().toISOString() });
}
