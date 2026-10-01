import { HISTORY_RANGES, SYMBOL_PATTERN, type HistoryRange } from "@/lib/market";
import { AssetNotFoundError, getHistory } from "@/lib/yahoo";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const symbol = params.get("symbol")?.trim() ?? "";
  const range = (params.get("range") ?? "1y") as HistoryRange;

  if (!SYMBOL_PATTERN.test(symbol)) {
    return Response.json({ error: "Ticker inválido." }, { status: 400 });
  }
  if (!Object.hasOwn(HISTORY_RANGES, range)) {
    return Response.json({ error: "Período inválido." }, { status: 400 });
  }

  try {
    const bars = await getHistory(symbol.toUpperCase(), range);
    return Response.json({ bars });
  } catch (error) {
    if (error instanceof AssetNotFoundError) {
      return Response.json({ error: `Sem histórico de preços para "${symbol.toUpperCase()}".` }, { status: 404 });
    }
    console.error("[api/history]", error);
    return Response.json(
      { error: "Serviço do Yahoo Finance indisponível no momento. Tente novamente em instantes." },
      { status: 502 },
    );
  }
}
