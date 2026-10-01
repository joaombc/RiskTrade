import { beforeEach, describe, expect, it, vi } from "vitest";

// "server-only" impede o import fora do servidor do Next; nos testes ele não tem efeito.
vi.mock("server-only", () => ({}));

const chart = vi.fn();
const quote = vi.fn();
vi.mock("yahoo-finance2", () => ({
  default: class {
    chart = chart;
    quote = quote;
  },
}));

const { AssetNotFoundError, getAssetSummary, getHistory } = await import("./yahoo");
const { GET: historyRoute } = await import("../app/api/history/route");

const NO_DATA = new Error("No data found, symbol may be delisted");

beforeEach(() => {
  chart.mockReset();
  quote.mockReset();
});

describe("getHistory", () => {
  it("trata ticker sem histórico no Yahoo como ativo não encontrado", async () => {
    chart.mockRejectedValue(NO_DATA);
    await expect(getHistory("ELET3.SA", "1y")).rejects.toBeInstanceOf(AssetNotFoundError);
  });

  it("mantém outras falhas como erro do serviço", async () => {
    chart.mockRejectedValue(new Error("fetch failed"));
    await expect(getHistory("AAPL", "1y")).rejects.not.toBeInstanceOf(AssetNotFoundError);
  });
});

describe("rota /api/history", () => {
  it("responde 404 com mensagem de histórico ausente (não 502)", async () => {
    chart.mockRejectedValue(NO_DATA);
    const res = await historyRoute(new Request("http://localhost/api/history?symbol=ELET3.SA&range=1y"));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('Sem histórico de preços para "ELET3.SA".');
  });

  it("responde 502 quando o Yahoo está fora do ar", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    chart.mockRejectedValue(new Error("fetch failed"));
    const res = await historyRoute(new Request("http://localhost/api/history?symbol=AAPL&range=1y"));
    expect(res.status).toBe(502);
  });
});

describe("getAssetSummary", () => {
  it("devolve a cotação sem média de volume quando falta histórico", async () => {
    quote.mockResolvedValue({
      symbol: "XYZ",
      longName: "XYZ S.A.",
      currency: "BRL",
      fullExchangeName: "São Paulo",
      regularMarketPrice: 10,
      regularMarketVolume: 1000,
      marketState: "CLOSED",
    });
    chart.mockRejectedValue(NO_DATA);
    const summary = await getAssetSummary("XYZ");
    expect(summary.price).toBe(10);
    expect(summary.avgVolume20d).toBeNull();
  });
});
