import type { AccountLimits } from "./portfolioAccount";
import type { AssetGroup } from "./portfolioAssets";
import { isClosed, type Position } from "./positions";

/**
 * Resumo da carteira pelas regras de gestão do dinheiro de Murphy (cap. 16): quanto de cada
 * limite está em uso, o histórico das operações encerradas e o que fazer depois de sequências de
 * ganhos e de perdas. Cálculos puros; os valores já vêm na moeda da conta.
 */

export interface Holding {
  symbol: string;
  group: AssetGroup;
  /** Valor da posição aberta, na moeda da conta. */
  value: number;
}

export interface LimitUse {
  key: string;
  value: number;
  /** % do capital. */
  pct: number;
  limit: number;
  over: boolean;
}

export interface Exposures {
  invested: LimitUse;
  byAsset: LimitUse[];
  byGroup: LimitUse[];
}

/** Uso de cada limite de alocação: total investido, por ativo e por grupo (do maior para o menor). */
export function exposures(holdings: Holding[], capital: number, limits: AccountLimits): Exposures {
  const pct = (v: number) => (capital > 0 ? (v / capital) * 100 : 0);
  const usage = (key: string, value: number, limit: number): LimitUse => ({ key, value, pct: pct(value), limit, over: pct(value) > limit + 1e-9 });
  const sum = (list: Holding[]) => list.reduce((s, h) => s + h.value, 0);
  const group = <K extends string>(key: (h: Holding) => K) => {
    const map = new Map<K, Holding[]>();
    for (const h of holdings) map.set(key(h), [...(map.get(key(h)) ?? []), h]);
    return [...map.entries()];
  };
  return {
    invested: usage("total", sum(holdings), limits.maxInvested),
    byAsset: group((h) => h.symbol)
      .map(([k, list]) => usage(k, sum(list), limits.maxPerAsset))
      .sort((a, b) => b.value - a.value),
    byGroup: group((h) => h.group)
      .map(([k, list]) => usage(k, sum(list), limits.maxPerGroup))
      .sort((a, b) => b.value - a.value),
  };
}

export interface ClosedTrade {
  position: Position;
  /** Resultado na moeda do ativo (positivo = ganho, também na venda a descoberto). */
  pnl: number;
  /** Resultado sobre o valor de entrada, em %. */
  pnlPct: number;
  openedAt: number;
  closedAt: number;
}

/** Operações encerradas (todas as unidades com venda registrada), da mais recente para a mais antiga. */
export function closedTrades(positions: Position[]): ClosedTrade[] {
  return positions
    .filter(isClosed)
    .map((position) => {
      const sign = position.side === "long" ? 1 : -1;
      const pnl = position.units.reduce((s, u) => s + sign * (u.exit!.price - u.entry) * u.quantity, 0);
      const cost = position.units.reduce((s, u) => s + u.entry * u.quantity, 0);
      return {
        position,
        pnl,
        pnlPct: cost > 0 ? (pnl / cost) * 100 : 0,
        openedAt: Math.min(...position.units.map((u) => u.at)),
        closedAt: Math.max(...position.units.map((u) => u.exit!.at)),
      };
    })
    .sort((a, b) => b.closedAt - a.closedAt);
}

export interface TradeStats {
  trades: number;
  winRate: number | null;
  avgWin: number | null;
  avgLoss: number | null;
  /** Ganho médio ÷ perda média: acima de 1, os ganhos compensam as perdas mesmo acertando menos da metade. */
  payoff: number | null;
  total: number;
}

/** Estatísticas dos resultados (moeda da conta). */
export function tradeStats(results: number[]): TradeStats {
  const wins = results.filter((r) => r > 0);
  const losses = results.filter((r) => r <= 0);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const avgWin = avg(wins);
  const avgLoss = avg(losses);
  return {
    trades: results.length,
    winRate: results.length ? (wins.length / results.length) * 100 : null,
    avgWin,
    avgLoss,
    payoff: avgWin !== null && avgLoss !== null && avgLoss < 0 ? avgWin / Math.abs(avgLoss) : null,
    total: results.reduce((a, b) => a + b, 0),
  };
}

/** Curva de capital: o capital inicial mais os resultados realizados, na ordem em que fecharam. */
export function equityCurve(capital: number, trades: { closedAt: number; pnl: number }[]): { time: number; value: number }[] {
  let value = capital;
  const points = [...trades].sort((a, b) => a.closedAt - b.closedAt).map((t) => ({ time: t.closedAt, value: (value += t.pnl) }));
  return points.length ? [{ time: points[0].time, value: capital }, ...points] : [];
}

/** Sequência atual: resultados seguidos do mesmo lado, a partir do mais recente. */
export function currentStreak(results: number[]): { kind: "wins" | "losses"; count: number } | null {
  if (!results.length) return null;
  const win = results[0] > 0;
  let count = 0;
  while (count < results.length && results[count] > 0 === win) count++;
  return { kind: win ? "wins" : "losses", count };
}

/** Queda da curva de capital desde o pico, em %. */
export function drawdown(curve: { value: number }[]): number {
  let peak = -Infinity;
  let last = 0;
  for (const p of curve) {
    peak = Math.max(peak, p.value);
    last = peak > 0 ? (1 - p.value / peak) * 100 : 0;
  }
  return Math.max(0, last);
}

/** Sequências que pedem a orientação de Murphy sobre o tamanho das posições. */
export const STREAK_ALERT = 3;
export const DRAWDOWN_ALERT = 10;

export type Guidance =
  | { key: "afterWins"; count: number }
  | { key: "afterLosses"; count: number }
  | { key: "drawdown"; pct: number }
  | { key: "closeLosersFirst"; symbols: string[] }
  | { key: "tooMany"; count: number; max: number }
  | { key: "oneGroup"; group: AssetGroup; count: number };

/**
 * Orientações de Murphy para o momento da carteira: depois de ganhos, não aumentar a mão; depois de
 * uma queda do capital, é quando aumentar (com cuidado); fechar primeiro as perdedoras (regra 12);
 * diversificar, mas sem exagero (regra 8).
 */
export function guidance(input: {
  results: number[];
  curve: { value: number }[];
  open: { symbol: string; group: AssetGroup; pnl: number }[];
  limits: AccountLimits;
}): Guidance[] {
  const out: Guidance[] = [];
  const streak = currentStreak(input.results);
  if (streak && streak.count >= STREAK_ALERT) out.push({ key: streak.kind === "wins" ? "afterWins" : "afterLosses", count: streak.count });
  const dd = drawdown(input.curve);
  if (dd >= DRAWDOWN_ALERT) out.push({ key: "drawdown", pct: dd });
  const losers = input.open.filter((o) => o.pnl < 0);
  if (losers.length && losers.length < input.open.length) out.push({ key: "closeLosersFirst", symbols: losers.map((o) => o.symbol) });
  const max = Math.max(1, Math.floor(input.limits.maxInvested / input.limits.maxPerAsset));
  if (input.open.length > max * 2) out.push({ key: "tooMany", count: input.open.length, max });
  const groups = new Set(input.open.map((o) => o.group));
  if (input.open.length >= 2 && groups.size === 1) out.push({ key: "oneGroup", group: input.open[0].group, count: input.open.length });
  return out;
}
