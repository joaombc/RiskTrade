import { zeroCrossings, type ZeroCross } from "./momentum";

/**
 * Oscilador de duas médias (Murphy, cap. 10): a média curta menos a longa. Cruza o zero quando as
 * médias se cruzam, e antes disso mostra se elas estão se afastando (tendência ganhando força) ou
 * se aproximando (cruzamento chegando). É a ideia por trás do MACD.
 */

type Values = (number | null)[];

/** Diferença ponto a ponto; null onde alguma das médias ainda não existe. */
export function maDifference(fast: Values, slow: Values): Values {
  return fast.map((f, i) => {
    const s = slow[i];
    return f === null || s === null || s === undefined ? null : f - s;
  });
}

/** A barra i aumentou de tamanho (em módulo) em relação à anterior? null sem barra anterior. */
export function isWidening(values: Values, i: number): boolean | null {
  const now = values[i];
  const before = values[i - 1];
  if (now === null || now === undefined || before === null || before === undefined) return null;
  // Trocou de lado: a barra nova começa uma sequência de alargamento.
  if (Math.sign(now) !== Math.sign(before)) return true;
  return Math.abs(now) >= Math.abs(before);
}

export interface MaOscillatorReading {
  value: number;
  /** Diferença em % da média longa. */
  percent: number;
  widening: boolean;
  /** Candles seguidos (incluindo o último) no mesmo sentido: aumentando ou diminuindo. */
  streak: number;
  lastCross: ZeroCross | null;
}

/** Leitura do último candle; null se ainda não há as duas médias. */
export function readMaOscillator(diff: Values, slow: Values): MaOscillatorReading | null {
  const last = diff.length - 1;
  const value = diff[last];
  const base = slow[last];
  if (value === null || value === undefined || base === null || base === undefined) return null;
  const widening = isWidening(diff, last) ?? true;
  let streak = 1;
  for (let i = last - 1; i > 0 && isWidening(diff, i) === widening; i--) streak++;
  return {
    value,
    percent: base === 0 ? 0 : (value / base) * 100,
    widening,
    streak,
    lastCross: zeroCrossings(diff).at(-1) ?? null,
  };
}

const STORAGE_KEY = "risktrade:ma-oscillator:v1";

/** Histograma visível quando há duas médias (padrão). Storage bloqueado: visível. */
export function loadMaOscillatorVisible(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

export function saveMaOscillatorVisible(visible: boolean): void {
  try {
    if (visible) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, "0");
  } catch {
    // Storage bloqueado: a escolha vale só nesta sessão.
  }
}
