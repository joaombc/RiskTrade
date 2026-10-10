import { TOOLS, type Bar, type Drawing } from "./drawings/types";
import { atrSeries, type LabeledSwing, type Trend } from "./trend";

/**
 * Linhas de tendência automáticas, pelos critérios de Murphy (cap. 4): na alta, retas por fundos
 * ascendentes; na baixa, por topos descendentes; na lateral, o suporte e a resistência da faixa.
 * Uma linha vale enquanto nenhum fechamento a atravessa; quanto mais toques e mais tempo, mais
 * confiável. Cálculos puros, a partir dos candles e dos topos e fundos confirmados.
 */

/** Fechamento além da reta por até 1/4 de ATR é violação rápida, não rompimento. */
const VIOLATION_ATRS = 0.25;
/** Topo/fundo a até meio ATR da reta conta como toque. */
const TOUCH_ATRS = 0.5;
/** Na lateral, topos (ou fundos) a até 1 ATR do último formam o mesmo nível. */
const RANGE_ATRS = 1;

/**
 * main: a linha mais confiável da tendência; recent: a reta pelos dois últimos fundos (ou topos),
 * mais inclinada que a principal; channel: a paralela do canal; support/resistance: a faixa lateral.
 */
export type TrendLineRole = "main" | "recent" | "channel" | "support" | "resistance";

export interface LinePoint {
  index: number;
  price: number;
}

export interface TrendLine {
  role: TrendLineRole;
  /** support: o preço está acima da linha (LTA, suporte); resistance: abaixo (LTB, resistência). */
  side: "support" | "resistance";
  /** Primeiro ponto da linha (o início dela no gráfico). */
  from: LinePoint;
  /** Segundo ponto que define a reta. */
  through: LinePoint;
  /** Valor da linha no último candle: o nível de rompimento hoje. */
  now: number;
  touches: number;
}

export const lineAt = (a: LinePoint, b: LinePoint, index: number) =>
  b.index === a.index ? a.price : a.price + ((b.price - a.price) * (index - a.index)) / (b.index - a.index);

/** Nenhum fechamento atravessa a reta (além da tolerância) do primeiro ponto até o último candle. */
function holds(bars: Bar[], atr: number[], a: LinePoint, b: LinePoint, side: TrendLine["side"]): boolean {
  for (let k = a.index; k < bars.length; k++) {
    const gap = bars[k].close - lineAt(a, b, k);
    if (side === "support" ? gap < -VIOLATION_ATRS * atr[k] : gap > VIOLATION_ATRS * atr[k]) return false;
  }
  return true;
}

/** Topos/fundos a partir do início da reta que a tocam; devolve quantos e o último toque. */
function touchesOf(pivots: LabeledSwing[], atr: number[], a: LinePoint, b: LinePoint) {
  const touching = pivots.filter((p) => p.index >= a.index && Math.abs(p.price - lineAt(a, b, p.index)) <= TOUCH_ATRS * atr[p.index]);
  return { touches: touching.length, last: touching.at(-1)?.index ?? a.index };
}

const point = (s: LabeledSwing): LinePoint => ({ index: s.index, price: s.price });

function slopedLines(bars: Bar[], swings: LabeledSwing[], atr: number[], trend: "up" | "down"): TrendLine[] {
  const last = bars.length - 1;
  const side = trend === "up" ? "support" : "resistance";
  const pivots = swings.filter((s) => s.kind === (trend === "up" ? "low" : "high"));
  const rising = (a: LinePoint, b: LinePoint) => (trend === "up" ? b.price > a.price : b.price < a.price);
  const make = (role: TrendLineRole, a: LinePoint, b: LinePoint, touches: number): TrendLine => ({
    role,
    side,
    from: a,
    through: b,
    now: lineAt(a, b, last),
    touches,
  });

  // Todas as retas válidas por dois fundos (ou topos) na direção da tendência.
  const candidates: { a: LinePoint; b: LinePoint; touches: number; lastTouch: number }[] = [];
  for (let i = 0; i < pivots.length; i++) {
    for (let j = i + 1; j < pivots.length; j++) {
      const [a, b] = [point(pivots[i]), point(pivots[j])];
      if (!rising(a, b) || !holds(bars, atr, a, b, side)) continue;
      const { touches, last: lastTouch } = touchesOf(pivots, atr, a, b);
      candidates.push({ a, b, touches, lastTouch });
    }
  }
  if (candidates.length === 0) return [];

  // Mais toques primeiro; depois a de toque mais recente; depois a mais longa.
  candidates.sort((x, y) => y.touches - x.touches || y.lastTouch - x.lastTouch || x.a.index - y.a.index);
  const best = candidates[0];
  const lines = [make("main", best.a, best.b, best.touches)];
  const slope = (a: LinePoint, b: LinePoint) => (b.price - a.price) / (b.index - a.index);
  const mainSlope = slope(best.a, best.b);

  // Reta pelos dois últimos fundos (ou topos): mais inclinada que a principal, costuma romper primeiro.
  const [p1, p2] = pivots.slice(-2).map(point);
  if (p1 && p2 && (p1.index !== best.a.index || p2.index !== best.b.index)) {
    const recent = candidates.find((c) => c.a.index === p1.index && c.b.index === p2.index);
    const steeper = trend === "up" ? slope(p1, p2) > mainSlope : slope(p1, p2) < mainSlope;
    if (recent && steeper) lines.push(make("recent", p1, p2, recent.touches));
  }

  // Canal: paralela à principal pelo topo (na alta) ou fundo (na baixa) mais distante dela.
  const opposite = swings.filter((s) => s.kind === (trend === "up" ? "high" : "low") && s.index >= best.a.index);
  if (opposite.length >= 2) {
    const distance = (s: LabeledSwing) => (s.price - lineAt(best.a, best.b, s.index)) * (trend === "up" ? 1 : -1);
    const far = opposite.reduce((m, s) => (distance(s) > distance(m) ? s : m));
    const offset = far.price - lineAt(best.a, best.b, far.index);
    const shifted = (p: LinePoint): LinePoint => ({ index: p.index, price: p.price + offset });
    const [ca, cb] = [shifted(best.a), shifted(best.b)];
    const { touches, last: lastTouch } = touchesOf(opposite, atr, ca, cb);
    // Só enquanto o canal "trabalha": o último topo (ou fundo) ainda encosta na paralela.
    if (touches >= 2 && lastTouch === opposite[opposite.length - 1].index) lines.push(make("channel", ca, cb, touches));
  }
  return lines;
}

/** Nível horizontal da faixa a partir do último topo (ou fundo), voltando pelos que ficam no mesmo nível. */
function rangeLine(bars: Bar[], swings: LabeledSwing[], atr: number[], kind: "high" | "low"): TrendLine | null {
  const pivots = swings.filter((s) => s.kind === kind);
  const lastPivot = pivots.at(-1);
  if (!lastPivot) return null;
  let start = lastPivot;
  let touches = 1;
  for (let k = pivots.length - 2; k >= 0 && Math.abs(pivots[k].price - lastPivot.price) <= RANGE_ATRS * atr[lastPivot.index]; k--) {
    start = pivots[k];
    touches++;
  }
  const level = lastPivot.price;
  return {
    role: kind === "high" ? "resistance" : "support",
    side: kind === "high" ? "resistance" : "support",
    from: { index: start.index, price: level },
    through: { index: lastPivot.index, price: level },
    now: level,
    touches,
  };
}

/** Linhas da tendência atual: inclinadas na alta e na baixa, horizontais na lateral. */
export function findTrendLines(bars: Bar[], swings: LabeledSwing[], trend: Trend): TrendLine[] {
  if (bars.length === 0) return [];
  const atr = atrSeries(bars);
  if (trend !== "lateral") return slopedLines(bars, swings, atr, trend);
  return [rangeLine(bars, swings, atr, "high"), rangeLine(bars, swings, atr, "low")].filter((l): l is TrendLine => l !== null);
}

/**
 * Linhas automáticas como desenhos editáveis ("Copiar para meus desenhos"), sem o id: a principal
 * vira canal quando há paralela; a recente, linha de tendência; a faixa lateral, suporte/resistência.
 */
export function trendLinesToDrawings(bars: Bar[], lines: TrendLine[]): Omit<Drawing, "id">[] {
  const anchor = (p: LinePoint) => ({ time: bars[p.index].time, price: p.price });
  const channel = lines.find((l) => l.role === "channel");
  return lines.flatMap((l): Omit<Drawing, "id">[] => {
    if (l.role === "channel") return [];
    if (l.role === "main" && channel) {
      return [{ kind: "channel", points: [anchor(l.from), anchor(l.through), anchor(channel.from)], options: {} }];
    }
    if (l.role === "main" || l.role === "recent") {
      return [{ kind: "trendline", points: [anchor(l.from), anchor(l.through)], options: { ...TOOLS.trendline.defaults } }];
    }
    return [{ kind: "horizontal", points: [anchor(l.through)], options: { ...TOOLS.horizontal.defaults } }];
  });
}
