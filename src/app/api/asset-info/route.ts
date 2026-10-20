import { SYMBOL_PATTERN } from "@/lib/market";
import { MAX_PORTFOLIO_ASSETS } from "@/lib/portfolioAssets";
import { getAssetInfos } from "@/lib/yahoo";

/** Nome, moeda, tipo e setor dos ativos, para o grupo de cada um na carteira. */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("symbols") ?? "";
  const symbols = [...new Set(raw.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean))];
  if (symbols.length === 0 || symbols.length > MAX_PORTFOLIO_ASSETS || !symbols.every((s) => SYMBOL_PATTERN.test(s))) {
    return Response.json({ error: "Lista de ativos inválida.", code: "invalid_symbols" }, { status: 400 });
  }
  try {
    return Response.json({ infos: await getAssetInfos(symbols) });
  } catch (error) {
    console.error("[api/asset-info]", error);
    return Response.json(
      { error: "Serviço do Yahoo Finance indisponível no momento. Tente novamente em instantes.", code: "unavailable" },
      { status: 502 },
    );
  }
}
