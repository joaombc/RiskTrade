import type { Bar } from "./drawings/types";

/**
 * Gráfico de ponto e figura com reversão de 3 caixas (Murphy, cap. 11), pelo método da máxima e da
 * mínima: numa coluna de X, primeiro se tenta estender a coluna com a máxima; só se não der, se
 * verifica a reversão pela mínima (numa coluna de O, o inverso). O tempo não importa: uma coluna
 * nova só começa quando o preço reverte pelo menos 3 caixas. Cálculos puros, a partir dos candles.
 */

export const PF_REVERSAL = 3;

/** Escala de tamanhos de caixa "redondos" por década, usada no ajuste − / +. */
const NICE = [1, 2, 2.5, 4, 5];
/** Mais linhas que isso deixaria o gráfico ilegível: o − para antes. */
export const PF_MAX_ROWS = 400;

const EPS = 1e-9;
const MONTH_MARKS = "123456789ABC";

export interface PFBox {
  /** Nível da caixa em múltiplos do tamanho da caixa (preço = nível × caixa). */
  level: number;
  /** Candle em que a caixa foi preenchida. */
  index: number;
  /** Mês (1–9, A, B, C) na primeira caixa preenchida em cada mês, como nos gráficos de Murphy. */
  month?: string;
}

export interface PFColumn {
  kind: "X" | "O";
  /** Nível mais baixo e mais alto da coluna. */
  low: number;
  high: number;
  /** Caixas na ordem em que foram preenchidas (X: de baixo para cima; O: de cima para baixo). */
  boxes: PFBox[];
}

export interface PFSignal {
  kind: "buy" | "sell";
  /** Coluna em que o sinal aconteceu. */
  column: number;
  /** Nível da caixa que rompeu o topo (ou fundo) da coluna anterior do mesmo tipo. */
  level: number;
  index: number;
}

export interface PointFigure {
  box: number;
  reversal: number;
  columns: PFColumn[];
  signals: PFSignal[];
}

const topLevel = (price: number, box: number) => Math.floor(price / box + EPS);
const bottomLevel = (price: number, box: number) => Math.ceil(price / box - EPS);

/** Monta as colunas e os sinais: compra quando um X passa o topo do X anterior; venda quando um O perde o fundo do O anterior. */
export function pointFigure(bars: Bar[], box: number, reversal = PF_REVERSAL): PointFigure {
  const columns: PFColumn[] = [];
  const signals: PFSignal[] = [];
  let lastMonth = -1;

  const mark = (index: number): string | undefined => {
    const date = new Date(bars[index].time * 1000);
    const month = date.getUTCFullYear() * 12 + date.getUTCMonth();
    if (month === lastMonth) return undefined;
    lastMonth = month;
    return MONTH_MARKS[date.getUTCMonth()];
  };

  /** Preenche níveis na coluna atual e verifica o rompimento da coluna anterior do mesmo tipo. */
  const fill = (levels: number[], index: number) => {
    const c = columns.length - 1;
    const column = columns[c];
    const previous = columns[c - 2];
    for (const level of levels) {
      const month = mark(index);
      column.boxes.push(month ? { level, index, month } : { level, index });
      column.low = Math.min(column.low, level);
      column.high = Math.max(column.high, level);
      if (column.kind === "X" && previous && level === previous.high + 1) signals.push({ kind: "buy", column: c, level, index });
      if (column.kind === "O" && previous && level === previous.low - 1) signals.push({ kind: "sell", column: c, level, index });
    }
  };
  const range = (from: number, to: number) =>
    Array.from({ length: Math.abs(to - from) + 1 }, (_, k) => (to >= from ? from + k : from - k));
  const open = (kind: "X" | "O", from: number, to: number, index: number) => {
    columns.push({ kind, low: from, high: from, boxes: [] });
    fill(range(from, to), index);
  };

  if (bars.length === 0 || !(box > 0)) return { box, reversal, columns, signals };

  // Primeira coluna: quando o preço anda `reversal` caixas a partir do primeiro fechamento.
  const start = Math.round(bars[0].close / box);
  let i = 0;
  for (; i < bars.length; i++) {
    const up = topLevel(bars[i].high, box) >= start + reversal;
    const down = bottomLevel(bars[i].low, box) <= start - reversal;
    if (!up && !down) continue;
    // Nas duas direções no mesmo candle: vale a do fechamento.
    if (up && (!down || bars[i].close >= bars[i].open)) open("X", start, topLevel(bars[i].high, box), i);
    else open("O", start, bottomLevel(bars[i].low, box), i);
    i++;
    break;
  }

  for (; i < bars.length; i++) {
    const column = columns[columns.length - 1];
    const top = topLevel(bars[i].high, box);
    const bottom = bottomLevel(bars[i].low, box);
    if (column.kind === "X") {
      if (top > column.high) fill(range(column.high + 1, top), i);
      else if (bottom <= column.high - reversal) open("O", column.high - 1, bottom, i);
    } else if (bottom < column.low) fill(range(column.low - 1, bottom), i);
    else if (top >= column.low + reversal) open("X", column.low + 1, top, i);
  }
  return { box, reversal, columns, signals };
}

/** Todos os tamanhos "redondos" entre 0,0001 e 50 000. */
const NICE_SIZES = Array.from({ length: 9 }, (_, d) => NICE.map((n) => +(n * 10 ** (d - 4)).toPrecision(6))).flat();

/** Tamanho "redondo" mais próximo de `value`. */
function nearestNice(value: number): number {
  return NICE_SIZES.reduce((best, s) => (Math.abs(Math.log(s / value)) < Math.abs(Math.log(best / value)) ? s : best));
}

/**
 * Tamanho de caixa padrão pela tabela tradicional por faixa de preço (Murphy, cap. 11) e, fora
 * dela (preços muito baixos ou muito altos), cerca de 1% do preço.
 */
export function defaultBoxSize(price: number): number {
  if (price < 1 || price >= 500) return nearestNice(price * 0.01);
  if (price < 5) return 0.25;
  if (price < 20) return 0.5;
  if (price < 100) return 1;
  if (price < 200) return 2;
  return 4;
}

/** Próximo tamanho de caixa na escala (dir = +1 maior, −1 menor). */
export function stepBoxSize(box: number, dir: 1 | -1): number {
  const k = NICE_SIZES.indexOf(nearestNice(box));
  return NICE_SIZES[Math.min(NICE_SIZES.length - 1, Math.max(0, k + dir))];
}

/** Linhas que o gráfico teria com essa caixa (da mínima à máxima do período). */
export function pfRows(bars: Bar[], box: number): number {
  if (bars.length === 0) return 0;
  const high = Math.max(...bars.map((b) => b.high));
  const low = Math.min(...bars.map((b) => b.low));
  return topLevel(high, box) - bottomLevel(low, box) + 1;
}

export interface PFTrigger {
  /** Preço que dá o sinal (topo do X anterior + 1 caixa, ou fundo do O anterior − 1 caixa). */
  price: number;
  /** A coluna atual já passou desse nível. */
  triggered: boolean;
}

export interface PFReading {
  current: PFColumn;
  lastSignal: PFSignal | null;
  buy: PFTrigger | null;
  sell: PFTrigger | null;
}

/** Leitura da última coluna; null se ainda não há coluna. */
export function readPointFigure({ columns, signals, box }: PointFigure): PFReading | null {
  const current = columns.at(-1);
  if (!current) return null;
  const last = columns.length - 1;
  // A coluna que precisa ser rompida: a anterior do mesmo tipo, ou a última do outro tipo (a próxima coluna rompe).
  const reference = (kind: "X" | "O") => (current.kind === kind ? columns[last - 2] : columns[last - 1]);
  const xRef = reference("X");
  const oRef = reference("O");
  return {
    current,
    lastSignal: signals.at(-1) ?? null,
    buy: xRef ? { price: (xRef.high + 1) * box, triggered: current.kind === "X" && current.high > xRef.high } : null,
    sell: oRef ? { price: (oRef.low - 1) * box, triggered: current.kind === "O" && current.low < oRef.low } : null,
  };
}

export type ChartType = "candles" | "pointFigure";

const TYPE_KEY = "risktrade:chartType:v1";

/** Tipo de gráfico escolhido (vale para todos os ativos). Storage bloqueado: candles. */
export function loadChartType(): ChartType {
  try {
    return localStorage.getItem(TYPE_KEY) === "pointFigure" ? "pointFigure" : "candles";
  } catch {
    return "candles";
  }
}

export function saveChartType(type: ChartType): void {
  try {
    if (type === "pointFigure") localStorage.setItem(TYPE_KEY, type);
    else localStorage.removeItem(TYPE_KEY);
  } catch {
    // Storage bloqueado: a escolha vale só nesta sessão.
  }
}
