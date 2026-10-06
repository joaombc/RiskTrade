import type { DrawingKind, DrawingOptions } from "../drawings/types";
import type { HistoryRange } from "../market";

export const CATEGORIES = [
  "Padrões de Reversão",
  "Padrões de Continuação",
  "Gaps",
  "Linhas",
  "Volume",
  "Indicadores",
] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * Diagramas em um viewBox 200×120. A área principal de preço vai de y=10 (alto) a y=92 (baixo);
 * o painel inferior (volume/OBV), de y=98 a y=118. Velas já vêm em coordenadas y do viewBox.
 */
export type Pt = [x: number, y: number];
export type DiagramTone = "primary" | "support" | "resistance" | "target" | "muted";

export interface DiagramLine {
  from: Pt;
  to: Pt;
  tone: DiagramTone;
  dashed?: boolean;
  label?: string;
  /** Onde fica o rótulo (padrão: no fim da linha; em linhas verticais, "start" põe à esquerda). */
  labelAt?: "start" | "end";
}

export interface DiagramPoint {
  at: Pt;
  label: string;
  placement?: "above" | "below" | "left" | "right";
}

export interface DiagramCandle {
  o: number;
  h: number;
  l: number;
  c: number;
}

/** Curva extra sobre o preço (ex.: uma média móvel), com rótulo no fim. */
export interface DiagramCurve {
  path: Pt[];
  tone: DiagramTone;
  label?: string;
  /** Rótulo acima (padrão) ou abaixo do fim da curva, para não colidir com outra. */
  labelPlacement?: "above" | "below";
  dashed?: boolean;
}

export interface Diagram {
  /** Caminho do preço (linha). */
  path?: Pt[];
  curves?: DiagramCurve[];
  /** Velas, distribuídas igualmente na largura. */
  candles?: DiagramCandle[];
  lines?: DiagramLine[];
  points?: DiagramPoint[];
  /** Barras de volume no painel inferior, alturas de 0 a 1, distribuídas igualmente. */
  volume?: { h: number; up: boolean }[];
  /** Linha no painel inferior (ex.: OBV). */
  sub?: { path: Pt[]; label: string; lines?: DiagramLine[] };
  /** Textos soltos, sem marcador (ex.: nomes de fases). */
  notes?: { at: Pt; text: string; tone?: DiagramTone; anchor?: "start" | "middle" | "end" }[];
}

/** Ponto de um exemplo real: data do candle e qual preço dele usar (ou um preço fixo). */
export interface ExampleAnchor {
  date: string;
  price: "high" | "low" | "open" | "close" | number;
}

export interface ExampleDrawing {
  kind: DrawingKind;
  points: ExampleAnchor[];
  /** Sobrescreve as opções padrão da ferramenta (ex.: linha de tendência sem prolongar). */
  options?: DrawingOptions;
}

export interface ExampleMarker {
  date: string;
  text: string;
  position: "aboveBar" | "belowBar";
}

/** Exemplo histórico aplicado no gráfico principal pelo botão "Ver no gráfico real". */
export interface TermExample {
  symbol: string;
  range: HistoryRange;
  description: string;
  drawings?: ExampleDrawing[];
  markers?: ExampleMarker[];
  /** Janela de datas exibida ao abrir; sem ela, o gráfico calcula uma a partir dos desenhos. */
  view?: { from: string; to: string };
}

/** Conteúdo do card ampliado: o que explica o padrão além da definição e da regra. */
export interface TermDetails {
  /** O que está acontecendo no mercado: quem compra, quem vende e por quê. */
  market: string;
  /** Como o volume deve se comportar ao longo do movimento. */
  volume: string;
  /** Como operar: entrada, stop, alvo e confirmação. */
  trading: string;
  /** Erros comuns e sinais de que o padrão falhou. */
  pitfalls: string;
  /** Referência no livro-texto. */
  source: string;
}

export interface GlossaryTerm {
  slug: string;
  name: string;
  /** Outros nomes e siglas usados na busca. */
  aliases: string[];
  category: Category;
  definition: string;
  validation: string;
  diagram: Diagram;
  /** Ferramenta do gráfico que desenha o conceito, quando houver. */
  tool?: DrawingKind;
  example?: TermExample;
  details?: TermDetails;
}

export interface LessonSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  diagram?: { diagram: Diagram; caption: string };
}

/** Aula longa sobre uma teoria (ex.: Dow, Elliott), com página própria. */
export interface Lesson {
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  readingMinutes: number;
  sections: LessonSection[];
  takeaways: string[];
  /** Termos do glossário relacionados (slugs). */
  relatedTerms: string[];
  source: string;
}
