import { useEffect, useState, useSyncExternalStore } from "react";
import { mergeAlerts, planAlerts, planMemo, positionAlerts, type PlanMemo, type PortfolioAlert } from "@/lib/portfolioAlerts";
import type { Account } from "@/lib/portfolioAccount";
import { isClosed, trackPosition, type Position } from "@/lib/positions";
import { finalAction } from "@/lib/tradePlan";
import { loadAllowShort } from "./PlanPanel";
import type { PortfolioPlans } from "./usePortfolioPlans";

export interface StoredAlert extends PortfolioAlert {
  /** Quando o app percebeu o alerta (ms). */
  detectedAt: number;
  read: boolean;
}

interface AlertStore {
  history: StoredAlert[];
  /** Último plano de cada ativo, para comparar com a leitura seguinte. */
  plans: Record<string, PlanMemo>;
  /** Notificação do navegador ligada. */
  notify: boolean;
}

const STORAGE_KEY = "risktrade:portfolio:alerts:v1";
/** Eventos da gestão mais antigos que isso já passaram (não viram alerta ao abrir a página). */
const RECENT_SECONDS = 3 * 86_400;
const EMPTY: AlertStore = { history: [], plans: {}, notify: false };
const noSubscription = () => () => {};
const useHydrated = () => useSyncExternalStore(noSubscription, () => true, () => false);

function loadStore(): AlertStore {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!raw || !Array.isArray(raw.history)) return EMPTY;
    return { history: raw.history, plans: raw.plans ?? {}, notify: raw.notify === true };
  } catch {
    return EMPTY;
  }
}

function saveStore(store: AlertStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage bloqueado: os alertas valem só nesta sessão.
  }
}

/**
 * Alertas da carteira: a cada leitura dos planos, compara com a anterior e com a gestão das
 * posições, guarda os novos no histórico e avisa pela notificação do navegador, se ligada.
 */
export function usePortfolioAlerts(
  plans: PortfolioPlans,
  positions: Position[],
  account: Account,
  describe: (alert: PortfolioAlert) => string,
) {
  const [store, setStore] = useState<AlertStore | null>(null);
  // O histórico salvo aparece logo, sem esperar a primeira leitura.
  const hydrated = useHydrated();
  if (hydrated && store === null) setStore(loadStore());
  const current = store ?? EMPTY;

  useEffect(() => {
    if (plans.checkedAt === null) return;
    const current = loadStore();
    const now = Math.floor(plans.checkedAt / 1000);
    const allowShort = loadAllowShort();
    const fresh: PortfolioAlert[] = [];
    const memos = { ...current.plans };
    for (const [symbol, item] of Object.entries(plans.items)) {
      if (!item.plan) continue;
      const action = finalAction(item.plan, account.limits.minRewardRisk, allowShort).action;
      fresh.push(...planAlerts(symbol, current.plans[symbol], item.plan, action, now));
      memos[symbol] = planMemo(item.plan, action);
    }
    for (const position of positions) {
      if (isClosed(position)) continue;
      const bars = plans.items[position.symbol]?.bars;
      const tracking = bars ? trackPosition(position, bars) : null;
      if (tracking) fresh.push(...positionAlerts(position, tracking, now - RECENT_SECONDS, now));
    }
    const stamped = fresh.map((a) => ({ ...a, detectedAt: plans.checkedAt!, read: false }));
    const { history, added } = mergeAlerts(current.history, stamped);
    const next = { ...current, history, plans: memos };
    saveStore(next);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- o histórico vem do localStorage, atualizado a cada leitura
    setStore(next);
    if (next.notify && added.length && typeof Notification !== "undefined" && Notification.permission === "granted") {
      for (const alert of added) new Notification(`RiskTrade · ${alert.symbol}`, { body: describe(alert), tag: alert.id });
    }
    // Só a cada leitura nova: posições e conta entram no cálculo, mas não disparam outra comparação.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans.checkedAt]);

  const update = (change: (s: AlertStore) => AlertStore) => {
    const next = change(loadStore());
    saveStore(next);
    setStore(next);
  };

  return {
    alerts: current.history,
    unread: current.history.filter((a) => !a.read).length,
    notify: current.notify,
    markAllRead: () => update((s) => ({ ...s, history: s.history.map((a) => ({ ...a, read: true })) })),
    setNotify: (notify: boolean) => update((s) => ({ ...s, notify })),
    clear: () => update((s) => ({ ...s, history: [] })),
  };
}
