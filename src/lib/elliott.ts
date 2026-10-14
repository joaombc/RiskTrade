import type { Bar } from "./drawings/types";
import type { LabeledSwing } from "./trend";

/**
 * Contagem automática das ondas de Elliott (Murphy, cap. 13) sobre os topos e fundos confirmados:
 * impulso de 5 ondas (1-2-3-4-5) e correção A-B-C. As regras descartam contagens; as proporções de
 * Fibonacci dão a nota. A contagem é uma interpretação possível, não a única. Cálculos puros.
 */

export type WaveLabel = "0" | "1" | "2" | "3" | "4" | "5" | "A" | "B" | "C";

export interface WavePoint {
  index: number;
  price: number;
  label: WaveLabel;
  /** Extremo depois do último topo/fundo confirmado: ainda em formação, pode mudar. */
  provisional?: boolean;
}

export type RatioKey = "wave2" | "wave3" | "wave4" | "wave5" | "waveB" | "waveC";

export interface WaveRatio {
  key: RatioKey;
  value: number;
  /** Proporção ideal: um valor ou uma faixa. */
  ideal: number | [number, number];
  /** Encaixe de 0 a 1 (1 = na proporção ideal). */
  fit: number;
}

export interface FibLevel {
  ratio: number;
  price: number;
  kind: "retracement" | "projection";
}

export interface ElliottCount {
  /** Direção do impulso: alta (começa num fundo) ou baixa (começa num topo). */
  direction: "up" | "down";
  points: WavePoint[];
  /** Onda em andamento depois do último ponto confirmado. */
  current: Exclude<WaveLabel, "0">;
  /** Regras: true = respeitada; null = ainda não se aplica. */
  rules: { wave2: boolean | null; wave3: boolean | null; wave4: boolean | null };
  ratios: WaveRatio[];
  /** Média dos encaixes (0 a 1). */
  fit: number;
  /** Níveis de Fibonacci da onda em andamento. */
  levels: FibLevel[];
  /** Preço que derruba a contagem e de que lado ele precisa ser cruzado. */
  invalidation: { price: number; side: "below" | "above" } | null;
}

/** Encaixe de uma proporção: 1 na ideal (ou dentro da faixa), caindo com o erro relativo. */
export function ratioFit(value: number, ideal: number | [number, number]): number {
  const [lo, hi] = typeof ideal === "number" ? [ideal, ideal] : ideal;
  if (value >= lo && value <= hi) return 1;
  const near = value < lo ? lo : hi;
  return Math.max(0, 1 - Math.abs(value - near) / near);
}

const IMPULSE_LABELS: WaveLabel[] = ["0", "1", "2", "3", "4", "5"];
const NEXT: Record<WaveLabel, Exclude<WaveLabel, "0">> = { "0": "1", "1": "2", "2": "3", "3": "4", "4": "5", "5": "A", A: "B", B: "C", C: "1" };

/**
 * Monta e confere uma contagem a partir de pontos alternados (fundo, topo, … numa alta). Devolve
 * null se alguma regra for quebrada. Os cálculos usam preços "normalizados" (na baixa, o preço com
 * sinal trocado), então as mesmas contas valem para os dois lados.
 */
export function buildCount(
  swings: (Pick<LabeledSwing, "index" | "price" | "kind"> & { provisional?: boolean })[],
  impulseLength: number,
): ElliottCount | null {
  if (swings.length < 3 || impulseLength < 3 || impulseLength > 6) return null;
  const direction = swings[0].kind === "low" ? "up" : "down";
  const sign = direction === "up" ? 1 : -1;
  const v = swings.map((s) => s.price * sign);
  const unv = (x: number) => x * sign;
  const n = swings.length;
  const corrective = n - impulseLength;
  if (corrective < 0 || corrective > 3 || (corrective > 0 && impulseLength !== 6)) return null;

  const w1 = v[1] - v[0];
  const rules: ElliottCount["rules"] = { wave2: null, wave3: null, wave4: null };
  const ratios: WaveRatio[] = [];
  const ratio = (key: RatioKey, value: number, ideal: number | [number, number]) => ratios.push({ key, value, ideal, fit: ratioFit(value, ideal) });

  // Onda 2: não volta além do início da onda 1.
  rules.wave2 = v[2] > v[0];
  if (!rules.wave2 || w1 <= 0) return null;
  ratio("wave2", (v[1] - v[2]) / w1, [0.5, 0.618]);
  let w3 = 0;
  if (impulseLength >= 4) {
    w3 = v[3] - v[2];
    // A onda 3 precisa passar o fim da onda 1.
    if (v[3] <= v[1]) return null;
    ratio("wave3", w3 / w1, 1.618);
  }
  if (impulseLength >= 5) {
    // Onda 4: não entra no território da onda 1.
    rules.wave4 = v[4] > v[1];
    if (!rules.wave4) return null;
    ratio("wave4", (v[3] - v[4]) / w3, 0.382);
  }
  if (impulseLength === 6) {
    const w5 = v[5] - v[4];
    // Onda 3: não é a mais curta das ondas de impulso.
    rules.wave3 = !(w3 < w1 && w3 < w5);
    if (!rules.wave3 || w5 <= 0) return null;
    ratio("wave5", w5 / w1, 1);
  }
  const span = impulseLength === 6 ? v[5] - v[0] : 0;
  const a = corrective >= 1 ? v[5] - v[6] : 0;
  if (corrective >= 1 && (a <= 0 || a >= span)) return null;
  if (corrective >= 2) {
    // B corrige parte de A sem passar do fim do impulso.
    if (v[7] <= v[6] || v[7] >= v[5]) return null;
    ratio("waveB", (v[7] - v[6]) / a, [0.5, 0.618]);
  }
  if (corrective === 3) {
    if (v[8] >= v[7]) return null;
    ratio("waveC", (v[7] - v[8]) / a, 1);
  }

  const labels: WaveLabel[] = [...IMPULSE_LABELS.slice(0, impulseLength), ...(["A", "B", "C"] as const).slice(0, corrective)];
  const points = swings.map((s, k): WavePoint => ({ index: s.index, price: s.price, label: labels[k], ...(s.provisional ? { provisional: true } : {}) }));
  const last = labels[labels.length - 1];
  const current = NEXT[last];

  // Níveis da onda em andamento (em preço normalizado) e a invalidação.
  const lv: { ratio: number; v: number; kind: FibLevel["kind"] }[] = [];
  let inv: { v: number; side: "below" | "above" } | null = null;
  if (last === "2") {
    for (const r of [1.618, 2.618]) lv.push({ ratio: r, v: v[2] + r * w1, kind: "projection" });
    inv = { v: v[0], side: "below" };
  } else if (last === "3") {
    for (const r of [0.236, 0.382, 0.5, 0.618]) lv.push({ ratio: r, v: v[3] - r * w3, kind: "retracement" });
    inv = { v: v[1], side: "below" };
  } else if (last === "4") {
    lv.push({ ratio: 0.618, v: v[4] + 0.618 * (v[3] - v[0]), kind: "projection" }, { ratio: 1, v: v[4] + w1, kind: "projection" });
    inv = { v: v[4], side: "below" };
  } else if (last === "5") {
    for (const r of [0.382, 0.5, 0.618]) lv.push({ ratio: r, v: v[5] - r * span, kind: "retracement" });
    inv = { v: v[5], side: "above" };
  } else if (last === "A") {
    for (const r of [0.382, 0.5, 0.618]) lv.push({ ratio: r, v: v[6] + r * a, kind: "retracement" });
    inv = { v: v[5], side: "above" };
  } else if (last === "B") {
    for (const r of [1, 1.618]) lv.push({ ratio: r, v: v[7] - r * a, kind: "projection" });
    inv = { v: v[7], side: "above" };
  }
  // Na baixa, "abaixo" e "acima" se invertem ao voltar ao preço real.
  const flip = (side: "below" | "above") => (direction === "up" ? side : side === "below" ? "above" : "below");

  return {
    direction,
    points,
    current,
    rules,
    ratios,
    fit: ratios.length ? ratios.reduce((t, r) => t + r.fit, 0) / ratios.length : 0,
    levels: lv.map((l) => ({ ratio: l.ratio, price: unv(l.v), kind: l.kind })).sort((x, y) => x.price - y.price),
    invalidation: inv ? { price: unv(inv.v), side: flip(inv.side) } : null,
  };
}

/** A contagem já caiu: algum fechamento depois do último ponto passou do nível de invalidação. */
function brokenAfter(bars: Bar[], count: ElliottCount): boolean {
  const inv = count.invalidation;
  if (!inv) return false;
  const from = count.points[count.points.length - 1].index + 1;
  return bars.slice(from).some((b) => (inv.side === "below" ? b.close < inv.price : b.close > inv.price));
}

/**
 * Extremo depois do último topo/fundo confirmado (o fundo mais baixo depois de um topo, ou o topo
 * mais alto depois de um fundo): o movimento atual, que ainda não virou ponto confirmado.
 */
export function provisionalPoint(bars: Bar[], swings: Pick<LabeledSwing, "index" | "kind">[]) {
  const last = swings[swings.length - 1];
  if (!last || last.index >= bars.length - 1) return null;
  const after = bars.slice(last.index + 1);
  const kind = last.kind === "high" ? ("low" as const) : ("high" as const);
  let best = 0;
  after.forEach((b, k) => {
    if (kind === "low" ? b.low < after[best].low : b.high > after[best].high) best = k;
  });
  const bar = after[best];
  return { index: last.index + 1 + best, price: kind === "low" ? bar.low : bar.high, kind, provisional: true };
}

/**
 * Contagens que terminam no último topo/fundo confirmado, ou no ponto provisório depois dele, das
 * mais completas e bem encaixadas para as piores: impulsos de 3 a 6 pontos (ondas 1-2 até 1-5) e
 * impulsos completos seguidos de A, A-B ou A-B-C. Contagens que quebram regras ou já foram
 * invalidadas pelo preço ficam de fora.
 */
export function elliottCounts(bars: Bar[], swings: LabeledSwing[], max = 3): ElliottCount[] {
  const counts: ElliottCount[] = [];
  const provisional = provisionalPoint(bars, swings);
  // As só com pontos confirmados entram primeiro: no empate, elas ficam na frente.
  const sequences = provisional ? [swings, [...swings, provisional]] : [swings];
  for (const sequence of sequences) {
    const n = sequence.length;
    for (let length = 3; length <= 9 && length <= n; length++) {
      const count = buildCount(sequence.slice(n - length), Math.min(length, 6));
      if (count && !brokenAfter(bars, count)) counts.push(count);
    }
  }
  // Mais pontos confirmados e melhor encaixe primeiro: 1 ponto confirmado a mais vale 0,05 de nota.
  const score = (c: ElliottCount) => c.fit + 0.05 * c.points.filter((p) => !p.provisional).length;
  return counts.sort((x, y) => score(y) - score(x)).slice(0, max);
}

const STORAGE_KEY = "risktrade:elliott:v1";

/** Ondas de Elliott ligadas no gráfico (vale para todos os ativos). Storage bloqueado: desligadas. */
export function loadElliottEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveElliottEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage bloqueado: a escolha vale só nesta sessão.
  }
}
