"use client";

import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { PnfVariant } from "@/lib/pnfPatterns/patterns";

/**
 * Diagrama esquemático de um padrão de ponto e figura: X em verde e O em vermelho, a tendência
 * anterior apagada e a linha tracejada do rompimento que confirma o padrão.
 */
export function PnfDiagram({ variant, large = false }: { variant: PnfVariant; large?: boolean }) {
  const { pnfUi: u } = useI18n().t;
  const cell = large ? 15 : 12;
  /** Espaço à direita das colunas para o rótulo do rompimento. */
  const label = large ? 64 : 52;
  const levels = variant.columns.flat();
  const low = Math.min(...levels) - 1;
  const high = Math.max(...levels) + 1;
  const columnsWidth = variant.columns.length * cell + 2;
  const width = columnsWidth + label;
  const height = (high - low + 1) * cell;
  const y = (level: number) => (high - level) * cell;
  const inset = cell * 0.2;
  const breakoutY = y(variant.breakout) + cell / 2;

  return (
    <svg role="img" aria-label={fmt(u.diagram, { name: variant.name })} viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" style={{ maxWidth: width }}>
      {variant.columns.map(([from, to], k) => {
        const up = to > from;
        const span = Array.from({ length: Math.abs(to - from) + 1 }, (_, i) => Math.min(from, to) + i);
        return (
          <g key={k} className={up ? "text-positive" : "text-negative"} opacity={k < variant.context ? 0.3 : 1}>
            {span.map((level) => {
              const bx = k * cell + 1;
              const by = y(level);
              return up ? (
                <path
                  key={level}
                  d={`M${bx + inset} ${by + inset}L${bx + cell - inset} ${by + cell - inset}M${bx + cell - inset} ${by + inset}L${bx + inset} ${by + cell - inset}`}
                  stroke="currentColor"
                  strokeWidth={1.4}
                  strokeLinecap="round"
                />
              ) : (
                <circle key={level} cx={bx + cell / 2} cy={by + cell / 2} r={cell / 2 - inset} fill="none" stroke="currentColor" strokeWidth={1.4} />
              );
            })}
          </g>
        );
      })}
      <line x1={0} x2={width} y1={breakoutY} y2={breakoutY} stroke="var(--accent)" strokeWidth={1.2} strokeDasharray="4 3" />
      <text
        x={width}
        y={variant.side === "bottom" ? breakoutY - 3 : breakoutY + 3}
        textAnchor="end"
        dominantBaseline={variant.side === "bottom" ? "auto" : "hanging"}
        fontSize={large ? 10 : 8}
        fill="var(--accent)"
      >
        {u.breakout}
      </text>
    </svg>
  );
}
