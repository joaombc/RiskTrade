"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AssetSearch } from "@/components/AssetSearch";
import { Sparkline } from "@/components/watchlist/Sparkline";
import { useWatchlist } from "@/components/watchlist/useWatchlist";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { ASSET_GROUPS, groupSummary, MAX_PORTFOLIO_ASSETS, positionsPerGroup, type AssetGroup, type AssetInfo } from "@/lib/portfolioAssets";
import type { WatchlistQuote } from "@/lib/watchlist";
import { useAccount } from "./useAccount";
import { portfolioAssetActions, usePortfolioAssets } from "./usePortfolioAssets";

/** Atualização das cotações, como no painel e nos favoritos. */
const REFRESH_MS = 60_000;

/** Ativos acompanhados na carteira: busca, favoritos, grupo de cada um e cotação ao vivo. */
export function AssetsPanel() {
  const { t, locale, href } = useI18n();
  const a = t.portfolio.assets;
  const assets = usePortfolioAssets();
  const favorites = useWatchlist();
  const account = useAccount();
  const [adding, setAdding] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<Record<string, WatchlistQuote>>({});
  const [quotesAt, setQuotesAt] = useState<number | null>(null);
  const [quoteError, setQuoteError] = useState(false);

  const symbolsKey = assets.map((x) => x.symbol).join(",");
  const missingFavorites = favorites.filter((f) => !assets.some((x) => x.symbol === f.symbol)).map((f) => f.symbol);
  const full = assets.length >= MAX_PORTFOLIO_ASSETS;

  // Cotações de todos os ativos, a cada minuto com a aba visível.
  useEffect(() => {
    if (!symbolsKey) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        const res = await fetch(`/api/watchlist?symbols=${encodeURIComponent(symbolsKey)}`, { signal: controller.signal });
        if (!res.ok) throw new Error();
        const data: { quotes: WatchlistQuote[] } = await res.json();
        setQuotes(Object.fromEntries(data.quotes.map((q) => [q.symbol, q])));
        setQuotesAt(Date.now());
        setQuoteError(false);
      } catch {
        if (!controller.signal.aborted) setQuoteError(true);
      }
    };
    load();
    const id = setInterval(() => document.visibilityState === "visible" && load(), REFRESH_MS);
    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, [symbolsKey]);

  const add = async (symbols: string[]) => {
    if (symbols.length === 0) return;
    setAdding(true);
    setFailed([]);
    try {
      const res = await fetch(`/api/asset-info?symbols=${encodeURIComponent(symbols.join(","))}`);
      if (!res.ok) throw new Error();
      const { infos }: { infos: AssetInfo[] } = await res.json();
      portfolioAssetActions.add(infos);
      setFailed(symbols.filter((s) => !infos.some((i) => i.symbol === s)));
    } catch {
      setFailed(symbols);
    } finally {
      setAdding(false);
    }
  };

  const groups = useMemo(
    () => groupSummary(assets, account.limits.maxPerGroup, account.limits.maxPerAsset),
    [assets, account.limits.maxPerGroup, account.limits.maxPerAsset],
  );
  const fits = positionsPerGroup(account.limits.maxPerGroup, account.limits.maxPerAsset);
  const price = (q: WatchlistQuote) => {
    try {
      return new Intl.NumberFormat(locale, { style: "currency", currency: q.currency || "USD" }).format(q.price);
    } catch {
      return q.price.toLocaleString(locale, { maximumFractionDigits: 2 });
    }
  };

  return (
    <section aria-labelledby="ativos-carteira" className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div>
        <h2 id="ativos-carteira" className="text-xl font-semibold">
          {a.title}
        </h2>
        <p className="mt-1 text-sm text-muted">{a.subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className={`min-w-64 flex-1 ${full ? "pointer-events-none opacity-50" : ""}`} aria-label={a.add}>
          <AssetSearch onSelect={(symbol) => add([symbol])} />
        </div>
        <button
          type="button"
          disabled={missingFavorites.length === 0 || adding || full}
          onClick={() => add(missingFavorites)}
          className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-border/60 disabled:opacity-50"
        >
          {favorites.length === 0 ? a.noFavorites : missingFavorites.length ? fmt(a.importFavorites, { n: missingFavorites.length }) : a.allImported}
        </button>
      </div>
      {adding && <p className="text-xs text-muted">{a.adding}</p>}
      {failed.length > 0 && <p className="text-xs text-negative">{fmt(a.addFailed, { symbols: failed.join(", ") })}</p>}
      {full && <p className="text-xs text-muted">{fmt(a.full, { max: MAX_PORTFOLIO_ASSETS })}</p>}

      {assets.length === 0 ? (
        <p className="text-sm text-muted">{a.empty}</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-border/30 text-left text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">{a.columns.asset}</th>
                  <th className="px-3 py-2 font-medium" title={a.groupHint}>
                    {a.columns.group}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">{a.columns.price}</th>
                  <th className="px-3 py-2 text-right font-medium">{a.columns.change}</th>
                  <th className="hidden px-3 py-2 font-medium lg:table-cell">{a.columns.trend}</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => {
                  const q = quotes[asset.symbol];
                  return (
                    <tr key={asset.symbol} className="border-t border-border">
                      <td className="px-3 py-2">
                        <Link
                          href={`${href("/")}?symbol=${encodeURIComponent(asset.symbol)}`}
                          title={fmt(a.open, { symbol: asset.symbol })}
                          className="font-mono font-semibold hover:underline"
                        >
                          {asset.symbol}
                        </Link>
                        <div className="max-w-44 truncate text-xs text-muted">{asset.name}</div>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={asset.group}
                          aria-label={fmt(a.groupLabel, { symbol: asset.symbol })}
                          title={a.groupHint}
                          onChange={(e) => portfolioAssetActions.setGroup(asset.symbol, e.target.value as AssetGroup)}
                          className="w-36 rounded-md border border-border bg-background px-2 py-1 text-xs"
                        >
                          {ASSET_GROUPS.map((g) => (
                            <option key={g} value={g}>
                              {a.groups[g]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{q ? price(q) : "—"}</td>
                      <td className={`px-3 py-2 text-right tabular-nums ${q ? (q.changePercent >= 0 ? "text-positive" : "text-negative") : "text-muted"}`}>
                        {q ? `${q.changePercent >= 0 ? "+" : "−"}${Math.abs(q.changePercent).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : "—"}
                      </td>
                      <td className="hidden px-3 py-2 lg:table-cell">{q && <Sparkline values={q.sparkline} />}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          aria-label={fmt(a.remove, { symbol: asset.symbol })}
                          title={fmt(a.remove, { symbol: asset.symbol })}
                          onClick={() => portfolioAssetActions.remove(asset.symbol)}
                          className="rounded-md px-2 py-1 text-muted hover:bg-border/60 hover:text-negative"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted">
            {quoteError
              ? a.quoteError
              : quotesAt !== null && fmt(a.updated, { time: new Date(quotesAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) })}
          </p>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">{a.groupsTitle}</h3>
            <ul className="flex flex-wrap gap-1.5">
              {groups.map((g) => (
                <li
                  key={g.group}
                  title={g.symbols.join(", ")}
                  className={`rounded-full border px-2.5 py-1 text-xs ${g.crowded ? "border-amber-500 text-amber-700 dark:text-amber-400" : "border-border"}`}
                >
                  {a.groups[g.group]} <span className="font-semibold tabular-nums">{g.symbols.length}</span>
                </li>
              ))}
            </ul>
            {groups
              .filter((g) => g.crowded)
              .map((g) => (
                <p key={g.group} className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs leading-relaxed">
                  {fmt(fits === 1 ? a.crowded : a.crowdedMany, {
                    group: a.groups[g.group],
                    n: g.symbols.length,
                    groupLimit: account.limits.maxPerGroup,
                    fits,
                    assetLimit: account.limits.maxPerAsset,
                  })}
                </p>
              ))}
          </div>
        </>
      )}
    </section>
  );
}
