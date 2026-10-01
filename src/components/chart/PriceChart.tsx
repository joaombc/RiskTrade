"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { loadDrawings, saveDrawings } from "@/lib/drawings/storage";
import { TOOLS, type Anchor, type Bar, type Drawing, type DrawingKind, type DrawingOptions } from "@/lib/drawings/types";
import { HISTORY_RANGES, type HistoryRange } from "@/lib/market";
import { DrawingsPrimitive } from "./DrawingsPrimitive";
import { DrawingToolbar } from "./DrawingToolbar";
import { CHART_THEMES } from "./theme";
import { useColorScheme } from "./useColorScheme";

/** Distância máxima (px) para o clique "grudar" na máxima/mínima/abertura/fechamento do candle. */
const MAGNET_PX = 10;
/** Deslocamento máximo (px) entre pressionar e soltar para contar como clique, não arrasto. */
const CLICK_TOLERANCE_PX = 5;
const RANGE_KEYS = Object.keys(HISTORY_RANGES) as HistoryRange[];

interface ChartHandles {
  chart: IChartApi;
  candles: ISeriesApi<"Candlestick">;
  volume: ISeriesApi<"Histogram">;
  drawings: DrawingsPrimitive;
}

interface History {
  key: string;
  bars: Bar[];
  error: string | null;
}

interface LiveState {
  bars: Bar[];
  drawings: Drawing[];
  tool: DrawingKind | null;
  pending: Anchor[];
  selectedId: string | null;
}

/** Converte uma posição (px, relativa ao painel) em âncora, com ímã para o OHLC do candle. */
function toAnchor(x: number, y: number, handles: ChartHandles, bars: Bar[]): Anchor | null {
  const rawLogical = handles.chart.timeScale().coordinateToLogical(x);
  const pointed = handles.candles.coordinateToPrice(y);
  if (rawLogical === null || pointed === null) return null;
  const logical = Math.round(rawLogical);
  let price: number = pointed;

  const bar = bars[logical];
  if (bar) {
    let best = MAGNET_PX;
    for (const candidate of [bar.high, bar.low, bar.open, bar.close]) {
      const candidateY = handles.candles.priceToCoordinate(candidate);
      if (candidateY === null) continue;
      const distance = Math.abs(candidateY - y);
      if (distance < best) {
        best = distance;
        price = candidate;
      }
    }
  }
  return { time: handles.drawings.timeAxis.toTime(logical), price };
}

export function PriceChart({ symbol }: { symbol: string }) {
  const theme = CHART_THEMES[useColorScheme()];
  const containerRef = useRef<HTMLDivElement>(null);
  const handlesRef = useRef<ChartHandles | null>(null);
  const cursorRef = useRef<Anchor | null>(null);
  const fittedKeyRef = useRef<string | null>(null);

  const [range, setRange] = useState<HistoryRange>("1y");
  const [history, setHistory] = useState<History | null>(null);
  // O componente só é montado no cliente (após a cotação carregar), então o localStorage está disponível.
  const [drawings, setDrawings] = useState<Drawing[]>(() => loadDrawings(symbol));
  const [tool, setTool] = useState<DrawingKind | null>(null);
  const [pending, setPending] = useState<Anchor[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const key = `${symbol}:${range}`;
  const bars = history?.bars;
  const loading = history?.key !== key;
  const liveRef = useRef<LiveState>({ bars: [], drawings, tool, pending, selectedId });

  /** Envia o estado atual ao plugin, incluindo a pré-visualização do desenho em construção. */
  const pushToChart = useCallback(() => {
    const live = liveRef.current;
    const cursor = cursorRef.current;
    const preview: Drawing | null =
      live.tool && cursor
        ? { id: "preview", kind: live.tool, points: [...live.pending, cursor], options: { ...TOOLS[live.tool].defaults } }
        : null;
    handlesRef.current?.drawings.setState({
      bars: live.bars,
      drawings: live.drawings,
      preview,
      selectedId: live.selectedId,
    });
  }, []);

  // Cria o gráfico uma única vez; tema e dados são aplicados pelos efeitos abaixo.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: { rightOffset: 12, borderVisible: false },
      rightPriceScale: { borderVisible: false },
    });
    const candles = chart.addSeries(CandlestickSeries, {});
    candles.priceScale().applyOptions({ scaleMargins: { top: 0.08, bottom: 0.25 } });
    const volume = chart.addSeries(HistogramSeries, {
      priceScaleId: "volume",
      priceFormat: { type: "volume" },
      lastValueVisible: false,
      priceLineVisible: false,
    });
    chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    const drawingsPrimitive = new DrawingsPrimitive(CHART_THEMES.light.drawings);
    candles.attachPrimitive(drawingsPrimitive);
    const handles: ChartHandles = { chart, candles, volume, drawings: drawingsPrimitive };
    handlesRef.current = handles;

    const onMove = (param: MouseEventParams<Time>) => {
      if (!liveRef.current.tool) return;
      cursorRef.current = param.point ? toAnchor(param.point.x, param.point.y, handles, liveRef.current.bars) : null;
      pushToChart();
    };

    const onClick = (x: number, y: number) => {
      const live = liveRef.current;
      const pane = chart.paneSize();
      if (x < 0 || y < 0 || x > pane.width || y > pane.height) return;

      if (!live.tool) {
        setSelectedId(drawingsPrimitive.hitTest(x, y)?.externalId ?? null);
        return;
      }
      const anchor = toAnchor(x, y, handles, live.bars);
      if (!anchor) return;
      const points = [...live.pending, anchor];
      if (points.length < TOOLS[live.tool].points) {
        liveRef.current = { ...live, pending: points };
        setPending(points);
        return;
      }
      const drawing: Drawing = {
        id: crypto.randomUUID(),
        kind: live.tool,
        points,
        options: { ...TOOLS[live.tool].defaults },
      };
      cursorRef.current = null;
      liveRef.current = { ...live, pending: [], tool: null };
      setDrawings((current) => [...current, drawing]);
      setPending([]);
      setTool(null);
      setSelectedId(drawing.id);
    };

    // O subscribeClick do lightweight-charts descarta o 2º clique dado em menos de 500 ms
    // (trata como tentativa de duplo clique), o que perderia pontos ao desenhar rápido.
    // Por isso o clique é detectado aqui: pressionar e soltar sem arrastar (arrasto = pan).
    let pressed: { x: number; y: number } | null = null;
    const onPointerDown = (e: PointerEvent) => {
      pressed = e.button === 0 ? { x: e.clientX, y: e.clientY } : null;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!pressed || e.button !== 0) return;
      const moved = Math.abs(e.clientX - pressed.x) + Math.abs(e.clientY - pressed.y);
      pressed = null;
      if (moved >= CLICK_TOLERANCE_PX) return;
      const rect = container.getBoundingClientRect();
      onClick(e.clientX - rect.left, e.clientY - rect.top);
    };

    chart.subscribeCrosshairMove(onMove);
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointerup", onPointerUp);
    return () => {
      chart.unsubscribeCrosshairMove(onMove);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointerup", onPointerUp);
      chart.remove();
      handlesRef.current = null;
    };
  }, [pushToChart]);

  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles) return;
    handles.chart.applyOptions({
      layout: { background: { type: ColorType.Solid, color: theme.background }, textColor: theme.text },
      grid: { vertLines: { color: theme.grid }, horzLines: { color: theme.grid } },
    });
    handles.candles.applyOptions({
      upColor: theme.up,
      downColor: theme.down,
      borderUpColor: theme.up,
      borderDownColor: theme.down,
      wickUpColor: theme.up,
      wickDownColor: theme.down,
    });
    handles.drawings.setPalette(theme.drawings);
  }, [theme]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/history?symbol=${encodeURIComponent(symbol)}&range=${range}`, {
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Falha ao carregar o histórico.");
        setHistory({ key, bars: data.bars, error: null });
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : String(err);
        setHistory((prev) => ({ key, bars: prev?.bars ?? [], error: message }));
      }
    })();
    return () => controller.abort();
  }, [symbol, range, key]);

  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles || !bars) return;
    handles.candles.setData(
      bars.map((b) => ({ time: b.time as UTCTimestamp, open: b.open, high: b.high, low: b.low, close: b.close })),
    );
    handles.volume.setData(
      bars.map((b) => ({
        time: b.time as UTCTimestamp,
        value: b.volume,
        color: `${b.close >= b.open ? theme.up : theme.down}55`,
      })),
    );
    if (history && fittedKeyRef.current !== history.key) {
      fittedKeyRef.current = history.key;
      handles.chart.timeScale().fitContent();
    }
  }, [bars, history, theme]);

  useEffect(() => {
    liveRef.current = { bars: bars ?? [], drawings, tool, pending, selectedId };
    if (!tool) cursorRef.current = null;
    pushToChart();
  }, [bars, drawings, tool, pending, selectedId, pushToChart]);

  useEffect(() => {
    saveDrawings(symbol, drawings);
  }, [symbol, drawings]);

  const changeTool = useCallback((next: DrawingKind | null) => {
    setTool(next);
    setPending([]);
    setSelectedId(null);
  }, []);

  const deleteSelected = useCallback(() => {
    setDrawings((current) => current.filter((d) => d.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable]")) return;
      if (event.key === "Escape") {
        if (tool) changeTool(null);
        else setSelectedId(null);
      } else if ((event.key === "Delete" || event.key === "Backspace") && selectedId) {
        event.preventDefault();
        deleteSelected();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tool, selectedId, changeTool, deleteSelected]);

  const selected = drawings.find((d) => d.id === selectedId) ?? null;

  return (
    <section aria-label={`Gráfico de ${symbol}`} className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Gráfico diário</h2>
        <div role="group" aria-label="Período" className="flex gap-1">
          {RANGE_KEYS.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
              className={`rounded-md px-2 py-1 text-xs font-medium ${range === r ? "bg-foreground text-background" : "text-muted hover:bg-border/60"}`}
            >
              {HISTORY_RANGES[r].label}
            </button>
          ))}
        </div>
      </header>

      <DrawingToolbar
        activeTool={tool}
        pendingPoints={pending.length}
        selected={selected}
        drawingCount={drawings.length}
        onToolChange={changeTool}
        onOptionsChange={(options: DrawingOptions) =>
          setDrawings((current) => current.map((d) => (d.id === selectedId ? { ...d, options } : d)))
        }
        onDeleteSelected={deleteSelected}
        onClearAll={() => {
          if (window.confirm(`Apagar todos os ${drawings.length} desenhos de ${symbol}?`)) {
            setDrawings([]);
            setSelectedId(null);
          }
        }}
      />

      <div className="relative mt-2 h-[420px] sm:h-[480px]">
        <div ref={containerRef} className={`h-full w-full ${tool ? "cursor-crosshair" : ""}`} />
        {loading && (
          <div role="status" className="absolute inset-0 flex items-center justify-center bg-surface/60 text-sm text-muted">
            Carregando histórico…
          </div>
        )}
        {history?.error && history.key === key && (
          <div role="alert" className="absolute inset-x-0 top-0 rounded-lg bg-negative/10 p-3 text-sm text-negative">
            {history.error}
          </div>
        )}
      </div>
    </section>
  );
}
