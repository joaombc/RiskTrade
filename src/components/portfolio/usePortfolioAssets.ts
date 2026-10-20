import { useSyncExternalStore } from "react";
import { inferGroup, isPortfolioAsset, MAX_PORTFOLIO_ASSETS, type AssetGroup, type AssetInfo, type PortfolioAsset } from "@/lib/portfolioAssets";

const STORAGE_KEY = "risktrade:portfolio:assets:v1";
const CHANGE_EVENT = "risktrade:portfolio-assets-change";
const EMPTY: PortfolioAsset[] = [];

// O snapshot precisa ser estável entre leituras; só reparseia quando o JSON muda.
let cachedRaw: string | null = null;
let cachedAssets: PortfolioAsset[] = EMPTY;

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): PortfolioAsset[] {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedAssets;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedAssets = Array.isArray(parsed) ? parsed.filter(isPortfolioAsset) : EMPTY;
  } catch {
    cachedAssets = EMPTY;
  }
  return cachedAssets;
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

function write(update: (assets: PortfolioAsset[]) => PortfolioAsset[]) {
  const next = update(getSnapshot());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage bloqueado: sem persistência, mas também sem quebrar a página.
    cachedRaw = null;
    cachedAssets = next;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export const portfolioAssetActions = {
  /** Acrescenta os ativos que ainda não estão na lista, com o grupo deduzido, até o limite. */
  add(infos: AssetInfo[]) {
    write((assets) => {
      const fresh = infos
        .filter((info) => !assets.some((a) => a.symbol === info.symbol))
        .map((info, k) => ({ symbol: info.symbol, name: info.name, currency: info.currency, group: inferGroup(info), addedAt: Date.now() + k }));
      return [...assets, ...fresh].slice(0, MAX_PORTFOLIO_ASSETS);
    });
  },

  remove(symbol: string) {
    write((assets) => assets.filter((a) => a.symbol !== symbol));
  },

  setGroup(symbol: string, group: AssetGroup) {
    write((assets) => assets.map((a) => (a.symbol === symbol ? { ...a, group } : a)));
  },
};

export function usePortfolioAssets(): PortfolioAsset[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}
