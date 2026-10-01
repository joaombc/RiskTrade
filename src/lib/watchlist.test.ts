import { describe, expect, it } from "vitest";
import { isWatchlistEntry, normalizeTag, sortEntries, type WatchlistEntry, type WatchlistQuote } from "./watchlist";

const entry = (symbol: string): WatchlistEntry => ({ symbol, name: symbol, tags: [], addedAt: 0 });
const quote = (symbol: string, changePercent: number, volume: number): WatchlistQuote => ({
  symbol,
  currency: "USD",
  price: 1,
  changePercent,
  volume,
  sparkline: [],
});

describe("sortEntries", () => {
  const entries = ["MSFT", "AAPL", "PETR4.SA", "BTC-USD"].map(entry);
  const quotes = {
    MSFT: quote("MSFT", -1.2, 20_000_000),
    AAPL: quote("AAPL", 2.5, 50_000_000),
    "PETR4.SA": quote("PETR4.SA", 0.4, 90_000_000),
  };
  const symbols = (list: WatchlistEntry[]) => list.map((e) => e.symbol);

  it("ordena por maior variação, com ativos sem cotação no fim", () => {
    expect(symbols(sortEntries(entries, quotes, "change"))).toEqual(["AAPL", "PETR4.SA", "MSFT", "BTC-USD"]);
  });

  it("ordena por maior volume", () => {
    expect(symbols(sortEntries(entries, quotes, "volume"))).toEqual(["PETR4.SA", "AAPL", "MSFT", "BTC-USD"]);
  });

  it("ordena alfabeticamente independente das cotações", () => {
    expect(symbols(sortEntries(entries, {}, "alpha"))).toEqual(["AAPL", "BTC-USD", "MSFT", "PETR4.SA"]);
  });

  it("não altera a lista original", () => {
    sortEntries(entries, quotes, "change");
    expect(symbols(entries)).toEqual(["MSFT", "AAPL", "PETR4.SA", "BTC-USD"]);
  });
});

describe("normalizeTag", () => {
  it("remove espaços extras e limita o tamanho", () => {
    expect(normalizeTag("  Teste   de  Suporte ")).toBe("Teste de Suporte");
    expect(normalizeTag("x".repeat(50))).toHaveLength(30);
  });
});

describe("isWatchlistEntry", () => {
  it("rejeita entradas malformadas", () => {
    expect(isWatchlistEntry(entry("AAPL"))).toBe(true);
    expect(isWatchlistEntry({ symbol: "AAPL", name: "Apple", tags: [1], addedAt: 0 })).toBe(false);
    expect(isWatchlistEntry(null)).toBe(false);
  });
});
