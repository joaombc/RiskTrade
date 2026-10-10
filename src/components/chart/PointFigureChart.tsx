"use client";

import { useLayoutEffect, useRef } from "react";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { Bar } from "@/lib/drawings/types";
import { PF_MAX_ROWS, pfRows, stepBoxSize, type PFColumn, type PointFigure } from "@/lib/pointFigure";

interface Props {
  bars: Bar[];
  pf: PointFigure;
  /** Tamanho padrão da caixa para o ativo (botão "padrão"). */
  defaultBox: number;
  onBoxChange: (box: number | null) => void;
  intraday: boolean;
}

/** Altura útil do desenho: as caixas encolhem (até MIN_CELL) para caber nela. */
const PLOT_HEIGHT = 500;
const MIN_CELL = 8;
const MAX_CELL = 22;
const AXIS_WIDTH = 64;
/** Linhas livres acima e abaixo, para as setas dos sinais e as letras C/V. */
const PAD_ROWS = 3;

/** Ponto e figura (Murphy, cap. 11) em SVG: X em verde, O em vermelho, meses nas caixas e setas nos sinais. */
export function PointFigureChart({ bars, pf, defaultBox, onBoxChange, intraday }: Props) {
  const { t, locale } = useI18n();
  const p = t.pointFigure;
  const scrollRef = useRef<HTMLDivElement>(null);
  const { box, columns, signals } = pf;

  const decimals = box < 0.01 ? 4 : box < 1 ? 2 : box % 1 === 0 ? 0 : 2;
  const price = (v: number) => v.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const dateFormat = new Intl.DateTimeFormat(
    locale,
    intraday ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit", year: "2-digit" },
  );
  const dateOf = (i: number) => dateFormat.format(new Date(bars[i].time * 1000));

  const smaller = stepBoxSize(box, -1);
  const larger = stepBoxSize(box, 1);
  const canShrink = smaller < box && pfRows(bars, smaller) <= PF_MAX_ROWS;
  const canGrow = larger > box;

  // Sempre começa no fim (as colunas mais recentes), como o gráfico de candles.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [pf]);

  const stepButton = "rounded-md border border-border px-2 py-0.5 font-semibold hover:bg-border/60 disabled:opacity-40";
  const controls = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
      <span className="font-semibold">{p.box}</span>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onBoxChange(smaller)} disabled={!canShrink} aria-label={p.shrink} title={p.shrink} className={stepButton}>
          −
        </button>
        <span className="min-w-14 text-center font-mono tabular-nums">{price(box)}</span>
        <button type="button" onClick={() => onBoxChange(larger)} disabled={!canGrow} aria-label={p.grow} title={p.grow} className={stepButton}>
          +
        </button>
      </div>
      {box !== defaultBox && (
        <button type="button" onClick={() => onBoxChange(null)} className="text-muted hover:text-foreground hover:underline">
          {fmt(p.reset, { box: price(defaultBox) })}
        </button>
      )}
      <span className="text-muted">{fmt(p.reversal, { n: pf.reversal })}</span>
    </div>
  );

  if (columns.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {controls}
        <p className="rounded-lg border border-border p-6 text-center text-sm text-muted">{p.empty}</p>
      </div>
    );
  }

  const low = Math.min(...columns.map((c) => c.low)) - PAD_ROWS;
  const high = Math.max(...columns.map((c) => c.high)) + PAD_ROWS;
  const rows = high - low + 1;
  const cell = Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(PLOT_HEIGHT / rows)));
  const plotWidth = columns.length * cell;
  const height = rows * cell;
  /** Topo (y) da linha de um nível. */
  const y = (level: number) => (high - level) * cell;
  const x = (column: number) => column * cell;
  // Rótulos de preço a cada `step` linhas, para ficarem a pelo menos 16px um do outro.
  const step = Math.max(1, Math.ceil(16 / cell));
  const axisLevels = Array.from({ length: rows }, (_, k) => low + k).filter((level) => level % step === 0);
  const lastClose = bars[bars.length - 1].close;
  const lastY = y(lastClose / box) + cell / 2;
  const signalAt = new Set(signals.map((s) => `${s.column}:${s.level}`));
  const inset = Math.max(1.5, cell * 0.18);
  const stroke = cell >= 14 ? 1.6 : 1.2;

  const columnTitle = (c: PFColumn) =>
    fmt(c.kind === "X" ? p.columnX : p.columnO, {
      boxes: c.high - c.low + 1,
      from: price((c.kind === "X" ? c.low : c.high) * box),
      to: price((c.kind === "X" ? c.high : c.low) * box),
      start: dateOf(c.boxes[0].index),
      end: dateOf(c.boxes[c.boxes.length - 1].index),
    });

  return (
    <div className="flex flex-col gap-3">
      {controls}
      {/* A rolagem vertical vale para tudo; a horizontal, só para as colunas: o eixo de preço fica fixo à direita. */}
      <div className="flex max-h-[560px] overflow-y-auto rounded-lg border border-border">
        <div ref={scrollRef} className="min-w-0 flex-1 overflow-x-auto">
          <svg
            width={plotWidth}
            height={height}
            role="img"
            aria-label={fmt(p.aria, { columns: columns.length, signals: signals.length })}
            className="ml-auto block"
          >
            {/* Grade das caixas. */}
            {Array.from({ length: rows + 1 }, (_, k) => (
              <line key={`r${k}`} x1={0} x2={plotWidth} y1={k * cell} y2={k * cell} stroke="var(--border)" strokeWidth={0.5} />
            ))}
            {Array.from({ length: columns.length + 1 }, (_, k) => (
              <line key={`c${k}`} x1={k * cell} x2={k * cell} y1={0} y2={height} stroke="var(--border)" strokeWidth={0.5} />
            ))}

            {/* Último fechamento. */}
            <line x1={0} x2={plotWidth} y1={lastY} y2={lastY} stroke="var(--muted)" strokeDasharray="3 3" strokeWidth={1} />

            {columns.map((c, ci) => (
              <g key={ci} className={c.kind === "X" ? "text-positive" : "text-negative"}>
                <title>{columnTitle(c)}</title>
                {/* Área da coluna inteira, para a dica aparecer em qualquer ponto dela. */}
                <rect x={x(ci)} y={y(c.high)} width={cell} height={(c.high - c.low + 1) * cell} fill="transparent" />
                {c.boxes.map((b) => {
                  const bx = x(ci);
                  const by = y(b.level);
                  return (
                    <g key={b.level}>
                      {signalAt.has(`${ci}:${b.level}`) && (
                        <rect
                          x={bx + 0.5}
                          y={by + 0.5}
                          width={cell - 1}
                          height={cell - 1}
                          rx={2}
                          fill="currentColor"
                          fillOpacity={0.18}
                          stroke="currentColor"
                          strokeWidth={1.2}
                        />
                      )}
                      {b.month ? (
                        <text
                          x={bx + cell / 2}
                          y={by + cell / 2}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={Math.max(7, cell * 0.72)}
                          fontWeight={700}
                          fill="currentColor"
                        >
                          {b.month}
                        </text>
                      ) : c.kind === "X" ? (
                        <path
                          d={`M${bx + inset} ${by + inset}L${bx + cell - inset} ${by + cell - inset}M${bx + cell - inset} ${by + inset}L${bx + inset} ${by + cell - inset}`}
                          stroke="currentColor"
                          strokeWidth={stroke}
                          strokeLinecap="round"
                        />
                      ) : (
                        <circle cx={bx + cell / 2} cy={by + cell / 2} r={cell / 2 - inset} fill="none" stroke="currentColor" strokeWidth={stroke} />
                      )}
                    </g>
                  );
                })}
              </g>
            ))}

            {/* Setas dos sinais com a letra (C/V): compra acima do topo da coluna, venda abaixo do fundo. */}
            {signals.map((s) => {
              const c = columns[s.column];
              const cx = x(s.column) + cell / 2;
              const size = Math.max(4, cell * 0.4);
              const label = fmt(s.kind === "buy" ? p.buyAt : p.sellAt, { price: price(s.level * box), date: dateOf(s.index) });
              const base = s.kind === "buy" ? y(c.high) - 2 : y(c.low) + cell + 2;
              const tip = s.kind === "buy" ? base - size * 1.4 : base + size * 1.4;
              // Letra numa etiqueta preenchida, para não se confundir com a marca de mês (A, B, C) das caixas.
              const tag = Math.max(12, cell * 0.9);
              const tagY = s.kind === "buy" ? tip - 1 - tag : tip + 1;
              return (
                <g key={`s${s.column}`} className={s.kind === "buy" ? "fill-positive" : "fill-negative"}>
                  <title>{label}</title>
                  <path d={`M${cx} ${tip}L${cx - size} ${base}L${cx + size} ${base}Z`} />
                  <rect x={cx - tag / 2} y={tagY} width={tag} height={tag} rx={3} />
                  <text
                    x={cx}
                    y={tagY + tag / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={tag * 0.7}
                    fontWeight={700}
                    fill="var(--background)"
                  >
                    {s.kind === "buy" ? p.buyLetter : p.sellLetter}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        {/* Eixo de preço. */}
        <svg width={AXIS_WIDTH} height={height} aria-hidden className="block shrink-0 border-l border-border">
          {axisLevels.map((level) => (
            <text key={level} x={6} y={y(level) + cell / 2} dominantBaseline="central" fontSize={10} fill="var(--muted)" className="tabular-nums">
              {price(level * box)}
            </text>
          ))}
          <rect x={2} y={lastY - 8} width={AXIS_WIDTH - 4} height={16} rx={3} fill="var(--foreground)" />
          <text x={6} y={lastY} dominantBaseline="central" fontSize={10} fontWeight={600} fill="var(--background)" className="tabular-nums">
            {lastClose.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </text>
        </svg>
      </div>
      <p className="text-[11px] text-muted">{p.legend}</p>
    </div>
  );
}
