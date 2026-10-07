import { getOpenInterest } from "@/lib/cftc";
import { isIntraday, parseRange, rangeSpec, SYMBOL_PATTERN, type HistoryRange } from "@/lib/market";
import { alignToBars, type OpenInterestPoint } from "@/lib/openInterest";
import { AssetNotFoundError, getHistory } from "@/lib/yahoo";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Interesse aberto semanal (CFTC) para futuros, só nos períodos diários. Uma falha da CFTC não
 * derruba o gráfico: o painel apenas não aparece.
 */
async function openInterestPoints(symbol: string, range: HistoryRange): Promise<OpenInterestPoint[] | null> {
  if (isIntraday(range)) return null;
  try {
    return await getOpenInterest(symbol, new Date(Date.now() - rangeSpec(range).days * DAY_MS));
  } catch (error) {
    console.error("[api/history] interesse aberto", error);
    return null;
  }
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const symbol = params.get("symbol")?.trim() ?? "";
  const range = parseRange(params.get("range") ?? "1y");

  if (!SYMBOL_PATTERN.test(symbol)) {
    return Response.json({ error: "Ticker inválido.", code: "invalid_symbol" }, { status: 400 });
  }
  if (!range) {
    return Response.json({ error: "Período inválido.", code: "invalid_range" }, { status: 400 });
  }

  try {
    const upper = symbol.toUpperCase();
    const [{ bars, warmup }, points] = await Promise.all([getHistory(upper, range), openInterestPoints(upper, range)]);
    return Response.json({ bars, warmup, openInterest: points ? alignToBars(bars, points) : null });
  } catch (error) {
    if (error instanceof AssetNotFoundError) {
      return Response.json(
        { error: `Sem histórico de preços para "${symbol.toUpperCase()}".`, code: "no_history", symbol: symbol.toUpperCase() },
        { status: 404 },
      );
    }
    console.error("[api/history]", error);
    return Response.json(
      { error: "Serviço do Yahoo Finance indisponível no momento. Tente novamente em instantes.", code: "unavailable" },
      { status: 502 },
    );
  }
}
