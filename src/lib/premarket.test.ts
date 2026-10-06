import { describe, expect, it } from "vitest";
import type { Bar } from "./drawings/types";
import {
  atr,
  classifyGap,
  crossedLevel,
  nearestLevels,
  openingMove,
  pickNews,
  priceTargetOrNull,
  technicalMap,
} from "./premarket";

const at = (iso: string) => new Date(iso);
const DAY = 86_400;
const bar = (i: number, close: number, spread = 1, volume = 100): Bar => ({
  time: 1_700_000_000 + i * DAY,
  open: close,
  high: close + spread,
  low: close - spread,
  close,
  volume,
});

describe("openingMove", () => {
  const closed = { regularMarketPrice: 100, regularMarketPreviousClose: 98, regularMarketTime: at("2026-10-05T20:00:00Z") };

  it("no pré-mercado, compara com o fechamento do último pregão", () => {
    const move = openingMove({ ...closed, marketState: "PRE", preMarketPrice: 102, preMarketTime: at("2026-10-06T12:00:00Z") });
    expect(move).toMatchObject({ phase: "pre", price: 102, reference: 100, change: 2, changePercent: 2 });
  });

  it("com o pregão aberto, mostra o gap real da abertura sobre o fechamento anterior", () => {
    const move = openingMove({ ...closed, marketState: "REGULAR", regularMarketOpen: 97, regularMarketPreviousClose: 100 });
    expect(move).toMatchObject({ phase: "open", price: 97, reference: 100, change: -3 });
  });

  it("depois do fechamento, usa o after-hours", () => {
    const move = openingMove({ ...closed, marketState: "POST", postMarketPrice: 99, postMarketTime: at("2026-10-05T21:00:00Z") });
    expect(move).toMatchObject({ phase: "after", price: 99, reference: 100 });
  });

  it("ignora cotação de pré-mercado antiga (anterior ao último pregão)", () => {
    const move = openingMove({ ...closed, marketState: "PREPRE", preMarketPrice: 105, preMarketTime: at("2026-10-05T12:00:00Z") });
    expect(move).toBeNull();
  });
});

describe("atr e tamanho do gap", () => {
  it("inclui o gap entre um pregão e outro na oscilação (true range)", () => {
    // Cada candle tem amplitude 2, mas abre 4 acima do fechamento anterior: true range = 5.
    const bars = Array.from({ length: 16 }, (_, i) => bar(i, 100 + i * 4));
    expect(atr(bars, 14)).toBe(5);
    expect(atr(bars.slice(0, 10), 14)).toBeNull();
  });

  it("classifica pela oscilação normal do ativo", () => {
    expect(classifyGap(1, 4)?.size).toBe("small");
    expect(classifyGap(-3, 4)?.size).toBe("moderate");
    expect(classifyGap(6, 4)).toEqual({ atrs: 1.5, size: "large" });
    expect(classifyGap(1, null)).toBeNull();
  });
});

describe("níveis", () => {
  // Topo em 110 (índice 10) e fundo em 90 (índice 20), confirmados por 5 candles de cada lado.
  const closes = [...Array.from({ length: 11 }, (_, i) => 100 + i), ...Array.from({ length: 10 }, (_, i) => 109 - i * 2), ...Array.from({ length: 10 }, (_, i) => 91 + i)];
  const bars = closes.map((c, i) => bar(i, c, 0.5));

  it("acham a resistência acima e o suporte abaixo mais próximos", () => {
    const levels = nearestLevels(bars, 100);
    expect(levels.resistance?.price).toBe(110.5);
    expect(levels.support?.price).toBe(90.5);
  });

  it("apontam o nível atravessado pelo preço fora do pregão", () => {
    const levels = nearestLevels(bars, 100);
    expect(crossedLevel(100, 111, levels)).toMatchObject({ kind: "resistance" });
    expect(crossedLevel(100, 90, levels)).toMatchObject({ kind: "support" });
    expect(crossedLevel(100, 105, levels)).toBeNull();
  });
});

describe("technicalMap", () => {
  it("mede médias, 52 semanas, volume e cruzamento 10 × 50", () => {
    // Queda e depois alta: a MMS 10 cruza a MMS 50 para cima perto do fim.
    const closes = [...Array.from({ length: 60 }, (_, i) => 200 - i), ...Array.from({ length: 30 }, (_, i) => 141 + i * 3)];
    const bars = closes.map((c, i) => bar(i, c, 1, i === closes.length - 1 ? 300 : 100));
    const map = technicalMap(bars)!;
    expect(map.close).toBe(closes.at(-1));
    expect(map.sma50).not.toBeNull();
    expect(map.sma200).toBeNull(); // só 90 candles e sem aquecimento
    expect(map.range52w.high).toBe(229); // 141 + 29 × 3 + 1 de sombra
    expect(map.range52w.low).toBe(140);
    expect(map.volume?.ratio).toBe(3);
    expect(map.cross.last?.kind).toBe("buy");
    expect(map.cross.position).toBe("above");
  });

  it("usa o aquecimento para a MMS 200 valer desde já", () => {
    const bars = Array.from({ length: 50 }, (_, i) => bar(i, 100));
    expect(technicalMap(bars, Array(200).fill(100))!.sma200).toBe(100);
  });
});

describe("pickNews", () => {
  const item = (title: string, tickers: string[], iso: string) => ({ title, publisher: "X", link: title, time: at(iso), relatedTickers: tickers });

  it("só traz notícias que citam o ticker, das mais focadas para as menos", () => {
    const news = pickNews(
      [
        item("geral", ["NVDA", "MDB", "META"], "2026-10-06T10:00:00Z"),
        item("outra empresa", ["META"], "2026-10-06T11:00:00Z"),
        item("focada antiga", ["MDB"], "2026-10-01T10:00:00Z"),
        item("focada nova", ["MDB"], "2026-10-05T10:00:00Z"),
      ],
      "MDB",
    );
    expect(news.map((n) => n.title)).toEqual(["focada nova", "focada antiga", "geral"]);
  });
});

describe("priceTargetOrNull", () => {
  it("trata alvo zero (analista sem preço-alvo) e valores inválidos como ausência de alvo", () => {
    expect(priceTargetOrNull(355)).toBe(355);
    expect(priceTargetOrNull(0)).toBeNull();
    expect(priceTargetOrNull(undefined)).toBeNull();
    expect(priceTargetOrNull("360")).toBeNull();
  });
});
