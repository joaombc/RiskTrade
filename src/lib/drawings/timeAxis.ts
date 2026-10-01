import type { Bar } from "./types";

/**
 * Converte entre horário e índice lógico de barra (o eixo X do lightweight-charts).
 * Horários fora dos dados são extrapolados pelo espaçamento típico entre barras,
 * o que permite ancorar desenhos e projeções à direita do último candle.
 */
export interface TimeAxis {
  toLogical(time: number): number;
  toTime(logical: number): number;
}

function medianStep(times: number[]): number {
  if (times.length < 2) return 86_400;
  const diffs = times.slice(1).map((t, i) => t - times[i]).sort((a, b) => a - b);
  return diffs[Math.floor(diffs.length / 2)];
}

export function createTimeAxis(bars: Pick<Bar, "time">[]): TimeAxis {
  const times = bars.map((b) => b.time);
  const step = medianStep(times);
  const last = times.length - 1;

  return {
    toLogical(time) {
      if (times.length === 0) return 0;
      if (time <= times[0]) return (time - times[0]) / step;
      if (time >= times[last]) return last + (time - times[last]) / step;

      let lo = 0;
      let hi = last;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (times[mid] <= time) lo = mid;
        else hi = mid;
      }
      return lo + (time - times[lo]) / (times[hi] - times[lo]);
    },

    toTime(logical) {
      if (times.length === 0) return 0;
      if (logical <= 0) return Math.round(times[0] + logical * step);
      if (logical >= last) return Math.round(times[last] + (logical - last) * step);
      const i = Math.floor(logical);
      return Math.round(times[i] + (logical - i) * (times[i + 1] - times[i]));
    },
  };
}
