import type { Palette } from "./DrawingsPrimitive";

export interface ChartTheme {
  background: string;
  text: string;
  grid: string;
  up: string;
  down: string;
  drawings: Palette;
}

export const CHART_THEMES: Record<"light" | "dark", ChartTheme> = {
  light: {
    background: "#ffffff",
    text: "#4b5563",
    grid: "#eef0f3",
    up: "#059669",
    down: "#dc2626",
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
