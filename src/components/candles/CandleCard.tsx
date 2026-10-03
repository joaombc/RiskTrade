import { BIAS_LABELS, KIND_LABELS, type CandlePattern } from "@/lib/candles/types";
import { CandleDiagram } from "./CandleDiagram";

const BIAS_CLASS = {
  bullish: "bg-positive/15 text-positive",
  bearish: "bg-negative/15 text-negative",
  neutral: "bg-border/60 text-muted",
} as const;

export function PatternBadges({ pattern }: { pattern: CandlePattern }) {
  const biases = [...new Set(pattern.variants.map((v) => v.bias))];
  return (
    <div className="flex flex-wrap gap-1">
      <span className="rounded-full bg-border/60 px-2 py-0.5 text-[11px] font-medium text-muted">{KIND_LABELS[pattern.kind]}</span>
      {pattern.kind !== "basic" &&
        biases.map((b) => (
          <span key={b} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${BIAS_CLASS[b]}`}>
            {BIAS_LABELS[b]}
          </span>
        ))}
      <span className="rounded-full bg-border/60 px-2 py-0.5 text-[11px] font-medium text-muted">
        {pattern.candleCount} {pattern.candleCount === 1 ? "vela" : "velas"}
      </span>
    </div>
  );
}

/** Card compacto; o título, o diagrama e "Ver detalhes" abrem o card ampliado (#slug). */
export function CandleCard({ pattern }: { pattern: CandlePattern }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <header className="flex flex-col gap-1.5">
        <h3 className="text-lg font-semibold leading-snug">
          <a href={`#${pattern.slug}`} className="hover:underline">
            {pattern.name}
          </a>
        </h3>
        <p className="text-xs italic text-muted">{pattern.englishName}</p>
        <PatternBadges pattern={pattern} />
      </header>

      <a
        href={`#${pattern.slug}`}
        aria-label={`Ver detalhes de ${pattern.name}`}
        className="flex flex-wrap items-end justify-center gap-4 rounded-xl border border-border/70 bg-background/60 p-3 transition-colors hover:border-accent/60"
      >
        {pattern.variants.map((v) => (
          <figure key={v.name} className="flex flex-col items-center gap-1">
            <CandleDiagram variant={v} />
            {pattern.variants.length > 1 && <figcaption className="text-[11px] text-muted">{v.name}</figcaption>}
          </figure>
        ))}
      </a>

      <p className="text-sm leading-relaxed">{pattern.summary}</p>

      <footer className="mt-auto pt-1">
        <a href={`#${pattern.slug}`} className="inline-block rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-border/60">
          Ver detalhes
        </a>
      </footer>
    </article>
  );
}
