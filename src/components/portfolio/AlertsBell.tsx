"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Dictionary } from "@/i18n/dictionary";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { PortfolioAlert } from "@/lib/portfolioAlerts";
import type { StoredAlert } from "./usePortfolioAlerts";

type Permission = NotificationPermission | "unsupported";
const noSubscription = () => () => {};
const readPermission = (): Permission => (typeof Notification === "undefined" ? "unsupported" : Notification.permission);

/** Texto de um alerta, no idioma da página (o mesmo vai para a notificação do navegador). */
export function describeAlert(alert: PortfolioAlert, t: Dictionary, locale: string): string {
  const m = t.portfolio.alerts.messages;
  const digits = alert.price !== null && Math.abs(alert.price) < 1 ? 4 : 2;
  const price = alert.price === null ? "—" : alert.price.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const values = { symbol: alert.symbol, price };
  switch (alert.kind) {
    case "entrySignal": {
      const action = alert.action === "enterNow" || alert.action === "enterLimit" || alert.action === "enterStop" ? alert.action : "enterNow";
      return fmt(m.entrySignal, { ...values, action: fmt(t.portfolio.plan.actions[alert.side][action], { price }) });
    }
    case "trendChanged":
      return fmt(m.trendChanged, { ...values, trend: t.portfolio.plan.trends[alert.trend ?? "lateral"] });
    case "inZone":
    case "breakout":
    case "stopHit":
    case "raiseStop":
    case "trendReversed":
      return fmt(m[alert.kind][alert.side], values);
    default:
      return fmt(m[alert.kind], values);
  }
}

const TONE: Record<PortfolioAlert["tone"], string> = {
  buy: "border-l-positive",
  sell: "border-l-negative",
  info: "border-l-accent",
};

interface Props {
  alerts: StoredAlert[];
  unread: number;
  notify: boolean;
  onNotifyChange: (notify: boolean) => void;
  onClose: () => void;
  onClear: () => void;
}

/** Sino dos alertas da carteira: contador dos novos e o card com o histórico (marcados como lidos ao fechar). */
export function AlertsBell({ alerts, unread, notify, onNotifyChange, onClose, onClear }: Props) {
  const { t, locale } = useI18n();
  const a = t.portfolio.alerts;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const [, setPermissionVersion] = useState(0);
  const permission = useSyncExternalStore(noSubscription, readPermission, () => "default" as Permission);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => {
    setOpen(false);
    onClose();
  };
  const when = (ms: number) => new Date(ms).toLocaleString(locale, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={unread ? `${a.button}: ${fmt(a.unread, { n: unread })}` : a.button}
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium shadow-sm ${unread ? "border-accent bg-surface text-accent" : "border-border bg-surface hover:bg-border/60"}`}
      >
        <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {a.button}
        {unread > 0 && <span className="rounded-full bg-accent px-1.5 text-xs font-semibold text-white tabular-nums">{unread}</span>}
      </button>

      <dialog
        ref={ref}
        aria-labelledby="alertas-titulo"
        onClose={close}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="m-auto max-h-[92vh] w-[min(40rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/60"
      >
        {open && (
          <article className="flex flex-col gap-4 p-5 sm:p-6">
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2 id="alertas-titulo" className="text-xl font-bold tracking-tight">
                  {a.title}
                </h2>
                <p className="mt-1 text-sm text-muted">{a.subtitle}</p>
              </div>
              <button type="button" onClick={close} className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-border/60">
                {a.close}
              </button>
            </header>

            <label className="flex flex-wrap items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notify && permission === "granted"}
                disabled={permission === "unsupported" || permission === "denied"}
                onChange={async (e) => {
                  if (e.target.checked && permission === "default") {
                    await Notification.requestPermission();
                    setPermissionVersion((v) => v + 1);
                  }
                  onNotifyChange(e.target.checked);
                }}
              />
              {a.notify}
              {permission === "denied" && <span className="text-xs text-muted">{a.notifyDenied}</span>}
              {permission === "unsupported" && <span className="text-xs text-muted">{a.notifyUnsupported}</span>}
            </label>

            {alerts.length === 0 ? (
              <p className="text-sm text-muted">{a.empty}</p>
            ) : (
              <>
                <ul className="flex flex-col gap-2">
                  {alerts.map((alert) => (
                    <li key={alert.id} className={`rounded-lg border border-l-4 border-border p-3 text-sm ${TONE[alert.tone]}`}>
                      <p className="leading-snug">{describeAlert(alert, t, locale)}</p>
                      <p className="mt-1 flex gap-2 text-xs text-muted">
                        <span>{when(alert.detectedAt)}</span>
                        {!alert.read && <span className="rounded-full bg-accent px-1.5 font-semibold text-white">{a.new}</span>}
                      </p>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={onClear} className="self-start text-xs text-muted hover:text-negative">
                  {a.clear}
                </button>
              </>
            )}
          </article>
        )}
      </dialog>
    </>
  );
}
