"use client";

import { useMemo } from "react";
import { isClosed } from "@/lib/positions";
import { PlanPanel } from "./PlanPanel";
import { PositionsPanel } from "./PositionsPanel";
import { useAccount } from "./useAccount";
import { usePortfolioAssets } from "./usePortfolioAssets";
import { usePortfolioPlans } from "./usePortfolioPlans";
import { usePositions } from "./usePositions";

/** Quanto já está investido nas posições abertas, na moeda da conta (no total e por ativo). */
export interface Exposure {
  total: number;
  bySymbol: Record<string, number>;
}

/** Plano dos ativos e posições abertas, com uma busca só a cada minuto. */
export function PortfolioLive() {
  const assets = usePortfolioAssets();
  const positions = usePositions();
  const account = useAccount();
  const open = positions.filter((p) => !isClosed(p));
  const symbols = [...new Set([...assets.map((a) => a.symbol), ...open.map((p) => p.symbol)])];
  const withBars = [...new Set(open.map((p) => p.symbol))];
  const plans = usePortfolioPlans(symbols, withBars, account.currency);

  const exposure = useMemo<Exposure>(() => {
    const bySymbol: Record<string, number> = {};
    for (const p of positions) {
      const item = plans.items[p.symbol];
      const price = item?.plan?.close;
      for (const u of p.units) {
        if (u.exit) continue;
        // Sem cotação ou câmbio ainda: o preço de entrada, sem conversão (melhor que ignorar a posição).
        bySymbol[p.symbol] = (bySymbol[p.symbol] ?? 0) + u.quantity * (price ?? u.entry) * (item?.fx ?? 1);
      }
    }
    return { total: Object.values(bySymbol).reduce((a, b) => a + b, 0), bySymbol };
  }, [positions, plans.items]);

  return (
    <>
      <PlanPanel plans={plans} exposure={exposure} />
      <PositionsPanel plans={plans} positions={positions} />
    </>
  );
}
