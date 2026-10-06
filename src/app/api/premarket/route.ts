import { SYMBOL_PATTERN } from "@/lib/market";
import { AssetNotFoundError, getPremarketReport, NotUSListedError } from "@/lib/yahoo";

export async function GET(request: Request) {
  const symbol = new URL(request.url).searchParams.get("symbol")?.trim() ?? "";
  if (!SYMBOL_PATTERN.test(symbol)) {
    return Response.json({ error: "Ticker inválido.", code: "invalid_symbol" }, { status: 400 });
  }

  try {
    const report = await getPremarketReport(symbol.toUpperCase());
    return Response.json({ report });
  } catch (error) {
    if (error instanceof NotUSListedError) {
      return Response.json(
        { error: "O relatório pré-market é só para ações e ETFs do mercado americano.", code: "not_us_listed" },
        { status: 400 },
      );
    }
    if (error instanceof AssetNotFoundError) {
      return Response.json(
        { error: `Ativo "${symbol.toUpperCase()}" não encontrado.`, code: "not_found", symbol: symbol.toUpperCase() },
        { status: 404 },
      );
    }
    console.error("[api/premarket]", error);
    return Response.json(
      { error: "Serviço do Yahoo Finance indisponível no momento. Tente novamente em instantes.", code: "unavailable" },
      { status: 502 },
    );
  }
}
