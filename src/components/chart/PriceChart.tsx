"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  createSeriesMarkers,
  HistogramSeries,
  LineSeries,
  LineStyle,
  TickMarkType,
  type AutoscaleInfo,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type MouseEventParams,
  type SeriesMarker,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { loadDrawings, saveDrawings } from "@/lib/drawings/storage";
import { createTimeAxis } from "@/lib/drawings/timeAxis";
import { TOOLS, type Anchor, type Bar, type Drawing, type DrawingKind, type DrawingOptions } from "@/lib/drawings/types";
import { resolveExample, type ResolvedExample } from "@/lib/glossary/examples";
import type { TermExample } from "@/lib/glossary/types";
import { computeOBV, findDivergences, type Divergence } from "@/lib/indicators";
import { HISTORY_RANGES, INTERVAL_LABELS, isIntraday, type HistoryRange } from "@/lib/market";
import { useTheme } from "@/lib/theme";
import type { PlanLevel } from "@/lib/risk";
import { DivergencePanel } from "./DivergencePanel";
import { DrawingsPrimitive } from "./DrawingsPrimitive";
import { DrawingToolbar } from "./DrawingToolbar";
import { CHART_THEMES } from "./theme";

/** Distância máxima (px) para o clique "grudar" na máxima/mínima/abertura/fechamento do candle. */
const MAGNET_PX = 10;
/** Deslocamento máximo (px) entre pressionar e soltar para contar como clique, não arrasto. */
const CLICK_TOLERANCE_PX = 5;
const RANGE_KEYS = Object.keys(HISTORY_RANGES) as HistoryRange[];
const NO_LEVELS: PlanLevel[] = [];
/** Intervalo de atualização dos períodos intradiários (os diários não mudam ao longo do dia). */
const INTRADAY_REFRESH_MS = 60_000;

/**
 * Datas e horas em português. No intradiário, as horas saem no fuso do computador; nos
 * candles diários, a data fica em UTC, que é como o Yahoo marca o dia de cada candle.
 */
function timeFormatting(intraday: boolean) {
  const timeZone = intraday ? undefined : "UTC";
  const format = (time: Time, options: Intl.DateTimeFormatOptions) =>
    new Date((time as number) * 1000).toLocaleString("pt-BR", { timeZone, ...options });
  return {
    timeFormatter: (time: Time) =>
      format(
        time,
        intraday
          ? { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }
          : { day: "2-digit", month: "short", year: "numeric" },
      ),
    tickMarkFormatter: (time: Time, type: TickMarkType) => {
      switch (type) {
        case TickMarkType.Year:
          return format(time, { year: "numeric" });
        case TickMarkType.Month:
          return format(time, { month: "short" });
        case TickMarkType.DayOfMonth:
          return format(time, intraday ? { day: "2-digit", month: "short" } : { day: "numeric" });
        default:
          return format(time, { hour: "2-digit", minute: "2-digit" });
      }
    },
  };
}
const NO_EXAMPLE: ResolvedExample = { drawings: [], markers: [] };

/** Painéis do gráfico, de cima para baixo. */
const PRICE_PANE = 0;
const VOLUME_PANE = 1;
const OBV_PANE = 2;

interface ChartHandles {
  chart: IChartApi;
  candles: ISeriesApi<"Candlestick">;
  volume: ISeriesApi<"Histogram">;
  obv: ISeriesApi<"Line">;
  priceMarkers: ISeriesMarkersPluginApi<Time>;
  obvMarkers: ISeriesMarkersPluginApi<Time>;
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
  fixed: Drawing[];
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

/** Exemplo do glossário aberto pelo botão "Ver no gráfico real". */
export interface ChartExample {
  slug: string;
  name: string;
  example: TermExample;
}

interface PriceChartProps {
  symbol: string;
  /** Níveis do plano de risco (entrada, stop, alvo…) desenhados como linhas de preço. */
  levels?: PlanLevel[];
  initialRange?: HistoryRange;
  example?: ChartExample | null;
  onCloseExample?: () => void;
}

export function PriceChart({ symbol, levels = NO_LEVELS, initialRange = "1y", example = null, onCloseExample }: PriceChartProps) {
  const theme = CHART_THEMES[useTheme()];
  const containerRef = useRef<HTMLDivElement>(null);
  const handlesRef = useRef<ChartHandles | null>(null);
  const cursorRef = useRef<Anchor | null>(null);
  const fittedKeyRef = useRef<string | null>(null);
  const zoomedExampleRef = useRef<string | null>(null);

  const [range, setRange] = useState<HistoryRange>(initialRange);
  const [history, setHistory] = useState<History | null>(null);
  // O componente só é montado no cliente (após a cotação carregar), então o localStorage está disponível.
  const [drawings, setDrawings] = useState<Drawing[]>(() => loadDrawings(symbol));
  const [tool, setTool] = useState<DrawingKind | null>(null);
  const [pending, setPending] = useState<Anchor[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const key = `${symbol}:${range}`;
  const bars = history?.bars;
  const loading = history?.key !== key;
  const obvValues = useMemo(() => (bars ? computeOBV(bars) : []), [bars]);
  const divergences = useMemo(() => (bars ? findDivergences(bars, obvValues) : []), [bars, obvValues]);
  const [showDivergences, setShowDivergences] = useState(true);
  const resolvedExample = useMemo(
    () => (example && bars ? resolveExample(example.slug, example.example, bars) : NO_EXAMPLE),
    [example, bars],
  );
  const liveRef = useRef<LiveState>({ bars: [], drawings, tool, pending, selectedId, fixed: [] });

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
      fixed: live.fixed,
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
    const candles = chart.addSeries(CandlestickSeries, {}, PRICE_PANE);
    candles.priceScale().applyOptions({ scaleMargins: { top: 0.08, bottom: 0.08 } });
    const volume = chart.addSeries(
      HistogramSeries,
      { priceFormat: { type: "volume" }, lastValueVisible: false, priceLineVisible: false, title: "Volume" },
      VOLUME_PANE,
    );
    const obv = chart.addSeries(
      LineSeries,
      { priceFormat: { type: "volume" }, lineWidth: 2, priceLineVisible: false, title: "OBV" },
      OBV_PANE,
    );
    const [pricePane, volumePane, obvPane] = chart.panes();
    pricePane.setStretchFactor(5);
    volumePane.setStretchFactor(1.2);
    obvPane.setStretchFactor(1.5);

    const drawingsPrimitive = new DrawingsPrimitive(CHART_THEMES.light.drawings);
    candles.attachPrimitive(drawingsPrimitive);
    const handles: ChartHandles = {
      chart,
      candles,
      volume,
      obv,
      priceMarkers: createSeriesMarkers(candles, []),
      obvMarkers: createSeriesMarkers(obv, []),
      drawings: drawingsPrimitive,
    };
    handlesRef.current = handles;

    const onMove = (param: MouseEventParams<Time>) => {
      if (!liveRef.current.tool) return;
      // Desenhos só existem no painel de preço; fora dele não há pré-visualização.
      const inPricePane = (param.paneIndex ?? PRICE_PANE) === PRICE_PANE;
      cursorRef.current =
        param.point && inPricePane ? toAnchor(param.point.x, param.point.y, handles, liveRef.current.bars) : null;
      pushToChart();
    };

    const onClick = (x: number, y: number) => {
      const live = liveRef.current;
      const pane = chart.paneSize(PRICE_PANE);
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
      layout: {
        background: { type: ColorType.Solid, color: theme.background },
        textColor: theme.text,
        panes: { separatorColor: theme.grid },
      },
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
    handles.obv.applyOptions({ color: theme.drawings.target });
    handles.drawings.setPalette(theme.drawings);
  }, [theme]);

  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles) return;
    const colors: Record<PlanLevel["kind"], string> = {
      entry: theme.drawings.primary,
      stop: theme.down,
      target: theme.up,
      partial: theme.drawings.target,
    };
    const lines = levels.map((level) =>
      handles.candles.createPriceLine({
        price: level.price,
        color: colors[level.kind],
        lineWidth: 1,
        lineStyle: level.kind === "entry" ? LineStyle.Solid : LineStyle.Dashed,
        axisLabelVisible: true,
        title: level.label,
      }),
    );
    // Expande a escala automática para que stop e alvo fiquem sempre visíveis.
    const prices = levels.map((l) => l.price);
    handles.candles.applyOptions({
      autoscaleInfoProvider: (original: () => AutoscaleInfo | null) => {
        const base = original();
        if (!base?.priceRange || prices.length === 0) return base;
        return {
          ...base,
          priceRange: {
            minValue: Math.min(base.priceRange.minValue, ...prices),
            maxValue: Math.max(base.priceRange.maxValue, ...prices),
          },
        };
      },
    });
    return () => {
      if (handlesRef.current) lines.forEach((line) => handles.candles.removePriceLine(line));
    };
  }, [levels, theme]);

  useEffect(() => {
    const controller = new AbortController();

    async function load(silent: boolean) {
      try {
        const res = await fetch(`/api/history?symbol=${encodeURIComponent(symbol)}&range=${range}`, {
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Falha ao carregar o histórico.");
        setHistory({ key, bars: data.bars, error: null });
      } catch (err) {
        // Numa atualização em segundo plano, uma falha mantém os candles que já estão na tela.
        if (controller.signal.aborted || silent) return;
        const message = err instanceof Error ? err.message : String(err);
        setHistory((prev) => ({ key, bars: prev?.bars ?? [], error: message }));
      }
    }

    load(false);
    // Os períodos intradiários ganham candles novos ao longo do pregão.
    const id = isIntraday(range)
      ? setInterval(() => {
          if (document.visibilityState === "visible") load(true);
        }, INTRADAY_REFRESH_MS)
      : undefined;
    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, [symbol, range, key]);

  // Horas no eixo do tempo só nos períodos intradiários.
  useEffect(() => {
    const intraday = isIntraday(range);
    const { timeFormatter, tickMarkFormatter } = timeFormatting(intraday);
    handlesRef.current?.chart.applyOptions({
      localization: { locale: "pt-BR", timeFormatter },
      timeScale: { timeVisible: intraday, secondsVisible: false, tickMarkFormatter },
    });
  }, [range]);

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
        color: `${b.close >= b.open ? theme.up : theme.down}99`,
      })),
    );
    handles.obv.setData(bars.map((b, i) => ({ time: b.time as UTCTimestamp, value: obvValues[i] })));
    if (history && fittedKeyRef.current !== history.key) {
      fittedKeyRef.current = history.key;
      handles.chart.timeScale().fitContent();
    }
  }, [bars, history, theme, obvValues]);

  // Exemplo do glossário: aproxima o gráfico da janela do padrão (uma vez por exemplo carregado).
  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles || !bars || !example || !history) return;
    const zoomKey = `${example.slug}:${history.key}`;
    if (zoomedExampleRef.current === zoomKey) return;
    const times = [
      ...resolvedExample.drawings.flatMap((d) => d.points.map((p) => p.time)),
      ...resolvedExample.markers.map((m) => m.time),
    ];
    if (times.length === 0) return;
    zoomedExampleRef.current = zoomKey;
    const axis = createTimeAxis(bars);
    const toLogical = (date: string) => axis.toLogical(Date.parse(`${date}T23:59:59Z`) / 1000);
    const { view } = example.example;
    if (view) {
      handles.chart.timeScale().setVisibleLogicalRange({ from: toLogical(view.from), to: toLogical(view.to) });
      return;
    }
    const from = axis.toLogical(Math.min(...times));
    const to = axis.toLogical(Math.max(...times));
    // Mais folga à direita: é onde ficam o rompimento e a projeção do alvo.
    const span = to - from;
    handles.chart.timeScale().setVisibleLogicalRange({ from: from - Math.max(25, span * 0.25), to: to + Math.max(45, span * 0.8) });
  }, [bars, example, history, resolvedExample]);

  // Divergências: seta no candle do novo topo/fundo e uma linha ligando os dois pontos,
  // no preço e no OBV, para comparar as inclinações.
  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles || !bars) return;
    const visible: Divergence[] = showDivergences ? divergences : [];
    const time = (i: number) => bars[i].time as UTCTimestamp;
    const colorOf = (d: Divergence) => (d.kind === "bearish" ? theme.down : theme.up);

    const divergenceMarkers = visible.map(
      (d): SeriesMarker<Time> => ({
        time: time(d.to),
        position: d.kind === "bearish" ? "aboveBar" : "belowBar",
        shape: d.kind === "bearish" ? "arrowDown" : "arrowUp",
        color: colorOf(d),
        // Texto curto: divergências encadeadas ficam próximas; cor e seta já indicam o tipo.
        text: "Div.",
      }),
    );
    const exampleMarkers = resolvedExample.markers.map(
      (m): SeriesMarker<Time> => ({
        time: m.time as UTCTimestamp,
        position: m.position,
        shape: "circle",
        color: theme.drawings.target,
        text: m.text,
      }),
    );
    // A API exige marcadores em ordem cronológica.
    handles.priceMarkers.setMarkers(
      [...divergenceMarkers, ...exampleMarkers].sort((a, b) => (a.time as number) - (b.time as number)),
    );
    handles.obvMarkers.setMarkers(
      visible.map(
        (d): SeriesMarker<Time> => ({
          time: time(d.to),
          position: d.kind === "bearish" ? "aboveBar" : "belowBar",
          shape: "circle",
          color: colorOf(d),
        }),
      ),
    );

    const segment = (pane: number, color: string, from: [number, number], to: [number, number]) => {
      const series = handles.chart.addSeries(
        LineSeries,
        {
          color,
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          lastValueVisible: false,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
          autoscaleInfoProvider: () => null,
        },
        pane,
      );
      series.setData([
        { time: time(from[0]), value: from[1] },
        { time: time(to[0]), value: to[1] },
      ]);
      return series;
    };
    const segments = visible.flatMap((d) => [
      segment(PRICE_PANE, colorOf(d), [d.from, d.priceFrom], [d.to, d.priceTo]),
      segment(OBV_PANE, colorOf(d), [d.from, d.obvFrom], [d.to, d.obvTo]),
    ]);
    return () => {
      // Se o gráfico já foi desmontado, as séries foram junto.
      if (handlesRef.current) segments.forEach((s) => handles.chart.removeSeries(s));
    };
  }, [bars, divergences, showDivergences, theme, resolvedExample]);

  useEffect(() => {
    liveRef.current = { bars: bars ?? [], drawings, tool, pending, selectedId, fixed: resolvedExample.drawings };
    if (!tool) cursorRef.current = null;
    pushToChart();
  }, [bars, drawings, tool, pending, selectedId, pushToChart, resolvedExample]);

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
        <h2 className="text-sm font-semibold">
          Gráfico <span className="font-normal text-muted">· {INTERVAL_LABELS[HISTORY_RANGES[range].interval]}</span>
        </h2>
        <div role="group" aria-label="Período" className="flex flex-wrap gap-1">
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

      {example && (
        <div role="status" className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-target/40 bg-target/10 p-3 text-sm">
          <span className="min-w-0 flex-1">
            <strong className="text-target">Exemplo do glossário: {example.name}.</strong> {example.example.description}
            {bars && resolvedExample.drawings.length < (example.example.drawings?.length ?? 0) && (
              <span className="text-muted"> Parte do exemplo está fora do período carregado.</span>
            )}
          </span>
          {resolvedExample.drawings.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setDrawings((current) => [
                  ...current,
                  ...resolvedExample.drawings.map((d) => ({ ...d, id: crypto.randomUUID() })),
                ])
              }
              className="rounded-md bg-target px-2.5 py-1 text-xs font-medium text-white hover:opacity-90"
            >
              Copiar para meus desenhos
            </button>
          )}
          <button type="button" onClick={onCloseExample} className="text-xs font-medium text-muted hover:text-foreground">
            Fechar exemplo
          </button>
        </div>
      )}

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

      <div className="relative mt-2 h-[560px] sm:h-[640px]">
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
      {bars && bars.length > 0 && (
        <DivergencePanel
          bars={bars}
          divergences={divergences}
          show={showDivergences}
          onShowChange={setShowDivergences}
        />
      )}
    </section>
  );
}
