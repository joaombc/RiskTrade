"use client";

import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { CandlePattern } from "@/lib/candles/types";
import { CandleDiagram } from "./CandleDiagram";

const BIAS_CLASS = {
  bullish: "bg-positive/15 text-positive",
  bearish: "bg-negative/15 text-negative",
  neutral: "bg-border/60 text-muted",
} as const;

export function PatternBadges({ pattern }: { pattern: CandlePattern }) {
  const { candleUi: c } = useI18n().t;
  const biases = [...new Set(pattern.variants.map((v) => v.bias))];
  return (
    <div className="flex flex-wrap gap-1">
      <span className="rounded-full bg-border/60 px-2 py-0.5 text-[11px] font-medium text-muted">{c.kinds[pattern.kind]}</span>
      {pattern.kind !== "basic" &&
        biases.map((b) => (
          <span key={b} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${BIAS_CLASS[b]}`}>
            {c.bias[b]}
          </span>
        ))}
      <span className="rounded-full bg-border/60 px-2 py-0.5 text-[11px] font-medium text-muted">
        {fmt(pattern.candleCount === 1 ? c.candleOne : c.candleMany, { n: pattern.candleCount })}
      </span>
    </div>
  );
}

/**
 * Card compacto; o título, o diagrama e "Ver detalhes" abrem o card ampliado (#slug). Nas seções de
 * alta e de baixa, `pattern` chega só com as versões daquela direção, e `variantNames` mostra o nome
 * da versão (ex.: "Engolfo de alta").
 */
export function CandleCard({
  pattern,
  variantNames = false,
  heading: Heading = "h3",
}: {
  pattern: CandlePattern;
  variantNames?: boolean;
  /** Nível do título, conforme a seção em que o card está. */
  heading?: "h3" | "h4" | "h5";
}) {
  const { candleUi: c } = useI18n().t;
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <header className="flex flex-col gap-1.5">
        <Heading className="text-lg font-semibold leading-snug">
          <a href={`#${pattern.slug}`} className="hover:underline">
            {pattern.name}
          </a>
        </Heading>
        {/* Em inglês o nome já é o original. */}
        {pattern.englishName !== pattern.name && <p className="text-xs italic text-muted">{pattern.englishName}</p>}
        <PatternBadges pattern={pattern} />
      </header>

      <a
        href={`#${pattern.slug}`}
        aria-label={fmt(c.detailsOf, { name: pattern.name })}
        className="flex flex-wrap items-end justify-center gap-4 rounded-xl border border-border/70 bg-background/60 p-3 transition-colors hover:border-accent/60"
      >
        {pattern.variants.map((v) => (
          <figure key={v.name} className="flex flex-col items-center gap-1">
            <CandleDiagram variant={v} />
            {(variantNames || pattern.variants.length > 1) && <figcaption className="text-[11px] text-muted">{v.name}</figcaption>}
          </figure>
        ))}
      </a>

      <p className="text-sm leading-relaxed">{pattern.summary}</p>

      <footer className="mt-auto pt-1">
        <a href={`#${pattern.slug}`} className="inline-block rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-border/60">
          {c.details}
        </a>
      </footer>
    </article>
  );
}
