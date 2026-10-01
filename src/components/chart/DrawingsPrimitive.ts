import type {
  IChartApi,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesApi,
  ISeriesPrimitive,
  Logical,
  PrimitiveHoveredItem,
  SeriesAttachedParameter,
  SeriesType,
  Time,
} from "lightweight-charts";
import { buildShapes, type Shape, type Tone } from "@/lib/drawings/geometry";
import { createTimeAxis, type TimeAxis } from "@/lib/drawings/timeAxis";
import type { Bar, Drawing } from "@/lib/drawings/types";

type CanvasRenderingTarget2D = Parameters<IPrimitivePaneRenderer["draw"]>[0];

export type Palette = Record<Tone, string> & { label: string; handle: string };

interface PixelPoint {
  x: number;
  y: number;
}

type PixelShape =
  | { type: "line"; from: PixelPoint; to: PixelPoint; color: string; dashed: boolean }
  | { type: "label"; at: PixelPoint; text: string; color: string; placement: "above" | "below" | "right" };

interface PixelDrawing {
  id: string;
  shapes: PixelShape[];
  handles: PixelPoint[];
  selected: boolean;
}

export interface DrawingsState {
  bars: Bar[];
  drawings: Drawing[];
  /** Desenho em construção (inclui a posição atual do cursor como último ponto). */
  preview: Drawing | null;
  selectedId: string | null;
}

const HIT_TOLERANCE_PX = 6;
const PREVIEW_ID = "__preview__";

function distanceToSegment(p: PixelPoint, a: PixelPoint, b: PixelPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/**
 * Continua a semirreta que sai de `from` e passa por `to` até a borda do painel.
 * Um segmento de comprimento zero (ex.: nível horizontal de uma barra só) segue na horizontal.
 */
function extendRay(from: PixelPoint, to: PixelPoint, width: number, fallback: "left" | "right"): PixelPoint {
  if (from.x === to.x) {
    return from.y === to.y ? { x: fallback === "right" ? width : 0, y: to.y } : to;
  }
  const edge = to.x > from.x ? width : 0;
  const slope = (to.y - from.y) / (to.x - from.x);
  return { x: edge, y: to.y + slope * (edge - to.x) };
}

class DrawingsRenderer implements IPrimitivePaneRenderer {
  constructor(
    private readonly drawings: PixelDrawing[],
    private readonly palette: Palette,
  ) {}

  draw(target: CanvasRenderingTarget2D): void {
    target.useMediaCoordinateSpace(({ context: ctx }) => {
      ctx.lineCap = "round";
      ctx.font = "11px var(--font-geist-sans), system-ui, sans-serif";

      for (const drawing of this.drawings) {
        for (const shape of drawing.shapes) {
          if (shape.type === "line") {
            ctx.strokeStyle = shape.color;
            ctx.lineWidth = drawing.selected ? 2.5 : 1.5;
            ctx.setLineDash(shape.dashed ? [5, 4] : []);
            ctx.beginPath();
            ctx.moveTo(shape.from.x, shape.from.y);
            ctx.lineTo(shape.to.x, shape.to.y);
            ctx.stroke();
          } else {
            this.drawLabel(ctx, shape);
          }
        }
        ctx.setLineDash([]);
        for (const h of drawing.handles) {
          ctx.fillStyle = this.palette.handle;
          ctx.strokeStyle = this.palette.primary;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(h.x, h.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
    });
  }

  private drawLabel(ctx: CanvasRenderingContext2D, shape: Extract<PixelShape, { type: "label" }>) {
    const padding = 4;
    const width = ctx.measureText(shape.text).width + padding * 2;
    const height = 16;
    let x = shape.at.x + 4;
    let y = shape.at.y - height - 4;
    if (shape.placement === "below") y = shape.at.y + 4;
    if (shape.placement === "right") y = shape.at.y - height / 2;

    ctx.fillStyle = this.palette.label;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = 1;
    ctx.fillStyle = shape.color;
    ctx.textBaseline = "middle";
    x += padding;
    ctx.fillText(shape.text, x, y + height / 2);
  }
}

class DrawingsPaneView implements IPrimitivePaneView {
  constructor(private readonly source: DrawingsPrimitive) {}

  renderer(): IPrimitivePaneRenderer {
    return new DrawingsRenderer(this.source.pixelDrawings, this.source.palette);
  }
}

/**
 * Plugin do lightweight-charts que desenha as marcações técnicas no mesmo canvas do
 * gráfico. As posições são recalculadas a cada mudança de viewport (pan, zoom, escala).
 */
export class DrawingsPrimitive implements ISeriesPrimitive<Time> {
  pixelDrawings: PixelDrawing[] = [];
  palette: Palette;

  private chart: IChartApi | null = null;
  private series: ISeriesApi<SeriesType> | null = null;
  private requestUpdate: (() => void) | null = null;
  private state: DrawingsState = { bars: [], drawings: [], preview: null, selectedId: null };
  private axis: TimeAxis = createTimeAxis([]);
  private shapeCache = new Map<Drawing, Shape[]>();
  private readonly views = [new DrawingsPaneView(this)];

  constructor(palette: Palette) {
    this.palette = palette;
  }

  attached(param: SeriesAttachedParameter<Time>): void {
    this.chart = param.chart as IChartApi;
    this.series = param.series;
    this.requestUpdate = param.requestUpdate;
  }

  detached(): void {
    this.chart = null;
    this.series = null;
    this.requestUpdate = null;
  }

  setState(state: DrawingsState): void {
    if (state.bars !== this.state.bars) {
      this.axis = createTimeAxis(state.bars);
      this.shapeCache.clear();
    }
    this.state = state;
    this.requestUpdate?.();
  }

  setPalette(palette: Palette): void {
    this.palette = palette;
    this.requestUpdate?.();
  }

  get timeAxis(): TimeAxis {
    return this.axis;
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return this.views;
  }

  updateAllViews(): void {
    const { chart, series } = this;
    if (!chart || !series) return;
    const timeScale = chart.timeScale();
    const width = timeScale.width();

    // logicalToCoordinate só aceita índices inteiros (fracionários viram 0). Como o eixo é
    // linear, interpolamos entre os dois inteiros vizinhos (ex.: ápice de um triângulo).
    const logicalToX = (logical: number): number | null => {
      const base = Math.floor(logical);
      const x0 = timeScale.logicalToCoordinate(base as Logical);
      if (x0 === null || base === logical) return x0;
      const x1 = timeScale.logicalToCoordinate((base + 1) as Logical);
      return x1 === null ? null : x0 + (x1 - x0) * (logical - base);
    };

    const toPixel = (logical: number, price: number): PixelPoint | null => {
      const x = logicalToX(logical);
      const y = series.priceToCoordinate(price);
      return x === null || y === null ? null : { x, y };
    };

    const { drawings, preview, selectedId } = this.state;
    const all = preview ? [...drawings, preview] : drawings;
    const live = new Set(all);
    for (const key of this.shapeCache.keys()) if (!live.has(key)) this.shapeCache.delete(key);

    this.pixelDrawings = all.map((drawing) => {
      let shapes = this.shapeCache.get(drawing);
      if (!shapes) {
        shapes = buildShapes(drawing, this.state.bars, this.axis);
        this.shapeCache.set(drawing, shapes);
      }

      const pixelShapes: PixelShape[] = [];
      for (const shape of shapes) {
        const color = this.palette[shape.tone];
        if (shape.type === "label") {
          const at = toPixel(shape.at.logical, shape.at.price);
          if (at) pixelShapes.push({ type: "label", at, text: shape.text, color, placement: shape.placement ?? "above" });
          continue;
        }
        let from = toPixel(shape.from.logical, shape.from.price);
        let to = toPixel(shape.to.logical, shape.to.price);
        if (!from || !to) continue;
        const [start, end] = [from, to];
        if (shape.extendRight) to = extendRay(start, end, width, "right");
        if (shape.extendLeft) from = extendRay(end, start, width, "left");
        pixelShapes.push({ type: "line", from, to, color, dashed: Boolean(shape.dashed) });
      }

      const isPreview = drawing === preview;
      const selected = isPreview || drawing.id === selectedId;
      const handles = selected
        ? drawing.points.flatMap((p) => toPixel(this.axis.toLogical(p.time), p.price) ?? [])
        : [];
      return { id: isPreview ? PREVIEW_ID : drawing.id, shapes: pixelShapes, handles, selected };
    });
  }

  hitTest(x: number, y: number): PrimitiveHoveredItem | null {
    const cursor = { x, y };
    // Percorre de trás para frente: o desenho mais recente fica por cima.
    for (let i = this.pixelDrawings.length - 1; i >= 0; i--) {
      const drawing = this.pixelDrawings[i];
      if (drawing.id === PREVIEW_ID) continue;
      for (const shape of drawing.shapes) {
        if (shape.type !== "line") continue;
        const distance = distanceToSegment(cursor, shape.from, shape.to);
        if (distance <= HIT_TOLERANCE_PX) {
          return { externalId: drawing.id, distance, cursorStyle: "pointer", zOrder: "top" };
        }
      }
    }
    return null;
  }
}
