import type { CandleVariant, Ohlc } from "@/lib/candles/types";

const CONTEXT_CANDLES = 4;
const SLOT = 20;
const HEIGHT = 110;
const PAD_Y = 10;

/**
 * Velas da tendência anterior, terminando perto da abertura da primeira vela do padrão.
 * São só ilustrativas: mostram o contexto em que o padrão vale.
 */
export function contextCandles(variant: CandleVariant): Ohlc[] {
  if (variant.context === "none") return [];
  const first = variant.candles[0];
  const range = Math.max(...variant.candles.map((k) => k.h)) - Math.min(...variant.candles.map((k) => k.l));
  // A tendência anterior ocupa cerca de 60% da altura do padrão, para não espremê-lo.
  const step = Math.max(range * 0.15, 3);
  const sign = variant.context === "down" ? 1 : -1;
  return Array.from({ length: CONTEXT_CANDLES }, (_, i) => {
    const o = first.o + sign * (CONTEXT_CANDLES - i) * step;
    const c = first.o + sign * (CONTEXT_CANDLES - 1 - i) * step + sign * step * 0.15;
    return { o, c, h: Math.max(o, c) + step * 0.25, l: Math.min(o, c) - step * 0.25 };
  });
}

/** Desenho das velas de uma versão do padrão, com a tendência anterior apagada. */
export function CandleDiagram({ variant, large = false }: { variant: CandleVariant; large?: boolean }) {
  const context = contextCandles(variant);
  const all = [...context, ...variant.candles];
  // Velas básicas (sem contexto) usam a escala fixa dos dados (0–100), para que um dia curto
  // pareça curto ao lado de um dia longo; os padrões se ajustam às próprias velas.
  const fixed = context.length === 0;
  const max = Math.max(...all.map((k) => k.h), fixed ? 85 : -Infinity);
  const min = Math.min(...all.map((k) => k.l), fixed ? 15 : Infinity);
  const y = (p: number) => PAD_Y + ((max - p) / (max - min || 1)) * (HEIGHT - PAD_Y * 2);
  const width = all.length * SLOT + 10;
  const patternX = 5 + context.length * SLOT;

  return (
    <svg
      role="img"
      aria-label={`${variant.name}: ${variant.candles.length} ${variant.candles.length === 1 ? "vela" : "velas"}`}
      viewBox={`0 0 ${width} ${HEIGHT}`}
      className={large ? "h-48 w-auto max-w-full" : "h-28 w-auto max-w-full"}
    >
      {context.length > 0 && (
        <rect
          x={patternX - 2}
          y={2}
          width={variant.candles.length * SLOT + 4}
          height={HEIGHT - 4}
          rx={4}
          className="fill-accent/10"
        />
      )}
      {all.map((k, i) => {
        const x = 5 + i * SLOT + SLOT / 2;
        const isContext = i < context.length;
        const doji = Math.abs(k.c - k.o) < 0.6;
        const tone = doji ? "text-foreground" : k.c > k.o ? "text-positive" : "text-negative";
        const top = y(Math.max(k.o, k.c));
        const body = Math.max(y(Math.min(k.o, k.c)) - top, 1.2);
        return (
          <g key={i} className={tone} opacity={isContext ? 0.35 : 1}>
            <line x1={x} x2={x} y1={y(k.h)} y2={y(k.l)} stroke="currentColor" strokeWidth={1.4} />
            {doji ? (
              <line x1={x - SLOT * 0.32} x2={x + SLOT * 0.32} y1={top} y2={top} stroke="currentColor" strokeWidth={2} />
            ) : (
              <rect x={x - SLOT * 0.32} y={top} width={SLOT * 0.64} height={body} fill="currentColor" rx={1} />
            )}
          </g>
        );
      })}
    </svg>
  );
}
