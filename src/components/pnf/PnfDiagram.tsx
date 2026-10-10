"use client";

import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { PnfVariant } from "@/lib/pnfPatterns/patterns";

/**
 * Diagrama esquemático de um padrão de ponto e figura: X em verde e O em vermelho, a tendência
 * anterior apagada, as linhas do padrão (rompimento, triângulo, 45°) e a caixa do sinal com a
 * etiqueta C (compra) ou V (venda), como no gráfico.
 */
export function PnfDiagram({ variant, large = false }: { variant: PnfVariant; large?: boolean }) {
  const { pnfUi: u } = useI18n().t;
  const cell = large ? 15 : 12;
  /** Espaço à direita das colunas para o rótulo do rompimento. */
  const label = variant.breakout === null ? 4 : large ? 64 : 52;
  const lineLevels = variant.lines.flatMap((l) => [l.from[1], l.to[1]]);
  const levels = [...variant.columns.flat(), ...lineLevels];
  // Duas linhas livres acima e abaixo: é onde ficam as etiquetas C/V.
  const low = Math.floor(Math.min(...levels)) - 2;
  const high = Math.ceil(Math.max(...levels)) + 2;
  const width = variant.columns.length * cell + 2 + label;
  const height = (high - low + 1) * cell;
  const y = (level: number) => (high - level) * cell;
  const cx = (column: number) => column * cell + 1 + cell / 2;
  const cy = (level: number) => y(level) + cell / 2;
  const inset = cell * 0.2;

  const buy = variant.side === "bottom";
  const [signalColumn, signalLevel] = variant.signal;
  const [from, to] = variant.columns[signalColumn];
  // Etiqueta acima do topo da coluna (compra) ou abaixo do fundo (venda).
  const tag = cell * 1.05;
  const tagY = buy ? y(Math.max(from, to)) - tag - 2 : y(Math.min(from, to)) + cell + 2;

  return (
    <svg role="img" aria-label={fmt(u.diagram, { name: variant.name })} viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" style={{ maxWidth: width }}>
      {variant.columns.map(([a, b], k) => {
        const up = b > a;
        const span = Array.from({ length: Math.abs(b - a) + 1 }, (_, i) => Math.min(a, b) + i);
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

      {/* Linhas do padrão: lados do triângulo, linhas de 45°. */}
      {variant.lines.map((l, k) => (
        <line key={k} x1={cx(l.from[0])} y1={cy(l.from[1])} x2={cx(l.to[0])} y2={cy(l.to[1])} stroke="var(--muted)" strokeWidth={1.2} />
      ))}

      {variant.breakout !== null && (
        <>
          <line x1={0} x2={width} y1={y(variant.breakout) + cell / 2} y2={y(variant.breakout) + cell / 2} stroke="var(--accent)" strokeWidth={1.2} strokeDasharray="4 3" />
          <text
            x={width}
            y={buy ? y(variant.breakout) + cell / 2 - 3 : y(variant.breakout) + cell / 2 + 3}
            textAnchor="end"
            dominantBaseline={buy ? "auto" : "hanging"}
            fontSize={large ? 10 : 8}
            fill="var(--accent)"
          >
            {u.breakout}
          </text>
        </>
      )}

      {/* Ponto do sinal: caixa destacada e etiqueta C/V. */}
      <g className={buy ? "text-positive" : "text-negative"}>
        <title>{buy ? u.buy : u.sell}</title>
        <rect
          x={signalColumn * cell + 1.5}
          y={y(signalLevel) + 0.5}
          width={cell - 1}
          height={cell - 1}
          rx={2}
          fill="currentColor"
          fillOpacity={0.2}
          stroke="currentColor"
          strokeWidth={1.4}
        />
        <rect x={cx(signalColumn) - tag / 2} y={tagY} width={tag} height={tag} rx={3} fill="currentColor" />
        <text
          x={cx(signalColumn)}
          y={tagY + tag / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={tag * 0.7}
          fontWeight={700}
          fill="var(--background)"
        >
          {buy ? u.buyLetter : u.sellLetter}
        </text>
      </g>
    </svg>
  );
}
