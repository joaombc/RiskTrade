"use client";

import { MAX_WATCHLIST_SIZE } from "@/lib/watchlist";
import { useWatchlist, watchlistActions } from "./useWatchlist";

export function FavoriteButton({ symbol, name }: { symbol: string; name: string }) {
  const entries = useWatchlist();
  const favorited = entries.some((e) => e.symbol === symbol);
  const full = !favorited && entries.length >= MAX_WATCHLIST_SIZE;
  const label = favorited ? "Remover dos favoritos" : full ? `Limite de ${MAX_WATCHLIST_SIZE} favoritos atingido` : "Adicionar aos favoritos";

  return (
    <button
      type="button"
      aria-pressed={favorited}
      aria-label={label}
      title={label}
      disabled={full}
      onClick={() => watchlistActions.toggle(symbol, name)}
      className={`rounded-full p-1.5 transition-colors hover:bg-border/60 disabled:cursor-not-allowed disabled:opacity-40 ${favorited ? "text-warning" : "text-muted"}`}
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill={favorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round">
        <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
      </svg>
    </button>
  );
}
