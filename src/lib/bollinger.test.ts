import { describe, expect, it } from "vitest";
import { bollinger, readBollinger } from "./bollinger";

const bar = (close: number, high = close, low = close) => ({ close, high, low });

describe("bollinger", () => {
  it("põe as bandas a 2 desvios-padrão (populacional) da média de 20", () => {
    // 20 fechamentos alternando 9 e 11: média 10, desvio 1 → bandas em 8 e 12, largura 40%.
    const bars = Array.from({ length: 20 }, (_, i) => bar(i % 2 ? 11 : 9));
    const b = bollinger(bars);
    expect(b.middle[19]).toBe(10);
    expect(b.upper[19]).toBe(12);
    expect(b.lower[19]).toBe(8);
    expect(b.width[19]).toBeCloseTo(40);
    expect(b.middle[18]).toBeNull();
  });

  it("usa o aquecimento para valer desde o primeiro candle", () => {
    const warmup = Array.from({ length: 19 }, (_, i) => (i % 2 ? 11 : 9));
    const b = bollinger([bar(11)], warmup);
    expect(b.middle[0]).toBe(10);
    expect(b.upper).toHaveLength(1);
  });
});

describe("readBollinger", () => {
  /** 40 candles laterais em volta de 100 e depois os candles do caso. */
  const scenario = (tail: { close: number; high?: number; low?: number }[]) => {
    const base = Array.from({ length: 40 }, (_, i) => bar(i % 2 ? 101 : 99));
    const bars = [...base, ...tail.map((t) => bar(t.close, t.high ?? t.close, t.low ?? t.close))];
    return { bars, reading: readBollinger(bars, bollinger(bars))! };
  };

  it("quicou na banda de baixo e cruzou a média para cima: alvo na banda de cima, caso clássico", () => {
    const { reading } = scenario([{ close: 97, low: 96 }, { close: 99 }, { close: 101.5 }]);
    expect(reading.target).toMatchObject({ direction: "up", fromBand: true });
    expect(reading.target!.price).toBeCloseTo(reading.upper);
    expect(reading.touch?.band).toBe("lower");
  });

  it("cruzou a média para baixo: alvo na banda de baixo", () => {
    const { reading } = scenario([{ close: 103, high: 104 }, { close: 101 }, { close: 98.5 }]);
    expect(reading.target).toMatchObject({ direction: "down", fromBand: true });
    expect(reading.target!.price).toBeCloseTo(reading.lower);
  });

  it("alta forte: fechamentos acima da média com toque na banda de cima", () => {
    const climb = Array.from({ length: 12 }, (_, i) => ({ close: 102 + i * 1.5, high: 103 + i * 1.5 }));
    const { reading } = scenario(climb);
    expect(reading.strongTrend).toBe("up");
    expect(reading.percentB).toBeGreaterThan(0.5);
  });

  it("detecta o aperto: largura atual entre as menores dos últimos candles", () => {
    const wide = Array.from({ length: 60 }, (_, i) => bar(i % 2 ? 110 : 90));
    const calm = Array.from({ length: 30 }, (_, i) => bar(i % 2 ? 100.2 : 99.8));
    const bars = [...wide, ...calm];
    expect(readBollinger(bars, bollinger(bars))!.width.state).toBe("squeeze");
  });

  it("detecta bandas muito abertas depois de um salto de volatilidade", () => {
    const calm = Array.from({ length: 100 }, (_, i) => bar(i % 2 ? 100.2 : 99.8));
    const burst = Array.from({ length: 8 }, (_, i) => bar(100 + i * 4));
    const bars = [...calm, ...burst];
    expect(readBollinger(bars, bollinger(bars))!.width.state).toBe("wide");
  });

  it("não quebra com preços parados (bandas coincidentes)", () => {
    const bars = Array.from({ length: 25 }, () => bar(100));
    expect(readBollinger(bars, bollinger(bars))!.percentB).toBe(0.5);
  });

  it("devolve null sem histórico suficiente", () => {
    const bars = Array.from({ length: 10 }, () => bar(100));
    expect(readBollinger(bars, bollinger(bars))).toBeNull();
  });
});
