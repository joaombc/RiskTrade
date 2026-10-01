"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { SearchResult } from "@/lib/market";

const DEBOUNCE_MS = 250;

interface Props {
  onSelect: (symbol: string) => void;
}

export function AssetSearch({ onSelect }: Props) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = query.trim();
    // Com a busca vazia a lista já fica oculta (showList), então não há o que limpar.
    if (!term) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setResults(data.results);
        setError(null);
        setActive(-1);
      } catch (err) {
        if (controller.signal.aborted) return;
        setResults([]);
        setError(err instanceof Error && err.message ? err.message : "Falha ao buscar ativos.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function choose(symbol: string) {
    setQuery(symbol);
    setOpen(false);
    onSelect(symbol.toUpperCase());
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const picked = active >= 0 ? results[active]?.symbol : query.trim();
      if (picked) choose(picked);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor={`${listId}-input`} className="sr-only">
        Buscar ativo
      </label>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
        <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="9" cy="9" r="6" />
          <path d="m14 14 4 4" strokeLinecap="round" />
        </svg>
        <input
          id={`${listId}-input`}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-opt-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder="Busque por ticker ou empresa — ex: AAPL, PETR4.SA, BTC-USD"
          className="w-full bg-transparent text-base outline-none placeholder:text-muted"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {loading && (
          <span aria-label="Carregando" className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-muted border-t-transparent" />
        )}
      </div>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-xl border border-border bg-surface py-1 shadow-lg"
        >
          {error && <li className="px-4 py-3 text-sm text-negative">{error}</li>}
          {!error && !loading && results.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted">
              Nenhum resultado. Pressione Enter para buscar &quot;{query.trim().toUpperCase()}&quot; diretamente.
            </li>
          )}
          {results.map((r, i) => (
            <li
              key={r.symbol}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(r.symbol)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between gap-4 px-4 py-2.5 ${i === active ? "bg-accent/10" : ""}`}
            >
              <div className="min-w-0">
                <div className="font-mono text-sm font-semibold">{r.symbol}</div>
                <div className="truncate text-sm text-muted">{r.name}</div>
              </div>
              <div className="shrink-0 text-right text-xs text-muted">
                <div>{r.exchange}</div>
                <div>{r.type}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
