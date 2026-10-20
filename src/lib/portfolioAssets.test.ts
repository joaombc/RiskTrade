import { describe, expect, it } from "vitest";
import { groupSummary, inferGroup, isPortfolioAsset, positionsPerGroup, type PortfolioAsset } from "./portfolioAssets";

const asset = (symbol: string, group: PortfolioAsset["group"]): PortfolioAsset => ({ symbol, name: symbol, group, currency: "USD", addedAt: 0 });

describe("grupos da carteira", () => {
  it("deduz o grupo pelo tipo, pelo setor e pela raiz do futuro", () => {
    expect(inferGroup({ symbol: "AAPL", quoteType: "EQUITY", sector: "Technology" })).toBe("technology");
    expect(inferGroup({ symbol: "PETR4.SA", quoteType: "EQUITY", sector: "Energy" })).toBe("energy");
    expect(inferGroup({ symbol: "XYZ", quoteType: "EQUITY", sector: null })).toBe("other");
    expect(inferGroup({ symbol: "BTC-USD", quoteType: "CRYPTOCURRENCY", sector: null })).toBe("crypto");
    expect(inferGroup({ symbol: "EURUSD=X", quoteType: "CURRENCY", sector: null })).toBe("currencies");
    expect(inferGroup({ symbol: "^BVSP", quoteType: "INDEX", sector: null })).toBe("stockIndex");
    expect(inferGroup({ symbol: "SPY", quoteType: "ETF", sector: null })).toBe("etf");
    expect(inferGroup({ symbol: "GC=F", quoteType: "FUTURE", sector: null })).toBe("metals");
    expect(inferGroup({ symbol: "CL=F", quoteType: "FUTURE", sector: null })).toBe("energyFutures");
    expect(inferGroup({ symbol: "ESZ26.CME", quoteType: "FUTURE", sector: null })).toBe("stockIndex");
    expect(inferGroup({ symbol: "6E=F", quoteType: "FUTURE", sector: null })).toBe("currencies");
  });

  it("posições cheias por grupo: limite do grupo ÷ limite por ativo", () => {
    expect(positionsPerGroup(25, 15)).toBe(1);
    expect(positionsPerGroup(25, 10)).toBe(2);
    expect(positionsPerGroup(5, 10)).toBe(1);
  });

  it("resumo por grupo: do maior para o menor, com os grupos cheios marcados", () => {
    const assets = [asset("AAPL", "technology"), asset("GC=F", "metals"), asset("MSFT", "technology"), asset("XYZ", "other"), asset("ABC", "other")];
    expect(groupSummary(assets, 25, 10)).toEqual([
      { group: "technology", symbols: ["AAPL", "MSFT"], crowded: false },
      { group: "other", symbols: ["XYZ", "ABC"], crowded: false },
      { group: "metals", symbols: ["GC=F"], crowded: false },
    ]);
    expect(groupSummary(assets, 25, 15)[0]).toMatchObject({ group: "technology", crowded: true });
  });

  it("valida o que veio do storage", () => {
    expect(isPortfolioAsset(asset("AAPL", "technology"))).toBe(true);
    expect(isPortfolioAsset({ ...asset("AAPL", "technology"), group: "xyz" })).toBe(false);
    expect(isPortfolioAsset(null)).toBe(false);
  });
});
