import type { Bar } from "./drawings/types";
import { findSwings, readTrend, TREND_WINDOWS, atrSeries } from "./trend";
import { invertBars } from "./tradePlan";

/**
 * Posições abertas e a gestão automática delas pelas regras do capítulo 16 de Murphy. O app guarda
 * só o que o usuário registrou (a compra, as unidades e as vendas); o resto é recalculado candle a
 * candle desde a entrada, sem olhar o futuro:
 * - stop móvel: sobe para baixo de cada novo fundo confirmado e nunca desce (deixar o lucro correr,
 *   cortar as perdas); a unidade de tendência usa os fundos intermediários (stop folgado), a de
 *   trading, depois do 1º objetivo, os de curto prazo (stop apertado);
 * - breakeven: no 1º objetivo, o stop vai para o preço de entrada (regra 10d);
 * - stop atingido, alvo atingido e virada da tendência viram instruções de saída.
 * A venda a descoberto é o espelho: calculada sobre os preços invertidos. Cálculos puros.
 */

export type UnitKind = "trading" | "trending" | "pyramid";

export interface UnitExit {
  price: number;
  /** Unix, segundos. */
  at: number;
}

export interface PositionUnit {
  id: string;
  kind: UnitKind;
  quantity: number;
  entry: number;
  /** Data da entrada (unix, segundos). */
  at: number;
  /** Stop inicial, registrado na compra. */
  stop: number;
  exit?: UnitExit;
}

export interface Position {
  id: string;
  symbol: string;
  name: string;
  side: "long" | "short";
  currency: string;
  /** 1º objetivo (realizar a unidade de trading) e alvo (unidade de tendência). */
  target1: number | null;
  target: number | null;
  units: PositionUnit[];
}

export type PositionEvent =
  | { key: "stopRaised"; unitId: string; from: number; to: number; time: number }
  | { key: "breakeven"; unitId: string; to: number; time: number }
  | { key: "target1Hit"; price: number; time: number }
  | { key: "targetHit"; price: number; time: number }
  | { key: "stopHit"; unitId: string; price: number; time: number };

export interface UnitState {
  unit: PositionUnit;
  /** Stop de agora, já com os ajustes automáticos. */
  stop: number;
  /** open: aberta; stopHit: o preço tocou o stop e falta registrar a venda; closed: venda registrada. */
  status: "open" | "stopHit" | "closed";
  /** Preço provável da saída pelo stop (o stop, ou a abertura se ela abriu além dele). */
  stopFill: number | null;
  /** Resultado por unidade do ativo (positivo = ganho), pelo preço de saída ou pelo último preço. */
  pnlPerUnit: number;
}

export type Instruction =
  | { key: "sellStop"; unitIds: string[]; price: number }
  | { key: "trendReversed" }
  | { key: "takeProfit"; unitId: string; price: number }
  | { key: "targetReached"; price: number; stop: number }
  | { key: "raiseStop"; unitIds: string[]; to: number }
  | { key: "hold"; stop: number }
  | { key: "pyramid" }
  | { key: "noAddLoser" };

export interface PositionTracking {
  price: number;
  units: UnitState[];
  events: PositionEvent[];
  instructions: Instruction[];
  /** Resultado no preço de agora (abertas) e nas saídas (fechadas), em moeda do ativo. */
  pnl: number;
  /** Quanto se perde ainda se os stops abertos forem atingidos (0 com stops no breakeven ou acima). */
  openRisk: number;
  /** Todas as unidades abertas com stop no preço de entrada ou melhor: posição sem risco. */
  riskFree: boolean;
  /** Preço médio das unidades abertas. */
  averageEntry: number | null;
  /** A tendência intermediária virou contra a posição (ou o último fundo foi perdido). */
  trendAgainst: boolean;
  closed: boolean;
}

/** Folga do stop móvel abaixo do fundo, em ATR. */
const TRAIL_ATRS = 0.25;
/** Fundos de curto prazo para o stop apertado (unidade de trading depois do 1º objetivo, ou depois do alvo). */
const TIGHT_WINDOW = TREND_WINDOWS.short;
/** Ajustes de stop nos últimos candles viram a instrução "suba o stop". */
const RECENT_BARS = 2;

const dayOf = (unixSeconds: number) => new Date(unixSeconds * 1000).toISOString().slice(0, 10);

/** Índice do candle do dia da entrada (ou o primeiro depois dela); -1 se a entrada é depois de todos. */
function entryIndex(bars: Bar[], at: number): number {
  const day = dayOf(at);
  return bars.findIndex((b) => dayOf(b.time) >= day);
}

/** Posição no espelho (venda a descoberto vira compra), para reaproveitar a lógica. */
function invertPosition(p: Position): Position {
  const flip = (v: number | null) => (v === null ? null : -v);
  return {
    ...p,
    target1: flip(p.target1),
    target: flip(p.target),
    units: p.units.map((u) => ({ ...u, entry: -u.entry, stop: -u.stop, exit: u.exit ? { ...u.exit, price: -u.exit.price } : undefined })),
  };
}

function flipTracking(t: PositionTracking): PositionTracking {
  const flipEvent = (e: PositionEvent): PositionEvent =>
    e.key === "stopRaised" ? { ...e, from: -e.from, to: -e.to } : e.key === "breakeven" ? { ...e, to: -e.to } : { ...e, price: -e.price };
  const flipInstruction = (i: Instruction): Instruction => {
    switch (i.key) {
      case "sellStop":
      case "takeProfit":
        return { ...i, price: -i.price };
      case "targetReached":
        return { ...i, price: -i.price, stop: -i.stop };
      case "raiseStop":
        return { ...i, to: -i.to };
      case "hold":
        return { ...i, stop: -i.stop };
      default:
        return i;
    }
  };
  return {
    ...t,
    price: -t.price,
    units: t.units.map((u) => ({
      ...u,
      unit: { ...u.unit, entry: -u.unit.entry, stop: -u.unit.stop, exit: u.unit.exit ? { ...u.unit.exit, price: -u.unit.exit.price } : undefined },
      stop: -u.stop,
      stopFill: u.stopFill === null ? null : -u.stopFill,
    })),
    events: t.events.map(flipEvent),
    instructions: t.instructions.map(flipInstruction),
    averageEntry: t.averageEntry === null ? null : -t.averageEntry,
  };
}

/** Gestão de uma posição comprada (a vendida passa pelo espelho em trackPosition). */
function trackLong(position: Position, bars: Bar[]): PositionTracking {
  const last = bars.length - 1;
  const price = bars[last].close;
  const atr = atrSeries(bars);
  const wide = findSwings(bars, TREND_WINDOWS.intermediate).filter((s) => s.kind === "low");
  const tight = findSwings(bars, TIGHT_WINDOW).filter((s) => s.kind === "low");
  const events: PositionEvent[] = [];
  const first = Math.min(...position.units.map((u) => Math.max(0, entryIndex(bars, u.at))));
  let t1At: number | null = null;
  let targetAt: number | null = null;

  const states = position.units.map((unit) => ({ unit, stop: unit.stop, status: "open" as UnitState["status"], stopFill: null as number | null, from: entryIndex(bars, unit.at) }));
  for (let i = first; i <= last; i++) {
    const bar = bars[i];
    // 1º objetivo e alvo: a máxima do candle chegou lá.
    if (t1At === null && position.target1 !== null && bar.high >= position.target1) {
      t1At = i;
      events.push({ key: "target1Hit", price: position.target1, time: bar.time });
    }
    if (targetAt === null && position.target !== null && bar.high >= position.target) {
      targetAt = i;
      events.push({ key: "targetHit", price: position.target, time: bar.time });
    }
    for (const s of states) {
      if (s.from < 0 || i < s.from || s.status !== "open") continue;
      const exitDay = s.unit.exit ? dayOf(s.unit.exit.at) : null;
      // Stop atingido no candle (antes de qualquer ajuste dele): a saída é no stop ou na abertura com gap.
      if (i > s.from && bar.low <= s.stop && (!exitDay || dayOf(bar.time) <= exitDay)) {
        s.status = "stopHit";
        s.stopFill = Math.min(bar.open, s.stop);
        events.push({ key: "stopHit", unitId: s.unit.id, price: s.stopFill, time: bar.time });
        continue;
      }
      if (exitDay && dayOf(bar.time) >= exitDay) continue;
      let next = s.stop;
      // Breakeven: no 1º objetivo, a proteção vai para o preço de entrada (regra 10d).
      if (t1At !== null && i >= t1At && next < s.unit.entry) {
        next = s.unit.entry;
        events.push({ key: "breakeven", unitId: s.unit.id, to: next, time: bar.time });
      }
      const protectedAt = next;
      // Stop móvel abaixo do último fundo confirmado depois da entrada: folgado na unidade de tendência,
      // apertado na de trading depois do 1º objetivo e em todas depois do alvo.
      const useTight = targetAt !== null ? i >= targetAt : s.unit.kind === "trading" && t1At !== null && i >= t1At;
      const lows = useTight ? tight : s.unit.kind === "trading" ? [] : wide;
      const swing = lows.findLast((l) => l.index > s.from && l.confirmedAt <= i);
      if (swing) next = Math.max(next, swing.price - TRAIL_ATRS * atr[swing.index]);
      if (next > protectedAt) events.push({ key: "stopRaised", unitId: s.unit.id, from: protectedAt, to: next, time: bar.time });
      s.stop = next;
    }
  }

  const units: UnitState[] = states.map((s) => {
    const status: UnitState["status"] = s.unit.exit ? "closed" : s.status;
    const exitPrice = s.unit.exit?.price ?? (status === "stopHit" ? (s.stopFill ?? price) : price);
    return { unit: s.unit, stop: s.stop, status, stopFill: s.stopFill, pnlPerUnit: exitPrice - s.unit.entry };
  });
  const open = units.filter((u) => u.status === "open");
  const pnl = units.reduce((sum, u) => sum + u.pnlPerUnit * u.unit.quantity, 0);
  const openRisk = open.reduce((sum, u) => sum + Math.max(0, u.unit.entry - u.stop) * u.unit.quantity, 0);
  const quantityOpen = open.reduce((sum, u) => sum + u.unit.quantity, 0);
  const averageEntry = quantityOpen > 0 ? open.reduce((sum, u) => sum + u.unit.entry * u.unit.quantity, 0) / quantityOpen : null;
  const riskFree = open.length > 0 && open.every((u) => u.stop >= u.unit.entry);
  const reading = readTrend(bars, TREND_WINDOWS.intermediate);
  const trendAgainst = reading !== null && (reading.trend === "down" || reading.broken === "up");

  // Instruções de agora, da mais urgente para a mais tranquila.
  const instructions: Instruction[] = [];
  const hit = units.filter((u) => u.status === "stopHit");
  if (hit.length) instructions.push({ key: "sellStop", unitIds: hit.map((u) => u.unit.id), price: Math.min(...hit.map((u) => u.stopFill ?? u.stop)) });
  if (open.length && trendAgainst) instructions.push({ key: "trendReversed" });
  const trading = open.find((u) => u.unit.kind === "trading");
  if (trading && t1At !== null && targetAt === null && position.target1 !== null) instructions.push({ key: "takeProfit", unitId: trading.unit.id, price: position.target1 });
  if (open.length && targetAt !== null && position.target !== null) instructions.push({ key: "targetReached", price: position.target, stop: Math.max(...open.map((u) => u.stop)) });
  const recent = events.filter((e) => (e.key === "stopRaised" || e.key === "breakeven") && e.time >= bars[Math.max(0, last - RECENT_BARS + 1)].time) as Extract<PositionEvent, { unitId: string }>[];
  const raised = open.filter((u) => recent.some((e) => e.unitId === u.unit.id));
  if (raised.length) instructions.push({ key: "raiseStop", unitIds: raised.map((u) => u.unit.id), to: Math.max(...raised.map((u) => u.stop)) });
  if (open.length && !hit.length && !trendAgainst) {
    if (averageEntry !== null && price < averageEntry) instructions.push({ key: "noAddLoser" });
    else if (riskFree) instructions.push({ key: "pyramid" });
  }
  if (open.length && instructions.length === 0) instructions.push({ key: "hold", stop: Math.min(...open.map((u) => u.stop)) });

  return {
    price,
    units,
    events,
    instructions,
    pnl,
    openRisk,
    riskFree,
    averageEntry,
    trendAgainst,
    closed: units.every((u) => u.status === "closed"),
  };
}

/** Gestão da posição sobre os candles diários (com o de hoje pela cotação ao vivo). */
export function trackPosition(position: Position, bars: Bar[]): PositionTracking | null {
  if (bars.length === 0 || position.units.length === 0) return null;
  if (position.side === "long") return trackLong(position, bars);
  const tracked = trackLong(invertPosition(position), invertBars(bars));
  // Resultado e risco não mudam de sinal no espelho: ganho na venda é ganho.
  return flipTracking(tracked);
}

/** Divide a quantidade em unidade de trading e de tendência, em lotes inteiros (Murphy: nunca uma unidade só). */
export function splitUnits(quantity: number, lot: number, tradingShare = 0.5): { trading: number; trending: number } {
  const lots = Math.round(quantity / lot);
  const tradingLots = lots >= 2 ? Math.max(1, Math.round(lots * tradingShare)) : 0;
  const round = (n: number) => Number((n * lot).toFixed(4));
  return { trading: round(tradingLots), trending: round(lots - tradingLots) };
}

/** Próxima camada da pirâmide: menor que a anterior (metade dela, em lotes; regra 10a). */
export function pyramidQuantity(position: Position, lot: number): number {
  const layers = position.units.filter((u) => !u.exit);
  const lastLayer = layers.filter((u) => u.kind === "pyramid").at(-1)?.quantity ?? layers.reduce((s, u) => s + u.quantity, 0);
  return Number((Math.floor(lastLayer / 2 / lot + 1e-9) * lot).toFixed(4));
}

export function isPosition(value: unknown): value is Position {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<Position>;
  const number = (v: unknown) => typeof v === "number" && Number.isFinite(v);
  return (
    typeof p.id === "string" &&
    typeof p.symbol === "string" &&
    typeof p.name === "string" &&
    (p.side === "long" || p.side === "short") &&
    typeof p.currency === "string" &&
    (p.target1 === null || number(p.target1)) &&
    (p.target === null || number(p.target)) &&
    Array.isArray(p.units) &&
    p.units.length > 0 &&
    p.units.every(
      (u) =>
        typeof u?.id === "string" &&
        ["trading", "trending", "pyramid"].includes(u.kind) &&
        number(u.quantity) &&
        u.quantity > 0 &&
        number(u.entry) &&
        number(u.at) &&
        number(u.stop) &&
        (u.exit === undefined || (number(u.exit.price) && number(u.exit.at))),
    )
  );
}

/** Posição com todas as unidades vendidas (registradas). */
export const isClosed = (p: Position) => p.units.every((u) => u.exit);
