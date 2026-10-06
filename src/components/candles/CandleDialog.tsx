"use client";

import { useEffect, useRef } from "react";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { CandlePattern } from "@/lib/candles/types";
import { PatternBadges } from "./CandleCard";
import { CandleDiagram } from "./CandleDiagram";

/** Card ampliado do padrão de candle. */
export function CandleDialog({ pattern, onClose }: { pattern: CandlePattern | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { candleUi: c } = useI18n().t;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (pattern && !dialog.open) dialog.showModal();
    if (!pattern && dialog.open) dialog.close();
  }, [pattern]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="candle-dialog-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto max-h-[92vh] w-[min(52rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/60"
    >
      {pattern && (
        <article className="flex flex-col gap-5 p-5 sm:p-7">
          <header className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <h2 id="candle-dialog-title" className="text-2xl font-bold tracking-tight">
                {pattern.name}
              </h2>
              <p className="text-sm italic text-muted">{pattern.englishName}</p>
              <PatternBadges pattern={pattern} />
            </div>
            <button type="button" onClick={onClose} aria-label={c.close} className="rounded-lg p-2 text-muted hover:bg-border/60 hover:text-foreground">
              <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="m5 5 10 10M15 5 5 15" />
              </svg>
            </button>
          </header>

          <div className="flex flex-wrap items-end justify-center gap-6 rounded-xl border border-border/70 bg-background/60 p-4">
            {pattern.variants.map((v) => (
              <figure key={v.name} className="flex flex-col items-center gap-1.5">
                <CandleDiagram variant={v} large />
                <figcaption className="text-xs text-muted">{v.name}</figcaption>
              </figure>
            ))}
          </div>
          {pattern.kind !== "basic" && (
            <p className="-mt-3 text-center text-xs text-muted">{c.contextNote}</p>
          )}

          <p className="leading-relaxed">{pattern.summary}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-xl border border-border p-4 sm:col-span-2">
              <h3 className="mb-1.5 text-sm font-semibold">{c.recognize}</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground/90">
                {pattern.recognition.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>
            <section className="rounded-xl border border-border p-4">
              <h3 className="mb-1.5 text-sm font-semibold">{c.market}</h3>
              <p className="text-sm leading-relaxed text-foreground/90">{pattern.psychology}</p>
            </section>
            <section className="rounded-xl border border-border p-4">
              <h3 className="mb-1.5 text-sm font-semibold">{c.confirmation}</h3>
              <p className="text-sm leading-relaxed text-foreground/90">{pattern.confirmation}</p>
            </section>
          </div>

          <footer className="border-t border-border pt-4 text-xs text-muted">{fmt(c.source, { source: pattern.source })}</footer>
        </article>
      )}
    </dialog>
  );
}
