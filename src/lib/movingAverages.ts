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
  /** Envelopes marcados, em % acima e abaixo da média (só médias simples). */
  envelopes?: EnvelopePercent[];
}

/**
 * Envelopes de Murphy (cap. 9): 3% em volta da MMS 21 no curto prazo, 5% em volta da média de
 * 10 semanas (≈ MMS 50) e 10% em volta da de 40 semanas (≈ MMS 200).
 */
export const ENVELOPE_PERCENTS = [3, 5, 10] as const;
export type EnvelopePercent = (typeof ENVELOPE_PERCENTS)[number];

/** Linha do envelope: a média deslocada `percent`% para cima (upper) ou para baixo (lower). */
export function envelopeLine(values: (number | null)[], percent: number, side: "upper" | "lower"): (number | null)[] {
  const factor = side === "upper" ? 1 + percent / 100 : 1 - percent / 100;
  return values.map((v) => (v === null ? null : v * factor));
}

/** Liga ou desliga um envelope de uma média simples; exponenciais não têm envelope. */
export function toggleEnvelope(list: MovingAverage[], id: string, percent: EnvelopePercent): MovingAverage[] {
  return list.map((ma) => {
    if (ma.id !== id || ma.kind !== "sma") return ma;
    const current = ma.envelopes ?? [];
    const next = current.includes(percent) ? current.filter((p) => p !== percent) : [...current, percent];
    return { ...ma, envelopes: ENVELOPE_PERCENTS.filter((p) => next.includes(p)) };
  });
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
  // Número de Fibonacci citado por Murphy e base dos envelopes de 3% de curto prazo.
  { kind: "sma", period: 21 },
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
      .slice(0, MAX_MOVING_AVERAGES)
      .map(({ envelopes, ...ma }) => {
        // Envelopes só valem em médias simples e só nas porcentagens conhecidas.
        const kept = ma.kind === "sma" && Array.isArray(envelopes) ? ENVELOPE_PERCENTS.filter((p) => envelopes.includes(p)) : [];
        return kept.length > 0 ? { ...ma, envelopes: kept } : ma;
      });
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

// ─── Sinais de cruzamento (Murphy, cap. 9) ─────────────────────────────────────

type Values = (number | null)[];

/** Índices em que `fast` cruza `slow` para cima (up) ou para baixo (down), comparando candles vizinhos. */
export function crossings(fast: Values, slow: Values): { index: number; dir: "up" | "down" }[] {
  const result: { index: number; dir: "up" | "down" }[] = [];
  for (let i = 1; i < Math.min(fast.length, slow.length); i++) {
    const [a0, b0, a1, b1] = [fast[i - 1], slow[i - 1], fast[i], slow[i]];
    if (a0 === null || b0 === null || a1 === null || b1 === null) continue;
    if (a0 <= b0 && a1 > b1) result.push({ index: i, dir: "up" });
    else if (a0 >= b0 && a1 < b1) result.push({ index: i, dir: "down" });
  }
  return result;
}

export type CrossSignalKind = "buy" | "sell" | "buy-alert" | "sell-alert";

export interface CrossSignal {
  index: number;
  kind: CrossSignalKind;
}

export const CROSS_SIGNAL_LABELS: Record<CrossSignalKind, string> = {
  buy: "Compra",
  sell: "Venda",
  "buy-alert": "Alerta de compra",
  "sell-alert": "Alerta de venda",
};

/** Sinais nos últimos candles contam como recentes e ganham destaque no painel. */
export const RECENT_CROSS_BARS = 5;

/**
 * Sinais de cruzamento segundo Murphy (cap. 9), com as médias ordenadas pelo período:
 * - duas médias: a curta cruza a longa para cima = compra; para baixo = venda;
 * - três médias: a curta passa para cima (ou para baixo) das outras duas = alerta; a do meio
 *   cruzando a longa na mesma direção = compra (ou venda) confirmada.
 * Com outra quantidade de médias não há regra, e a lista fica vazia. Quando o alerta e a
 * confirmação caem no mesmo candle, fica só a confirmação.
 */
export function findCrossSignals(lines: { period: number; values: Values }[]): CrossSignal[] {
  const sorted = [...lines].sort((a, b) => a.period - b.period);
  if (sorted.length === 2) {
    const [short, long] = sorted;
    return crossings(short.values, long.values).map((c) => ({ index: c.index, kind: c.dir === "up" ? "buy" : "sell" }));
  }
  if (sorted.length !== 3) return [];

  const [short, mid, long] = sorted.map((l) => l.values);
  const confirmed: CrossSignal[] = crossings(mid, long).map((c) => ({ index: c.index, kind: c.dir === "up" ? "buy" : "sell" }));
  // A curta acima (1) ou abaixo (-1) das duas outras; 0 quando está entre elas.
  const side = (i: number) => {
    const [s, m, l] = [short[i], mid[i], long[i]];
    if (s === null || m === null || l === null) return null;
    return s > m && s > l ? 1 : s < m && s < l ? -1 : 0;
  };
  const alerts: CrossSignal[] = [];
  for (let i = 1; i < short.length; i++) {
    const [before, now] = [side(i - 1), side(i)];
    if (before === null || now === null || now === before || now === 0) continue;
    const kind: CrossSignalKind = now === 1 ? "buy-alert" : "sell-alert";
    const sameBar = confirmed.some((c) => c.index === i && c.kind === (now === 1 ? "buy" : "sell"));
    if (!sameBar) alerts.push({ index: i, kind });
  }
  return [...confirmed, ...alerts].sort((a, b) => a.index - b.index);
}
