import { searchAssets } from "@/lib/yahoo";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 1) {
    return Response.json({ results: [] });
  }

  try {
    const results = await searchAssets(query);
    return Response.json({ results });
  } catch (error) {
    console.error("[api/search]", error);
    return Response.json(
      { error: "Serviço do Yahoo Finance indisponível no momento. Tente novamente em instantes.", code: "unavailable" },
      { status: 502 },
    );
  }
}
