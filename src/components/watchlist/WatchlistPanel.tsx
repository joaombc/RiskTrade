"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  MAX_TAG_LENGTH,
  normalizeTag,
  SCENARIO_TAGS,
  SORT_LABELS,
  sortEntries,
  type SortKey,
  type WatchlistEntry,
  type WatchlistQuote,
} from "@/lib/watchlist";
import { Sparkline } from "./Sparkline";
import { useWatchlist, watchlistActions } from "./useWatchlist";

const REFRESH_MS = 60_000;

interface QuotesState {
  key: string;
  bySymbol: Record<string, WatchlistQuote>;
  error: string | null;
}

function formatPrice(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency, maximumFractionDigits: value < 1 ? 4 : 2 }).format(value);
  } catch {
    return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  }
}

const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

function useWatchlistQuotes(symbols: string[]): QuotesState | null {
  const key = [...symbols].sort().join(",");
  const [state, setState] = useState<QuotesState | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/watchlist?symbols=${encodeURIComponent(key)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Falha ao atualizar a watchlist.");
        const bySymbol = Object.fromEntries((data.quotes as WatchlistQuote[]).map((q) => [q.symbol, q]));
        if (!cancelled) setState({ key, bySymbol, error: null });
      } catch (err) {
        // Mantém as últimas cotações conhecidas e só sinaliza o erro.
        if (!cancelled) {
          setState((prev) => ({ key, bySymbol: prev?.bySymbol ?? {}, error: err instanceof Error ? err.message : String(err) }));
        }
      }
    }

    load();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [key]);

  return state;
}

interface Props {
  activeSymbol: string | null;
  onSelect: (symbol: string) => void;
}

export function WatchlistPanel({ activeSymbol, onSelect }: Props) {
  const entries = useWatchlist();
  const quotes = useWatchlistQuotes(entries.map((e) => e.symbol));
  const [sort, setSort] = useState<SortKey>("change");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const sortId = useId();

  const usedTags = useMemo(
    () => [...new Set(entries.flatMap((e) => e.tags))].sort((a, b) => a.localeCompare(b)),
    [entries],
  );
  // Se a etiqueta filtrada deixou de existir, o filtro deixa de valer.
  const activeFilter = tagFilter && usedTags.includes(tagFilter) ? tagFilter : null;
  const bySymbol = quotes?.bySymbol ?? {};
  const visible = sortEntries(
    activeFilter ? entries.filter((e) => e.tags.includes(activeFilter)) : entries,
    bySymbol,
    sort,
  );

  return (
    <aside aria-label="Favoritos" className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">
          Favoritos <span className="font-normal text-muted">({entries.length})</span>
        </h2>
        {entries.length > 1 && (
          <>
            <label htmlFor={sortId} className="sr-only">
              Ordenar por
            </label>
            <select
              id={sortId}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-xs"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABELS[k]}
                </option>
              ))}
            </select>
          </>
        )}
      </header>

      {usedTags.length > 0 && (
        <div role="group" aria-label="Filtrar por etiqueta" className="flex flex-wrap gap-1">
          {[null, ...usedTags].map((tag) => (
            <button
              key={tag ?? "__all__"}
              type="button"
              aria-pressed={activeFilter === tag}
              onClick={() => setTagFilter(tag)}
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${activeFilter === tag ? "bg-accent text-white" : "bg-border/60 text-muted hover:bg-border"}`}
            >
              {tag ?? "Todas"}
            </button>
          ))}
        </div>
      )}

      {quotes?.error && <p role="alert" className="text-xs text-negative">{quotes.error}</p>}

      {entries.length === 0 ? (
        <p className="text-sm text-muted">
          Nenhum favorito ainda. Use a estrela <span aria-hidden>☆</span> no painel do ativo para acompanhá-lo aqui.
        </p>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {visible.map((entry) => (
            <WatchlistRow
              key={entry.symbol}
              entry={entry}
              quote={bySymbol[entry.symbol]}
              loading={!quotes}
              active={entry.symbol === activeSymbol}
              editing={editing === entry.symbol}
              onSelect={() => onSelect(entry.symbol)}
              onToggleEditing={() => setEditing((cur) => (cur === entry.symbol ? null : entry.symbol))}
            />
          ))}
        </ul>
      )}
    </aside>
  );
}

interface RowProps {
  entry: WatchlistEntry;
  quote: WatchlistQuote | undefined;
  loading: boolean;
  active: boolean;
  editing: boolean;
  onSelect: () => void;
  onToggleEditing: () => void;
}

function WatchlistRow({ entry, quote, loading, active, editing, onSelect, onToggleEditing }: RowProps) {
  const up = (quote?.changePercent ?? 0) >= 0;

  return (
    <li className={`rounded-xl px-2 py-2 ${active ? "bg-accent/10" : ""}`}>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-sm font-semibold">{entry.symbol}</div>
            <div className="truncate text-xs text-muted">{entry.name}</div>
          </div>
          {quote ? (
            <>
              <Sparkline values={quote.sparkline} />
              <div className="w-24 shrink-0 text-right tabular-nums">
                <div className="text-sm font-medium">{formatPrice(quote.price, quote.currency)}</div>
                <div className={`text-xs font-semibold ${up ? "text-positive" : "text-negative"}`}>
                  {up ? "+" : ""}
                  {quote.changePercent.toFixed(2)}%
                </div>
                <div className="text-[11px] text-muted">Vol {compact.format(quote.volume)}</div>
              </div>
            </>
          ) : (
            <span className="text-xs text-muted">{loading ? "Carregando…" : "Sem cotação"}</span>
          )}
        </button>
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            aria-expanded={editing}
            aria-label={`Etiquetas de ${entry.symbol}`}
            title="Etiquetas de cenário"
            onClick={onToggleEditing}
            className={`rounded p-1 hover:bg-border/60 ${editing ? "text-accent" : "text-muted"}`}
          >
            <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round">
              <path d="M3 3h6.5L17 10.5 10.5 17 3 9.5V3Z" />
              <circle cx="6.5" cy="6.5" r="1.2" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={`Remover ${entry.symbol} dos favoritos`}
            title="Remover dos favoritos"
            onClick={() => watchlistActions.remove(entry.symbol)}
            className="rounded p-1 text-muted hover:bg-negative/10 hover:text-negative"
          >
            <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="m5 5 10 10M15 5 5 15" />
            </svg>
          </button>
        </div>
      </div>

      {entry.tags.length > 0 && !editing && (
        <ul aria-label="Etiquetas" className="mt-1.5 flex flex-wrap gap-1">
          {entry.tags.map((tag) => (
            <li key={tag} className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
              {tag}
            </li>
          ))}
        </ul>
      )}

      {editing && <TagEditor entry={entry} />}
    </li>
  );
}

function TagEditor({ entry }: { entry: WatchlistEntry }) {
  const [draft, setDraft] = useState("");
  const inputId = useId();
  const has = (tag: string) => entry.tags.some((t) => t.toLowerCase() === tag.toLowerCase());
  // Etiquetas livres já aplicadas aparecem junto das sugestões para poderem ser removidas.
  const options = [...SCENARIO_TAGS, ...entry.tags.filter((t) => !SCENARIO_TAGS.some((s) => s.toLowerCase() === t.toLowerCase()))];

  return (
    <div className="mt-2 rounded-lg border border-border p-2">
      <div role="group" aria-label={`Etiquetas de cenário para ${entry.symbol}`} className="flex flex-wrap gap-1">
        {options.map((tag) => (
          <button
            key={tag}
            type="button"
            aria-pressed={has(tag)}
            onClick={() => watchlistActions.toggleTag(entry.symbol, tag)}
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${has(tag) ? "bg-accent text-white" : "bg-border/60 text-muted hover:bg-border"}`}
          >
            {tag}
          </button>
        ))}
      </div>
      <form
        className="mt-2 flex gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          const tag = normalizeTag(draft);
          if (tag && !has(tag)) watchlistActions.toggleTag(entry.symbol, tag);
          setDraft("");
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Nova etiqueta
        </label>
        <input
          id={inputId}
          value={draft}
          maxLength={MAX_TAG_LENGTH}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Nova etiqueta…"
          className="min-w-0 flex-1 rounded-md border border-border bg-transparent px-2 py-1 text-xs outline-none focus:border-accent"
        />
        <button type="submit" className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-white disabled:opacity-40" disabled={!normalizeTag(draft)}>
          Adicionar
        </button>
      </form>
    </div>
  );
}
