import type { Bar } from "./drawings/types";
import { ema, sma } from "./indicators";
import { MAX_WARMUP_BARS } from "./market";

export type MovingAverageKind = "sma" | "ema";

export interface MovingAverage {
  /** Tipo e período identificam a média: não há duas iguais. */
  id: string;
  kind: MovingAverageKind;
  /** Quantidade de candles do gráfico na média. */
  period: number;
  visible: boolean;
  /** Posição na paleta de cores do tema; fica fixa enquanto a média existir. */
  slot: number;
}

export const MA_LABELS: Record<MovingAverageKind, string> = { sma: "MMS", ema: "MME" };
export const MA_NAMES: Record<MovingAverageKind, string> = { sma: "Simples", ema: "Exponencial" };

/**
 * Atalhos. Primeiro as simples que montam as combinações do Murphy (cap. 9): 5/20 em futuros,
 * 10/50 em ações e 50/200 no longo prazo; ele lembra que a maioria usa médias simples e que
 * não há prova de que a exponencial seja melhor. Depois, MME 9 e MME 21, populares no mercado
 * brasileiro.
 */
export const MA_PRESETS: { kind: MovingAverageKind; period: number }[] = [
  { kind: "sma", period: 5 },
  { kind: "sma", period: 10 },
  { kind: "sma", period: 20 },
  { kind: "sma", period: 50 },
  { kind: "sma", period: 200 },
  { kind: "ema", period: 9 },
  { kind: "ema", period: 21 },
];

/** Formação de médias simples aplicada de uma vez (métodos de cruzamento do Murphy, cap. 9). */
export interface MovingAverageCombo {
  id: string;
  label: string;
  description: string;
  /** Períodos das médias simples, da mais curta para a mais longa. */
  periods: number[];
}

export const MA_COMBOS: MovingAverageCombo[] = [
  { id: "4-9-18", label: "4-9-18", description: "Cruzamento triplo (MMS 4, 9 e 18), usado em futuros", periods: [4, 9, 18] },
  { id: "5-20", label: "5-20", description: "Cruzamento duplo de futuros (MMS 5 e 20)", periods: [5, 20] },
  { id: "10-50", label: "10-50", description: "Cruzamento duplo de ações (MMS 10 e 50)", periods: [10, 50] },
];

/** Médias da combinação, com as cores na ordem: a mais curta na primeira cor. */
export function applyCombo(combo: MovingAverageCombo): MovingAverage[] {
  return combo.periods.reduce<MovingAverage[]>((list, period) => addMovingAverage(list, "sma", period), []);
}

/** A combinação está no gráfico exatamente como aplicada: as mesmas médias, todas visíveis e nada além. */
export function isComboActive(list: MovingAverage[], combo: MovingAverageCombo): boolean {
  return (
    list.length === combo.periods.length &&
    combo.periods.every((period) => list.some((ma) => ma.id === maId("sma", period) && ma.visible))
  );
}

/** Mais que isso deixa o gráfico ilegível; também é o tamanho da paleta de cores. */
export const MAX_MOVING_AVERAGES = 4;
export const MIN_MA_PERIOD = 2;
/** Igual ao aquecimento enviado pelo servidor: toda média permitida começa na borda do gráfico. */
export const MAX_MA_PERIOD = MAX_WARMUP_BARS;

const STORAGE_KEY = "risktrade:moving-averages:v1";

export const maId = (kind: MovingAverageKind, period: number) => `${kind}-${period}`;
export const maLabel = (ma: Pick<MovingAverage, "kind" | "period">) => `${MA_LABELS[ma.kind]} ${ma.period}`;

export function isValidPeriod(period: number): boolean {
  return Number.isInteger(period) && period >= MIN_MA_PERIOD && period <= MAX_MA_PERIOD;
}

/**
 * Valores da média sobre os fechamentos, alinhados aos candles. Os fechamentos de `warmup`
 * (anteriores ao período) entram no cálculo mas não no resultado; sem eles, os primeiros
 * candles ficam null até completar o período.
 */
export function computeMovingAverage(
  bars: Pick<Bar, "close">[],
  ma: Pick<MovingAverage, "kind" | "period">,
  warmup: number[] = [],
): (number | null)[] {
  const closes = [...warmup, ...bars.map((b) => b.close)];
  const values = ma.kind === "ema" ? ema(closes, ma.period) : sma(closes, ma.period);
  return values.slice(warmup.length);
}

/**
 * Acrescenta uma média na primeira cor livre. Devolve a lista sem mudança quando ela já
 * existe, quando o período é inválido ou quando o limite foi atingido.
 */
export function addMovingAverage(list: MovingAverage[], kind: MovingAverageKind, period: number): MovingAverage[] {
  const id = maId(kind, period);
  if (!isValidPeriod(period) || list.length >= MAX_MOVING_AVERAGES || list.some((ma) => ma.id === id)) return list;
  const used = new Set(list.map((ma) => ma.slot));
  const slot = [...Array(MAX_MOVING_AVERAGES).keys()].find((s) => !used.has(s)) ?? 0;
  return [...list, { id, kind, period, visible: true, slot }];
}

function isMovingAverage(value: unknown): value is MovingAverage {
  if (!value || typeof value !== "object") return false;
  const ma = value as Partial<MovingAverage>;
  return (
    (ma.kind === "sma" || ma.kind === "ema") &&
    typeof ma.period === "number" &&
    isValidPeriod(ma.period) &&
    ma.id === maId(ma.kind, ma.period) &&
    typeof ma.visible === "boolean" &&
    Number.isInteger(ma.slot) &&
    ma.slot! >= 0 &&
    ma.slot! < MAX_MOVING_AVERAGES
  );
}

/** Médias salvas (valem para todos os ativos). Dados corrompidos ou storage bloqueado: lista vazia. */
export function loadMovingAverages(): MovingAverage[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter(isMovingAverage);
    // Descarta repetidas (mesma média ou mesma cor), mantendo a primeira.
    return valid
      .filter((ma, i) => valid.findIndex((o) => o.id === ma.id || o.slot === ma.slot) === i)
      .slice(0, MAX_MOVING_AVERAGES);
  } catch {
    return [];
  }
}

export function saveMovingAverages(list: MovingAverage[]): void {
  try {
    if (list.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage cheio ou bloqueado: as médias valem só nesta sessão.
  }
}
