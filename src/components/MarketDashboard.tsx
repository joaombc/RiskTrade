"use client";

import { useEffect, useState } from "react";
import type { AssetSummary } from "@/lib/market";
import { AssetSearch } from "./AssetSearch";
import { AssetSummaryPanel } from "./AssetSummaryPanel";

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

export function MarketDashboard() {
  const [symbol, setSymbol] = useState<string | null>(null);
  const [state, setState] = useState<State>({ kind: "idle" });

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
    <div className="flex flex-col gap-6">
      <AssetSearch onSelect={setSymbol} />

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
      {state.kind === "ready" && <AssetSummaryPanel summary={state.summary} />}
    </div>
  );
}
