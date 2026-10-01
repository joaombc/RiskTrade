import { AssetNotFoundError, getAssetSummary } from "@/lib/yahoo";

const SYMBOL_PATTERN = /^[A-Za-z0-9.\-=^]{1,20}$/;

export async function GET(request: Request) {
  const symbol = new URL(request.url).searchParams.get("symbol")?.trim() ?? "";
  if (!SYMBOL_PATTERN.test(symbol)) {
    return Response.json({ error: "Ticker inválido." }, { status: 400 });
  }

  try {
    const summary = await getAssetSummary(symbol.toUpperCase());
    return Response.json({ summary });
  } catch (error) {
    if (error instanceof AssetNotFoundError) {
      return Response.json(
        { error: `Não encontramos o ativo "${symbol.toUpperCase()}". Verifique o ticker (ex: AAPL, PETR4.SA, BTC-USD).` },
        { status: 404 },
      );
    }
    console.error("[api/quote]", error);
    return Response.json(
      { error: "Serviço do Yahoo Finance indisponível no momento. Tente novamente em instantes." },
      { status: 502 },
    );
  }
}
