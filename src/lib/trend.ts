import { isSwing } from "./drawings/geometry";
import type { Bar } from "./drawings/types";

/**
 * Tendência pela definição de Murphy (cap. 4): a direção dos topos e fundos. Alta = fundos
 * mais altos, com topos subindo (ou no mesmo nível); baixa = topos mais baixos, com fundos caindo
 * (ou no mesmo nível); lateral = topos e fundos no mesmo nível ou sem direção comum. Cálculos puros, a partir dos candles.
 */

export type Trend = "up" | "down" | "lateral";

/** Os três prazos de Murphy: primária, intermediária e de curto prazo. */
export type TrendDegree = "primary" | "intermediate" | "short";

export const TREND_DEGREES: TrendDegree[] = ["primary", "intermediate", "short"];

/** Candles de cada lado que confirmam um topo ou fundo, em cada prazo. */
export const TREND_WINDOWS: Record<TrendDegree, number> = { primary: 25, intermediate: 10, short: 3 };

/** Topos ou fundos a menos de meio ATR do anterior contam como no mesmo nível. */
const EQUAL_ATRS = 0.5;
const ATR_PERIOD = 14;

/** Comparação com o topo (ou fundo) anterior: mais alto, mais baixo ou no mesmo nível. */
export type SwingStep = "higher" | "lower" | "equal";

export interface Swing {
  index: number;
  kind: "high" | "low";
  price: number;
  /** Candle em que o topo/fundo fica confirmado (`window` candles depois). */
  confirmedAt: number;
}

export interface LabeledSwing extends Swing {
  /** Null no primeiro topo (ou fundo): não há anterior para comparar. */
  step: SwingStep | null;
}

/** ATR simples em cada candle (média do true range dos últimos `period` candles, ou dos que houver). */
export function atrSeries(bars: Bar[], period = ATR_PERIOD): number[] {
  const ranges = bars.map((b, i) =>
    i === 0 ? b.high - b.low : Math.max(b.high - b.low, Math.abs(b.high - bars[i - 1].close), Math.abs(b.low - bars[i - 1].close)),
  );
  let sum = 0;
  return ranges.map((r, i) => {
    sum += r;
    if (i >= period) sum -= ranges[i - period];
    return sum / Math.min(i + 1, period);
  });
}

/** Junta um topo/fundo à lista mantendo a alternância: dois topos seguidos, fica o mais alto (e vice-versa). */
function pushAlternating(list: Swing[], swing: Swing): void {
  const last = list[list.length - 1];
  if (last && last.kind === swing.kind) {
    if (swing.kind === "high" ? swing.price > last.price : swing.price < last.price) list[list.length - 1] = swing;
    return;
  }
  list.push(swing);
}

/** Candidatos a topo e fundo, em ordem; um candle pode ser os dois (candle de expansão). */
function swingCandidates(bars: Bar[], window: number): Swing[] {
  const out: Swing[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (isSwing(bars, i, "high", window)) out.push({ index: i, kind: "high", price: bars[i].high, confirmedAt: i + window });
    if (isSwing(bars, i, "low", window)) out.push({ index: i, kind: "low", price: bars[i].low, confirmedAt: i + window });
  }
  return out;
}

export function compareSwing(price: number, previous: number, tolerance: number): SwingStep {
  if (Math.abs(price - previous) <= tolerance) return "equal";
  return price > previous ? "higher" : "lower";
}

/** Topos e fundos alternados, cada um comparado ao anterior do mesmo tipo. */
export function findSwings(bars: Bar[], window: number): LabeledSwing[] {
  const list: Swing[] = [];
  for (const c of swingCandidates(bars, window)) pushAlternating(list, c);
  const atr = atrSeries(bars);
  return list.map((s, k) => {
    const previous = list[k - 2];
    return { ...s, step: previous ? compareSwing(s.price, previous.price, atr[s.index] * EQUAL_ATRS) : null };
  });
}

export interface TrendState {
  trend: Trend;
  /** Topos e fundos indicavam essa tendência, mas o fechamento passou do último fundo (alta) ou topo (baixa). */
  broken: "up" | "down" | null;
}

/** Últimos dois topos e dois fundos da lista. */
function lastPairs(list: Swing[]) {
  const highs = list.filter((s) => s.kind === "high");
  const lows = list.filter((s) => s.kind === "low");
  return { prevHigh: highs.at(-2), lastHigh: highs.at(-1), prevLow: lows.at(-2), lastLow: lows.at(-1) };
}

/**
 * Tendência em cada candle, só com os topos e fundos já confirmados até ali (sem olhar o futuro).
 * Null enquanto não há dois topos e dois fundos.
 */
export function trendStates(bars: Bar[], window: number): (TrendState | null)[] {
  const candidates = swingCandidates(bars, window);
  const atr = atrSeries(bars);
  const list: Swing[] = [];
  let next = 0;
  /** Quebra da tendência: vale até se confirmar um topo ou fundo formado a partir do candle `at`. */
  let broken: { at: number; from: "up" | "down" } | null = null;
  return bars.map((bar, i) => {
    while (next < candidates.length && candidates[next].confirmedAt <= i) pushAlternating(list, candidates[next++]);
    const { prevHigh, lastHigh, prevLow, lastLow } = lastPairs(list);
    if (!prevHigh || !lastHigh || !prevLow || !lastLow) return null;
    const tolerance = atr[i] * EQUAL_ATRS;
    const highs = compareSwing(lastHigh.price, prevHigh.price, tolerance);
    const lows = compareSwing(lastLow.price, prevLow.price, tolerance);
    // Topo no mesmo nível numa alta (ou fundo no mesmo nível numa baixa) é aviso, não fim de tendência.
    const base: Trend =
      lows === "higher" && highs !== "lower" ? "up" : highs === "lower" && lows !== "higher" ? "down" : "lateral";
    // Murphy: a alta termina quando a correção perde o último fundo (a baixa, quando o repique passa
    // o último topo). Voltar para dentro do nível não desfaz a quebra: só um novo topo ou fundo muda a leitura.
    if (broken && list[list.length - 1].index < broken.at) return { trend: "lateral", broken: broken.from };
    broken = null;
    if (base === "up" && bar.close < lastLow.price) broken = { at: i, from: "up" };
    if (base === "down" && bar.close > lastHigh.price) broken = { at: i, from: "down" };
    return broken ? { trend: "lateral", broken: broken.from } : { trend: base, broken: null };
  });
}

export interface TrendReading extends TrendState {
  /** Primeiro candle da tendência atual (desde quando ela vale sem interrupção). */
  since: number;
  lastHigh: LabeledSwing | null;
  lastLow: LabeledSwing | null;
  /**
   * Nível que muda a leitura: na alta, perder o último fundo; na baixa, passar o último topo;
   * na lateral, romper a faixa entre o último topo e o último fundo.
   */
  invalidation: { below: number | null; above: number | null };
}

/** Leitura no último candle; null se ainda não há topos e fundos suficientes. */
export function readTrend(bars: Bar[], window: number, states = trendStates(bars, window), swings = findSwings(bars, window)): TrendReading | null {
  const last = states.at(-1);
  if (!last) return null;
  let since = states.length - 1;
  while (since > 0 && states[since - 1]?.trend === last.trend) since--;
  const confirmed = swings.filter((s) => s.confirmedAt <= states.length - 1);
  const lastHigh = confirmed.findLast((s) => s.kind === "high") ?? null;
  const lastLow = confirmed.findLast((s) => s.kind === "low") ?? null;
  const invalidation =
    last.trend === "up"
      ? { below: lastLow?.price ?? null, above: null }
      : last.trend === "down"
        ? { below: null, above: lastHigh?.price ?? null }
        : { below: lastLow?.price ?? null, above: lastHigh?.price ?? null };
  return { ...last, since, lastHigh, lastLow, invalidation };
}

const STORAGE_KEY = "risktrade:trend:v1";

/** Prazo da tendência mostrado no gráfico (vale para todos os ativos); null = desligada. Storage bloqueado: desligada. */
export function loadTrendDegree(): TrendDegree | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return TREND_DEGREES.includes(raw as TrendDegree) ? (raw as TrendDegree) : null;
  } catch {
    return null;
  }
}

export function saveTrendDegree(degree: TrendDegree | null): void {
  try {
    if (degree) localStorage.setItem(STORAGE_KEY, degree);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage bloqueado: a escolha vale só nesta sessão.
  }
}
