import type { PositionTracking, Position } from "./positions";
import type { PlanAction, PlanSide, TradePlan } from "./tradePlan";
import type { Trend } from "./trend";

/**
 * Alertas da carteira: o que mudou no plano de cada ativo e na gestão de cada posição desde a
 * última leitura. Cada alerta tem um id estável, para ser contado uma vez só (no app e no
 * Telegram). Cálculos puros; quem guarda o histórico e o que já foi visto é quem chama.
 */

export type AlertKind =
  | "entrySignal"
  | "inZone"
  | "nearZone"
  | "breakout"
  | "trendChanged"
  | "stopHit"
  | "raiseStop"
  | "breakeven"
  | "target1Hit"
  | "targetHit"
  | "trendReversed"
  | "pyramid";

export interface PortfolioAlert {
  id: string;
  kind: AlertKind;
  symbol: string;
  side: PlanSide;
  /** buy: a favor de comprar; sell: de vender (ou sair da compra); info: ajuste. */
  tone: "buy" | "sell" | "info";
  /** Unix, segundos: o candle do evento (ou o momento da leitura). */
  time: number;
  price: number | null;
  /** Tendência nova (trendChanged). */
  trend?: Trend;
  /** Ação do plano (entrySignal). */
  action?: PlanAction;
}

/** O que se guarda do plano de cada ativo entre leituras. */
export interface PlanMemo {
  action: PlanAction;
  side: PlanSide | null;
  trend: Trend | null;
}

/** Preço perto da zona de entrada: até meio ATR. */
const NEAR_ATRS = 0.5;

const entering = (a: PlanAction) => a === "enterNow" || a === "enterLimit" || a === "enterStop";
const day = (unixSeconds: number) => new Date(unixSeconds * 1000).toISOString().slice(0, 10);
const toneOf = (side: PlanSide) => (side === "long" ? "buy" : "sell");

export const planMemo = (plan: TradePlan, action: PlanAction): PlanMemo => ({ action, side: plan.side, trend: plan.dailyTrend });

/**
 * Alertas do plano entre a leitura anterior (`prev`) e a atual. Sem leitura anterior (o ativo
 * acabou de entrar), nada: só registra. `action` é a ação final (com a conta), `now` em segundos.
 */
export function planAlerts(symbol: string, prev: PlanMemo | undefined, plan: TradePlan, action: PlanAction, now: number): PortfolioAlert[] {
  if (!prev || plan.side === null) return [];
  const side = plan.side;
  const base = { symbol, side, time: now, price: plan.entry };
  const id = (kind: AlertKind, extra = "") => `plan:${symbol}:${kind}:${side}:${day(now)}${extra}`;
  const out: PortfolioAlert[] = [];
  if (entering(action) && !entering(prev.action)) {
    out.push({ ...base, id: id("entrySignal", `:${action}`), kind: "entrySignal", tone: toneOf(side), action });
  } else if (prev.action === "enterLimit" && action === "enterNow") {
    out.push({ ...base, id: id("inZone"), kind: "inZone", tone: toneOf(side), price: plan.close });
  } else if (prev.action === "enterStop" && action === "enterNow") {
    out.push({ ...base, id: id("breakout"), kind: "breakout", tone: toneOf(side), price: plan.close });
  }
  if (action === "enterLimit" && plan.entry !== null && Math.abs(plan.close - plan.entry) <= NEAR_ATRS * plan.atr) {
    out.push({ ...base, id: id("nearZone"), kind: "nearZone", tone: toneOf(side) });
  }
  if (prev.trend && plan.dailyTrend && prev.trend !== plan.dailyTrend) {
    const trend = plan.dailyTrend;
    out.push({
      ...base,
      id: `plan:${symbol}:trendChanged:${trend}:${day(now)}`,
      kind: "trendChanged",
      tone: trend === "up" ? "buy" : trend === "down" ? "sell" : "info",
      price: plan.close,
      trend,
    });
  }
  return out;
}

/**
 * Alertas da gestão de uma posição: os eventos a partir de `since` (unix, segundos; os mais antigos
 * já passaram) e as instruções de agora que pedem ação.
 */
export function positionAlerts(position: Position, tracking: PositionTracking, since: number, now: number): PortfolioAlert[] {
  const { symbol, side } = position;
  const exitTone = side === "long" ? "sell" : "buy";
  const out: PortfolioAlert[] = [];
  const pid = `pos:${position.id}`;
  // Ajustes de stop do mesmo candle viram um alerta só (o maior).
  const raised = new Map<number, number>();
  for (const e of tracking.events) {
    if (e.time < since) continue;
    switch (e.key) {
      case "stopHit":
        out.push({ id: `${pid}:stopHit:${e.unitId}:${e.time}`, kind: "stopHit", symbol, side, tone: exitTone, time: e.time, price: e.price });
        break;
      case "target1Hit":
      case "targetHit":
        out.push({ id: `${pid}:${e.key}:${e.time}`, kind: e.key, symbol, side, tone: "info", time: e.time, price: e.price });
        break;
      case "breakeven":
        if (!out.some((a) => a.kind === "breakeven" && a.time === e.time))
          out.push({ id: `${pid}:breakeven:${e.time}`, kind: "breakeven", symbol, side, tone: "info", time: e.time, price: e.to });
        break;
      case "stopRaised":
        raised.set(e.time, side === "long" ? Math.max(raised.get(e.time) ?? -Infinity, e.to) : Math.min(raised.get(e.time) ?? Infinity, e.to));
        break;
    }
  }
  for (const [time, to] of raised) out.push({ id: `${pid}:raiseStop:${time}:${to}`, kind: "raiseStop", symbol, side, tone: "info", time, price: to });
  for (const i of tracking.instructions) {
    if (i.key === "trendReversed") out.push({ id: `${pid}:trendReversed:${day(now)}`, kind: "trendReversed", symbol, side, tone: exitTone, time: now, price: tracking.price });
    // Pirâmide: uma vez por camada (o id muda quando entra uma camada nova).
    if (i.key === "pyramid") out.push({ id: `${pid}:pyramid:${position.units.length}`, kind: "pyramid", symbol, side, tone: toneOf(side), time: now, price: tracking.price });
  }
  return out.sort((a, b) => a.time - b.time);
}

/** Junta os alertas novos ao histórico (mais recentes primeiro), sem repetir ids, até `max`. */
export function mergeAlerts<T extends { id: string }>(history: T[], fresh: T[], max = 100): { history: T[]; added: T[] } {
  const known = new Set(history.map((a) => a.id));
  const added = fresh.filter((a) => !known.has(a.id) && known.add(a.id));
  return { history: [...[...added].reverse(), ...history].slice(0, max), added };
}
