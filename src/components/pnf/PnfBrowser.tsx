"use client";

import { useEffect, useId, useRef, useState } from "react";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { searchPnfPatterns } from "@/lib/pnfPatterns/localize";
import type { PnfGroup, PnfPattern } from "@/lib/pnfPatterns/patterns";
import { useHashSlug } from "../glossary/useHashSlug";
import { PnfDiagram } from "./PnfDiagram";

const SIDE_CLASS = { bottom: "bg-positive/15 text-positive", top: "bg-negative/15 text-negative" } as const;
const GROUPS: PnfGroup[] = ["reversal", "signal"];

/** Fundo e topo lado a lado, com o nome de cada versão. */
function Variants({ pattern, large = false }: { pattern: PnfPattern; large?: boolean }) {
  const { pnfUi: u } = useI18n().t;
  return (
    <>
      {pattern.variants.map((v) => (
        // Os dois diagramas encolhem juntos para caber lado a lado.
        <figure key={v.side} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
          <PnfDiagram variant={v} large={large} />
          <figcaption className={`text-center ${large ? "text-xs" : "text-[11px]"}`}>
            {/* Reversões: fundo/topo; sinais: compra/venda. */}
            <span className={`mr-1 rounded-full px-1.5 py-0.5 font-medium ${SIDE_CLASS[v.side]}`}>
              {pattern.group === "reversal" ? u[v.side] : v.side === "bottom" ? u.buy : u.sell}
            </span>
            <span className="text-muted">{v.name}</span>
          </figcaption>
        </figure>
      ))}
    </>
  );
}

/** Card compacto; o título, o diagrama e "Ver detalhes" abrem o card ampliado (#slug). */
function PnfCard({ pattern }: { pattern: PnfPattern }) {
  const { pnfUi: u } = useI18n().t;
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <header className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold leading-snug">
          <a href={`#${pattern.slug}`} className="hover:underline">
            {pattern.name}
          </a>
        </h3>
        {/* Em inglês o nome já é o original. */}
        {pattern.englishName !== pattern.name && <p className="text-xs italic text-muted">{pattern.englishName}</p>}
      </header>
      <a
        href={`#${pattern.slug}`}
        aria-label={fmt(u.detailsOf, { name: pattern.name })}
        className="flex items-end justify-center gap-4 rounded-xl border border-border/70 bg-background/60 p-3 transition-colors hover:border-accent/60"
      >
        <Variants pattern={pattern} />
      </a>
      <p className="text-sm leading-relaxed">{pattern.summary}</p>
      <footer className="mt-auto pt-1">
        <a href={`#${pattern.slug}`} className="inline-block rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-border/60">
          {u.details}
        </a>
      </footer>
    </article>
  );
}

/** Card ampliado do padrão. */
function PnfDialog({ pattern, onClose }: { pattern: PnfPattern | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { pnfUi: u } = useI18n().t;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (pattern && !dialog.open) dialog.showModal();
    if (!pattern && dialog.open) dialog.close();
  }, [pattern]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="pnf-dialog-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto max-h-[92vh] w-[min(52rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/60"
    >
      {pattern && (
        <article className="flex flex-col gap-5 p-5 sm:p-7">
          <header className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="pnf-dialog-title" className="text-2xl font-bold tracking-tight">
                {pattern.name}
              </h2>
              {pattern.englishName !== pattern.name && <p className="text-sm italic text-muted">{pattern.englishName}</p>}
            </div>
            <button type="button" onClick={onClose} aria-label={u.close} className="rounded-lg p-2 text-muted hover:bg-border/60 hover:text-foreground">
              <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="m5 5 10 10M15 5 5 15" />
              </svg>
            </button>
          </header>

          <div className="flex items-end justify-center gap-6 rounded-xl border border-border/70 bg-background/60 p-4">
            <Variants pattern={pattern} large />
          </div>
          <p className="-mt-3 text-center text-xs text-muted">{u.contextNote}</p>

          <p className="leading-relaxed">{pattern.summary}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-xl border border-border p-4 sm:col-span-2">
              <h3 className="mb-1.5 text-sm font-semibold">{u.recognize}</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground/90">
                {pattern.recognition.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>
            <section className="rounded-xl border border-border p-4">
              <h3 className="mb-1.5 text-sm font-semibold">{u.market}</h3>
              <p className="text-sm leading-relaxed text-foreground/90">{pattern.psychology}</p>
            </section>
            <section className="rounded-xl border border-border p-4">
              <h3 className="mb-1.5 text-sm font-semibold">{u.confirmation}</h3>
              <p className="text-sm leading-relaxed text-foreground/90">{pattern.confirmation}</p>
            </section>
          </div>

          <footer className="border-t border-border pt-4 text-xs text-muted">{fmt(u.source, { source: pattern.source })}</footer>
        </article>
      )}
    </dialog>
  );
}

/** Recebe os padrões já no idioma da página (montados no servidor). */
export function PnfBrowser({ patterns }: { patterns: PnfPattern[] }) {
  const { pnfUi: u } = useI18n().t;
  const [query, setQuery] = useState("");
  /** Grupo escolhido nos botões de filtro; null = todos. */
  const [groupFilter, setGroupFilter] = useState<PnfGroup | null>(null);
  const inputId = useId();
  const results = searchPnfPatterns(patterns, query).filter((p) => groupFilter === null || p.group === groupFilter);
  const [openSlug, close] = useHashSlug();
  const open = patterns.find((p) => p.slug === openSlug) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <label htmlFor={inputId} className="sr-only">
        {u.searchLabel}
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
          placeholder={u.searchPlaceholder}
          autoComplete="off"
          className="w-full bg-transparent text-base outline-none placeholder:text-muted"
        />
      </div>

      <div role="group" aria-label={u.filter} className="flex flex-wrap items-center gap-1.5 text-xs">
        {([null, ...GROUPS] as const).map((group) => {
          const active = groupFilter === group;
          return (
            <button
              key={group ?? "all"}
              type="button"
              aria-pressed={active}
              onClick={() => setGroupFilter(group)}
              className={`rounded-full px-3 py-1 font-medium ${active ? "bg-accent text-white" : "bg-border/60 text-muted hover:bg-border"}`}
            >
              {group === null ? u.all : group === "reversal" ? u.reversalHeading : u.signalHeading}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-muted" aria-live="polite">
        {results.length === 0 ? u.noResults : fmt(results.length === 1 ? u.countOne : u.countMany, { n: results.length })}
      </p>

      {GROUPS.map((group) => {
        const items = results.filter((p) => p.group === group);
        if (items.length === 0) return null;
        return (
          <section key={group} aria-labelledby={`pnf-${group}`} className="flex flex-col gap-3">
            <div>
              <h3 id={`pnf-${group}`} className="text-lg font-semibold">
                {group === "reversal" ? u.reversalHeading : u.signalHeading}
              </h3>
              <p className="text-sm text-muted">{group === "reversal" ? u.reversalIntro : u.signalIntro}</p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((p) => (
                <PnfCard key={p.slug} pattern={p} />
              ))}
            </div>
          </section>
        );
      })}

      <PnfDialog pattern={open} onClose={close} />
    </div>
  );
}
