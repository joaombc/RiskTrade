import { afterEach, describe, expect, it } from "vitest";
import { ema, sma } from "./indicators";
import {
  addMovingAverage,
  computeMovingAverage,
  isValidPeriod,
  loadMovingAverages,
  MAX_MOVING_AVERAGES,
  maLabel,
  saveMovingAverages,
  type MovingAverage,
} from "./movingAverages";

describe("sma", () => {
  it("faz a média dos últimos valores e deixa null antes do primeiro período", () => {
    expect(sma([1, 2, 3, 4, 5], 3)).toEqual([null, null, 2, 3, 4]);
  });

  it("devolve só null quando há menos valores que o período", () => {
    expect(sma([1, 2], 3)).toEqual([null, null]);
  });
});

describe("ema", () => {
  it("começa pela média simples e depois pondera os valores recentes", () => {
    // k = 2 / (3 + 1) = 0,5
    const values = ema([1, 2, 3, 4, 5], 3);
    expect(values.slice(0, 2)).toEqual([null, null]);
    expect(values[2]).toBe(2);
    expect(values[3]).toBe(3); // 4 × 0,5 + 2 × 0,5
    expect(values[4]).toBe(4); // 5 × 0,5 + 3 × 0,5
  });

  it("reage mais rápido que a simples a um salto de preço", () => {
    const prices = [10, 10, 10, 10, 10, 20];
    expect(ema(prices, 5)[5]!).toBeGreaterThan(sma(prices, 5)[5]!);
  });
});

describe("computeMovingAverage", () => {
  it("usa os fechamentos dos candles", () => {
    const bars = [1, 2, 3].map((close) => ({ close }));
    expect(computeMovingAverage(bars, { kind: "sma", period: 2 })).toEqual([null, 1.5, 2.5]);
  });

  it("usa os fechamentos de aquecimento sem devolvê-los, e a média já começa no primeiro candle", () => {
    const bars = [4, 5].map((close) => ({ close }));
    expect(computeMovingAverage(bars, { kind: "sma", period: 3 }, [2, 3])).toEqual([3, 4]);
  });
});

describe("addMovingAverage", () => {
  it("dá a primeira cor livre, mesmo depois de uma remoção", () => {
    let list = addMovingAverage([], "ema", 9);
    list = addMovingAverage(list, "ema", 21);
    list = addMovingAverage(list, "sma", 50);
    list = list.filter((ma) => ma.period !== 21);
    list = addMovingAverage(list, "sma", 200);
    expect(list.map((ma) => [maLabel(ma), ma.slot])).toEqual([
      ["MME 9", 0],
      ["MMS 50", 2],
      ["MMS 200", 1],
    ]);
  });

  it("ignora repetidas, períodos inválidos e o que passa do limite", () => {
    const one = addMovingAverage([], "sma", 20);
    expect(addMovingAverage(one, "sma", 20)).toBe(one);
    expect(addMovingAverage(one, "sma", 1)).toBe(one);
    expect(addMovingAverage(one, "sma", 2.5)).toBe(one);
    let full: MovingAverage[] = [];
    for (let p = 10; full.length < MAX_MOVING_AVERAGES; p += 10) full = addMovingAverage(full, "ema", p);
    expect(addMovingAverage(full, "sma", 200)).toBe(full);
  });

  it("aceita a mesma janela com tipos diferentes", () => {
    const list = addMovingAverage(addMovingAverage([], "sma", 20), "ema", 20);
    expect(list.map((ma) => ma.id)).toEqual(["sma-20", "ema-20"]);
  });
});

describe("isValidPeriod", () => {
  it("aceita inteiros de 2 a 400", () => {
    expect([2, 200, 400].every(isValidPeriod)).toBe(true);
    expect([1, 401, 9.5, NaN].some(isValidPeriod)).toBe(false);
  });
});

describe("armazenamento", () => {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  } as Storage;
  afterEach(() => store.clear());

  it("salva e recupera as médias", () => {
    const list = addMovingAverage(addMovingAverage([], "ema", 9), "sma", 200);
    saveMovingAverages(list);
    expect(loadMovingAverages()).toEqual(list);
  });

  it("descarta dados corrompidos, inválidos e repetidos", () => {
    store.set("risktrade:moving-averages:v1", "não é json");
    expect(loadMovingAverages()).toEqual([]);
    store.set(
      "risktrade:moving-averages:v1",
      JSON.stringify([
        { id: "ema-9", kind: "ema", period: 9, visible: true, slot: 0 },
        { id: "ema-9", kind: "ema", period: 9, visible: false, slot: 1 },
        { id: "sma-50", kind: "sma", period: 50, visible: true, slot: 0 },
        { id: "sma-1", kind: "sma", period: 1, visible: true, slot: 2 },
        { id: "wma-20", kind: "wma", period: 20, visible: true, slot: 3 },
        { id: "sma-20", kind: "sma", period: 20, visible: true, slot: 3 },
      ]),
    );
    expect(loadMovingAverages().map((ma) => ma.id)).toEqual(["ema-9", "sma-20"]);
  });

  it("remove a chave quando não há médias", () => {
    saveMovingAverages(addMovingAverage([], "ema", 9));
    saveMovingAverages([]);
    expect(store.size).toBe(0);
  });
});

describe("atalhos", () => {
  it("montam as combinações do Murphy (5/20, 10/50, 50/200) e não se repetem", async () => {
    const { MA_PRESETS, maId } = await import("./movingAverages");
    const ids = MA_PRESETS.map((p) => maId(p.kind, p.period));
    expect(new Set(ids).size).toBe(ids.length);
    for (const period of [5, 10, 20, 21, 50, 200]) expect(ids, `MMS ${period}`).toContain(`sma-${period}`);
    expect(MA_PRESETS.every((p) => isValidPeriod(p.period))).toBe(true);
  });
});

describe("combinações", () => {
  it("aplicam só as médias simples da formação, da mais curta para a mais longa", async () => {
    const { MA_COMBOS, applyCombo } = await import("./movingAverages");
    const triple = MA_COMBOS.find((c) => c.id === "4-9-18")!;
    expect(applyCombo(triple).map((ma) => [maLabel(ma), ma.slot, ma.visible])).toEqual([
      ["MMS 4", 0, true],
      ["MMS 9", 1, true],
      ["MMS 18", 2, true],
    ]);
  });

  it("cobrem 4-9-18, 5-20 e 10-50 dentro do limite de médias", async () => {
    const { MA_COMBOS } = await import("./movingAverages");
    expect(MA_COMBOS.map((c) => c.periods)).toEqual([[4, 9, 18], [5, 20], [10, 50]]);
    for (const c of MA_COMBOS) expect(c.periods.length).toBeLessThanOrEqual(MAX_MOVING_AVERAGES);
  });

  it("só contam como ativas quando o gráfico tem exatamente a formação visível", async () => {
    const { MA_COMBOS, applyCombo, isComboActive } = await import("./movingAverages");
    const [triple, futures] = MA_COMBOS;
    const applied = applyCombo(triple);
    expect(isComboActive(applied, triple)).toBe(true);
    expect(isComboActive(applied, futures)).toBe(false);
    expect(isComboActive(addMovingAverage(applied, "sma", 200), triple)).toBe(false);
    expect(isComboActive(applied.map((ma, i) => (i === 1 ? { ...ma, visible: false } : ma)), triple)).toBe(false);
    // Mesmos períodos, mas exponenciais: não é a formação do livro.
    const exponential = [4, 9, 18].reduce<MovingAverage[]>((l, p) => addMovingAverage(l, "ema", p), []);
    expect(isComboActive(exponential, triple)).toBe(false);
  });
});

describe("findCrossSignals", () => {
  const line = (period: number, values: (number | null)[]) => ({ period, values });

  it("duas médias: curta cruzando a longa para cima é compra, para baixo é venda", async () => {
    const { findCrossSignals } = await import("./movingAverages");
    const short = [1, 2, 4, 5, 3, 1];
    const long = [3, 3, 3, 3, 3.5, 3];
    // A ordem das linhas não importa: vale o período.
    expect(findCrossSignals([line(20, long), line(5, short)])).toEqual([
      { index: 2, kind: "buy" },
      { index: 4, kind: "sell" },
    ]);
  });

  it("ignora candles sem valor (média ainda sem período completo)", async () => {
    const { findCrossSignals } = await import("./movingAverages");
    expect(findCrossSignals([line(5, [1, null, 4]), line(20, [3, 3, 3])])).toEqual([]);
  });

  it("três médias: alerta quando a curta passa as outras duas, confirmação quando a do meio cruza a longa", async () => {
    const { findCrossSignals } = await import("./movingAverages");
    //        0   1   2   3   4   5   6   7
    const s = [1, 1, 5, 5, 5, 1, 1, 1];
    const m = [2, 2, 2, 4, 4, 4, 1.5, 1.5];
    const l = [3, 3, 3, 3, 3, 3, 3, 3];
    expect(findCrossSignals([line(4, s), line(9, m), line(18, l)])).toEqual([
      { index: 2, kind: "buy-alert" }, // a de 4 passa a 9 e a 18
      { index: 3, kind: "buy" }, // a de 9 passa a 18
      { index: 5, kind: "sell-alert" }, // a de 4 volta para baixo das duas
      { index: 6, kind: "sell" }, // a de 9 perde a 18
    ]);
  });

  it("no mesmo candle, a confirmação substitui o alerta", async () => {
    const { findCrossSignals } = await import("./movingAverages");
    const s = [1, 5];
    const m = [2, 4];
    const l = [3, 3];
    expect(findCrossSignals([line(4, s), line(9, m), line(18, l)])).toEqual([{ index: 1, kind: "buy" }]);
  });

  it("sem regra para uma ou quatro médias", async () => {
    const { findCrossSignals } = await import("./movingAverages");
    const v = [1, 2, 3];
    expect(findCrossSignals([line(5, v)])).toEqual([]);
    expect(findCrossSignals([line(5, v), line(10, v), line(20, v), line(50, v)])).toEqual([]);
  });
});

describe("envelopes", () => {
  it("deslocam a média pela porcentagem, para cima e para baixo", async () => {
    const { envelopeLine } = await import("./movingAverages");
    expect(envelopeLine([null, 100, 200], 3, "upper")).toEqual([null, 103, 206]);
    expect(envelopeLine([100], 10, "lower")[0]).toBeCloseTo(90);
  });

  it("ligam e desligam por porcentagem, sempre em ordem, e só em médias simples", async () => {
    const { toggleEnvelope } = await import("./movingAverages");
    let list = addMovingAverage(addMovingAverage([], "sma", 21), "ema", 9);
    list = toggleEnvelope(list, "sma-21", 10);
    list = toggleEnvelope(list, "sma-21", 3);
    expect(list[0].envelopes).toEqual([3, 10]);
    list = toggleEnvelope(list, "sma-21", 10);
    expect(list[0].envelopes).toEqual([3]);
    expect(toggleEnvelope(list, "ema-9", 3)[1].envelopes).toBeUndefined();
  });

  it("são salvos com a média e validados ao carregar", async () => {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    } as Storage;
    store.set(
      "risktrade:moving-averages:v1",
      JSON.stringify([
        { id: "sma-21", kind: "sma", period: 21, visible: true, slot: 0, envelopes: [10, 7, 3] },
        { id: "ema-9", kind: "ema", period: 9, visible: true, slot: 1, envelopes: [3] },
        { id: "sma-50", kind: "sma", period: 50, visible: true, slot: 2, envelopes: "5" },
      ]),
    );
    const loaded = loadMovingAverages();
    expect(loaded.map((ma) => ma.envelopes)).toEqual([[3, 10], undefined, undefined]);
  });
});
