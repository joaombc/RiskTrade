import type { Bar } from "./drawings/types";
import { macd, macdCrosses } from "./macd";
import { customSignals, DEFAULT_RULES, isValidCondition, type CustomRules } from "./customSystem";
import { computeMovingAverage, crossings } from "./movingAverages";
import { parabolicSar, sarFlips } from "./parabolicSar";
import { channelSystem } from "./priceChannel";

/**
 * Teste de sistemas (Murphy, cap. 15, "Teste sistemas ou crie o seu"): simula um sistema de
 * sinais sobre os candles carregados, como faziam o System Writer e o TradeStation da Omega
 * Research. O sinal vem no fechamento de um candle e é executado na abertura do seguinte, para o
 * teste não usar informação que ainda não existia. Cálculos puros.
 */

export type SystemId = "maCross" | "fourWeek" | "sar" | "macd";
export const SYSTEM_IDS: SystemId[] = ["maCross", "fourWeek", "sar", "macd"];
/** Os sistemas prontos e o montado pelo usuário ("crie o seu"). */
export type TestedSystem = SystemId | "custom";
export const TESTED_SYSTEMS: TestedSystem[] = [...SYSTEM_IDS, "custom"];

export interface SystemParams {
  maCross: { fast: number; slow: number };
  /** Canal de entrada e de saída em candles; saída igual à entrada = sistema contínuo. */
  fourWeek: { entry: number; exit: number };
  sar: { step: number; max: number };
  macd: { fast: number; slow: number; signal: number };
}

export const DEFAULT_PARAMS: SystemParams = {
  maCross: { fast: 10, slow: 50 },
  fourWeek: { entry: 20, exit: 20 },
  sar: { step: 0.02, max: 0.2 },
  macd: { fast: 12, slow: 26, signal: 9 },
};

/** Grade de parâmetros da otimização de cada sistema. */
export const PARAM_GRID: { [K in SystemId]: SystemParams[K][] } = {
  maCross: [5, 10, 20, 40].flatMap((fast) => [20, 50, 100, 200].filter((slow) => slow > fast).map((slow) => ({ fast, slow }))),
  fourWeek: [10, 20, 40].flatMap((entry) => [entry, 10, 5].filter((exit, k, all) => exit <= entry && all.indexOf(exit) === k).map((exit) => ({ entry, exit }))),
  sar: [0.01, 0.02, 0.03].flatMap((step) => [0.1, 0.2, 0.3].map((max) => ({ step, max }))),
  macd: [
    { fast: 12, slow: 26, signal: 9 },
    { fast: 8, slow: 17, signal: 9 },
    { fast: 5, slow: 35, signal: 5 },
    { fast: 19, slow: 39, signal: 9 },
  ],
};

export interface SystemSignal {
  index: number;
  /** buy: comprar (ou virar para comprado); sell: vender (ou virar para vendido); exit: zerar. */
  kind: "buy" | "sell" | "exit";
}

/** Sinais do sistema, no fechamento de cada candle. */
export function systemSignals<K extends SystemId>(id: K, params: SystemParams[K], bars: Bar[], warmup: number[] = []): SystemSignal[] {
  switch (id) {
    case "maCross": {
      const p = params as SystemParams["maCross"];
      const fast = computeMovingAverage(bars, { kind: "sma", period: p.fast }, warmup);
      const slow = computeMovingAverage(bars, { kind: "sma", period: p.slow }, warmup);
      return crossings(fast, slow).map((c) => ({ index: c.index, kind: c.dir === "up" ? "buy" : "sell" }));
    }
    case "fourWeek": {
      const p = params as SystemParams["fourWeek"];
      return channelSystem(bars, p.entry, p.exit);
    }
    case "sar": {
      const p = params as SystemParams["sar"];
      return sarFlips(parabolicSar(bars, p.step, p.step, p.max));
    }
    case "macd": {
      const p = params as SystemParams["macd"];
      return macdCrosses(macd(bars, warmup, p.fast, p.slow, p.signal)).map((c) => ({ index: c.index, kind: c.dir === "up" ? "buy" : "sell" }));
    }
  }
  return [];
}

export type TradeMode = "longShort" | "longOnly";

export interface BacktestOptions {
  mode: TradeMode;
  /** Custo de cada execução (corretagem + derrapagem), em % do preço. */
  costPercent: number;
  /** Stop de perda em % do preço de entrada; null = sem stop. */
  stopPercent: number | null;
}

export const DEFAULT_OPTIONS: BacktestOptions = { mode: "longShort", costPercent: 0.1, stopPercent: null };
export const STOP_PERCENTS = [2, 5, 8, 10, 15] as const;

export interface Trade {
  direction: 1 | -1;
  /** Candle da entrada (a abertura seguinte ao sinal). */
  entryIndex: number;
  entryPrice: number;
  exitIndex: number;
  exitPrice: number;
  /** Resultado da operação em %, já descontados os custos. */
  returnPercent: number;
  /** Resultado em capital (o capital inicial é 1): os ganhos e as perdas que entram no fator de lucro. */
  profit: number;
  /** Ainda aberta no último candle (avaliada pelo fechamento). */
  open: boolean;
  /** Encerrada pelo stop de perda. */
  stopped: boolean;
}

export interface BacktestResult {
  trades: Trade[];
  /** Capital no fechamento de cada candle, começando em 1. */
  equity: number[];
  /** Comprar e segurar no mesmo trecho, começando em 1. */
  buyHold: number[];
  totalReturn: number;
  buyHoldReturn: number;
  winRate: number | null;
  avgWin: number | null;
  avgLoss: number | null;
  /** Soma dos ganhos ÷ soma das perdas, em capital (como em dinheiro); null sem perdas. */
  profitFactor: number | null;
  /** Maior queda do capital desde um pico, em % (positivo). */
  maxDrawdown: number;
  /** Fração dos candles com posição aberta. */
  exposure: number;
}

const TARGET: Record<TradeMode, Record<SystemSignal["kind"], 1 | -1 | 0>> = {
  longShort: { buy: 1, sell: -1, exit: 0 },
  longOnly: { buy: 1, sell: 0, exit: 0 },
};

/**
 * Simula os sinais: cada sinal no candle i é executado na abertura do candle i + 1. O stop de
 * perda é executado no próprio candle em que o preço o toca (na abertura, se ela já passou do
 * stop); depois dele, o sistema só volta para o mesmo lado com um sinal novo.
 */
export function backtest(
  bars: Pick<Bar, "open" | "high" | "low" | "close">[],
  signals: SystemSignal[],
  options: BacktestOptions = DEFAULT_OPTIONS,
): BacktestResult {
  const cost = options.costPercent / 100;
  const stop = options.stopPercent === null ? null : options.stopPercent / 100;
  const orders = new Map<number, 1 | -1 | 0>();
  signals.forEach((s) => s.index + 1 < bars.length && orders.set(s.index + 1, TARGET[options.mode][s.kind]));

  const trades: Trade[] = [];
  const equity: number[] = [];
  let capital = 1;
  let position: 0 | 1 | -1 = 0;
  let entry = { index: 0, price: 0, capital: 1 };
  let inMarket = 0;
  // Lado encerrado pelo stop: as ordens para ele são ignoradas até chegar uma ordem diferente.
  let stoppedSide: 0 | 1 | -1 = 0;
  // Capital da posição aberta, avaliado num preço (custo de entrada já descontado).
  const valueAt = (price: number) => entry.capital * (1 - cost) * (1 + position * (price / entry.price - 1));

  bars.forEach((bar, i) => {
    let target = orders.get(i);
    if (target !== undefined && stoppedSide !== 0) {
      if (target === stoppedSide) target = undefined;
      else stoppedSide = 0;
    }
    if (target !== undefined && target !== position) {
      if (position !== 0) {
        capital = valueAt(bar.open) * (1 - cost);
        trades.push(closeTrade(position, entry, i, bar.open, capital, false));
      }
      position = target;
      if (position !== 0) entry = { index: i, price: bar.open, capital };
    }
    if (position !== 0) inMarket++;
    if (position !== 0 && stop !== null) {
      const level = entry.price * (1 - position * stop);
      const hit = position === 1 ? bar.low <= level : bar.high >= level;
      if (hit) {
        const price = position === 1 ? Math.min(bar.open, level) : Math.max(bar.open, level);
        capital = valueAt(price) * (1 - cost);
        trades.push(closeTrade(position, entry, i, price, capital, false, true));
        stoppedSide = position;
        position = 0;
      }
    }
    equity.push(position === 0 ? capital : valueAt(bar.close));
  });
  const last = bars.length - 1;
  if (position !== 0 && last >= 0) trades.push(closeTrade(position, entry, last, bars[last].close, equity[last], true));

  const first = bars[0]?.close ?? 1;
  const buyHold = bars.map((b) => b.close / first);
  return { trades, equity, buyHold, ...stats(trades, equity), buyHoldReturn: ((buyHold.at(-1) ?? 1) - 1) * 100, exposure: bars.length ? inMarket / bars.length : 0 };
}

function closeTrade(
  direction: 1 | -1,
  entry: { index: number; price: number; capital: number },
  exitIndex: number,
  exitPrice: number,
  capital: number,
  open: boolean,
  stopped = false,
): Trade {
  return {
    direction,
    entryIndex: entry.index,
    entryPrice: entry.price,
    exitIndex,
    exitPrice,
    returnPercent: (capital / entry.capital - 1) * 100,
    profit: capital - entry.capital,
    open,
    stopped,
  };
}

function stats(trades: Trade[], equity: number[]) {
  const returns = trades.map((t) => t.returnPercent);
  const wins = returns.filter((r) => r > 0);
  const losses = returns.filter((r) => r <= 0);
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  let peak = 1;
  let maxDrawdown = 0;
  for (const value of equity) {
    peak = Math.max(peak, value);
    maxDrawdown = Math.max(maxDrawdown, (1 - value / peak) * 100);
  }
  // Em capital, e não em %: com juros compostos, a soma dos % não diz se o sistema ganhou ou perdeu.
  const gains = sum(trades.map((t) => Math.max(t.profit, 0)));
  const lossSum = Math.abs(sum(trades.map((t) => Math.min(t.profit, 0))));
  return {
    totalReturn: ((equity.at(-1) ?? 1) - 1) * 100,
    winRate: trades.length ? (wins.length / trades.length) * 100 : null,
    avgWin: wins.length ? sum(wins) / wins.length : null,
    avgLoss: losses.length ? sum(losses) / losses.length : null,
    profitFactor: lossSum > 0 ? gains / lossSum : null,
    maxDrawdown,
  };
}

export interface OptimizationRow<K extends SystemId = SystemId> {
  params: SystemParams[K];
  result: BacktestResult;
}

/** Roda o sistema com cada combinação da grade, do maior retorno para o menor. */
export function optimize<K extends SystemId>(id: K, bars: Bar[], warmup: number[], options: BacktestOptions): OptimizationRow<K>[] {
  return (PARAM_GRID[id] as SystemParams[K][])
    .map((params) => ({ params, result: backtest(bars, systemSignals(id, params, bars, warmup), options) }))
    .sort((a, b) => b.result.totalReturn - a.result.totalReturn);
}

/** Parâmetros iguais (para destacar a linha atual na otimização). */
export const sameParams = (a: object, b: object) => JSON.stringify(a) === JSON.stringify(b);

export interface BacktestSettings {
  system: TestedSystem;
  params: SystemParams;
  rules: CustomRules;
  options: BacktestOptions;
}

export const DEFAULT_SETTINGS: BacktestSettings = { system: "maCross", params: DEFAULT_PARAMS, rules: DEFAULT_RULES, options: DEFAULT_OPTIONS };

/** Sinais do sistema escolhido nas configurações (pronto ou montado). */
export function settingsSignals(settings: BacktestSettings, bars: Bar[], warmup: number[] = []): SystemSignal[] {
  const { system } = settings;
  if (system === "custom") return customSignals(bars, settings.rules, settings.options.mode === "longShort", warmup);
  return systemSignals(system, settings.params[system], bars, warmup);
}

const STORAGE_KEY = "risktrade:backtest:v1";

/** Último sistema testado (vale para todos os ativos). Storage bloqueado ou inválido: o padrão. */
export function loadBacktestSettings(): BacktestSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!raw || !TESTED_SYSTEMS.includes(raw.system)) return DEFAULT_SETTINGS;
    const params = Object.fromEntries(
      SYSTEM_IDS.map((id) => [id, PARAM_GRID[id].some((p) => sameParams(p, raw.params?.[id] ?? {})) ? raw.params[id] : DEFAULT_PARAMS[id]]),
    ) as unknown as SystemParams;
    const mode: TradeMode = raw.options?.mode === "longOnly" ? "longOnly" : "longShort";
    const cost = Number(raw.options?.costPercent);
    const stop = (STOP_PERCENTS as readonly number[]).includes(raw.options?.stopPercent) ? (raw.options.stopPercent as number) : null;
    const conditions = (list: unknown) => (Array.isArray(list) ? list.filter(isValidCondition) : null);
    const entry = conditions(raw.rules?.entry);
    const exit = conditions(raw.rules?.exit);
    return {
      system: raw.system,
      params,
      rules: entry && exit ? { entry, exit } : DEFAULT_RULES,
      options: { mode, costPercent: Number.isFinite(cost) && cost >= 0 && cost <= 5 ? cost : DEFAULT_OPTIONS.costPercent, stopPercent: stop },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveBacktestSettings(settings: BacktestSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage bloqueado: a escolha vale só nesta sessão.
  }
}
