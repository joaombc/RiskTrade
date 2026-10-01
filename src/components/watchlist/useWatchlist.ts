import { useSyncExternalStore } from "react";
import { isWatchlistEntry, MAX_WATCHLIST_SIZE, normalizeTag, type WatchlistEntry } from "@/lib/watchlist";

const STORAGE_KEY = "risktrade:watchlist:v1";
const CHANGE_EVENT = "risktrade:watchlist-change";
const EMPTY: WatchlistEntry[] = [];

// O snapshot precisa ser estável entre leituras; só reparseia quando o JSON muda.
let cachedRaw: string | null = null;
let cachedEntries: WatchlistEntry[] = EMPTY;

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): WatchlistEntry[] {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedEntries;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedEntries = Array.isArray(parsed) ? parsed.filter(isWatchlistEntry) : EMPTY;
  } catch {
    cachedEntries = EMPTY;
  }
  return cachedEntries;
}

function subscribe(onChange: () => void) {
  // "storage" mantém abas diferentes sincronizadas; o evento próprio cobre a aba atual.
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function write(update: (entries: WatchlistEntry[]) => WatchlistEntry[]) {
  const next = update(getSnapshot());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage bloqueado: sem persistência, mas também sem quebrar a página.
    cachedRaw = null;
    cachedEntries = next;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export const watchlistActions = {
  toggle(symbol: string, name: string) {
    write((entries) =>
      entries.some((e) => e.symbol === symbol)
        ? entries.filter((e) => e.symbol !== symbol)
        : entries.length >= MAX_WATCHLIST_SIZE
          ? entries
          : [...entries, { symbol, name, tags: [], addedAt: Date.now() }],
    );
  },

  remove(symbol: string) {
    write((entries) => entries.filter((e) => e.symbol !== symbol));
  },

  toggleTag(symbol: string, tag: string) {
    const clean = normalizeTag(tag);
    if (!clean) return;
    write((entries) =>
      entries.map((e) => {
        if (e.symbol !== symbol) return e;
        const has = e.tags.some((t) => t.toLowerCase() === clean.toLowerCase());
        return { ...e, tags: has ? e.tags.filter((t) => t.toLowerCase() !== clean.toLowerCase()) : [...e.tags, clean] };
      }),
    );
  },
};

export function useWatchlist(): WatchlistEntry[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}
