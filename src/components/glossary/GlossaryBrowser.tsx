"use client";

import { useId, useState } from "react";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { glossaryDeck } from "@/lib/anki";
import { searchTerms } from "@/lib/glossary/search";
import { CATEGORIES, type Category, type GlossaryTerm } from "@/lib/glossary/types";
import { AnkiDownloadButton } from "../anki/AnkiDownloadButton";
import { GlossaryDiagram } from "./GlossaryDiagram";
import { TermCard } from "./TermCard";
import { TermDialog } from "./TermDialog";
import { useHashSlug } from "./useHashSlug";

/** Recebe os termos já no idioma da página (montados no servidor). */
export function GlossaryBrowser({ terms }: { terms: GlossaryTerm[] }) {
  const { t } = useI18n();
  const g = t.glossary;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const inputId = useId();
  const results = searchTerms(terms, query, category);
  const [openSlug, closeTerm] = useHashSlug();
  // O card ampliado independe do filtro: um link direto (#slug) sempre abre o termo.
  const openTerm = terms.find((t) => t.slug === openSlug) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <label htmlFor={inputId} className="sr-only">
          {g.searchLabel}
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
          <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="9" cy="9" r="6" />
            <path d="m14 14 4 4" strokeLinecap="round" />
          </svg>
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={g.searchPlaceholder}
            autoComplete="off"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted"
          />
        </div>

        <div role="group" aria-label={g.filterLabel} className="flex flex-wrap gap-1.5">
          {[null, ...CATEGORIES].map((c) => (
            <button
              key={c ?? "__all__"}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${category === c ? "bg-accent text-white" : "bg-border/60 text-muted hover:bg-border"}`}
            >
              {c ? g.categories[c] : g.all} <span className="opacity-70">{c ? terms.filter((t) => t.category === c).length : terms.length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted" aria-live="polite">
          {results.length === 0
            ? `${fmt(g.noResults, { query: query.trim() })}${category ? fmt(g.inCategory, { category: g.categories[category] }) : ""}.`
            : fmt(results.length === 1 ? g.countOne : g.countMany, { n: results.length })}
        </p>
        <AnkiDownloadButton
          fileName={t.anki.files.glossary}
          build={(render) => glossaryDeck(terms, (term) => render(<GlossaryDiagram diagram={term.diagram} title={term.name} />), t.anki, (c) => g.categories[c])}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {results.map((term) => (
          <TermCard key={term.slug} term={term} />
        ))}
      </div>

      <TermDialog term={openTerm} onClose={closeTerm} />
    </div>
  );
}
