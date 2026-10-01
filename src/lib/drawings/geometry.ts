import type { TimeAxis } from "./timeAxis";
import { TOOLS, type Bar, type Drawing } from "./types";

/**
 * Tudo aqui trabalha em "espaço de dados": X é o índice lógico da barra (0 = primeira barra
 * carregada) e Y é o preço. A conversão para pixels fica a cargo do renderer.
 */
export interface DataPoint {
  logical: number;
  price: number;
}

export type Tone = "primary" | "support" | "resistance" | "target" | "muted";

export type Shape =
  | {
      type: "line";
      from: DataPoint;
      to: DataPoint;
      tone: Tone;
      dashed?: boolean;
      extendLeft?: boolean;
      extendRight?: boolean;
    }
  | { type: "label"; at: DataPoint; text: string; tone: Tone; placement?: "above" | "below" | "right" };

type LineShape = Extract<Shape, { type: "line" }>;

/** Rompimento só é confirmado com fechamento ao menos 1% além do nível ou da linha. */
export const BREAK_THRESHOLD = 0.01;
/** Barras de cada lado para confirmar um topo/fundo (swing). */
export const SWING_WINDOW = 3;
/** Comprimento, em barras, das linhas horizontais de alvo. */
const TARGET_LENGTH = 15;

export const FIBONACCI_LEVELS = [0, 0.382, 0.5, 0.618, 1];
export const THIRDS_LEVELS = [0, 1 / 3, 0.5, 2 / 3, 1];

export function formatPrice(price: number): string {
  const digits = Math.abs(price) < 1 ? 4 : 2;
  return price.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function formatPercent(ratio: number): string {
  return `${(ratio * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

/** Preço da reta que passa por `a` e `b` no índice lógico `logical`. */
export function lineAt(a: DataPoint, b: DataPoint, logical: number): number {
  if (b.logical === a.logical) return a.price;
  return a.price + ((b.price - a.price) * (logical - a.logical)) / (b.logical - a.logical);
}

function firstBarAfter(logical: number): number {
  return Math.max(0, Math.floor(logical) + 1);
}

// ─── Princípio do Leque ────────────────────────────────────────────────────────

export interface FanResult {
  /** Pontos por onde passam as linhas 1, 2 e 3 (todas partem da mesma origem). */
  through: DataPoint[];
  /** Fechamento que rompeu a 3ª linha: sinal de reversão da tendência. */
  reversal?: DataPoint;
}

function isSwing(bars: Bar[], i: number, kind: "low" | "high", window: number): boolean {
  if (i - window < 0 || i + window >= bars.length) return false;
  for (let j = i - window; j <= i + window; j++) {
    if (kind === "low" ? bars[j].low < bars[i].low : bars[j].high > bars[i].high) return false;
  }
  return true;
}

function findSwing(bars: Bar[], from: number, kind: "low" | "high", window = SWING_WINDOW): number {
  for (let i = from; i < bars.length; i++) {
    if (isSwing(bars, i, kind, window)) return i;
  }
  return -1;
}

/**
 * Gera as linhas do leque a partir da tendência principal (origem → segundo ponto).
 * Em alta: quando a linha é rompida para baixo, a próxima linha parte da mesma origem e
 * passa pelo fundo da reação seguinte, ficando mais plana. Em baixa, o espelho com os topos.
 * O rompimento da 3ª linha sinaliza reversão.
 */
export function fanLines(bars: Bar[], origin: DataPoint, second: DataPoint): FanResult {
  const up = second.price >= origin.price;
  const through: DataPoint[] = [second];
  let current = second;
  let from = firstBarAfter(Math.max(origin.logical, second.logical));

  for (let line = 1; line <= 3; line++) {
    let breakIdx = -1;
    for (let i = from; i < bars.length; i++) {
      const level = lineAt(origin, current, i);
      if (up ? bars[i].close < level : bars[i].close > level) {
        breakIdx = i;
        break;
      }
    }
    if (breakIdx < 0) break;
    if (line === 3) return { through, reversal: { logical: breakIdx, price: bars[breakIdx].close } };

    const pivotIdx = findSwing(bars, breakIdx, up ? "low" : "high");
    if (pivotIdx < 0) break;
    current = { logical: pivotIdx, price: up ? bars[pivotIdx].low : bars[pivotIdx].high };
    through.push(current);
    from = pivotIdx + 1;
  }
  return { through };
}

// ─── Suporte e resistência ─────────────────────────────────────────────────────

export type Role = "support" | "resistance";

export interface RoleSegment {
  from: number;
  to: number;
  role: Role;
}

/**
 * Divide o histórico em trechos onde o nível atuou como suporte (preço acima) ou
 * resistência (preço abaixo). O papel só se inverte após um rompimento confirmado.
 */
export function roleSegments(bars: Bar[], level: number, threshold = BREAK_THRESHOLD): RoleSegment[] {
  if (bars.length === 0) return [];
  const segments: RoleSegment[] = [];
  let role: Role = bars[0].close >= level ? "support" : "resistance";
  let start = 0;

  for (let i = 1; i < bars.length; i++) {
    const close = bars[i].close;
    const broke =
      role === "support" ? close < level * (1 - threshold) : close > level * (1 + threshold);
    if (broke) {
      segments.push({ from: start, to: i, role });
      role = role === "support" ? "resistance" : "support";
      start = i;
    }
  }
  segments.push({ from: start, to: bars.length - 1, role });
  return segments;
}

// ─── Triângulos ────────────────────────────────────────────────────────────────

export type TriangleType = "symmetric" | "ascending" | "descending" | "undefined";

export const TRIANGLE_LABEL: Record<TriangleType, string> = {
  symmetric: "Triângulo simétrico",
  ascending: "Triângulo ascendente",
  descending: "Triângulo descendente",
  undefined: "Triângulo",
};

export interface Breakout {
  logical: number;
  price: number;
  direction: "up" | "down";
}

export interface TriangleAnalysis {
  type: TriangleType;
  start: number;
  end: number;
  /** Índice onde as linhas se encontram, se convergirem à direita. */
  apex?: number;
  height: number;
  breakout?: Breakout;
  /** Alvo após o rompimento; sem rompimento, alvos potenciais para cada lado. */
  target?: number;
  potentialTargets: { up: number; down: number };
}

/** Uma linha é "plana" se varia menos que esta fração da altura do triângulo. */
const FLAT_TOLERANCE = 0.2;

export function analyzeTriangle(
  bars: Bar[],
  upper: [DataPoint, DataPoint],
  lower: [DataPoint, DataPoint],
): TriangleAnalysis {
  const [u1, u2] = upper;
  const [l1, l2] = lower;
  const start = Math.min(u1.logical, u2.logical, l1.logical, l2.logical);
  const end = Math.max(u1.logical, u2.logical, l1.logical, l2.logical);
  const up = (l: number) => lineAt(u1, u2, l);
  const down = (l: number) => lineAt(l1, l2, l);

  const height = Math.abs(up(start) - down(start));
  const upperDelta = up(end) - up(start);
  const lowerDelta = down(end) - down(start);
  const flat = (delta: number) => Math.abs(delta) < height * FLAT_TOLERANCE;

  let type: TriangleType = "undefined";
  if (flat(upperDelta) && lowerDelta > 0 && !flat(lowerDelta)) type = "ascending";
  else if (flat(lowerDelta) && upperDelta < 0 && !flat(upperDelta)) type = "descending";
  else if (upperDelta < 0 && lowerDelta > 0 && !flat(upperDelta) && !flat(lowerDelta)) type = "symmetric";

  // Interseção das duas retas: up(start) + su·t = down(start) + sl·t
  const span = end - start || 1;
  const closing = (lowerDelta - upperDelta) / span;
  const apex = closing > 0 ? start + (up(start) - down(start)) / closing : undefined;

  let breakout: Breakout | undefined;
  const limit = Math.min(bars.length - 1, apex ?? Infinity);
  for (let i = firstBarAfter(end); i <= limit; i++) {
    if (bars[i].close > up(i) * (1 + BREAK_THRESHOLD)) {
      breakout = { logical: i, price: up(i), direction: "up" };
      break;
    }
    if (bars[i].close < down(i) * (1 - BREAK_THRESHOLD)) {
      breakout = { logical: i, price: down(i), direction: "down" };
      break;
    }
  }

  return {
    type,
    start,
    end,
    apex: apex !== undefined && apex > end ? apex : undefined,
    height,
    breakout,
    target: breakout ? breakout.price + (breakout.direction === "up" ? height : -height) : undefined,
    potentialTargets: { up: up(end) + height, down: down(end) - height },
  };
}

// ─── Ombro-Cabeça-Ombro ────────────────────────────────────────────────────────

export interface HeadShouldersAnalysis {
  inverse: boolean;
  height: number;
  breakout?: DataPoint;
  /** Alvo medido a partir do rompimento da linha de pescoço (ou projetado do ombro direito). */
  target: number;
  projectedFrom: DataPoint;
}

export function analyzeHeadShoulders(
  bars: Bar[],
  [, neck1, head, neck2, rightShoulder]: DataPoint[],
): HeadShouldersAnalysis {
  const inverse = head.price < neck1.price;
  const neck = (l: number) => lineAt(neck1, neck2, l);
  const height = Math.abs(head.price - neck(head.logical));

  let breakout: DataPoint | undefined;
  for (let i = firstBarAfter(rightShoulder.logical); i < bars.length; i++) {
    const broke = inverse
      ? bars[i].close > neck(i) * (1 + BREAK_THRESHOLD)
      : bars[i].close < neck(i) * (1 - BREAK_THRESHOLD);
    if (broke) {
      breakout = { logical: i, price: neck(i) };
      break;
    }
  }

  const projectedFrom = breakout ?? { logical: rightShoulder.logical, price: neck(rightShoulder.logical) };
  return {
    inverse,
    height,
    breakout,
    target: projectedFrom.price + (inverse ? height : -height),
    projectedFrom,
  };
}

// ─── Montagem das formas de cada desenho ───────────────────────────────────────

function polyline(points: DataPoint[], tone: Tone, dashed = false): Shape[] {
  return points.slice(1).map((to, i) => ({ type: "line", from: points[i], to, tone, dashed }));
}

function horizontal(price: number, from: number, to: number, tone: Tone, extendRight = true): LineShape {
  return {
    type: "line",
    from: { logical: from, price },
    to: { logical: to, price },
    tone,
    extendRight,
  };
}

function targetShapes(from: DataPoint, target: number, text: string): Shape[] {
  return [
    { type: "line", from, to: { logical: from.logical, price: target }, tone: "target", dashed: true },
    { ...horizontal(target, from.logical, from.logical + TARGET_LENGTH, "target", false), dashed: true },
    {
      type: "label",
      at: { logical: from.logical + TARGET_LENGTH, price: target },
      text: `${text} ${formatPrice(target)}`,
      tone: "target",
      placement: "right",
    },
  ];
}

function retracement(a: DataPoint, b: DataPoint, levels: number[]): Shape[] {
  const left = Math.min(a.logical, b.logical);
  const right = Math.max(a.logical, b.logical);
  const shapes: Shape[] = [{ type: "line", from: a, to: b, tone: "muted", dashed: true }];
  for (const ratio of levels) {
    const price = b.price - (b.price - a.price) * ratio;
    const edge = ratio === 0 || ratio === 1;
    shapes.push(horizontal(price, left, right, edge ? "muted" : "primary"));
    shapes.push({
      type: "label",
      at: { logical: left, price },
      text: `${formatPercent(ratio)} · ${formatPrice(price)}`,
      tone: edge ? "muted" : "primary",
    });
  }
  return shapes;
}

export function buildShapes(drawing: Drawing, bars: Bar[], axis: TimeAxis): Shape[] {
  const pts = drawing.points.map((p) => ({ logical: axis.toLogical(p.time), price: p.price }));
  if (pts.length === 0) return [];

  // Desenho ainda em construção: mostra só os pontos já clicados ligados entre si.
  if (pts.length < TOOLS[drawing.kind].points) {
    if (drawing.kind === "triangle" && pts.length === 3) return polyline(pts.slice(0, 2), "primary");
    return polyline(pts, "muted", true);
  }

  switch (drawing.kind) {
    case "trendline": {
      const [a, b] = pts;
      return [{ type: "line", from: a, to: b, tone: "primary", extendRight: drawing.options.extend }];
    }

    case "fan": {
      const [origin, second] = pts;
      const { through, reversal } = fanLines(bars, origin, second);
      const shapes: Shape[] = through.flatMap((p, i): Shape[] => [
        { type: "line", from: origin, to: p, tone: i === 0 ? "primary" : "muted", extendRight: true },
        { type: "label", at: p, text: String(i + 1), tone: i === 0 ? "primary" : "muted", placement: "below" },
      ]);
      if (reversal) {
        shapes.push({ type: "label", at: reversal, text: "3ª linha rompida: reversão", tone: "target", placement: "below" });
      }
      return shapes;
    }

    case "horizontal": {
      const level = pts[0].price;
      if (!drawing.options.roleReversal || bars.length === 0) {
        return [
          { ...horizontal(level, 0, Math.max(bars.length - 1, 0), "primary"), extendLeft: true },
          { type: "label", at: { logical: Math.max(bars.length - 1, 0), price: level }, text: formatPrice(level), tone: "primary" },
        ];
      }
      const segments = roleSegments(bars, level);
      const shapes: Shape[] = segments.map((s, i) => ({
        ...horizontal(level, s.from, s.to, s.role, i === segments.length - 1),
        extendLeft: i === 0,
      }));
      const last = segments[segments.length - 1];
      shapes.push({
        type: "label",
        at: { logical: last.to, price: level },
        text: `${last.role === "support" ? "Suporte" : "Resistência"} · ${formatPrice(level)}`,
        tone: last.role,
      });
      return shapes;
    }

    case "channel": {
      const [a, b, c] = pts;
      const parallel = (l: number) => c.price + (lineAt(a, b, l) - lineAt(a, b, c.logical));
      const pa = { logical: a.logical, price: parallel(a.logical) };
      const pb = { logical: b.logical, price: parallel(b.logical) };
      return [
        { type: "line", from: a, to: b, tone: "primary", extendRight: true },
        { type: "line", from: pa, to: pb, tone: "primary", extendRight: true },
        {
          type: "line",
          from: { logical: a.logical, price: (a.price + pa.price) / 2 },
          to: { logical: b.logical, price: (b.price + pb.price) / 2 },
          tone: "muted",
          dashed: true,
          extendRight: true,
        },
      ];
    }

    case "fibonacci":
      return retracement(pts[0], pts[1], FIBONACCI_LEVELS);

    case "thirds":
      return retracement(pts[0], pts[1], THIRDS_LEVELS);

    case "speedLines": {
      const [a, b] = pts;
      const move = b.price - a.price;
      const shapes: Shape[] = [
        { type: "line", from: a, to: b, tone: "primary" },
        { type: "line", from: { logical: b.logical, price: a.price }, to: b, tone: "muted", dashed: true },
      ];
      for (const [fraction, text] of [[2 / 3, "2/3"], [1 / 3, "1/3"]] as const) {
        const through = { logical: b.logical, price: a.price + move * fraction };
        shapes.push({ type: "line", from: a, to: through, tone: "primary", extendRight: true });
        shapes.push({ type: "label", at: through, text, tone: "primary", placement: "right" });
      }
      return shapes;
    }

    case "triangle": {
      const [u1, u2, l1, l2] = pts;
      const t = analyzeTriangle(bars, [u1, u2], [l1, l2]);
      const lineEnd = t.apex ?? t.end;
      const upper = (l: number) => lineAt(u1, u2, l);
      const lower = (l: number) => lineAt(l1, l2, l);
      const shapes: Shape[] = [
        { type: "line", from: { logical: t.start, price: upper(t.start) }, to: { logical: lineEnd, price: upper(lineEnd) }, tone: "primary" },
        { type: "line", from: { logical: t.start, price: lower(t.start) }, to: { logical: lineEnd, price: lower(lineEnd) }, tone: "primary" },
        { type: "line", from: { logical: t.start, price: upper(t.start) }, to: { logical: t.start, price: lower(t.start) }, tone: "muted", dashed: true },
        { type: "label", at: { logical: t.start, price: upper(t.start) }, text: TRIANGLE_LABEL[t.type], tone: "primary" },
      ];
      if (t.breakout && t.target !== undefined) {
        const at = { logical: t.breakout.logical, price: t.breakout.price };
        shapes.push(...targetShapes(at, t.target, "Alvo"));
      } else {
        shapes.push(...targetShapes({ logical: t.end, price: upper(t.end) }, t.potentialTargets.up, "Alvo se romper ↑"));
        shapes.push(...targetShapes({ logical: t.end, price: lower(t.end) }, t.potentialTargets.down, "Alvo se romper ↓"));
      }
      return shapes;
    }

    case "headShoulders": {
      const [ls, n1, head, n2, rs] = pts;
      const hs = analyzeHeadShoulders(bars, pts);
      const placement = hs.inverse ? "below" : "above";
      return [
        ...polyline(pts, "primary"),
        { type: "line", from: n1, to: n2, tone: hs.inverse ? "support" : "resistance", extendRight: true, dashed: true },
        { type: "label", at: ls, text: "OE", tone: "primary", placement },
        { type: "label", at: head, text: hs.inverse ? "C · OCO invertido" : "C · OCO", tone: "primary", placement },
        { type: "label", at: rs, text: "OD", tone: "primary", placement },
        ...targetShapes(hs.projectedFrom, hs.target, hs.breakout ? "Alvo" : "Alvo (projeção)"),
      ];
    }
  }
}
