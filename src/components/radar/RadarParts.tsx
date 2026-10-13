"use client";

import { useEffect, useRef } from "react";
import type { Dictionary } from "@/i18n/dictionary";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { againstTrend, RADAR_INDICATORS, RADAR_INTERVALS, type RadarInterval, type RadarSignal } from "@/lib/radar";
import type { RadarEntry, SignalRadarState } from "./useSignalRadar";

/** Desenho do sino (contorno; preenchido quando `filled`). */
export function BellIcon({ filled = false, className = "h-4 w-4" }: { filled?: boolean; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round">
      <path d="M10 2.5a4.5 4.5 0 0 0-4.5 4.5v2.8L4 13.2h12l-1.5-3.4V7A4.5 4.5 0 0 0 10 2.5Z" />
      <path d="M8.2 15.5a1.9 1.9 0 0 0 3.6 0" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Sino do favorito: verde quando predominam os sinais de compra, vermelho quando predominam os de
 * venda, cinza no empate e apagado sem sinais recentes. Cheio quando há confluência (saldo de 2 ou
 * mais); um ponto marca sinal novo.
 */
export function RadarBell({ symbol, entry, open, onToggle }: { symbol: string; entry: RadarEntry | undefined; open: boolean; onToggle: () => void }) {
  const { radar: r } = useI18n().t;
  const bias = entry?.score?.bias;
  const score = entry?.score?.score ?? 0;
  const hasSignals = (entry?.signals.length ?? 0) > 0;
  const color = !hasSignals ? "text-border" : score > 0 ? "text-positive" : score < 0 ? "text-negative" : "text-muted";
  const state = !entry
    ? r.loading
    : entry.error
      ? r.itemError
      : !entry.analysis
        ? r.insufficient
        : !hasSignals
          ? r.none
          : `${r.bias[entry.score!.bias]}${entry.score!.strong ? ` (${r.strong})` : ""} · ${fmt(r.counts, { buys: entry.score!.buys, sells: entry.score!.sells })}`;
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={fmt(r.bellLabel, { symbol, state })}
      title={state}
      onClick={onToggle}
      className={`relative shrink-0 rounded p-1 hover:bg-border/60 ${color} ${open ? "bg-border/60" : ""}`}
    >
      <BellIcon filled={hasSignals && bias !== "neutral"} className="h-5 w-5" />
      {entry?.hasNew && <span aria-hidden className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-accent ring-2 ring-surface" />}
    </button>
  );
}

/** Frase do que aconteceu em cada sinal (ex.: "o MACD cruzou a linha de sinal para cima"). */
function explain(e: Dictionary["radar"]["explain"], s: RadarSignal): string {
  return (s.detail === "failure" ? e.rsiFailure : e[s.indicator])[s.kind];
}

/**
 * Card com os sinais de um favorito, aberto pelo sino: viés, tendência e os sinais de compra e de
 * venda em colunas, cada um em frase. `symbol` null = fechado.
 */
export function RadarDialog({
  symbol,
  name,
  entry,
  radar,
  locale,
  onClose,
  onOpenChart,
}: {
  symbol: string | null;
  name: string;
  entry: RadarEntry | undefined;
  radar: SignalRadarState;
  locale: string;
  onClose: () => void;
  onOpenChart: (symbol: string) => void;
}) {
  const { radar: r } = useI18n().t;
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (symbol && !dialog.open) dialog.showModal();
    if (!symbol && dialog.open) dialog.close();
  }, [symbol]);

  const ago = (n: number) => (n === 0 ? r.today : n === 1 ? r.agoOne : fmt(r.agoMany, { n }));
  const analysis = entry?.analysis ?? null;
  const score = entry?.score ?? null;
  const signals = entry?.signals ?? [];

  const column = (kind: "buy" | "sell") => {
    const list = signals.filter((s) => s.kind === kind);
    return (
      <section className={`flex flex-col gap-2 rounded-xl border p-4 ${kind === "buy" ? "border-positive/30" : "border-negative/30"}`}>
        <h3 className={`text-sm font-semibold ${kind === "buy" ? "text-positive" : "text-negative"}`}>
          {kind === "buy" ? r.buySignals : r.sellSignals} <span className="font-normal text-muted">({list.length})</span>
        </h3>
        {list.length === 0 ? (
          <p className="text-sm text-muted">{r.noneSide}</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {list.map((s) => (
              <li key={`${s.indicator}-${s.time}`} className="text-sm leading-snug">
                <span className="font-semibold">{r.indicators[s.indicator]}:</span> {explain(r.explain, s)}.
                <span className="mt-0.5 flex flex-wrap gap-1.5 text-xs text-muted">
                  <span>{ago(s.barsAgo)}</span>
                  {analysis && againstTrend(s, analysis.trend) && (
                    <span className="rounded-full bg-border/60 px-1.5 font-medium">{r.against}</span>
                  )}
                  {symbol && radar.isFresh(symbol, s) && <span className="rounded-full bg-accent px-1.5 font-semibold text-white">{r.new}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="radar-dialog-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto max-h-[92vh] w-[min(44rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/60"
    >
      {symbol && (
        <article className="flex flex-col gap-5 p-5 sm:p-6">
          <header className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <h2 id="radar-dialog-title" className="text-2xl font-bold tracking-tight">
                <span className="sr-only">{fmt(r.dialogTitle, { symbol })}: </span>
                <span className="font-mono">{symbol}</span>
              </h2>
              {name !== symbol && <p className="text-sm text-muted">{name}</p>}
              {analysis && (
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  {score && signals.length > 0 && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        score.bias === "bullish" ? "bg-positive/15 text-positive" : score.bias === "bearish" ? "bg-negative/15 text-negative" : "bg-border/60 text-muted"
                      }`}
                    >
                      {r.bias[score.bias]}
                      {score.strong && ` · ${r.strong}`}
                    </span>
                  )}
                  {score && <span className="text-muted">{signals.length === 0 ? r.none : fmt(r.counts, { buys: score.buys, sells: score.sells })}</span>}
                  {analysis.trend && <span className="text-muted">· {r.trend[analysis.trend]}</span>}
                </p>
              )}
            </div>
            <button type="button" onClick={onClose} aria-label={r.close} className="rounded-lg p-2 text-muted hover:bg-border/60 hover:text-foreground">
              <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="m5 5 10 10M15 5 5 15" />
              </svg>
            </button>
          </header>

          {!entry ? (
            <p className="text-sm text-muted">{r.loading}</p>
          ) : !analysis ? (
            <p className="text-sm text-muted">{entry.error ? r.itemError : r.insufficient}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {column("buy")}
              {column("sell")}
            </div>
          )}

          <footer className="flex flex-col gap-3 border-t border-border pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onOpenChart(symbol)}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                {r.openChart} →
              </button>
              {radar.checkedAt && (
                <span className="text-xs text-muted">
                  {fmt(r.checked, {
                    time: new Date(radar.checkedAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
                    min: radar.settings.interval,
                  })}
                </span>
              )}
            </div>
            <p className="text-xs text-muted">{r.disclaimer}</p>
          </footer>
        </article>
      )}
    </dialog>
  );
}

/** Configuração dos alertas, aberta pelo sino do cabeçalho dos favoritos. */
export function RadarSettingsPanel({ radar, locale }: { radar: SignalRadarState; locale: string }) {
  const { radar: r } = useI18n().t;
  const { settings, setSettings, permission } = radar;
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border p-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{r.title}</p>
        <button
          type="button"
          onClick={radar.refresh}
          disabled={radar.refreshing}
          className="rounded-md border border-border px-2 py-0.5 font-medium hover:bg-border/60 disabled:opacity-50"
        >
          {radar.refreshing ? r.refreshing : r.refresh}
        </button>
      </div>
      <p className="text-muted">{r.subtitle}</p>

      {/* Notificações: o pedido de permissão precisa partir de um clique. */}
      <div className="flex flex-wrap items-center gap-2">
        {permission === "default" && (
          <button type="button" onClick={radar.enableNotifications} className="rounded-md bg-accent px-2.5 py-1 font-medium text-white hover:opacity-90">
            {r.notifications.enable}
          </button>
        )}
        {permission === "granted" && <span className="font-medium text-positive">● {r.notifications.on}</span>}
        {permission === "denied" && <span className="text-muted">{r.notifications.blocked}</span>}
        {permission === "unsupported" && <span className="text-muted">{r.notifications.unsupported}</span>}
        <span className="w-full text-[11px] text-muted">{r.notifications.hint}</span>
      </div>

      <div>
        <p className="mb-1 font-semibold">{r.indicatorsLabel}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {RADAR_INDICATORS.map((indicator) => (
            <label key={indicator} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={settings.indicators.includes(indicator)}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    indicators: e.target.checked
                      ? RADAR_INDICATORS.filter((i) => i === indicator || s.indicators.includes(i))
                      : s.indicators.filter((i) => i !== indicator),
                  }))
                }
              />
              {r.indicators[indicator]}
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2">
        {r.interval}
        <select
          value={settings.interval}
          onChange={(e) => setSettings((s) => ({ ...s, interval: Number(e.target.value) as RadarInterval }))}
          className="rounded-md border border-border bg-surface px-1.5 py-0.5"
        >
          {RADAR_INTERVALS.map((n) => (
            <option key={n} value={n}>
              {fmt(r.minutes, { n })}
            </option>
          ))}
        </select>
      </label>

      <p className="text-[11px] text-muted">{r.legend}</p>
      {radar.failed && <p role="alert" className="text-negative">{r.error}</p>}
      {radar.checkedAt && (
        <p className="text-[11px] text-muted">
          {fmt(r.checked, {
            time: new Date(radar.checkedAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
            min: settings.interval,
          })}
        </p>
      )}
      <p className="text-[11px] text-muted">{r.disclaimer}</p>
    </div>
  );
}
