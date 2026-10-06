"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { GlossaryTerm } from "@/lib/glossary/types";
import { GlossaryDiagram } from "./GlossaryDiagram";
import { exampleHref } from "./TermCard";

const SECTIONS = ["market", "volume", "trading", "pitfalls"] as const;

/** Card ampliado do termo: diagrama maior e as seções detalhadas. */
export function TermDialog({ term, onClose }: { term: GlossaryTerm | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (term && !dialog.open) dialog.showModal();
    if (!term && dialog.open) dialog.close();
  }, [term]);

  const { t, href: localized } = useI18n();
  const g = t.glossary;
  const example = term ? exampleHref(term) : null;
  const href = example ? localized(example) : null;

  return (
    <dialog
      ref={ref}
      aria-labelledby="term-dialog-title"
      onClose={onClose}
      // Clique no fundo escurecido (fora do conteúdo) fecha.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto max-h-[92vh] w-[min(56rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/60"
    >
      {term && (
        <article className="flex flex-col gap-5 p-5 sm:p-7">
          <header className="flex items-start justify-between gap-4">
            <div>
              <span className="rounded-full bg-border/60 px-2 py-0.5 text-[11px] font-medium text-muted">{g.categories[term.category]}</span>
              <h2 id="term-dialog-title" className="mt-2 text-2xl font-bold tracking-tight">
                {term.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={g.close}
              className="rounded-lg p-2 text-muted hover:bg-border/60 hover:text-foreground"
            >
              <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="m5 5 10 10M15 5 5 15" />
              </svg>
            </button>
          </header>

          <div className="grid gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="rounded-xl border border-border/70 bg-background/60 p-3">
              <GlossaryDiagram diagram={term.diagram} title={term.name} labels={{ diagram: g.diagram, volume: g.volume }} />
            </div>
            <div className="flex flex-col gap-3">
              <p className="leading-relaxed">{term.definition}</p>
              <div className="rounded-lg bg-accent/10 p-3 text-sm leading-relaxed">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">{g.validation}</div>
                {term.validation}
              </div>
            </div>
          </div>

          {term.details && (
            <div className="grid gap-4 sm:grid-cols-2">
              {SECTIONS.map((key) => (
                <section key={key} className="rounded-xl border border-border p-4">
                  <h3 className="mb-1.5 text-sm font-semibold">{g.sections[key]}</h3>
                  <p className="text-sm leading-relaxed text-foreground/90">{term.details![key]}</p>
                </section>
              ))}
            </div>
          )}

          <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-sm">
            {href && term.example && (
              <Link href={href} className="rounded-lg bg-accent px-3 py-1.5 font-medium text-white hover:opacity-90">
                {g.viewOnChart}
              </Link>
            )}
            {term.tool && (
              <span className="text-xs text-muted">
                {g.chartTool} <strong className="text-foreground">{t.drawings.tools[term.tool].label}</strong>
              </span>
            )}
            {term.details && <span className="ml-auto text-xs text-muted">{fmt(g.source, { source: term.details.source })}</span>}
          </footer>
        </article>
      )}
    </dialog>
  );
}
