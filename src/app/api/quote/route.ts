import { SYMBOL_PATTERN } from "@/lib/market";
import { AssetNotFoundError, getAssetSummary } from "@/lib/yahoo";

export async function GET(request: Request) {
  const symbol = new URL(request.url).searchParams.get("symbol")?.trim() ?? "";
  if (!SYMBOL_PATTERN.test(symbol)) {
    return Response.json({ error: "Ticker inválido.", code: "invalid_symbol" }, { status: 400 });
  }

  try {
    const summary = await getAssetSummary(symbol.toUpperCase());
    return Response.json({ summary });
  } catch (error) {
    if (error instanceof AssetNotFoundError) {
      return Response.json(
        {
          error: `Não encontramos o ativo "${symbol.toUpperCase()}". Verifique o ticker (ex: AAPL, PETR4.SA, BTC-USD).`,
          code: "not_found",
          symbol: symbol.toUpperCase(),
        },
        { status: 404 },
      );
    }
    console.error("[api/quote]", error);
    return Response.json(
      { error: "Serviço do Yahoo Finance indisponível no momento. Tente novamente em instantes.", code: "unavailable" },
      { status: 502 },
    );
  }
}
