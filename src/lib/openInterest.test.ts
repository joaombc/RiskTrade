import { describe, expect, it } from "vitest";
import type { Bar } from "./drawings/types";
import { alignToBars, cotMarketFor, parseCotRows, readOpenInterest } from "./openInterest";

/** Candle diário de futuro: meia-noite de Nova York (04:00 UTC), como o Yahoo devolve. */
const bar = (date: string, close = 100): Bar => ({
  time: Date.parse(`${date}T04:00:00Z`) / 1000,
  open: close,
  high: close,
  low: close,
  close,
  volume: 0,
});

describe("cotMarketFor", () => {
  it("encontra o contrato pela raiz do futuro, sem diferenciar caixa", () => {
    expect(cotMarketFor("ES=F")?.code).toBe("13874A");
    expect(cotMarketFor("cl=f")?.code).toBe("067651");
    expect(cotMarketFor("6E=F")?.code).toBe("099741");
  });

  it("ignora ações, cripto à vista e futuros fora da tabela", () => {
    expect(cotMarketFor("AAPL")).toBeNull();
    expect(cotMarketFor("BTC-USD")).toBeNull();
    expect(cotMarketFor("XX=F")).toBeNull();
    expect(cotMarketFor("constructor=F")).toBeNull();
  });
});

describe("parseCotRows", () => {
  it("ordena por data, descarta linhas inválidas e repetidas", () => {
    const points = parseCotRows([
      { report_date_as_yyyy_mm_dd: "2026-09-29T00:00:00.000", open_interest_all: "1895922" },
      { report_date_as_yyyy_mm_dd: "2026-09-22T00:00:00.000", open_interest_all: "1890653" },
      { report_date_as_yyyy_mm_dd: "2026-09-22T00:00:00.000", open_interest_all: "1890653" },
      { report_date_as_yyyy_mm_dd: "lixo", open_interest_all: "10" },
      { report_date_as_yyyy_mm_dd: "2026-09-15T00:00:00.000", open_interest_all: "n/d" },
      null,
    ]);
    expect(points).toEqual([
      { date: "2026-09-22", value: 1890653 },
      { date: "2026-09-29", value: 1895922 },
    ]);
  });

  it("devolve lista vazia quando a resposta não é uma lista", () => {
    expect(parseCotRows({ error: true })).toEqual([]);
  });
});

describe("alignToBars", () => {
  const points = [
    { date: "2026-09-15", value: 100 },
    { date: "2026-09-22", value: 120 },
  ];

  it("dá a cada candle o último relatório até o dia dele, incluindo a própria terça", () => {
    const bars = ["2026-09-14", "2026-09-15", "2026-09-18", "2026-09-22", "2026-09-25"].map((d) => bar(d));
    expect(alignToBars(bars, points)).toEqual({ values: [null, 100, 100, 120, 120], lastReport: "2026-09-22" });
  });

  it("aponta o último relatório usado, não um posterior ao último candle", () => {
    const bars = [bar("2026-09-16"), bar("2026-09-17")];
    expect(alignToBars(bars, points)?.lastReport).toBe("2026-09-15");
  });

  it("devolve null sem relatórios ou quando nenhum cobre os candles", () => {
    expect(alignToBars([bar("2026-09-16")], [])).toBeNull();
    expect(alignToBars([bar("2026-09-01")], points)).toBeNull();
  });
});

describe("readOpenInterest", () => {
  const series = (closes: number[], ois: (number | null)[]) => ({
    bars: closes.map((c, i) => bar(`2026-08-${String(i + 1).padStart(2, "0")}`, c)),
    values: ois,
  });

  it("aplica as quatro regras de Murphy", () => {
    const cases = [
      { closes: [100, 110], ois: [1000, 1100], reading: "up-rising" },
      { closes: [100, 110], ois: [1000, 900], reading: "up-falling" },
      { closes: [100, 90], ois: [1000, 1100], reading: "down-rising" },
      { closes: [100, 90], ois: [1000, 900], reading: "down-falling" },
      { closes: [100, 110], ois: [1000, 1010], reading: "stable" },
      { closes: [100, 100.5], ois: [1000, 1100], reading: "flat-rising" },
      { closes: [100, 99.8], ois: [1000, 978], reading: "stable" },
    ] as const;
    for (const c of cases) {
      const { bars, values } = series([...c.closes], [...c.ois]);
      expect(readOpenInterest(bars, values, 1)?.reading, c.reading).toBe(c.reading);
    }
  });

  it("compara a partir do último candle com dado", () => {
    const { bars, values } = series([100, 120, 130], [1000, 1200, null]);
    const trend = readOpenInterest(bars, values, 1);
    expect(trend).toMatchObject({ from: 0, to: 1, reading: "up-rising" });
    expect(trend?.priceChange).toBeCloseTo(0.2);
  });

  it("devolve null quando a série é curta ou começa sem dado", () => {
    const short = series([100, 110], [1000, 1100]);
    expect(readOpenInterest(short.bars, short.values, 5)).toBeNull();
    const gap = series([100, 110], [null, 1100]);
    expect(readOpenInterest(gap.bars, gap.values, 1)).toBeNull();
  });
});
