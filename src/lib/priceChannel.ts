/**
 * Canal de preço e a regra das 4 semanas de Richard Donchian (Murphy, cap. 9). Quatro semanas
 * equivalem a cerca de 20 pregões, como no canal de 20 dias dos gráficos.
 */

type Values = (number | null)[];

/** Pregões da regra das 4 semanas. */
export const FOUR_WEEKS = 20;

/**
 * Máxima e mínima dos `period` candles anteriores. O candle atual não entra: é com ele que o
 * preço rompe (ou não) o canal. Null enquanto não há candles suficientes.
 */
export function priceChannel(bars: { high: number; low: number }[], period: number): { upper: Values; lower: Values } {
  const upper: Values = [];
  const lower: Values = [];
  bars.forEach((_, i) => {
    if (i < period) {
      upper.push(null);
      lower.push(null);
      return;
    }
    const window = bars.slice(i - period, i);
    upper.push(Math.max(...window.map((b) => b.high)));
    lower.push(Math.min(...window.map((b) => b.low)));
  });
  return { upper, lower };
}

/** buy/sell abrem posição (na versão contínua, também invertem a anterior); exit zera a posição. */
export type ChannelSignalKind = "buy" | "sell" | "exit";

export interface ChannelSignal {
  index: number;
  kind: ChannelSignalKind;
}

export type ChannelPosition = "long" | "short" | "flat";

export interface ChannelSystemState {
  signals: ChannelSignal[];
  /** Posição do sistema depois do último candle. */
  position: ChannelPosition;
  /** Candle do sinal que abriu a posição atual (null se de fora). */
  since: number | null;
}

/**
 * A regra das 4 semanas pelo fechamento: entra comprado quando o fechamento passa a máxima do
 * canal de entrada e vendido quando perde a mínima. Com `exitPeriod` igual a `entryPeriod`, é a
 * versão contínua (sempre posicionada: o sinal contrário inverte a posição). Com um canal de
 * saída mais curto (1 ou 2 semanas), é a não contínua: a posição é zerada no rompimento contrário
 * do canal curto, e o sistema fica de fora até o próximo rompimento do canal de entrada.
 */
export function channelSystemState(
  bars: { high: number; low: number; close: number }[],
  entryPeriod = FOUR_WEEKS,
  exitPeriod = entryPeriod,
): ChannelSystemState {
  const entry = priceChannel(bars, entryPeriod);
  const exit = priceChannel(bars, exitPeriod);
  const continuous = exitPeriod >= entryPeriod;
  const signals: ChannelSignal[] = [];
  let position: ChannelPosition = "flat";
  let since: number | null = null;
  const open = (i: number, kind: "buy" | "sell") => {
    signals.push({ index: i, kind });
    position = kind === "buy" ? "long" : "short";
    since = i;
  };
  const close = (i: number) => {
    signals.push({ index: i, kind: "exit" });
    position = "flat";
    since = null;
  };

  bars.forEach(({ close: price }, i) => {
    const [up, down, exitUp, exitDown] = [entry.upper[i], entry.lower[i], exit.upper[i], exit.lower[i]];
    if (up === null || down === null) return;
    if (position === "long") {
      if (continuous && price < down) open(i, "sell");
      else if (!continuous && exitDown !== null && price < exitDown) close(i);
      return;
    }
    if (position === "short") {
      if (continuous && price > up) open(i, "buy");
      else if (!continuous && exitUp !== null && price > exitUp) close(i);
      return;
    }
    if (price > up) open(i, "buy");
    else if (price < down) open(i, "sell");
  });
  return { signals, position, since };
}

/** Só os sinais do sistema (ver channelSystemState). */
export function channelSystem(
  bars: { high: number; low: number; close: number }[],
  entryPeriod = FOUR_WEEKS,
  exitPeriod = entryPeriod,
): ChannelSignal[] {
  return channelSystemState(bars, entryPeriod, exitPeriod).signals;
}

// ─── Preferências do gráfico ───────────────────────────────────────────────────

/** Pregões por semana: a regra é definida em semanas de candles diários. */
export const WEEK_BARS = 5;
/** Canal de entrada: 4 semanas (original), 2 (mais sensível) ou 8 (filtra a lateralidade). */
export const ENTRY_WEEKS = [2, 4, 8] as const;
/** Saída não contínua: rompimento contrário de 2 ou 1 semana. */
export const EXIT_WEEKS = [2, 1] as const;

export interface FourWeekSettings {
  enabled: boolean;
  entryWeeks: (typeof ENTRY_WEEKS)[number];
  /** null = versão contínua (sai e inverte pelo próprio canal de entrada). */
  exitWeeks: (typeof EXIT_WEEKS)[number] | null;
}

export const DEFAULT_FOUR_WEEK: FourWeekSettings = { enabled: false, entryWeeks: 4, exitWeeks: null };

const STORAGE_KEY = "risktrade:four-week:v1";

/** Preferências salvas, validadas; uma saída que não seja mais curta que a entrada vira contínua. */
export function loadFourWeekSettings(): FourWeekSettings {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!raw || typeof raw !== "object") return DEFAULT_FOUR_WEEK;
    const r = raw as Partial<FourWeekSettings>;
    const entryWeeks = ENTRY_WEEKS.find((w) => w === r.entryWeeks) ?? DEFAULT_FOUR_WEEK.entryWeeks;
    const exit = EXIT_WEEKS.find((w) => w === r.exitWeeks) ?? null;
    return { enabled: r.enabled === true, entryWeeks, exitWeeks: exit !== null && exit < entryWeeks ? exit : null };
  } catch {
    return DEFAULT_FOUR_WEEK;
  }
}

export function saveFourWeekSettings(settings: FourWeekSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage bloqueado: a escolha vale só nesta sessão.
  }
}
