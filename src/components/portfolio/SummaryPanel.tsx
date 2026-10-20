"use client";

import Link from "next/link";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { AssetGroup } from "@/lib/portfolioAssets";
import { closedTrades, equityCurve, exposures, guidance, tradeStats, type Guidance, type LimitUse } from "@/lib/portfolioSummary";
import { isClosed, trackPosition, type Position } from "@/lib/positions";
import { useAccount } from "./useAccount";
import type { PortfolioPlans } from "./usePortfolioPlans";
import { usePortfolioAssets } from "./usePortfolioAssets";

/** Resumo da carteira (Murphy, cap. 16): uso dos limites, risco aberto, orientações e histórico. */
export function SummaryPanel({ plans, positions }: { plans: PortfolioPlans; positions: Position[] }) {
  const { t, locale, href } = useI18n();
  const s = t.portfolio.summary;
  const groupNames = t.portfolio.assets.groups;
  const account = useAccount();
  const assets = usePortfolioAssets();
  const capital = account.capital;
  const groupOf = (symbol: string): AssetGroup => assets.find((a) => a.symbol === symbol)?.group ?? "other";
  const fxOf = (p: Position) => plans.items[p.symbol]?.fx ?? plans.rates[p.currency] ?? null;

  const money = (v: number) => new Intl.NumberFormat(locale, { style: "currency", currency: account.currency, maximumFractionDigits: 0 }).format(v);
  const assetMoney = (v: number, currency: string) => {
    try {
      return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(v);
    } catch {
      return v.toLocaleString(locale, { maximumFractionDigits: 2 });
    }
  };
  const pct = (v: number, digits = 1) => `${v.toLocaleString(locale, { maximumFractionDigits: digits })}%`;
  const signed = (v: number, text: string) => (v > 0 ? `+${text}` : v < 0 ? `−${text.replace(/^-/, "")}` : text);
  const date = (time: number) => new Date(time * 1000).toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "2-digit" });

  // Posições abertas com a gestão de agora (preço, resultado e risco), na moeda da conta.
  const open = positions
    .filter((p) => !isClosed(p))
    .map((p) => {
      const item = plans.items[p.symbol];
      const tracking = item?.bars ? trackPosition(p, item.bars) : null;
      const fx = fxOf(p);
      const openUnits = tracking?.units.filter((u) => u.status !== "closed") ?? [];
      const quantity = openUnits.reduce((sum, u) => sum + u.unit.quantity, 0);
      return { position: p, tracking, fx, value: tracking && fx ? quantity * tracking.price * fx : null, group: groupOf(p.symbol) };
    })
    .sort((a, b) => (a.tracking?.pnl ?? 0) * (a.fx ?? 1) - (b.tracking?.pnl ?? 0) * (b.fx ?? 1));
  const trades = closedTrades(positions);
  const tradeResults = trades.map((tr) => {
    const fx = fxOf(tr.position);
    return { ...tr, fx, pnlAccount: fx ? tr.pnl * fx : null };
  });

  if (open.length === 0 && trades.length === 0) {
    return (
      <section aria-labelledby="resumo-carteira" className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
        <h2 id="resumo-carteira" className="text-xl font-semibold">
          {s.title}
        </h2>
        <p className="text-sm text-muted">{s.empty}</p>
      </section>
    );
  }

  const holdings = open.flatMap((o) => (o.value !== null ? [{ symbol: o.position.symbol, group: o.group, value: o.value }] : []));
  const usage = capital ? exposures(holdings, capital, account.limits) : null;
  const openRisk = open.reduce((sum, o) => sum + (o.tracking && o.fx ? o.tracking.openRisk * o.fx : 0), 0);
  const known = tradeResults.filter((tr) => tr.pnlAccount !== null);
  const stats = tradeStats(known.map((tr) => tr.pnlAccount!));
  const curve = capital ? equityCurve(capital, known.map((tr) => ({ closedAt: tr.closedAt, pnl: tr.pnlAccount! })).reverse()) : [];
  const advice = guidance({
    results: known.map((tr) => tr.pnlAccount!),
    curve,
    open: open.map((o) => ({ symbol: o.position.symbol, group: o.group, pnl: (o.tracking?.pnl ?? 0) * (o.fx ?? 1) })),
    limits: account.limits,
  });

  const adviceText = (g: Guidance) => {
    const G = s.guidance;
    switch (g.key) {
      case "afterWins":
      case "afterLosses":
        return fmt(G[g.key], { count: g.count });
      case "drawdown":
        return fmt(G.drawdown, { pct: pct(g.pct, 0) });
      case "closeLosersFirst":
        return fmt(G.closeLosersFirst, { symbols: g.symbols.join(", ") });
      case "tooMany":
        return fmt(G.tooMany, { count: g.count, max: g.max });
      case "oneGroup":
        return fmt(G.oneGroup, { count: g.count, group: groupNames[g.group] });
    }
  };

  const bar = (label: React.ReactNode, use: LimitUse) => (
    <div key={use.key} className="flex flex-col gap-1">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
        <span className="font-medium">{label}</span>
        <span className={`tabular-nums ${use.over ? "font-semibold text-negative" : "text-muted"}`}>
          {fmt(s.ofLimit, { value: money(use.value), pct: pct(use.pct), limit: pct(use.limit, 0) })}
          {use.over && ` · ${s.over}`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-border/60">
        <div className={`h-full rounded-full ${use.over ? "bg-negative" : "bg-accent"}`} style={{ width: `${Math.min(100, (use.pct / use.limit) * 100)}%` }} />
      </div>
    </div>
  );

  return (
    <section aria-labelledby="resumo-carteira" className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div>
        <h2 id="resumo-carteira" className="text-xl font-semibold">
          {s.title}
        </h2>
        <p className="mt-1 text-sm text-muted">{s.subtitle}</p>
      </div>

      {open.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">{s.limitsTitle}</h3>
            {!usage || !capital ? (
              <p className="text-sm text-muted">{s.noCapital}</p>
            ) : (
              <>
                {bar(s.invested, usage.invested)}
                <p className="-mt-1 text-[11px] text-muted">{fmt(s.cash, { amount: money(capital - usage.invested.value) })}</p>
                <span className="text-xs font-semibold text-muted">{s.byAsset}</span>
                {usage.byAsset.map((u) => bar(u.key, u))}
                <span className="text-xs font-semibold text-muted">{s.byGroup}</span>
                {usage.byGroup.map((u) => bar(groupNames[u.key as AssetGroup], u))}
              </>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">{s.openRiskTitle}</h3>
            <p className="text-sm">
              {openRisk > 0 ? fmt(s.openRisk, { amount: money(openRisk), pct: capital ? pct((openRisk / capital) * 100) : "—" }) : s.noOpenRisk}
            </p>
            <h3 className="text-sm font-semibold">{s.openTitle}</h3>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[420px] text-xs tabular-nums">
                <thead className="bg-border/30 text-left text-muted">
                  <tr>
                    <th className="px-2 py-1.5 font-medium">{s.columns.asset}</th>
                    <th className="px-2 py-1.5 text-right font-medium">{s.columns.result}</th>
                    <th className="px-2 py-1.5 text-right font-medium">{s.columns.stop}</th>
                    <th className="px-2 py-1.5 text-right font-medium">{s.columns.risk}</th>
                  </tr>
                </thead>
                <tbody>
                  {open.map(({ position: p, tracking, fx }) => {
                    const stops = tracking?.units.filter((u) => u.status === "open").map((u) => u.stop) ?? [];
                    const stop = stops.length ? (p.side === "long" ? Math.min(...stops) : Math.max(...stops)) : null;
                    return (
                      <tr key={p.id} className="border-t border-border">
                        <td className="px-2 py-1.5">
                          <Link href={`${href("/")}?symbol=${encodeURIComponent(p.symbol)}`} className="font-mono font-semibold hover:underline">
                            {p.symbol}
                          </Link>{" "}
                          <span className="text-muted">{p.side === "long" ? s.long : s.short}</span>
                        </td>
                        <td className={`px-2 py-1.5 text-right ${(tracking?.pnl ?? 0) >= 0 ? "text-positive" : "text-negative"}`}>
                          {tracking ? (fx ? signed(tracking.pnl, money(Math.abs(tracking.pnl * fx))) : signed(tracking.pnl, assetMoney(Math.abs(tracking.pnl), p.currency))) : "—"}
                        </td>
                        <td className="px-2 py-1.5 text-right">{stop !== null ? assetMoney(stop, p.currency) : "—"}</td>
                        <td className="px-2 py-1.5 text-right">
                          {!tracking ? "—" : tracking.riskFree ? <span className="text-positive">{s.riskFree}</span> : fx ? money(tracking.openRisk * fx) : assetMoney(tracking.openRisk, p.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {advice.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{s.guidanceTitle}</h3>
          <ul className="flex flex-col gap-1.5">
            {advice.map((g) => (
              <li key={g.key} className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-sm leading-relaxed">
                {adviceText(g)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">{s.historyTitle}</h3>
        {trades.length === 0 ? (
          <p className="text-sm text-muted">{s.noHistory}</p>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {(
                [
                  ["trades", String(stats.trades)],
                  ["winRate", stats.winRate === null ? "—" : pct(stats.winRate, 0)],
                  ["avgWin", stats.avgWin === null ? "—" : money(stats.avgWin)],
                  ["avgLoss", stats.avgLoss === null ? "—" : signed(stats.avgLoss, money(Math.abs(stats.avgLoss)))],
                  ["payoff", stats.payoff === null ? "—" : `${stats.payoff.toLocaleString(locale, { maximumFractionDigits: 1 })} : 1`],
                  ["total", signed(stats.total, money(Math.abs(stats.total)))],
                ] as const
              ).map(([key, value]) => (
                <div key={key} className="rounded-lg border border-border p-2">
                  <dt className="text-[11px] text-muted">{s.stats[key]}</dt>
                  <dd className={`text-sm font-semibold tabular-nums ${key === "total" ? (stats.total >= 0 ? "text-positive" : "text-negative") : ""}`}>{value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-muted">{s.murphy40}</p>
            {curve.length > 1 && <EquityChart points={curve} label={s.equity} money={money} />}
            <div className="max-h-72 overflow-auto rounded-lg border border-border">
              <table className="w-full min-w-[520px] text-xs tabular-nums">
                <thead className="sticky top-0 bg-surface text-left text-muted">
                  <tr>
                    <th className="px-2 py-1.5 font-medium">{s.columns.asset}</th>
                    <th className="px-2 py-1.5 font-medium">{s.columns.opened}</th>
                    <th className="px-2 py-1.5 font-medium">{s.columns.closed}</th>
                    <th className="px-2 py-1.5 text-right font-medium">{s.columns.result}</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeResults.map((tr) => (
                    <tr key={tr.position.id} className="border-t border-border">
                      <td className="px-2 py-1.5">
                        <span className="font-mono font-semibold">{tr.position.symbol}</span>{" "}
                        <span className="text-muted">{tr.position.side === "long" ? s.long : s.short}</span>
                      </td>
                      <td className="px-2 py-1.5">{date(tr.openedAt)}</td>
                      <td className="px-2 py-1.5">{date(tr.closedAt)}</td>
                      <td className={`px-2 py-1.5 text-right ${tr.pnl >= 0 ? "text-positive" : "text-negative"}`}>
                        {signed(tr.pnl, assetMoney(Math.abs(tr.pnl), tr.position.currency))}
                        {tr.pnlAccount !== null && tr.position.currency !== account.currency && ` (${signed(tr.pnlAccount, money(Math.abs(tr.pnlAccount)))})`}
                        {` · ${signed(tr.pnlPct, pct(Math.abs(tr.pnlPct)))}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/** Curva de capital em degraus: um ponto a cada operação encerrada. */
function EquityChart({ points, label, money }: { points: { time: number; value: number }[]; label: string; money: (v: number) => string }) {
  const [width, height] = [600, 120];
  const values = points.map((p) => p.value);
  const [min, max] = [Math.min(...values), Math.max(...values)];
  const span = max - min || 1;
  const x = (k: number) => (k / (points.length - 1)) * width;
  const y = (v: number) => height - 6 - ((v - min) / span) * (height - 12);
  const d = points.map((p, k) => `${k === 0 ? "M" : "L"}${x(k).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const last = values[values.length - 1];
  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="flex justify-between gap-2 text-xs">
        <span className="font-medium">{label}</span>
        <span className={`tabular-nums ${last >= values[0] ? "text-positive" : "text-negative"}`}>{money(last)}</span>
      </figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-28 w-full rounded-lg border border-border" role="img" aria-label={label}>
        <line x1={0} x2={width} y1={y(values[0])} y2={y(values[0])} className="stroke-border" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        <path d={d} fill="none" className="stroke-accent" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
    </figure>
  );
}
