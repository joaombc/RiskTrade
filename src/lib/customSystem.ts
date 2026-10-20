import { dmi } from "./adx";
import type { SystemSignal } from "./backtest";
import { cci, cciExits } from "./cci";
import type { Bar } from "./drawings/types";
import { macd, macdCrosses } from "./macd";
import { computeMovingAverage, crossings } from "./movingAverages";
import { parabolicSar, sarFlips } from "./parabolicSar";
import { priceChannel } from "./priceChannel";
import { roc } from "./roc";
import { rsi, zoneExits } from "./rsi";

/**
 * "Crie o seu sistema" (Murphy, cap. 15): regras de entrada e de saída montadas com condições
 * prontas. A compra exige todas as condições de entrada no fechamento; a saída, qualquer uma das
 * condições de saída. O lado vendido usa o espelho das regras de compra. Cálculos puros.
 */

export type ConditionId =
  | "maCross"
  | "priceMa"
  | "channel"
  | "macdCross"
  | "macdZero"
  | "rsiExit"
  | "rsiMid"
  | "adx"
  | "di"
  | "sarFlip"
  | "sarSide"
  | "cciExit"
  | "rocZero";

/** bull: o lado da compra (cruza para cima, acima); bear: o lado da venda. */
export type Side = "bull" | "bear";

export interface Condition {
  id: ConditionId;
  side: Side;
  params: number[];
}

export interface CustomRules {
  entry: Condition[];
  exit: Condition[];
}

/** Condições que valem igual para os dois lados (força da tendência, sem direção). */
const NEUTRAL: ConditionId[] = ["adx"];

/** Variações de parâmetros oferecidas para cada condição. */
const VARIANTS: [ConditionId, number[][]][] = [
  ["maCross", [[5, 20], [10, 50], [20, 100], [50, 200]]],
  ["priceMa", [[20], [50], [200]]],
  ["channel", [[10], [20], [55]]],
  ["macdCross", [[]]],
  ["macdZero", [[]]],
  ["rsiExit", [[]]],
  ["rsiMid", [[]]],
  ["adx", [[20], [25], [30]]],
  ["di", [[]]],
  ["sarFlip", [[]]],
  ["sarSide", [[]]],
  ["cciExit", [[]]],
  ["rocZero", [[10]]],
];

/** Todas as condições que podem entrar numa regra, na ordem do menu. */
export const CONDITION_OPTIONS: Condition[] = VARIANTS.flatMap(([id, variants]) =>
  variants.flatMap((params) => (NEUTRAL.includes(id) ? ["bull" as const] : (["bull", "bear"] as const)).map((side) => ({ id, side, params }))),
);

export const conditionKey = (c: Condition) => `${c.id}:${c.side}:${c.params.join(",")}`;
const OPTION_KEYS = new Set(CONDITION_OPTIONS.map(conditionKey));
export const isValidCondition = (c: unknown): c is Condition =>
  typeof c === "object" && c !== null && Array.isArray((c as Condition).params) && OPTION_KEYS.has(conditionKey(c as Condition));

/** A mesma condição do outro lado (cruza para cima ↔ para baixo, acima ↔ abaixo). */
export function mirror(c: Condition): Condition {
  return NEUTRAL.includes(c.id) ? c : { ...c, side: c.side === "bull" ? "bear" : "bull" };
}

/** Exemplo de Murphy: só compra a favor da tendência longa (acima da MMS 200), no cruzamento do MACD. */
export const DEFAULT_RULES: CustomRules = {
  entry: [
    { id: "priceMa", side: "bull", params: [200] },
    { id: "macdCross", side: "bull", params: [] },
  ],
  exit: [{ id: "macdCross", side: "bear", params: [] }],
};

type Values = (number | null)[];
type Flags = boolean[];

/** Avalia condições sobre os mesmos candles, calculando cada indicador uma só vez. */
export function conditionEvaluator(bars: Bar[], warmup: number[] = []) {
  const cache = new Map<string, unknown>();
  const memo = <T>(key: string, compute: () => T): T => {
    if (!cache.has(key)) cache.set(key, compute());
    return cache.get(key) as T;
  };
  const sma = (period: number) => memo(`sma${period}`, () => computeMovingAverage(bars, { kind: "sma", period }, warmup));
  const macdLines = () => memo("macd", () => macd(bars, warmup));
  const rsiValues = () => memo("rsi", () => rsi(bars, 14, warmup));
  const dmiLines = () => memo("dmi", () => dmi(bars));
  const sarPoints = () => memo("sar", () => parabolicSar(bars));
  const at = (indices: { index: number }[]): Flags => {
    const flags: Flags = bars.map(() => false);
    indices.forEach(({ index }) => (flags[index] = true));
    return flags;
  };
  const compare = (values: Values, threshold: Values | number, above: boolean): Flags =>
    values.map((v, i) => {
      const t = typeof threshold === "number" ? threshold : threshold[i];
      return v !== null && t !== null && t !== undefined && (above ? v > t : v < t);
    });

  const evaluate = (c: Condition): Flags => {
    const bull = c.side === "bull";
    const [a, b] = c.params;
    switch (c.id) {
      case "maCross":
        return at(crossings(sma(a), sma(b)).filter((x) => (x.dir === "up") === bull));
      case "priceMa":
        return compare(bars.map((bar) => bar.close), sma(a), bull);
      case "channel": {
        const channel = memo(`channel${a}`, () => priceChannel(bars, a));
        return compare(bars.map((bar) => bar.close), bull ? channel.upper : channel.lower, bull);
      }
      case "macdCross":
        return at(macdCrosses(macdLines()).filter((x) => (x.dir === "up") === bull));
      case "macdZero":
        return compare(macdLines().macd, 0, bull);
      case "rsiExit":
        return at(zoneExits(rsiValues()).filter((x) => (x.kind === "buy") === bull));
      case "rsiMid":
        return compare(rsiValues(), 50, bull);
      case "adx":
        return compare(dmiLines().adx, a, true);
      case "di":
        return compare(dmiLines().plusDI, dmiLines().minusDI, bull);
      case "sarFlip":
        return at(sarFlips(sarPoints()).filter((x) => (x.kind === "buy") === bull));
      case "sarSide":
        return sarPoints().map((p) => p !== null && p.long === bull);
      case "cciExit":
        return at(cciExits(memo("cci", () => cci(bars))).filter((x) => (x.kind === "buy") === bull));
      case "rocZero":
        return compare(memo(`roc${a}`, () => roc(bars, a, warmup)), 0, bull);
    }
  };
  return (c: Condition): Flags => memo(`flags:${conditionKey(c)}`, () => evaluate(c));
}

/**
 * Sinais do sistema montado. Comprado: sai quando qualquer condição de saída vale (ou vira, se
 * a entrada vendida valer). Vendido: o mesmo com as regras espelhadas. Fora: entra quando todas
 * as condições de entrada de um lado valem. Sem condições de entrada, não há sinais.
 */
export function customSignals(bars: Bar[], rules: CustomRules, shortSide: boolean, warmup: number[] = []): SystemSignal[] {
  if (rules.entry.length === 0) return [];
  const flags = conditionEvaluator(bars, warmup);
  const all = (conditions: Condition[], i: number) => conditions.every((c) => flags(c)[i]);
  const any = (conditions: Condition[], i: number) => conditions.some((c) => flags(c)[i]);
  const shortEntry = rules.entry.map(mirror);
  const shortExit = rules.exit.map(mirror);

  const signals: SystemSignal[] = [];
  let position: 1 | -1 | 0 = 0;
  bars.forEach((_, i) => {
    const longIn = all(rules.entry, i);
    const shortIn = shortSide && all(shortEntry, i);
    if (position === 1) {
      if (shortIn) signals.push({ index: i, kind: "sell" });
      else if (any(rules.exit, i)) signals.push({ index: i, kind: "exit" });
      else return;
    } else if (position === -1) {
      if (longIn) signals.push({ index: i, kind: "buy" });
      else if (any(shortExit, i)) signals.push({ index: i, kind: "exit" });
      else return;
    } else if (longIn) signals.push({ index: i, kind: "buy" });
    else if (shortIn) signals.push({ index: i, kind: "sell" });
    else return;
    const kind = signals[signals.length - 1].kind;
    position = kind === "buy" ? 1 : kind === "sell" ? -1 : 0;
  });
  return signals;
}
