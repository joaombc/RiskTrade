"use client";

import { useMemo } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { isClosed } from "@/lib/positions";
import { AlertsBell, describeAlert } from "./AlertsBell";
import { PlanPanel } from "./PlanPanel";
import { PositionsPanel } from "./PositionsPanel";
import { SummaryPanel } from "./SummaryPanel";
import { useAccount } from "./useAccount";
import { usePortfolioAlerts } from "./usePortfolioAlerts";
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
  const { t, locale } = useI18n();
  const assets = usePortfolioAssets();
  const positions = usePositions();
  const account = useAccount();
  const open = positions.filter((p) => !isClosed(p));
  const symbols = [...new Set([...assets.map((a) => a.symbol), ...open.map((p) => p.symbol)])];
  const withBars = [...new Set(open.map((p) => p.symbol))];
  const plans = usePortfolioPlans(
    symbols,
    withBars,
    account.currency,
    positions.map((p) => p.currency),
  );

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

  const alerts = usePortfolioAlerts(plans, positions, account, (alert) => describeAlert(alert, t, locale));

  return (
    <>
      {/* O sino acompanha a rolagem: fica à vista sobre o plano e as posições. */}
      <div className="sticky top-4 z-10 flex justify-end">
        <AlertsBell
          alerts={alerts.alerts}
          unread={alerts.unread}
          notify={alerts.notify}
          onNotifyChange={alerts.setNotify}
          onClose={alerts.markAllRead}
          onClear={alerts.clear}
        />
      </div>
      <PlanPanel plans={plans} exposure={exposure} />
      <PositionsPanel plans={plans} positions={positions} />
      <SummaryPanel plans={plans} positions={positions} />
    </>
  );
}
