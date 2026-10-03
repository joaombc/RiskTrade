"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { TOOLS } from "@/lib/drawings/types";
import type { GlossaryTerm } from "@/lib/glossary/types";
import { GlossaryDiagram } from "./GlossaryDiagram";
import { exampleHref } from "./TermCard";
import { useBananaMode } from "./useBananaMode";

const SECTIONS = [
  { key: "market", title: "O que está acontecendo no mercado" },
  { key: "volume", title: "Volume" },
  { key: "trading", title: "Como operar" },
  { key: "pitfalls", title: "Armadilhas" },
] as const;

/** Card ampliado do termo: diagrama maior e as seções detalhadas. */
export function TermDialog({ term, onClose }: { term: GlossaryTerm | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [bananaMode, setBananaMode] = useBananaMode();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (term && !dialog.open) dialog.showModal();
    if (!term && dialog.open) dialog.close();
  }, [term]);

  const href = term ? exampleHref(term) : null;
  const banana = bananaMode ? term?.banana : undefined;

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
              <span className="rounded-full bg-border/60 px-2 py-0.5 text-[11px] font-medium text-muted">{term.category}</span>
              <h2 id="term-dialog-title" className="mt-2 text-2xl font-bold tracking-tight">
                {term.name}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {term.banana && (
                <button
                  type="button"
                  aria-pressed={bananaMode}
                  onClick={() => setBananaMode(!bananaMode)}
                  title={bananaMode ? "Voltar para a explicação normal" : "Explicar com bananas"}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    bananaMode
                      ? "border-warning/50 bg-warning/15 text-warning"
                      : "border-border text-muted hover:bg-border/60 hover:text-foreground"
                  }`}
                >
                  <span aria-hidden>🍌</span>
                  Modo banana
                  <span
                    aria-hidden
                    className={`relative ml-0.5 h-4 w-7 rounded-full transition-colors ${bananaMode ? "bg-warning" : "bg-border"}`}
                  >
                    <span
                      className={`absolute top-0.5 h-3 w-3 rounded-full bg-surface shadow transition-all ${bananaMode ? "left-3.5" : "left-0.5"}`}
                    />
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="rounded-lg p-2 text-muted hover:bg-border/60 hover:text-foreground"
              >
                <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <path d="m5 5 10 10M15 5 5 15" />
                </svg>
              </button>
            </div>
          </header>

          <div className="grid gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <div className="rounded-xl border border-border/70 bg-background/60 p-3">
              <GlossaryDiagram diagram={term.diagram} title={term.name} />
            </div>
            {banana ? (
              <div className="flex flex-col gap-3">
                <p className="leading-relaxed">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-warning">Na feira</span>
                  {banana.scene}
                </p>
                <p className="leading-relaxed">{banana.concept}</p>
                <div className="rounded-lg bg-warning/10 p-3 text-sm leading-relaxed">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-warning">Regra da feira</div>
                  {banana.rule}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="leading-relaxed">{term.definition}</p>
                <div className="rounded-lg bg-accent/10 p-3 text-sm leading-relaxed">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">Regra de validação</div>
                  {term.validation}
                </div>
              </div>
            )}
          </div>

          {banana && (
            <section className="rounded-xl border border-warning/40 bg-warning/5 p-4">
              <h3 className="mb-1.5 text-sm font-semibold">🍌 Moral da história</h3>
              <p className="text-sm font-medium leading-relaxed">{banana.moral}</p>
              <p className="mt-3 text-xs text-muted">
                A analogia simplifica o conceito. Desligue o modo banana para ver a explicação técnica completa: mercado, volume,
                como operar e armadilhas.
              </p>
            </section>
          )}

          {!banana && term.details && (
            <div className="grid gap-4 sm:grid-cols-2">
              {SECTIONS.map(({ key, title }) => (
                <section key={key} className="rounded-xl border border-border p-4">
                  <h3 className="mb-1.5 text-sm font-semibold">{title}</h3>
                  <p className="text-sm leading-relaxed text-foreground/90">{term.details![key]}</p>
                </section>
              ))}
            </div>
          )}

          <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-sm">
            {href && term.example && (
              <Link href={href} className="rounded-lg bg-accent px-3 py-1.5 font-medium text-white hover:opacity-90">
                Ver no gráfico real
              </Link>
            )}
            {term.tool && (
              <span className="text-xs text-muted">
                Ferramenta no gráfico: <strong className="text-foreground">{TOOLS[term.tool].label}</strong>
              </span>
            )}
            {term.details && <span className="ml-auto text-xs text-muted">Fonte: {term.details.source}</span>}
          </footer>
        </article>
      )}
    </dialog>
  );
}
