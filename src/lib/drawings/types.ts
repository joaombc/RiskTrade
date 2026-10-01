/** Ponto ancorado no gráfico: horário (unix, segundos) e preço. Independe do período carregado. */
export interface Anchor {
  time: number;
  price: number;
}

export type DrawingKind =
  | "trendline"
  | "fan"
  | "horizontal"
  | "channel"
  | "fibonacci"
  | "thirds"
  | "speedLines"
  | "triangle"
  | "headShoulders";

export interface DrawingOptions {
  /** Linha de tendência: prolongar à direita. */
  extend?: boolean;
  /** Suporte/resistência: inverter o papel da linha após o rompimento. */
  roleReversal?: boolean;
}

export interface Drawing {
  id: string;
  kind: DrawingKind;
  points: Anchor[];
  options: DrawingOptions;
}

export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ToolSpec {
  label: string;
  points: number;
  /** Instrução exibida enquanto a ferramenta está ativa. */
  hint: string;
  defaults: DrawingOptions;
}

export const TOOLS: Record<DrawingKind, ToolSpec> = {
  trendline: {
    label: "Tendência",
    points: 2,
    hint: "Clique em dois fundos ascendentes (alta) ou dois topos descendentes (baixa).",
    defaults: { extend: true },
  },
  fan: {
    label: "Leque",
    points: 2,
    hint: "Clique na origem e em um segundo ponto da tendência principal. As linhas 2 e 3 são geradas a cada rompimento.",
    defaults: {},
  },
  horizontal: {
    label: "Suporte/Resistência",
    points: 1,
    hint: "Clique no nível de preço.",
    defaults: { roleReversal: true },
  },
  channel: {
    label: "Canal",
    points: 3,
    hint: "Clique dois pontos da linha de tendência e depois um ponto da linha paralela.",
    defaults: {},
  },
  fibonacci: {
    label: "Fibonacci",
    points: 2,
    hint: "Clique no início e no fim do movimento (38,2% · 50% · 61,8%).",
    defaults: {},
  },
  thirds: {
    label: "Terços (Gann)",
    points: 2,
    hint: "Clique no início e no fim do movimento (33% · 50% · 66%).",
    defaults: {},
  },
  speedLines: {
    label: "Linhas de velocidade",
    points: 2,
    hint: "Clique no início do movimento e no seu extremo (topo ou fundo).",
    defaults: {},
  },
  triangle: {
    label: "Triângulo",
    points: 4,
    hint: "Clique dois pontos da linha superior e depois dois da linha inferior.",
    defaults: {},
  },
  headShoulders: {
    label: "OCO",
    points: 5,
    hint: "Clique em: ombro esquerdo, fundo da linha de pescoço, cabeça, segundo fundo da linha de pescoço, ombro direito.",
    defaults: {},
  },
};

export const DRAWING_KINDS = Object.keys(TOOLS) as DrawingKind[];
