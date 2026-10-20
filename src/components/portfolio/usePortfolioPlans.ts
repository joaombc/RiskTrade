import { useEffect, useState } from "react";
import type { PlanItem } from "@/app/api/plan/route";
import type { Currency } from "@/lib/portfolioAccount";

/** Atualização dos planos e das posições, como as cotações. */
const REFRESH_MS = 60_000;

export interface PortfolioPlans {
  items: Record<string, PlanItem>;
  checkedAt: number | null;
  failed: boolean;
  /** Câmbio de cada moeda para a da conta. */
  rates: Record<string, number>;
}

/**
 * Planos dos ativos (e candles dos que têm posição aberta), a cada minuto com a aba visível. Uma
 * busca só para o painel do plano e o das posições.
 */
export function usePortfolioPlans(symbols: string[], withBars: string[], currency: Currency, currencies: string[] = []): PortfolioPlans {
  const [state, setState] = useState<PortfolioPlans>({ items: {}, checkedAt: null, failed: false, rates: {} });
  const symbolsKey = symbols.join(",");
  const barsKey = withBars.join(",");
  const currenciesKey = [...new Set(currencies)].sort().join(",");

  useEffect(() => {
    if (!symbolsKey) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const query = new URLSearchParams({ symbols: symbolsKey, currency, withBars: barsKey, currencies: currenciesKey });
        const res = await fetch(`/api/plan?${query}`, { signal: controller.signal });
        if (!res.ok) throw new Error();
        const data: { items: PlanItem[]; rates: Record<string, number>; checkedAt: string } = await res.json();
        setState({
          items: Object.fromEntries(data.items.map((i) => [i.symbol, i])),
          rates: data.rates,
          checkedAt: Date.parse(data.checkedAt),
          failed: false,
        });
      } catch {
        if (!controller.signal.aborted) setState((s) => ({ ...s, failed: true }));
      }
    };
    load();
    const id = setInterval(() => document.visibilityState === "visible" && load(), REFRESH_MS);
    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, [symbolsKey, barsKey, currency, currenciesKey]);

  return state;
}
