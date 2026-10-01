import Link from "next/link";
import { TOOLS } from "@/lib/drawings/types";
import type { GlossaryTerm } from "@/lib/glossary/types";
import { GlossaryDiagram } from "./GlossaryDiagram";

/** Link do painel que abre o ativo do exemplo já com o desenho aplicado. */
export function exampleHref(term: GlossaryTerm): string | null {
  if (!term.example) return null;
  const params = new URLSearchParams({ ativo: term.example.symbol, periodo: term.example.range, exemplo: term.slug });
  return `/?${params}`;
}

export function TermCard({ term }: { term: GlossaryTerm }) {
  const href = exampleHref(term);
  return (
    <article id={term.slug} className="flex scroll-mt-6 flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">
          <a href={`#${term.slug}`} className="hover:underline">
            {term.name}
          </a>
        </h2>
        <span className="rounded-full bg-border/60 px-2 py-0.5 text-[11px] font-medium text-muted">{term.category}</span>
      </header>

      <div className="rounded-xl border border-border/70 bg-background/60 p-2">
        <GlossaryDiagram diagram={term.diagram} title={term.name} />
      </div>

      <p className="text-sm leading-relaxed">{term.definition}</p>

      <div className="rounded-lg bg-accent/10 p-3 text-sm leading-relaxed">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">Regra de validação</div>
        {term.validation}
      </div>

      {(href || term.tool) && (
        <footer className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-sm">
          {href && (
            <Link href={href} className="rounded-lg bg-accent px-3 py-1.5 font-medium text-white hover:opacity-90">
              Ver no gráfico real
            </Link>
          )}
          {term.tool && (
            <span className="text-xs text-muted">
              Ferramenta no gráfico: <strong className="text-foreground">{TOOLS[term.tool].label}</strong>
            </span>
          )}
        </footer>
      )}
    </article>
  );
}
