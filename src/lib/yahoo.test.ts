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

const { AssetNotFoundError, getAssetSummary, getHistory, getPremarketReport, NotUSStockError } = await import("./yahoo");
const { GET: historyRoute } = await import("../app/api/history/route");
const { GET: premarketRoute } = await import("../app/api/premarket/route");

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

  it("separa os candles do período dos fechamentos de aquecimento", async () => {
    const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
    const quote = (d: number, close: number) => ({ date: daysAgo(d), open: close, high: close, low: close, close, volume: 1 });
    chart.mockResolvedValue({
      meta: { gmtoffset: 0 },
      quotes: [quote(300, 1), quote(120, 2), quote(60, 3), quote(1, 4)],
    });
    const { bars, warmup } = await getHistory("AAPL", "3m");
    expect(bars.map((b) => b.close)).toEqual([3, 4]);
    expect(warmup).toEqual([1, 2]);
    // O Yahoo é chamado desde antes do período (3M = 92 dias), para buscar o aquecimento.
    const period1: Date = chart.mock.calls[0][1].period1;
    expect(Date.now() - period1.getTime()).toBeGreaterThan(400 * 24 * 60 * 60 * 1000);
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

describe("relatório pré-market", () => {
  it("recusa ativos que não são ações americanas", async () => {
    quote.mockResolvedValue({ symbol: "PETR4.SA", market: "br_market", quoteType: "EQUITY", regularMarketPrice: 50 });
    await expect(getPremarketReport("PETR4.SA")).rejects.toBeInstanceOf(NotUSStockError);
    quote.mockResolvedValue({ symbol: "SPY", market: "us_market", quoteType: "ETF", regularMarketPrice: 700 });
    await expect(getPremarketReport("SPY")).rejects.toBeInstanceOf(NotUSStockError);
  });

  it("a rota responde 400 com mensagem clara para ativos fora do escopo", async () => {
    quote.mockResolvedValue({ symbol: "BTC-USD", market: "ccc_market", quoteType: "CRYPTOCURRENCY", regularMarketPrice: 80000 });
    const res = await premarketRoute(new Request("http://localhost/api/premarket?symbol=BTC-USD"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("O relatório pré-market é só para ações do mercado americano.");
  });

  it("o card marca só ações americanas", async () => {
    quote.mockResolvedValue({ symbol: "MDB", market: "us_market", quoteType: "EQUITY", regularMarketPrice: 360, marketState: "PRE" });
    chart.mockRejectedValue(NO_DATA);
    expect((await getAssetSummary("MDB")).isUSStock).toBe(true);
    quote.mockResolvedValue({ symbol: "PETR4.SA", market: "br_market", quoteType: "EQUITY", regularMarketPrice: 50 });
    expect((await getAssetSummary("PETR4.SA")).isUSStock).toBe(false);
  });
});

