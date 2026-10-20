"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import type { PlanItem } from "@/app/api/plan/route";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { accountBudget, type Account } from "@/lib/portfolioAccount";
import type { PortfolioAsset } from "@/lib/portfolioAssets";
import { finalAction, lotOf, sizePosition, type FinalReason, type PlanAction, type PlanReason, type TradePlan } from "@/lib/tradePlan";
import { BuyForm } from "./BuyForm";
import type { Exposure } from "./PortfolioLive";
import { useAccount } from "./useAccount";
import { usePortfolioAssets } from "./usePortfolioAssets";
import type { PortfolioPlans } from "./usePortfolioPlans";

const SETTINGS_KEY = "risktrade:portfolio:plan:v1";
/** Ordem dos cards: o que pede ação primeiro. */
const ACTION_ORDER: PlanAction[] = ["enterNow", "enterLimit", "enterStop", "wait", "stayOut"];

const noSubscription = () => () => {};
const useHydrated = () => useSyncExternalStore(noSubscription, () => true, () => false);

/** "Operar vendido também" (lido também pelos alertas). */
export function loadAllowShort(): boolean {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}").allowShort === true;
  } catch {
    return false;
  }
}

function saveAllowShort(allowShort: boolean) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ allowShort }));
  } catch {
    // Storage bloqueado: a escolha vale só nesta sessão.
  }
}

/** Plano em tempo real de cada ativo acompanhado (Murphy, cap. 16): o quê, quando e quanto. */
export function PlanPanel({ plans, exposure }: { plans: PortfolioPlans; exposure: Exposure }) {
  const { t, locale } = useI18n();
  const p = t.portfolio.plan;
  const assets = usePortfolioAssets();
  const account = useAccount();
  const hydrated = useHydrated();
  const [allowShort, setAllowShort] = useState<boolean | null>(null);
  if (hydrated && allowShort === null) setAllowShort(loadAllowShort());
  const { items, checkedAt, failed } = plans;

  const short = allowShort === true;
  const cards = assets
    .map((asset) => {
      const item = items[asset.symbol];
      const final = item?.plan ? finalAction(item.plan, account.limits.minRewardRisk, short) : null;
      return { asset, item, final };
    })
    .sort((a, b) => ACTION_ORDER.indexOf(a.final?.action ?? "stayOut") - ACTION_ORDER.indexOf(b.final?.action ?? "stayOut"));

  return (
    <section aria-labelledby="plano-carteira" className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <h2 id="plano-carteira" className="text-xl font-semibold">
            {p.title}
          </h2>
          <p className="mt-1 text-sm text-muted">{p.subtitle}</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={short}
            onChange={(e) => {
              setAllowShort(e.target.checked);
              saveAllowShort(e.target.checked);
            }}
          />
          {p.allowShort}
        </label>
      </div>

      {assets.length === 0 ? (
        <p className="text-sm text-muted">{p.empty}</p>
      ) : checkedAt === null && !failed ? (
        <p className="text-sm text-muted">{p.loading}</p>
      ) : (
        <>
          {failed && <p className="text-sm text-negative">{p.failed}</p>}
          <ul className="grid gap-4 xl:grid-cols-2">
            {cards.map(({ asset, item, final }) => (
              <li key={asset.symbol}>
                {item?.plan && final ? (
                  <PlanCard
                    asset={asset}
                    item={item}
                    plan={item.plan}
                    action={final.action}
                    finalReason={final.reason}
                    account={account}
                    exposure={exposure}
                  />
                ) : (
                  <div className="rounded-xl border border-border p-4 text-sm text-muted">{fmt(p.error, { symbol: asset.symbol })}</div>
                )}
              </li>
            ))}
          </ul>
          {checkedAt !== null && (
            <p className="text-[11px] text-muted">{fmt(p.updated, { time: new Date(checkedAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) })}</p>
          )}
        </>
      )}
    </section>
  );
}

const ACTION_TONE: Record<PlanAction, string> = {
  enterNow: "bg-positive text-white",
  enterLimit: "bg-accent/15 text-accent",
  enterStop: "bg-accent/15 text-accent",
  wait: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  stayOut: "bg-border/70 text-muted",
};

interface CardProps {
  asset: PortfolioAsset;
  item: PlanItem;
  plan: TradePlan;
  action: PlanAction;
  finalReason: FinalReason | null;
  account: Account;
  exposure: Exposure;
}

function PlanCard({ asset, item, plan, action, finalReason, account, exposure }: CardProps) {
  const { t, locale, href } = useI18n();
  const p = t.portfolio.plan;
  const side = plan.side ?? "long";
  const [buying, setBuying] = useState(false);
  const currency = item.currency || asset.currency;
  const num = (v: number, digits = 2) => v.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const price = (v: number) => {
    const digits = Math.abs(v) < 1 ? 4 : 2;
    try {
      return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
    } catch {
      return num(v, digits);
    }
  };
  const money = (v: number) => new Intl.NumberFormat(locale, { style: "currency", currency: account.currency, maximumFractionDigits: 0 }).format(v);
  const pct = (v: number) => `${num(v * 100, 0)}%`;
  const date = (time: number) => new Date(time * 1000).toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "2-digit" });

  const entering = action === "enterNow" || action === "enterLimit" || action === "enterStop";
  const actionText =
    entering && plan.entry !== null ? fmt(p.actions[side][action], { price: price(plan.entry) }) : action === "wait" ? p.actions.wait : p.actions.stayOut;

  // Quantidade: só quando há entrada e stop, capital na conta e câmbio.
  const budget = accountBudget(account);
  const lot = lotOf(asset.symbol);
  const size =
    budget && plan.entry !== null && plan.stop !== null && item.fx
      ? sizePosition({
          ...account.limits,
          capital: account.capital!,
          entry: plan.entry,
          stop: plan.stop,
          fx: item.fx,
          lot,
          invested: exposure.total,
          assetInvested: exposure.bySymbol[asset.symbol] ?? 0,
        })
      : null;

  const reasonText = (r: PlanReason): string => {
    const R = p.reasons;
    switch (r.key) {
      case "trend":
        return fmt(R.trend[r.trend], { date: date(r.since) });
      case "noTrendData":
        return R.noTrendData;
      case "weekly":
        if (r.trend === null) return R.weekly.none;
        if (plan.dailyTrend === "lateral" && r.trend !== "lateral") return fmt(R.weekly.guides, { trend: p.trends[r.trend] });
        return r.agrees === true ? R.weekly.agrees : r.agrees === false ? R.weekly.disagrees : R.weekly.lateral;
      case "inZone":
      case "aboveZone":
      case "deepPullback":
        return fmt(R[r.key][side], { pct: pct(r.retrace) });
      case "freshBreakout":
      case "extendedBreakout":
      case "stopSupport":
      case "stopBreakout":
      case "stopSwing":
        return fmt(R[r.key][side], { level: price(r.level) });
      case "range":
        return fmt(R.range, { low: price(r.low), high: price(r.high) });
      case "targetProjection":
        return fmt(R.targetProjection, { target: price(r.target) });
      case "targetResistance":
        return fmt(R.targetResistance[side], { target: price(r.target) });
    }
  };
  const finalText = (r: FinalReason) =>
    r.key === "rewardRiskLow" ? fmt(p.reasons.rewardRiskLow, { rr: num(r.rewardRisk, 1), min: num(r.min, 1) }) : r.key === "shortDisabled" ? p.reasons.shortDisabled : p.noCapital;

  const field = (label: string, value: React.ReactNode, className = "") => (
    <div className={`flex flex-col ${className}`}>
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className="text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );

  return (
    <article className="flex h-full flex-col gap-3 rounded-xl border border-border p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link href={`${href("/")}?symbol=${encodeURIComponent(asset.symbol)}`} className="font-mono text-base font-semibold hover:underline">
            {asset.symbol}
          </Link>
          <span className="ml-2 tabular-nums text-muted">{price(plan.close)}</span>
          <div className="max-w-64 truncate text-xs text-muted">{asset.name}</div>
        </div>
        <span className={`rounded-lg px-2.5 py-1 text-sm font-semibold ${ACTION_TONE[action]}`}>{actionText}</span>
      </header>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {field(
          p.fields.trend,
          <>
            {p.fields.daily} {p.trends[plan.dailyTrend ?? "none"]} · {p.fields.weekly} {p.trends[plan.weeklyTrend ?? "none"]}
          </>,
          "col-span-2 sm:col-span-3",
        )}
        {plan.entry !== null && (
          <>
            {field(
              p.fields.entry,
              <>
                {price(plan.entry)}
                {plan.entryZone && (
                  <span className="block text-[11px] font-normal text-muted">
                    {fmt(p.fields.zone, { low: price(plan.entryZone[0]), high: price(plan.entryZone[1]) })}
                  </span>
                )}
              </>,
            )}
            {plan.stop !== null && field(p.fields.stop, <span className="text-negative">{price(plan.stop)}</span>)}
            {plan.rewardRisk !== null &&
              field(
                p.fields.rewardRisk,
                <span className={plan.rewardRisk >= account.limits.minRewardRisk ? "text-positive" : "text-negative"}>
                  {num(plan.rewardRisk, 1)} : 1
                </span>,
              )}
            {plan.target1 !== null && field(p.fields.target1, price(plan.target1))}
            {plan.target !== null && field(p.fields.target, <span className="text-positive">{price(plan.target)}</span>)}
          </>
        )}
      </dl>

      {plan.entry !== null && plan.order && plan.stop !== null && (
        <div className="flex flex-col gap-0.5 text-xs">
          <span className="font-semibold">{p.fields.order}</span>
          <span>{fmt(p.orders[side][plan.order], { price: price(plan.entry) })}</span>
          <span className="text-muted">{fmt(p.orders.protective[side], { price: price(plan.stop) })}</span>
        </div>
      )}

      {plan.entry !== null && plan.stop !== null && (
        <div className="flex flex-col gap-0.5 text-xs">
          <span className="font-semibold">{p.fields.quantity}</span>
          {!budget ? (
            <span className="text-muted">{p.noCapital}</span>
          ) : !item.fx ? (
            <span className="text-muted">{fmt(p.noFx, { from: currency, to: account.currency })}</span>
          ) : size && size.quantity > 0 ? (
            <>
              <span className="text-sm font-medium tabular-nums">
                {fmt(p.quantity, { qty: size.quantity.toLocaleString(locale, { maximumFractionDigits: 4 }), value: money(size.value) })}
              </span>
              <span className="text-muted">
                {fmt(p.quantityRisk, { risk: money(size.risk), pct: `${num((size.risk / account.capital!) * 100, 1)}%` })}{" "}
                {fmt(p.limitedBy[size.limitedBy], {
                  pct: num(size.limitedBy === "risk" ? account.limits.riskPerTrade : size.limitedBy === "asset" ? account.limits.maxPerAsset : account.limits.maxInvested, 0),
                })}
              </span>
            </>
          ) : (
            <span className="text-muted">
              {size?.limitedBy === "asset" && (exposure.bySymbol[asset.symbol] ?? 0) > 0
                ? fmt(p.assetFull, { pct: num(account.limits.maxPerAsset, 0) })
                : size?.limitedBy === "cash" && exposure.total > 0
                  ? fmt(p.cashFull, { pct: num(account.limits.maxInvested, 0) })
                  : fmt(p.tooSmall, { lot: lot.toLocaleString(locale) })}
            </span>
          )}
        </div>
      )}

      {plan.confluence.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold">{p.confluenceTitle}</span>
          {plan.confluence.map((c) => (
            <span key={c} className="rounded-full bg-accent/10 px-2 py-0.5 text-accent">
              {p.confluence[c]}
            </span>
          ))}
        </div>
      )}

      {plan.side && plan.entry !== null && plan.stop !== null && (
        <div>
          {buying ? (
            <BuyForm
              asset={asset}
              side={plan.side}
              plan={plan}
              quantity={size?.quantity ?? 0}
              lot={lot}
              currency={currency}
              onDone={() => setBuying(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setBuying(true)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-border/60"
            >
              {plan.side === "long" ? p.bought : p.sold}
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold">{p.why}</span>
        <ul className="list-disc space-y-0.5 pl-4 text-xs leading-relaxed text-foreground/90">
          {plan.reasons.map((r, k) => (
            <li key={k}>{reasonText(r)}</li>
          ))}
          {finalReason && <li className="font-medium text-amber-700 dark:text-amber-400">{finalText(finalReason)}</li>}
        </ul>
      </div>
    </article>
  );
}
