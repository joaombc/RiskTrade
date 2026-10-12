"use client";

import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { againstTrend, RADAR_INDICATORS, RADAR_INTERVALS, type RadarInterval } from "@/lib/radar";
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

/** Sinais de um favorito, abertos pelo sino. */
export function RadarSignals({ symbol, entry, radar }: { symbol: string; entry: RadarEntry | undefined; radar: SignalRadarState }) {
  const { radar: r } = useI18n().t;
  const ago = (n: number) => (n === 0 ? r.today : n === 1 ? r.agoOne : fmt(r.agoMany, { n }));
  if (!entry) return <p className="mt-2 text-xs text-muted">{r.loading}</p>;
  if (!entry.analysis) return <p className="mt-2 text-xs text-muted">{entry.error ? r.itemError : r.insufficient}</p>;
  const { analysis, score, signals } = entry;
  return (
    <div className="mt-2 flex flex-col gap-1.5 rounded-lg border border-border p-2.5 text-xs">
      <p className="flex flex-wrap items-center gap-1.5">
        {score && signals.length > 0 && (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              score.bias === "bullish" ? "bg-positive/15 text-positive" : score.bias === "bearish" ? "bg-negative/15 text-negative" : "bg-border/60 text-muted"
            }`}
          >
            {r.bias[score.bias]}
            {score.strong && ` · ${r.strong}`}
          </span>
        )}
        {analysis.trend && <span className="text-muted">{r.trend[analysis.trend]}</span>}
      </p>
      {signals.length === 0 ? (
        <p className="text-muted">{r.none}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {signals.map((s) => (
            <li key={`${s.indicator}-${s.kind}-${s.time}`} className="flex flex-wrap items-center gap-x-1.5">
              <span className={`font-semibold ${s.kind === "buy" ? "text-positive" : "text-negative"}`}>{r.kinds[s.kind]}</span>
              <span>
                {r.indicators[s.indicator]}
                {s.detail && ` (${r.details[s.detail]})`}
              </span>
              <span className="text-muted">· {ago(s.barsAgo)}</span>
              {againstTrend(s, analysis.trend) && <span className="text-muted">· {r.against}</span>}
              {radar.isFresh(symbol, s) && <span className="font-semibold text-accent">· {r.new}</span>}
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-muted">{r.disclaimer}</p>
    </div>
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
