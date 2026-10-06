import { SYMBOL_PATTERN } from "@/lib/market";
import { MAX_WATCHLIST_SIZE } from "@/lib/watchlist";
import { getWatchlistQuotes } from "@/lib/yahoo";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("symbols") ?? "";
  const symbols = [...new Set(raw.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean))];

  if (symbols.length === 0) return Response.json({ quotes: [] });
  if (symbols.length > MAX_WATCHLIST_SIZE || !symbols.every((s) => SYMBOL_PATTERN.test(s))) {
    return Response.json({ error: "Lista de tickers inválida.", code: "invalid_list" }, { status: 400 });
  }

  try {
    const quotes = await getWatchlistQuotes(symbols);
    return Response.json({ quotes });
  } catch (error) {
    console.error("[api/watchlist]", error);
    return Response.json(
      { error: "Serviço do Yahoo Finance indisponível no momento. Tente novamente em instantes.", code: "unavailable" },
      { status: 502 },
    );
  }
}
