import type { Palette } from "./DrawingsPrimitive";

export interface ChartTheme {
  background: string;
  text: string;
  grid: string;
  up: string;
  down: string;
  /** Cores das médias móveis, uma por posição (slot). Fogem do verde/vermelho dos candles, do azul dos desenhos e do roxo do OBV. */
  movingAverages: string[];
  /** Linha de momentum: foge do roxo do OBV e do azul do interesse aberto, nos painéis vizinhos. */
  momentum: string;
  drawings: Palette;
}

export const CHART_THEMES: Record<"light" | "dark", ChartTheme> = {
  light: {
    background: "#ffffff",
    text: "#4b5563",
    grid: "#eef0f3",
    up: "#059669",
    down: "#dc2626",
    movingAverages: ["#d97706", "#0891b2", "#db2777", "#475569"],
    momentum: "#c2410c",
    drawings: {
      primary: "#2563eb",
      support: "#059669",
      resistance: "#dc2626",
      target: "#9333ea",
      muted: "#6b7280",
      label: "#ffffff",
      handle: "#ffffff",
    },
  },
  dark: {
    background: "#14171c",
    text: "#9aa3af",
    grid: "#1f242b",
    up: "#34d399",
    down: "#f87171",
    movingAverages: ["#fbbf24", "#22d3ee", "#f472b6", "#cbd5e1"],
    momentum: "#fb923c",
    drawings: {
      primary: "#60a5fa",
      support: "#34d399",
      resistance: "#f87171",
      target: "#c084fc",
      muted: "#9aa3af",
      label: "#14171c",
      handle: "#14171c",
    },
  },
};
