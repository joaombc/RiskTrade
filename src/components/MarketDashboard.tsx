"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GLOSSARY } from "@/lib/glossary/terms";
import { HISTORY_RANGES, SYMBOL_PATTERN, type AssetSummary, type HistoryRange } from "@/lib/market";
import type { PlanLevel } from "@/lib/risk";
import { AssetSearch } from "./AssetSearch";
import { AssetSummaryPanel } from "./AssetSummaryPanel";
import { PriceChart, type ChartExample } from "./chart/PriceChart";
import { RiskCalculator } from "./risk/RiskCalculator";
import { WatchlistPanel } from "./watchlist/WatchlistPanel";

const REFRESH_MS = 30_000;

type State =
  | { kind: "idle" }
  | { kind: "loading"; symbol: string }
  | { kind: "error"; message: string }
  | { kind: "ready"; summary: AssetSummary };

async function fetchSummary(symbol: string): Promise<AssetSummary> {
  const res = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Serviço do Yahoo Finance indisponível no momento.");
  return data.summary;
}

/**
 * Lê o link do glossário ("Ver no gráfico real"): /?ativo=PETR4.SA&periodo=5y&exemplo=oco.
 * Parâmetros inválidos são ignorados.
 */
function readLink(params: URLSearchParams) {
  const rawSymbol = params.get("ativo")?.trim().toUpperCase() ?? "";
  const symbol = SYMBOL_PATTERN.test(rawSymbol) ? rawSymbol : null;
  const rawRange = params.get("periodo") ?? "";
  const range = Object.hasOwn(HISTORY_RANGES, rawRange) ? (rawRange as HistoryRange) : undefined;
  const term = GLOSSARY.find((t) => t.slug === params.get("exemplo") && t.example);
  const example: ChartExample | null =
    term?.example && term.example.symbol === symbol ? { slug: term.slug, name: term.name, example: term.example } : null;
  return { symbol, range, example };
}

export function MarketDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Só a URL de entrada importa: depois disso o estado é do próprio painel.
  const [link] = useState(() => readLink(new URLSearchParams(searchParams.toString())));
  const [symbol, setSymbol] = useState<string | null>(link.symbol);
  const [state, setState] = useState<State>({ kind: "idle" });
  // Remonta a busca para exibir o ticker aberto por fora dela (watchlist ou link do glossário).
  const [searchKey, setSearchKey] = useState(link.symbol ? 1 : 0);
  const [planLevels, setPlanLevels] = useState<PlanLevel[]>([]);
  const [example, setExample] = useState<ChartExample | null>(link.example);

  const selectSymbol = (target: string) => {
    setSymbol(target);
    setExample(null);
  };

  const selectFromWatchlist = (target: string) => {
    selectSymbol(target);
    setSearchKey((k) => k + 1);
  };

  const closeExample = () => {
    setExample(null);
    // Tira o exemplo da URL para que recarregar a página não o reabra.
    if (symbol) router.replace(`/?ativo=${encodeURIComponent(symbol)}`, { scroll: false });
  };

  useEffect(() => {
    if (!symbol) return;
    // Descarta respostas que chegam depois de o usuário trocar de ativo.
    let cancelled = false;

    async function load(target: string, silent: boolean) {
      if (!silent) setState({ kind: "loading", symbol: target });
      try {
        const summary = await fetchSummary(target);
        if (!cancelled) setState({ kind: "ready", summary });
      } catch (err) {
        // Numa atualização em segundo plano, mantém os últimos dados em vez de apagar a tela.
        if (!cancelled && !silent) setState({ kind: "error", message: err instanceof Error ? err.message : String(err) });
      }
    }

    load(symbol, false);
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load(symbol, true);
    }, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol]);

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-6">
        <AssetSearch key={searchKey} initialQuery={searchKey > 0 ? (symbol ?? "") : ""} onSelect={selectSymbol} />

        {state.kind === "idle" && (
          <p className="text-center text-sm text-muted">Busque um ativo para ver cotação, variação, range do dia e volume.</p>
        )}
        {state.kind === "loading" && (
          <div role="status" className="h-64 animate-pulse rounded-2xl border border-border bg-surface" aria-label={`Carregando ${state.symbol}`} />
        )}
        {state.kind === "error" && (
          <div role="alert" className="rounded-2xl border border-negative/40 bg-negative/10 p-4 text-sm text-negative">
            {state.message}
          </div>
        )}
        {state.kind === "ready" && (
          <>
            <AssetSummaryPanel summary={state.summary} />
            <PriceChart
              key={`chart-${state.summary.symbol}`}
              symbol={state.summary.symbol}
              levels={planLevels}
              initialRange={state.summary.symbol === link.symbol ? link.range : undefined}
              example={example?.example.symbol === state.summary.symbol ? example : null}
              onCloseExample={closeExample}
            />
            <RiskCalculator
              key={`risk-${state.summary.symbol}`}
              symbol={state.summary.symbol}
              currency={state.summary.currency}
              currentPrice={state.summary.price}
              onLevelsChange={setPlanLevels}
            />
          </>
        )}
      </div>

      <div className="lg:sticky lg:top-6">
        <WatchlistPanel activeSymbol={symbol} onSelect={selectFromWatchlist} />
      </div>
    </div>
  );
}
