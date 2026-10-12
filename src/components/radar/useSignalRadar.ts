"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Dictionary } from "@/i18n/dictionary";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import {
  loadRadarSettings,
  loadSeenSignals,
  newSignals,
  saveRadarSettings,
  saveSeenSignals,
  scoreRadar,
  signalKey,
  type RadarAnalysis,
  type RadarItem,
  type RadarScore,
  type RadarSettings,
  type RadarSignal,
} from "@/lib/radar";

export type Permission = NotificationPermission | "unsupported";

const noSubscription = () => () => {};
const readPermission = (): Permission => (typeof Notification === "undefined" ? "unsupported" : Notification.permission);

/** Uma notificação por ativo com sinais novos; clicar nela abre o ativo. */
function notify(news: { symbol: string; signals: RadarSignal[] }[], r: Dictionary["radar"], onSelect: (symbol: string) => void) {
  if (readPermission() !== "granted") return;
  for (const { symbol, signals } of news) {
    const list = signals.map((s) => `${r.indicators[s.indicator]} (${r.kinds[s.kind]})`).join(", ");
    const n = new Notification(fmt(r.notifyTitle, { symbol }), { body: fmt(r.notifyBody, { list }), tag: `radar-${symbol}` });
    n.onclick = () => {
      window.focus();
      onSelect(symbol);
      n.close();
    };
  }
}

/** O que o radar sabe de um ativo: a análise (ou erro) e o placar com os indicadores escolhidos. */
export interface RadarEntry {
  analysis: RadarAnalysis | null;
  error: boolean;
  score: RadarScore | null;
  /** Sinais dos indicadores escolhidos. */
  signals: RadarSignal[];
  /** Algum sinal apareceu depois que a página abriu e ainda não foi visto. */
  hasNew: boolean;
}

/**
 * Radar de sinais dos favoritos: analisa todos ao abrir e a cada intervalo, guarda os sinais já
 * vistos e avisa (notificação do navegador) quando surge um sinal novo.
 */
export function useSignalRadar(symbols: string[], onSelect: (symbol: string) => void) {
  const { t } = useI18n();
  const r = t.radar;
  const key = [...symbols].sort().join(",");
  const [settings, setSettings] = useState<RadarSettings>(loadRadarSettings);
  const [data, setData] = useState<{ items: RadarItem[]; checkedAt: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  /** Sinais novos desde que a página abriu e ainda não vistos (o sino ganha um ponto). */
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());
  // A permissão não tem evento de mudança: o contador força a releitura depois do pedido.
  const [, setPermissionVersion] = useState(0);
  const permission = useSyncExternalStore(noSubscription, readPermission, () => "default" as Permission);

  // As varreduras leem sempre o valor atual, sem reiniciar o intervalo a cada mudança.
  const latest = useRef({ indicators: settings.indicators, r, onSelect });
  useEffect(() => {
    latest.current = { indicators: settings.indicators, r, onSelect };
  });

  useEffect(() => {
    saveRadarSettings(settings);
  }, [settings]);

  const check = useCallback(async (list: string) => {
    try {
      const res = await fetch(`/api/radar?symbols=${encodeURIComponent(list)}`);
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as { items: RadarItem[]; checkedAt: string };
      const results = json.items.flatMap((i) => ("analysis" in i && i.analysis ? [{ symbol: i.symbol, signals: i.analysis.signals }] : []));
      const seen = loadSeenSignals();
      // Na primeira varredura, os sinais que já existem só são registrados: sem avalanche de avisos.
      if (seen) {
        const news = newSignals(results, seen, latest.current.indicators);
        if (news.length > 0) {
          setFresh((prev) => new Set([...prev, ...news.flatMap((n) => n.signals.map((s) => signalKey(n.symbol, s)))]));
          notify(news, latest.current.r, latest.current.onSelect);
        }
      }
      saveSeenSignals(new Set([...(seen ?? []), ...results.flatMap((x) => x.signals.map((s) => signalKey(x.symbol, s)))]));
      setData(json);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!key) return;
    void check(key);
    // Em aba de segundo plano o navegador atrasa os timers em até 1 min: irrelevante para candles diários.
    const id = setInterval(() => void check(key), settings.interval * 60_000);
    return () => clearInterval(id);
  }, [key, settings.interval, check]);

  const entries: Record<string, RadarEntry> = {};
  for (const item of data?.items ?? []) {
    const analysis = "analysis" in item ? item.analysis : null;
    const signals = analysis ? analysis.signals.filter((s) => settings.indicators.includes(s.indicator)) : [];
    entries[item.symbol] = {
      analysis,
      error: "error" in item,
      score: analysis ? scoreRadar(analysis, settings.indicators) : null,
      signals,
      hasNew: signals.some((s) => fresh.has(signalKey(item.symbol, s))),
    };
  }

  return {
    entries,
    settings,
    setSettings,
    checkedAt: data?.checkedAt ?? null,
    loaded: data !== null,
    failed,
    refreshing,
    permission,
    isFresh: (symbol: string, s: RadarSignal) => fresh.has(signalKey(symbol, s)),
    refresh: () => {
      if (!key) return;
      setRefreshing(true);
      void check(key);
    },
    /** Tira a marca de "novo" dos sinais de um ativo (o usuário abriu o sino). */
    markSeen: (symbol: string) => setFresh((prev) => new Set([...prev].filter((k) => !k.startsWith(`${symbol}|`)))),
    enableNotifications: async () => {
      await Notification.requestPermission();
      setPermissionVersion((v) => v + 1);
    },
  };
}

export type SignalRadarState = ReturnType<typeof useSignalRadar>;
