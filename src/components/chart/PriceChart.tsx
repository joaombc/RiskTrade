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
  LineType,
  TickMarkType,
  type AutoscaleInfo,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type MouseEventParams,
  type SeriesDefinition,
  type SeriesMarker,
  type SeriesPartialOptionsMap,
  type SeriesType,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { apiErrorMessage } from "@/i18n/apiError";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { bollinger, loadBollingerEnabled, readBollinger, saveBollingerEnabled } from "@/lib/bollinger";
import {
  channelSystemState,
  loadFourWeekSettings,
  priceChannel,
  saveFourWeekSettings,
  WEEK_BARS,
  type FourWeekSettings,
} from "@/lib/priceChannel";
import { loadDrawings, saveDrawings } from "@/lib/drawings/storage";
import { createTimeAxis } from "@/lib/drawings/timeAxis";
import { TOOLS, type Anchor, type Bar, type Drawing, type DrawingKind, type DrawingOptions } from "@/lib/drawings/types";
import { resolveExample, type ResolvedExample } from "@/lib/glossary/examples";
import type { TermExample } from "@/lib/glossary/types";
import { computeOBV, findDivergences, type Divergence } from "@/lib/indicators";
import {
  DEFAULT_PANE_ORDER,
  isDefaultPaneOrder,
  loadPaneOrder,
  movePane,
  savePaneOrder,
  visiblePanes,
  type PaneId,
} from "@/lib/paneOrder";
import { isWidening, loadMaOscillatorVisible, maDifference, readMaOscillator, saveMaOscillatorVisible } from "@/lib/maOscillator";
import { failureSwings, loadRsiPeriod, OVERBOUGHT, OVERSOLD, readRsi, rsi, saveRsiPeriod, zoneExits, type RsiPeriod } from "@/lib/rsi";
import {
  loadStochasticPeriod,
  OVERBOUGHT as STOCH_OVERBOUGHT,
  OVERSOLD as STOCH_OVERSOLD,
  readStochastic,
  saveStochasticPeriod,
  stochastic,
  stochasticCrosses,
  type StochasticPeriod,
} from "@/lib/stochastic";
import {
  loadWilliamsPeriod,
  OVERBOUGHT as WILLIAMS_OVERBOUGHT,
  OVERSOLD as WILLIAMS_OVERSOLD,
  readWilliams,
  saveWilliamsPeriod,
  williamsExits,
  williamsR,
  type WilliamsPeriod,
} from "@/lib/williamsR";
import { loadMomentumPeriod, momentum, readMomentum, saveMomentumPeriod, zeroCrossings, type MomentumPeriod } from "@/lib/momentum";
import {
  HISTORY_RANGES,
  isIntraday,
  rangeSpec,
  sameBars,
  type HistoryRange,
  type PresetRange,
} from "@/lib/market";
import {
  computeMovingAverage,
  envelopeLine,
  envelopeRegime,
  findCrossSignals,
  findEnvelopeSignals,
  loadMovingAverages,
  maLabel,
  saveMovingAverages,
  type CrossSignal,
  type EnvelopePercent,
  type EnvelopeSignal,
  type MovingAverage,
} from "@/lib/movingAverages";
import type { OpenInterestSeries } from "@/lib/openInterest";
import { useTheme } from "@/lib/theme";
import type { PlanLevel } from "@/lib/risk";
import { CrossSignalPanel } from "./CrossSignalPanel";
import { BollingerPanel } from "./BollingerPanel";
import { CustomRangeInput } from "./CustomRangeInput";
import { DivergencePanel } from "./DivergencePanel";
import { EnvelopeSignalPanel } from "./EnvelopeSignalPanel";
import { FourWeekPanel } from "./FourWeekPanel";
import { MaOscillatorPanel } from "./MaOscillatorPanel";
import { MomentumPanel } from "./MomentumPanel";
import { RsiPanel } from "./RsiPanel";
import { StochasticPanel } from "./StochasticPanel";
import { WilliamsRPanel } from "./WilliamsRPanel";
import { DrawingsPrimitive } from "./DrawingsPrimitive";
import { DrawingToolbar } from "./DrawingToolbar";
import { MovingAverageBar } from "./MovingAverageBar";
import { OpenInterestNote } from "./OpenInterestNote";
import { PaneHandles, type LegendItem, type PaneBox } from "./PaneHandles";
import { CHART_THEMES } from "./theme";

/** Distância máxima (px) para o clique "grudar" na máxima/mínima/abertura/fechamento do candle. */
const MAGNET_PX = 10;
/** Deslocamento máximo (px) entre pressionar e soltar para contar como clique, não arrasto. */
const CLICK_TOLERANCE_PX = 5;
const RANGE_KEYS = Object.keys(HISTORY_RANGES) as PresetRange[];
const NO_LEVELS: PlanLevel[] = [];
/**
 * Intervalo de atualização do gráfico, em todos os períodos: no intradiário entram candles
 * novos; no diário, o candle de hoje acompanha o pregão (e com ele médias, sinais e OBV).
 */
const REFRESH_MS = 60_000;

/**
 * Datas e horas em português. No intradiário, as horas saem no fuso do computador; nos
 * candles diários, a data fica em UTC, que é como o Yahoo marca o dia de cada candle.
 */
function timeFormatting(intraday: boolean, locale: string) {
  const timeZone = intraday ? undefined : "UTC";
  const format = (time: Time, options: Intl.DateTimeFormatOptions) =>
    new Date((time as number) * 1000).toLocaleString(locale, { timeZone, ...options });
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
/** Tracejado de cada envelope, para distinguir as porcentagens na mesma cor da média. */
const ENVELOPE_STYLE: Record<EnvelopePercent, LineStyle> = {
  3: LineStyle.Dotted,
  5: LineStyle.Dashed,
  10: LineStyle.LargeDashed,
};
const NO_EXAMPLE: ResolvedExample = { drawings: [], markers: [] };
/** Altura do gráfico conforme o número de painéis opcionais abertos (0 a 6). */
const CHART_HEIGHT = [
  "h-[560px] sm:h-[640px]",
  "h-[680px] sm:h-[780px]",
  "h-[800px] sm:h-[920px]",
  "h-[920px] sm:h-[1060px]",
  "h-[1040px] sm:h-[1200px]",
  "h-[1160px] sm:h-[1340px]",
  "h-[1280px] sm:h-[1480px]",
];

/**
 * Painéis do gráfico na criação. Depois disso a ordem é do usuário (alças ⋮⋮), então o índice de
 * cada painel é sempre perguntado à série principal dele (ver paneIndexOf).
 */
const INITIAL_PANES: PaneId[] = ["price", "volume", "obv"];

const sameBoxes = (a: PaneBox[], b: PaneBox[]) =>
  a.length === b.length && a.every((box, i) => box.id === b[i].id && box.top === b[i].top && box.height === b[i].height);

/** Índice atual do painel; -1 se ele não está aberto. */
function paneIndexOf(handles: ChartHandles, id: PaneId): number {
  return handles.paneSeries.get(id)?.getPane().paneIndex() ?? -1;
}

const pricePaneIndex = (handles: ChartHandles) => handles.candles.getPane().paneIndex();

/** A série ainda está no gráfico atual (ele pode ter sido recriado por desmontagem ou Fast Refresh). */
const isAlive = (chart: IChartApi | undefined, series: ISeriesApi<SeriesType>) =>
  !!chart?.panes().some((pane) => pane.getSeries().includes(series));

/**
 * Põe os painéis abertos na ordem escolhida e diz se terminou. A biblioteca só aceita mover para
 * uma posição que já tem widget desenhado, e o widget de um painel novo só aparece no quadro
 * seguinte; o que não puder ser feito agora fica para a próxima tentativa (ver `arrange`).
 */
function arrangePanes(handles: ChartHandles, order: PaneId[]): boolean {
  // Só séries que ainda estão no gráfico: um Fast Refresh pode deixar o mapa desatualizado.
  const present = [...handles.paneSeries].filter(([, series]) => isAlive(handles.chart, series)).map(([id]) => id);
  const drawn = handles.chart.panes().filter((pane) => pane.getHTMLElement() !== null).length;
  let done = true;
  visiblePanes(order, present).forEach((id, target) => {
    const pane = handles.paneSeries.get(id)!.getPane();
    if (pane.paneIndex() === target) return;
    if (target >= drawn || pane.paneIndex() >= drawn) done = false;
    else pane.moveTo(target);
  });
  return done;
}

/** Painéis opcionais (momentum, interesse aberto, diferença das médias) entram no fim; `arrange` os leva ao lugar escolhido. */
function addPaneSeries<T extends SeriesType>(
  handles: ChartHandles,
  id: PaneId,
  definition: SeriesDefinition<T>,
  options: SeriesPartialOptionsMap[T],
): ISeriesApi<T> {
  const series = handles.chart.addSeries(definition, options, handles.chart.panes().length);
  series.getPane().setStretchFactor(1.5);
  handles.paneSeries.set(id, series);
  return series;
}

/** Tira a série e o painel dela, se ele ficou vazio e a biblioteca não o removeu sozinha. */
function removePaneSeries(handles: ChartHandles, id: PaneId, series: ISeriesApi<SeriesType>) {
  if (handles.paneSeries.get(id) === series) handles.paneSeries.delete(id);
  const { chart } = handles;
  if (!isAlive(chart, series)) return;
  const index = series.getPane().paneIndex();
  const count = chart.panes().length;
  chart.removeSeries(series);
  if (chart.panes().length === count && chart.panes()[index]?.getSeries().length === 0) chart.removePane(index);
}

interface ChartHandles {
  chart: IChartApi;
  candles: ISeriesApi<"Candlestick">;
  volume: ISeriesApi<"Histogram">;
  obv: ISeriesApi<"Line">;
  priceMarkers: ISeriesMarkersPluginApi<Time>;
  obvMarkers: ISeriesMarkersPluginApi<Time>;
  drawings: DrawingsPrimitive;
  /** Série principal de cada painel aberto: é por ela que se descobre onde o painel está. */
  paneSeries: Map<PaneId, ISeriesApi<SeriesType>>;
}

interface History {
  key: string;
  bars: Bar[];
  /** Fechamentos anteriores ao período, para as médias móveis começarem na borda esquerda. */
  warmup: number[];
  openInterest: OpenInterestSeries | null;
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
  const { t, locale } = useI18n();
  const canvasLabels = useMemo(() => ({ locale, ...t.drawings.canvas }), [locale, t]);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Data da crosshair no topo: atualizada direto no DOM a cada movimento do mouse, sem re-renderizar.
  const topDateRef = useRef<HTMLDivElement>(null);
  const timeFormatterRef = useRef<(time: Time) => string>((time) => String(time));
  const handlesRef = useRef<ChartHandles | null>(null);
  // Ordem dos painéis escolhida pelo usuário; a ref serve aos efeitos que criam painéis.
  const [paneOrder, setPaneOrder] = useState<PaneId[]>(loadPaneOrder);
  const paneOrderRef = useRef(paneOrder);
  const [paneBoxes, setPaneBoxes] = useState<PaneBox[]>([]);
  // Põe os painéis na ordem escolhida a partir do próximo quadro (tentando de novo enquanto a
  // biblioteca não desenha os painéis novos) e mede as alças em seguida: a biblioteca reaproveita
  // os elementos ao mover, e sem mudança de altura nenhum observer percebe a troca.
  const measureRef = useRef<(() => void) | null>(null);
  /** Painéis abertos agora, segundo o próprio gráfico (a medição das alças pode estar atrasada). */
  const openPanes = () => {
    const handles = handlesRef.current;
    return handles ? [...handles.paneSeries].filter(([, series]) => isAlive(handles.chart, series)).map(([id]) => id) : [];
  };
  const arrange = useCallback(() => {
    let frame = 0;
    const step = () => {
      const handles = handlesRef.current;
      if (!handles) return;
      const done = arrangePanes(handles, paneOrderRef.current);
      measureRef.current?.();
      // A biblioteca atualiza os widgets num quadro próprio: mede por pelo menos três quadros.
      frame++;
      if ((!done || frame < 3) && frame < 12) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, []);
  const cursorRef = useRef<Anchor | null>(null);
  const fittedKeyRef = useRef<string | null>(null);
  const zoomedExampleRef = useRef<string | null>(null);

  const [range, setRange] = useState<HistoryRange>(initialRange);
  const [history, setHistory] = useState<History | null>(null);
  /** Hora da última resposta do servidor, mesmo quando ela não trouxe nada novo. */
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  // O componente só é montado no cliente (após a cotação carregar), então o localStorage está disponível.
  const [drawings, setDrawings] = useState<Drawing[]>(() => loadDrawings(symbol));
  const [tool, setTool] = useState<DrawingKind | null>(null);
  const [pending, setPending] = useState<Anchor[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const key = `${symbol}:${range}`;
  const bars = history?.bars;
  const openInterest = history?.openInterest ?? null;
  const loading = history?.key !== key;
  const obvValues = useMemo(() => (bars ? computeOBV(bars) : []), [bars]);
  const divergences = useMemo(() => (bars ? findDivergences(bars, obvValues) : []), [bars, obvValues]);
  const [showDivergences, setShowDivergences] = useState(true);
  // Valem para todos os ativos; o componente só monta no cliente, então o localStorage está disponível.
  const [averages, setAverages] = useState<MovingAverage[]>(loadMovingAverages);
  const warmup = history?.warmup;
  const averageLines = useMemo(
    () =>
      bars
        ? averages.filter((ma) => ma.visible).map((ma) => ({ ma, values: computeMovingAverage(bars, ma, warmup) }))
        : [],
    [bars, warmup, averages],
  );
  // Sinais de cruzamento (Murphy, cap. 9) entre as médias visíveis, da curta para a longa.
  const crossLines = useMemo(() => [...averageLines].sort((a, b) => a.ma.period - b.ma.period), [averageLines]);
  // Oscilador de duas médias: só com exatamente duas visíveis (curta menos longa).
  const [maOscillatorVisible, setMaOscillatorVisible] = useState(loadMaOscillatorVisible);
  const maOscillator = useMemo(() => {
    if (crossLines.length !== 2) return null;
    const [fast, slow] = crossLines;
    return { fast: fast.ma, slow: slow.ma, slowValues: slow.values, diff: maDifference(fast.values, slow.values) };
  }, [crossLines]);
  const maOscillatorReading = useMemo(
    () => (maOscillator ? readMaOscillator(maOscillator.diff, maOscillator.slowValues) : null),
    [maOscillator],
  );
  const showMaOscillator = !!maOscillator && maOscillatorVisible;
  const crossSignals = useMemo(
    () => findCrossSignals(crossLines.map(({ ma, values }) => ({ period: ma.period, values }))),
    [crossLines],
  );
  const [showCrossSignals, setShowCrossSignals] = useState(true);
  // Sinais dos envelopes: da média simples visível mais curta com envelope, na menor porcentagem marcada.
  const envelopeSource = useMemo(() => {
    const line = crossLines.find(({ ma }) => ma.kind === "sma" && (ma.envelopes?.length ?? 0) > 0);
    return line ? { ...line, percent: Math.min(...line.ma.envelopes!) } : null;
  }, [crossLines]);
  const envelopeSignals = useMemo(
    () =>
      bars && envelopeSource
        ? findEnvelopeSignals(bars, envelopeSource.values, envelopeSource.ma.period, envelopeSource.percent)
        : [],
    [bars, envelopeSource],
  );
  const [showEnvelopeSignals, setShowEnvelopeSignals] = useState(true);
  const [bollingerOn, setBollingerOn] = useState(loadBollingerEnabled);
  const bands = useMemo(() => (bars && bollingerOn ? bollinger(bars, warmup) : null), [bars, warmup, bollingerOn]);
  const bollingerReading = useMemo(() => (bars && bands ? readBollinger(bars, bands) : null), [bars, bands]);
  // Regra das 4 semanas: só em candles diários (uma semana = 5 pregões).
  const [fourWeek, setFourWeek] = useState<FourWeekSettings>(loadFourWeekSettings);
  const [showFourWeekSignals, setShowFourWeekSignals] = useState(true);

  const [momentumPeriod, setMomentumPeriod] = useState<MomentumPeriod | null>(loadMomentumPeriod);
  const [showMomentumSignals, setShowMomentumSignals] = useState(true);
  const momentumValues = useMemo(
    () => (bars && momentumPeriod ? momentum(bars, momentumPeriod, warmup) : null),
    [bars, momentumPeriod, warmup],
  );
  const momentumReading = useMemo(() => (bars && momentumValues ? readMomentum(bars, momentumValues) : null), [bars, momentumValues]);

  const [rsiPeriod, setRsiPeriod] = useState<RsiPeriod | null>(loadRsiPeriod);
  const [showRsiSignals, setShowRsiSignals] = useState(true);
  const rsiValues = useMemo(() => (bars && rsiPeriod ? rsi(bars, rsiPeriod, warmup) : null), [bars, rsiPeriod, warmup]);
  const rsiReading = useMemo(() => (rsiValues ? readRsi(rsiValues) : null), [rsiValues]);

  const [stochasticPeriod, setStochasticPeriod] = useState<StochasticPeriod | null>(loadStochasticPeriod);
  const [showStochasticSignals, setShowStochasticSignals] = useState(true);
  const stochasticLines = useMemo(() => (bars && stochasticPeriod ? stochastic(bars, stochasticPeriod) : null), [bars, stochasticPeriod]);
  const stochasticReading = useMemo(() => (stochasticLines ? readStochastic(stochasticLines) : null), [stochasticLines]);

  const [williamsPeriod, setWilliamsPeriod] = useState<WilliamsPeriod | null>(loadWilliamsPeriod);
  const [showWilliamsSignals, setShowWilliamsSignals] = useState(true);
  const williamsValues = useMemo(() => (bars && williamsPeriod ? williamsR(bars, williamsPeriod) : null), [bars, williamsPeriod]);
  const williamsReading = useMemo(() => (williamsValues ? readWilliams(williamsValues) : null), [williamsValues]);
  const fourWeekSystem = useMemo(() => {
    if (!bars || !fourWeek.enabled || isIntraday(range)) return null;
    const entryBars = fourWeek.entryWeeks * WEEK_BARS;
    const exitBars = (fourWeek.exitWeeks ?? fourWeek.entryWeeks) * WEEK_BARS;
    const entry = priceChannel(bars, entryBars);
    const exit = fourWeek.exitWeeks === null ? null : priceChannel(bars, exitBars);
    const last = bars.length - 1;
    return {
      entry,
      exit,
      state: channelSystemState(bars, entryBars, exitBars),
      // Níveis com que o fechamento do último candle é comparado.
      upper: entry.upper[last] ?? null,
      lower: entry.lower[last] ?? null,
      exitUpper: exit?.upper[last] ?? null,
      exitLower: exit?.lower[last] ?? null,
    };
  }, [bars, fourWeek, range]);
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
    const candles = chart.addSeries(CandlestickSeries, {}, INITIAL_PANES.indexOf("price"));
    candles.priceScale().applyOptions({ scaleMargins: { top: 0.08, bottom: 0.08 } });
    const volume = chart.addSeries(
      HistogramSeries,
      { priceFormat: { type: "volume" }, lastValueVisible: false, priceLineVisible: false },
      INITIAL_PANES.indexOf("volume"),
    );
    const obv = chart.addSeries(
      LineSeries,
      { priceFormat: { type: "volume" }, lineWidth: 2, priceLineVisible: false },
      INITIAL_PANES.indexOf("obv"),
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
      paneSeries: new Map<PaneId, ISeriesApi<SeriesType>>([
        ["price", candles],
        ["volume", volume],
        ["obv", obv],
      ]),
    };
    handlesRef.current = handles;
    arrange();

    const onMove = (param: MouseEventParams<Time>) => {
      if (!liveRef.current.tool) return;
      // Desenhos só existem no painel de preço; fora dele não há pré-visualização.
      const inPricePane = (param.paneIndex ?? pricePaneIndex(handles)) === pricePaneIndex(handles);
      cursorRef.current =
        param.point && inPricePane ? toAnchor(param.point.x, param.point.y, handles, liveRef.current.bars) : null;
      pushToChart();
    };

    const onClick = (x: number, y: number) => {
      const live = liveRef.current;
      const pane = chart.paneSize(pricePaneIndex(handles));
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
      // Coordenadas no painel de preço, que pode não estar no topo (ordem escolhida pelo usuário).
      const rect = candles.getPane().getHTMLElement()?.getBoundingClientRect() ?? container.getBoundingClientRect();
      onClick(e.clientX - rect.left, e.clientY - rect.top);
    };

    // A mesma data da etiqueta de baixo, no topo, alinhada à linha vertical e presa à área do gráfico.
    const onHover = (param: MouseEventParams<Time>) => {
      const label = topDateRef.current;
      if (!label) return;
      if (param.time === undefined || !param.point) {
        label.style.visibility = "hidden";
        return;
      }
      label.textContent = timeFormatterRef.current(param.time);
      const half = label.offsetWidth / 2;
      const x = Math.min(Math.max(param.point.x, half), chart.timeScale().width() - half);
      label.style.left = `${x}px`;
      label.style.visibility = "visible";
    };

    chart.subscribeCrosshairMove(onMove);
    chart.subscribeCrosshairMove(onHover);
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointerup", onPointerUp);
    return () => {
      chart.unsubscribeCrosshairMove(onMove);
      chart.unsubscribeCrosshairMove(onHover);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointerup", onPointerUp);
      chart.remove();
      handlesRef.current = null;
    };
  }, [pushToChart, arrange]);

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

  // Textos do idioma: rótulos escritos pelos desenhos. (Os nomes das séries ficam na legenda de
  // cada painel, e não no eixo, onde a etiqueta avançava sobre os candles.)
  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles) return;
    handles.drawings.setLabels(canvasLabels);
  }, [canvasLabels]);

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
        if (!res.ok) throw new Error(apiErrorMessage(t.errors, data, t.errors.historyFailed));
        const next: History = {
          key,
          bars: data.bars,
          warmup: data.warmup ?? [],
          openInterest: data.openInterest ?? null,
          error: null,
        };
        // Atualização sem novidade (ex.: mercado fechado): mantém o histórico atual, sem redesenhar.
        setHistory((prev) =>
          prev &&
          prev.key === key &&
          !prev.error &&
          sameBars(prev.bars, next.bars) &&
          prev.warmup.length === next.warmup.length &&
          prev.openInterest?.lastReport === next.openInterest?.lastReport
            ? prev
            : next,
        );
        setUpdatedAt(Date.now());
      } catch (err) {
        // Numa atualização em segundo plano, uma falha mantém os candles que já estão na tela.
        if (controller.signal.aborted || silent) return;
        const message = err instanceof Error ? err.message : String(err);
        setHistory((prev) => ({
          key,
          bars: prev?.bars ?? [],
          warmup: prev?.warmup ?? [],
          openInterest: prev?.openInterest ?? null,
          error: message,
        }));
      }
    }

    load(false);
    // Só com a aba visível: em segundo plano, ninguém está olhando o gráfico.
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, REFRESH_MS);
    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, [symbol, range, key, t.errors]);

  // Horas no eixo do tempo só nos períodos intradiários.
  useEffect(() => {
    const intraday = isIntraday(range);
    const { timeFormatter, tickMarkFormatter } = timeFormatting(intraday, locale);
    timeFormatterRef.current = timeFormatter;
    handlesRef.current?.chart.applyOptions({
      localization: { locale, timeFormatter },
      timeScale: { timeVisible: intraday, secondsVisible: false, tickMarkFormatter },
    });
  }, [range, locale]);

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

  useEffect(() => {
    saveMovingAverages(averages);
  }, [averages]);

  // Médias móveis: uma linha por média visível, sobre os candles, mais os envelopes marcados.
  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles || !bars) return;
    const series = averageLines.map(({ ma, values }) => {
      const line = handles.chart.addSeries(
        LineSeries,
        {
          color: theme.movingAverages[ma.slot],
          lineWidth: 2,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
        },
        pricePaneIndex(handles),
      );
      const toData = (points: (number | null)[]) =>
        bars.map((b, i) => {
          const value = points[i];
          return value === null ? { time: b.time as UTCTimestamp } : { time: b.time as UTCTimestamp, value };
        });
      line.setData(toData(values));
      // Envelopes: duas linhas finas na cor da média, com o tracejado indicando a porcentagem.
      const envelopes = (ma.kind === "sma" ? (ma.envelopes ?? []) : []).flatMap((percent) =>
        (["upper", "lower"] as const).map((side) => {
          const envelope = handles.chart.addSeries(
            LineSeries,
            {
              color: theme.movingAverages[ma.slot],
              lineWidth: 1,
              lineStyle: ENVELOPE_STYLE[percent],
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
            },
            pricePaneIndex(handles),
          );
          envelope.setData(toData(envelopeLine(values, percent, side)));
          return envelope;
        }),
      );
      return [line, ...envelopes];
    });
    return () => {
      // O gráfico pode ter sido recriado (desmontagem ou Fast Refresh) e levado as séries junto.
      const alive = handlesRef.current?.candles.getPane().getSeries() ?? [];
      series.flat().forEach((line) => {
        if (alive.includes(line)) handles.chart.removeSeries(line);
      });
    };
  }, [bars, averageLines, theme]);

  useEffect(() => {
    saveBollingerEnabled(bollingerOn);
  }, [bollingerOn]);

  useEffect(() => {
    saveFourWeekSettings(fourWeek);
  }, [fourWeek]);

  useEffect(() => {
    saveMomentumPeriod(momentumPeriod);
  }, [momentumPeriod]);

  useEffect(() => {
    saveMaOscillatorVisible(maOscillatorVisible);
  }, [maOscillatorVisible]);

  useEffect(() => {
    saveRsiPeriod(rsiPeriod);
  }, [rsiPeriod]);

  useEffect(() => {
    saveStochasticPeriod(stochasticPeriod);
  }, [stochasticPeriod]);

  useEffect(() => {
    saveWilliamsPeriod(williamsPeriod);
  }, [williamsPeriod]);

  useEffect(() => {
    paneOrderRef.current = paneOrder;
    savePaneOrder(paneOrder);
    arrange();
  }, [paneOrder, arrange]);

  // Posição de cada painel, para as alças ⋮⋮. Medida sempre que o gráfico muda de verdade:
  // painel entrando, saindo ou trocando de lugar (DOM) e redimensionamento.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const container = containerRef.current;
    if (!wrapper || !container) return;
    const measure = () => {
      const handles = handlesRef.current;
      if (!handles) return;
      const base = wrapper.getBoundingClientRect();
      const boxes = [...handles.paneSeries].flatMap(([id, series]): PaneBox[] => {
        const element = series.getPane().getHTMLElement();
        if (!element) return [];
        const rect = element.getBoundingClientRect();
        return [{ id, index: series.getPane().paneIndex(), top: rect.top - base.top, height: rect.height }];
      });
      boxes.sort((a, b) => a.index - b.index);
      setPaneBoxes((prev) => (sameBoxes(prev, boxes) ? prev : boxes));
    };
    measureRef.current = measure;
    const resize = new ResizeObserver(measure);
    resize.observe(container);
    const mutation = new MutationObserver(() => {
      // Painéis novos também precisam ser observados (eles mudam de altura ao arrastar o separador).
      container.querySelectorAll("td").forEach((cell) => resize.observe(cell));
      measure();
    });
    mutation.observe(container, { childList: true, subtree: true });
    const frame = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutation.disconnect();
      measureRef.current = null;
    };
  }, []);

  // Regra das 4 semanas: canal de entrada em degraus (máxima e mínima) e, na versão não
  // contínua, o canal de saída pontilhado.
  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles || !bars || !fourWeekSystem) return;
    const { entry, exit } = fourWeekSystem;
    // O último booleano diz se o valor aparece no eixo (só no canal de entrada).
    const specs: [(number | null)[], string, LineStyle, boolean][] = [
      [entry.upper, theme.down, LineStyle.Solid, true],
      [entry.lower, theme.up, LineStyle.Solid, true],
    ];
    if (exit && fourWeek.exitWeeks !== null) {
      specs.push([exit.upper, theme.drawings.muted, LineStyle.Dotted, false], [exit.lower, theme.drawings.muted, LineStyle.Dotted, false]);
    }
    const lines = specs.map(([values, color, lineStyle, showValue]) => {
      const line = handles.chart.addSeries(
        LineSeries,
        {
          color,
          lineWidth: 1,
          lineStyle,
          lineType: LineType.WithSteps,
          priceLineVisible: false,
          lastValueVisible: showValue,
          crosshairMarkerVisible: false,
        },
        pricePaneIndex(handles),
      );
      line.setData(
        bars.map((b, i) => {
          const value = values[i];
          return value === null ? { time: b.time as UTCTimestamp } : { time: b.time as UTCTimestamp, value };
        }),
      );
      return line;
    });
    return () => {
      const alive = handlesRef.current?.candles.getPane().getSeries() ?? [];
      lines.forEach((line) => {
        if (alive.includes(line)) handles.chart.removeSeries(line);
      });
    };
  }, [bars, fourWeekSystem, fourWeek.exitWeeks, theme]);

  // Bandas de Bollinger: bandas de cima e de baixo e a média central tracejada, numa cor neutra.
  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles || !bars || !bands) return;
    const lines = (
      [
        [bands.upper, LineStyle.Solid, true],
        [bands.middle, LineStyle.Dashed, false],
        [bands.lower, LineStyle.Solid, true],
      ] as const
    ).map(([values, lineStyle, showValue]) => {
      const line = handles.chart.addSeries(
        LineSeries,
        {
          color: theme.drawings.muted,
          lineWidth: 1,
          lineStyle,
          priceLineVisible: false,
          lastValueVisible: showValue,
          crosshairMarkerVisible: false,
        },
        pricePaneIndex(handles),
      );
      line.setData(
        bars.map((b, i) => {
          const value = values[i];
          return value === null ? { time: b.time as UTCTimestamp } : { time: b.time as UTCTimestamp, value };
        }),
      );
      return line;
    });
    return () => {
      const alive = handlesRef.current?.candles.getPane().getSeries() ?? [];
      lines.forEach((line) => {
        if (alive.includes(line)) handles.chart.removeSeries(line);
      });
    };
  }, [bars, bands, theme]);

  // Interesse aberto (futuros): painel próprio, criado só quando há dados, em degraus porque o
  // relatório da CFTC é semanal.
  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles || !bars || !openInterest || openInterest.values.length !== bars.length) return;
    const series = addPaneSeries(handles, "openInterest", LineSeries, {
      color: theme.drawings.primary,
      lineWidth: 2,
      lineType: LineType.WithSteps,
      priceFormat: { type: "volume" },
      priceLineVisible: false,
    });
    series.setData(
      bars.map((b, i) => {
        const value = openInterest.values[i];
        return value === null ? { time: b.time as UTCTimestamp } : { time: b.time as UTCTimestamp, value };
      }),
    );
    arrange();
    return () => {
      removePaneSeries(handles, "openInterest", series);
      arrange();
    };
  }, [bars, openInterest, theme, arrange]);

  // Linha de momentum: painel próprio, com a linha zero e os cruzamentos dela (Murphy, cap. 10).
  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles || !bars || !momentumPeriod || !momentumValues) return;
    const series = addPaneSeries(handles, "momentum", LineSeries, {
      color: theme.momentum,
      lineWidth: 2,
      priceLineVisible: false,
    });
    series.createPriceLine({ price: 0, color: theme.drawings.muted, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: false });
    series.setData(
      bars.map((b, i) => {
        const value = momentumValues[i];
        return value === null ? { time: b.time as UTCTimestamp } : { time: b.time as UTCTimestamp, value };
      }),
    );
    // Só setas: a linha cruza o zero com frequência, e as datas ficam no painel de leitura.
    createSeriesMarkers(
      series,
      showMomentumSignals
        ? zeroCrossings(momentumValues).map(
            (c): SeriesMarker<Time> => ({
              time: bars[c.index].time as UTCTimestamp,
              position: c.dir === "up" ? "belowBar" : "aboveBar",
              shape: c.dir === "up" ? "arrowUp" : "arrowDown",
              color: c.dir === "up" ? theme.up : theme.down,
            }),
          )
        : [],
    );
    arrange();
    return () => {
      removePaneSeries(handles, "momentum", series);
      arrange();
    };
  }, [bars, momentumPeriod, momentumValues, showMomentumSignals, theme, t, arrange]);

  // Histograma da diferença entre duas médias: verde acima de zero, vermelho abaixo, e mais
  // claro quando a diferença encolhe (médias se aproximando).
  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles || !bars || !maOscillator || !maOscillatorVisible) return;
    const { diff } = maOscillator;
    const series = addPaneSeries(handles, "maOscillator", HistogramSeries, {
      priceLineVisible: false,
    });
    series.createPriceLine({ price: 0, color: theme.drawings.muted, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: false });
    series.setData(
      bars.map((b, i) => {
        const value = diff[i];
        const time = b.time as UTCTimestamp;
        if (value === null) return { time };
        const color = value >= 0 ? theme.up : theme.down;
        // Sufixo de opacidade no hex: barras de diferença diminuindo ficam claras.
        return { time, value, color: isWidening(diff, i) === false ? `${color}66` : color };
      }),
    );
    arrange();
    return () => {
      removePaneSeries(handles, "maOscillator", series);
      arrange();
    };
  }, [bars, maOscillator, maOscillatorVisible, theme, t, arrange]);

  // IFR de Wilder: escala fixa de 0 a 100, linhas de 70, 50 e 30, e setas nas saídas das zonas
  // (círculos nos failure swings).
  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles || !bars || !rsiPeriod || !rsiValues) return;
    const series = addPaneSeries(handles, "rsi", LineSeries, {
      color: theme.rsi,
      lineWidth: 2,
      priceLineVisible: false,
      autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }),
    });
    // Só 70 e 30 ganham etiqueta no eixo; a de 50 encostaria no valor atual.
    (
      [
        [OVERBOUGHT, LineStyle.Dashed, true],
        [50, LineStyle.Dotted, false],
        [OVERSOLD, LineStyle.Dashed, true],
      ] as const
    ).forEach(([price, lineStyle, axisLabelVisible]) =>
      series.createPriceLine({ price, color: theme.drawings.muted, lineWidth: 1, lineStyle, axisLabelVisible }),
    );
    series.setData(
      bars.map((b, i) => {
        const value = rsiValues[i];
        return value === null ? { time: b.time as UTCTimestamp } : { time: b.time as UTCTimestamp, value };
      }),
    );
    createSeriesMarkers(
      series,
      showRsiSignals
        ? [...zoneExits(rsiValues), ...failureSwings(rsiValues)]
            .sort((a, b) => a.index - b.index)
            .map(
              (s): SeriesMarker<Time> => ({
                time: bars[s.index].time as UTCTimestamp,
                position: s.kind === "buy" ? "belowBar" : "aboveBar",
                shape: s.type === "failure" ? "circle" : s.kind === "buy" ? "arrowUp" : "arrowDown",
                color: s.kind === "buy" ? theme.up : theme.down,
              }),
            )
        : [],
    );
    arrange();
    return () => {
      removePaneSeries(handles, "rsi", series);
      arrange();
    };
  }, [bars, rsiPeriod, rsiValues, showRsiSignals, theme, arrange]);

  // Estocástico lento: %K e %D num painel de 0 a 100, linhas de 80, 50 e 20, e setas nos
  // cruzamentos do %K com o %D nas zonas extremas (os sinais de Murphy).
  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles || !bars || !stochasticPeriod || !stochasticLines) return;
    const fixedScale = () => ({ priceRange: { minValue: 0, maxValue: 100 } });
    const k = addPaneSeries(handles, "stochastic", LineSeries, {
      color: theme.stochastic.k,
      lineWidth: 2,
      priceLineVisible: false,
      autoscaleInfoProvider: fixedScale,
    });
    const d = handles.chart.addSeries(
      LineSeries,
      { color: theme.stochastic.d, lineWidth: 1, priceLineVisible: false, crosshairMarkerVisible: false, autoscaleInfoProvider: fixedScale },
      k.getPane().paneIndex(),
    );
    (
      [
        [STOCH_OVERBOUGHT, LineStyle.Dashed, true],
        [50, LineStyle.Dotted, false],
        [STOCH_OVERSOLD, LineStyle.Dashed, true],
      ] as const
    ).forEach(([price, lineStyle, axisLabelVisible]) =>
      k.createPriceLine({ price, color: theme.drawings.muted, lineWidth: 1, lineStyle, axisLabelVisible }),
    );
    const toData = (values: (number | null)[]) =>
      bars.map((b, i) => {
        const value = values[i];
        return value === null ? { time: b.time as UTCTimestamp } : { time: b.time as UTCTimestamp, value };
      });
    k.setData(toData(stochasticLines.k));
    d.setData(toData(stochasticLines.d));
    createSeriesMarkers(
      k,
      showStochasticSignals
        ? stochasticCrosses(stochasticLines).flatMap((c): SeriesMarker<Time>[] =>
            c.signal
              ? [
                  {
                    time: bars[c.index].time as UTCTimestamp,
                    position: c.signal === "buy" ? "belowBar" : "aboveBar",
                    shape: c.signal === "buy" ? "arrowUp" : "arrowDown",
                    color: c.signal === "buy" ? theme.up : theme.down,
                  },
                ]
              : [],
          )
        : [],
    );
    arrange();
    return () => {
      // O %D sai primeiro: o painel só é removido quando fica vazio (junto com o %K).
      if (isAlive(handles.chart, d)) handles.chart.removeSeries(d);
      removePaneSeries(handles, "stochastic", k);
      arrange();
    };
  }, [bars, stochasticPeriod, stochasticLines, showStochasticSignals, theme, arrange]);

  // %R de Williams: escala fixa de −100 a 0, linhas de −20, −50 e −80, e setas nas saídas das zonas.
  useEffect(() => {
    const handles = handlesRef.current;
    if (!handles || !bars || !williamsPeriod || !williamsValues) return;
    const series = addPaneSeries(handles, "williamsR", LineSeries, {
      color: theme.williamsR,
      lineWidth: 2,
      priceLineVisible: false,
      autoscaleInfoProvider: () => ({ priceRange: { minValue: -100, maxValue: 0 } }),
    });
    (
      [
        [WILLIAMS_OVERBOUGHT, LineStyle.Dashed, true],
        [-50, LineStyle.Dotted, false],
        [WILLIAMS_OVERSOLD, LineStyle.Dashed, true],
      ] as const
    ).forEach(([price, lineStyle, axisLabelVisible]) =>
      series.createPriceLine({ price, color: theme.drawings.muted, lineWidth: 1, lineStyle, axisLabelVisible }),
    );
    series.setData(
      bars.map((b, i) => {
        const value = williamsValues[i];
        return value === null ? { time: b.time as UTCTimestamp } : { time: b.time as UTCTimestamp, value };
      }),
    );
    createSeriesMarkers(
      series,
      showWilliamsSignals
        ? williamsExits(williamsValues).map(
            (s): SeriesMarker<Time> => ({
              time: bars[s.index].time as UTCTimestamp,
              position: s.kind === "buy" ? "belowBar" : "aboveBar",
              shape: s.kind === "buy" ? "arrowUp" : "arrowDown",
              color: s.kind === "buy" ? theme.up : theme.down,
            }),
          )
        : [],
    );
    arrange();
    return () => {
      removePaneSeries(handles, "williamsR", series);
      arrange();
    };
  }, [bars, williamsPeriod, williamsValues, showWilliamsSignals, theme, arrange]);

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
        text: t.chart.series.divergence,
      }),
    );
    const mk = t.chart.markers;
    const crossStyle: Record<
      CrossSignal["kind"],
      { position: "aboveBar" | "belowBar"; shape: "arrowUp" | "arrowDown" | "circle"; color: string; text: string }
    > = {
      buy: { position: "belowBar", shape: "arrowUp", color: theme.up, text: mk.buy },
      sell: { position: "aboveBar", shape: "arrowDown", color: theme.down, text: mk.sell },
      "buy-alert": { position: "belowBar", shape: "circle", color: theme.up, text: mk.alert },
      "sell-alert": { position: "aboveBar", shape: "circle", color: theme.down, text: mk.alert },
    };
    const crossMarkers = (showCrossSignals ? crossSignals : []).map(
      (signal): SeriesMarker<Time> => ({ time: time(signal.index), ...crossStyle[signal.kind] }),
    );
    const envelopeMarkers = (showEnvelopeSignals ? envelopeSignals : []).map((signal: EnvelopeSignal): SeriesMarker<Time> => {
      if (signal.kind === "buy") return { time: time(signal.index), position: "belowBar", shape: "arrowUp", color: theme.up, text: mk.buy };
      if (signal.kind === "sell") return { time: time(signal.index), position: "aboveBar", shape: "arrowDown", color: theme.down, text: mk.sell };
      return {
        time: time(signal.index),
        position: signal.line === "upper" ? "aboveBar" : "belowBar",
        shape: "circle",
        color: theme.drawings.target,
        text: mk.takeProfit,
      };
    });
    const weekTag = fmt(mk.weeks, { n: fourWeek.entryWeeks });
    const fourWeekMarkers = (showFourWeekSignals && fourWeekSystem ? fourWeekSystem.state.signals : []).map(
      (signal): SeriesMarker<Time> =>
        signal.kind === "buy"
          ? { time: time(signal.index), position: "belowBar", shape: "arrowUp", color: theme.up, text: `${mk.buy} ${weekTag}` }
          : signal.kind === "sell"
            ? { time: time(signal.index), position: "aboveBar", shape: "arrowDown", color: theme.down, text: `${mk.sell} ${weekTag}` }
            : { time: time(signal.index), position: "aboveBar", shape: "circle", color: theme.drawings.target, text: mk.exit },
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
      [...divergenceMarkers, ...crossMarkers, ...envelopeMarkers, ...fourWeekMarkers, ...exampleMarkers].sort(
        (a, b) => (a.time as number) - (b.time as number),
      ),
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
      segment(pricePaneIndex(handles), colorOf(d), [d.from, d.priceFrom], [d.to, d.priceTo]),
      segment(paneIndexOf(handles, "obv"), colorOf(d), [d.from, d.obvFrom], [d.to, d.obvTo]),
    ]);
    return () => {
      // Se o gráfico já foi desmontado, as séries foram junto.
      if (handlesRef.current) segments.forEach((s) => handles.chart.removeSeries(s));
    };
  }, [
    bars,
    divergences,
    showDivergences,
    theme,
    resolvedExample,
    crossSignals,
    showCrossSignals,
    envelopeSignals,
    showEnvelopeSignals,
    fourWeekSystem,
    showFourWeekSignals,
    fourWeek.entryWeeks,
    t,
  ]);

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

  // Nome das séries de cada painel, na cor da linha (legenda no canto do painel).
  const legends: Partial<Record<PaneId, LegendItem[]>> = {
    price: [
      ...averageLines.map(({ ma }) => ({ label: maLabel(ma, t.ma.short), color: theme.movingAverages[ma.slot] })),
      ...(bands ? [{ label: t.ma.bollinger, color: theme.drawings.muted }] : []),
      ...(fourWeekSystem
        ? [
            { label: fmt(t.chart.markers.channelHigh, { n: fourWeek.entryWeeks }), color: theme.down },
            { label: fmt(t.chart.markers.channelLow, { n: fourWeek.entryWeeks }), color: theme.up },
          ]
        : []),
    ],
    volume: [{ label: t.chart.series.volume, color: theme.text }],
    obv: [{ label: t.chart.series.obv, color: theme.drawings.target }],
    openInterest: [{ label: t.chart.series.openInterest, color: theme.drawings.primary }],
    momentum: momentumPeriod ? [{ label: fmt(t.chart.series.momentum, { n: momentumPeriod }), color: theme.momentum }] : [],
    rsi: rsiPeriod ? [{ label: fmt(t.chart.series.rsi, { n: rsiPeriod }), color: theme.rsi }] : [],
    williamsR: williamsPeriod ? [{ label: fmt(t.chart.series.williamsR, { n: williamsPeriod }), color: theme.williamsR }] : [],
    stochastic: stochasticPeriod
      ? [
          { label: fmt(t.chart.series.stochK, { n: stochasticPeriod }), color: theme.stochastic.k },
          { label: t.chart.series.stochD, color: theme.stochastic.d },
        ]
      : [],
    maOscillator: maOscillator
      ? [
          {
            label: fmt(t.chart.series.maOscillator, {
              fast: maLabel(maOscillator.fast, t.ma.short),
              slow: maLabel(maOscillator.slow, t.ma.short),
            }),
            color: theme.up,
          },
        ]
      : [],
  };

  return (
    <section aria-label={fmt(t.chart.label, { symbol })} className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">
          {t.chart.title} <span className="font-normal text-muted">· {t.chart.intervals[rangeSpec(range).interval]}</span>
          {updatedAt !== null && !loading && (
            <span className="font-normal text-muted" title={t.chart.updatedHint}>
              {" "}
              {fmt(t.chart.updated, { time: new Date(updatedAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) })}
            </span>
          )}
        </h2>
        <div role="group" aria-label={t.chart.period} className="flex flex-wrap items-center gap-1">
          {RANGE_KEYS.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
              className={`rounded-md px-2 py-1 text-xs font-medium ${range === r ? "bg-foreground text-background" : "text-muted hover:bg-border/60"}`}
            >
              {t.chart.ranges[r]}
            </button>
          ))}
          <CustomRangeInput key={range} range={range} onChange={setRange} />
        </div>
      </header>

      {example && (
        <div role="status" className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-target/40 bg-target/10 p-3 text-sm">
          <span className="min-w-0 flex-1">
            <strong className="text-target">{fmt(t.chart.example, { name: example.name })}</strong> {example.example.description}
            {bars && resolvedExample.drawings.length < (example.example.drawings?.length ?? 0) && (
              <span className="text-muted">{t.chart.exampleOutside}</span>
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
              {t.chart.copyDrawings}
            </button>
          )}
          <button type="button" onClick={onCloseExample} className="text-xs font-medium text-muted hover:text-foreground">
            {t.chart.closeExample}
          </button>
        </div>
      )}

      <MovingAverageBar
        averages={averages}
        onChange={setAverages}
        barCount={bars && !loading ? bars.length + (warmup?.length ?? 0) : null}
        colors={theme.movingAverages}
        bollinger={bollingerOn}
        onBollingerChange={setBollingerOn}
        fourWeek={fourWeek}
        onFourWeekChange={setFourWeek}
        momentum={momentumPeriod}
        onMomentumChange={setMomentumPeriod}
        rsi={rsiPeriod}
        onRsiChange={setRsiPeriod}
        stochastic={stochasticPeriod}
        onStochasticChange={setStochasticPeriod}
        williamsR={williamsPeriod}
        onWilliamsRChange={setWilliamsPeriod}
      />

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
          if (window.confirm(fmt(t.chart.confirmClear, { count: drawings.length, symbol }))) {
            setDrawings([]);
            setSelectedId(null);
          }
        }}
      />

      {/* Os painéis opcionais (interesse aberto, momentum) ganham altura própria, sem espremer o preço. */}
      <div className="mt-2 flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[11px] text-muted">
        <span>{t.panes.hint}</span>
        {!isDefaultPaneOrder(paneOrder) && (
          <button type="button" onClick={() => setPaneOrder(DEFAULT_PANE_ORDER)} className="font-medium text-accent hover:underline">
            {t.panes.reset}
          </button>
        )}
      </div>
      <div aria-hidden className="relative mt-1 h-5">
        <div
          ref={topDateRef}
          className="invisible absolute top-0 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[11px] font-medium leading-4 text-background tabular-nums"
        />
      </div>
      <div
        ref={wrapperRef}
        className={`relative ${CHART_HEIGHT[(openInterest ? 1 : 0) + (momentumPeriod ? 1 : 0) + (showMaOscillator ? 1 : 0) + (rsiPeriod ? 1 : 0) + (stochasticPeriod ? 1 : 0) + (williamsPeriod ? 1 : 0)]}`}
      >
        <div ref={containerRef} className={`h-full w-full ${tool ? "cursor-crosshair" : ""}`} />
        <PaneHandles
          boxes={paneBoxes}
          legends={legends}
          onMove={(id, to) => setPaneOrder((order) => movePane(order, openPanes(), id, to))}
          onStep={(id, delta) =>
            setPaneOrder((order) => {
              const present = openPanes();
              return movePane(order, present, id, visiblePanes(order, present).indexOf(id) + delta);
            })
          }
        />
        {loading && (
          <div role="status" className="absolute inset-0 flex items-center justify-center bg-surface/60 text-sm text-muted">
            {t.chart.loading}
          </div>
        )}
        {history?.error && history.key === key && (
          <div role="alert" className="absolute inset-x-0 top-0 rounded-lg bg-negative/10 p-3 text-sm text-negative">
            {history.error}
          </div>
        )}
      </div>
      {bars && bars.length > 0 && !loading && (
        <CrossSignalPanel
          bars={bars}
          averages={crossLines.map((l) => l.ma)}
          lastValues={crossLines.map((l) => l.values[l.values.length - 1] ?? null)}
          signals={crossSignals}
          intraday={isIntraday(range)}
          show={showCrossSignals}
          onShowChange={setShowCrossSignals}
        />
      )}
      {bars && bars.length > 0 && !loading && envelopeSource && (
        <EnvelopeSignalPanel
          bars={bars}
          average={envelopeSource.ma}
          percent={envelopeSource.percent}
          signals={envelopeSignals}
          regime={envelopeRegime(envelopeSource.values, bars.length - 1, envelopeSource.ma.period, envelopeSource.percent)}
          intraday={isIntraday(range)}
          show={showEnvelopeSignals}
          onShowChange={setShowEnvelopeSignals}
        />
      )}
      {bars && bars.length > 0 && !loading && fourWeek.enabled && (
        <FourWeekPanel
          bars={bars}
          settings={fourWeek}
          system={fourWeekSystem}
          show={showFourWeekSignals}
          onShowChange={setShowFourWeekSignals}
        />
      )}
      {bars && bars.length > 0 && !loading && bollingerOn && (
        <BollingerPanel bars={bars} reading={bollingerReading} intraday={isIntraday(range)} />
      )}
      {bars && bars.length > 0 && !loading && maOscillator && (
        <MaOscillatorPanel
          bars={bars}
          fast={maLabel(maOscillator.fast, t.ma.short)}
          slow={maLabel(maOscillator.slow, t.ma.short)}
          reading={maOscillatorReading}
          intraday={isIntraday(range)}
          show={maOscillatorVisible}
          onShowChange={setMaOscillatorVisible}
        />
      )}
      {bars && bars.length > 0 && !loading && williamsPeriod && (
        <WilliamsRPanel
          bars={bars}
          period={williamsPeriod}
          reading={williamsReading}
          intraday={isIntraday(range)}
          show={showWilliamsSignals}
          onShowChange={setShowWilliamsSignals}
        />
      )}
      {bars && bars.length > 0 && !loading && stochasticPeriod && (
        <StochasticPanel
          bars={bars}
          period={stochasticPeriod}
          reading={stochasticReading}
          intraday={isIntraday(range)}
          show={showStochasticSignals}
          onShowChange={setShowStochasticSignals}
        />
      )}
      {bars && bars.length > 0 && !loading && rsiPeriod && (
        <RsiPanel
          bars={bars}
          period={rsiPeriod}
          reading={rsiReading}
          intraday={isIntraday(range)}
          show={showRsiSignals}
          onShowChange={setShowRsiSignals}
        />
      )}
      {bars && bars.length > 0 && !loading && momentumPeriod && (
        <MomentumPanel
          bars={bars}
          period={momentumPeriod}
          reading={momentumReading}
          intraday={isIntraday(range)}
          show={showMomentumSignals}
          onShowChange={setShowMomentumSignals}
        />
      )}
      {bars && bars.length > 0 && (
        <DivergencePanel
          bars={bars}
          divergences={divergences}
          show={showDivergences}
          onShowChange={setShowDivergences}
        />
      )}
      <OpenInterestNote symbol={symbol} range={range} bars={bars ?? []} series={openInterest} loading={loading} />
    </section>
  );
}
