import { TOOLS, type Bar, type Drawing } from "../drawings/types";
import type { ExampleAnchor, TermExample } from "./types";

export interface ResolvedExample {
  drawings: Drawing[];
  markers: { time: number; text: string; position: "aboveBar" | "belowBar" }[];
}

const isoDate = (time: number) => new Date(time * 1000).toISOString().slice(0, 10);

/** Índice do candle da data (ou do primeiro pregão depois dela, se a data caiu em feriado). */
function barIndex(bars: Bar[], date: string): number {
  return bars.findIndex((b) => isoDate(b.time) >= date);
}

function resolveAnchor(bars: Bar[], anchor: ExampleAnchor) {
  const i = barIndex(bars, anchor.date);
  if (i < 0) return null;
  const bar = bars[i];
  return { time: bar.time, price: typeof anchor.price === "number" ? anchor.price : bar[anchor.price] };
}

/**
 * Converte as datas do exemplo em pontos sobre os candles carregados. Desenhos com alguma
 * data fora do período são descartados, e não deformados.
 */
export function resolveExample(slug: string, example: TermExample, bars: Bar[]): ResolvedExample {
  const drawings = (example.drawings ?? []).flatMap((d, i): Drawing[] => {
    const points = d.points.map((p) => resolveAnchor(bars, p));
    if (points.some((p) => p === null)) return [];
    return [
      {
        id: `example:${slug}:${i}`,
        kind: d.kind,
        points: points as NonNullable<(typeof points)[number]>[],
        options: { ...TOOLS[d.kind].defaults },
      },
    ];
  });

  const markers = (example.markers ?? []).flatMap((m) => {
    const i = barIndex(bars, m.date);
    return i < 0 ? [] : [{ time: bars[i].time, text: m.text, position: m.position }];
  });

  return { drawings, markers };
}
