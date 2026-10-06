"use client";

import { useEffect, useRef, useState } from "react";
import { apiErrorMessage } from "@/i18n/apiError";
import type { Dictionary } from "@/i18n/dictionary";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { maLabel } from "@/lib/movingAverages";
import type { Level, PremarketReport } from "@/lib/premarket";

/** Textos e formatos do idioma atual, passados às seções do relatório. */
interface Ctx {
  p: Dictionary["premarket"];
  t: Dictionary;
  usd: (v: number) => string;
  num: (v: number, digits?: number) => string;
  pct: (v: number) => string;
  compact: (v: number) => string;
  date: (iso: string) => string;
  time: (iso: string) => string;
}

function useCtx(): Ctx {
  const { t, locale } = useI18n();
  const num = (v: number, digits = 2) => v.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const compactFormat = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 2 });
  return {
    p: t.premarket,
    t,
    usd: (v) => v.toLocaleString(locale, { style: "currency", currency: "USD" }),
    num,
    pct: (v) => `${v >= 0 ? "+" : ""}${num(v)}%`,
    compact: (v) => compactFormat.format(v),
    date: (iso) =>
      new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso).toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "2-digit" }),
    time: (iso) => new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
  };
}

const tone = (v: number) => (v >= 0 ? "text-positive" : "text-negative");

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border/70 py-2 text-sm last:border-0 sm:grid-cols-[11rem_minmax(0,1fr)]">
      <dt className="font-medium text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Opening({ report, c }: { report: PremarketReport; c: Ctx }) {
  const { p, usd, num, pct, date, time } = c;
  const { opening, gap, atr, crossed } = report;
  if (!opening) return <p className="text-sm text-muted">{p.noTrading}</p>;
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold">{p.phaseTitle[opening.phase]}</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-3xl font-semibold tabular-nums">{usd(opening.price)}</span>
          <span className={`text-lg font-semibold tabular-nums ${tone(opening.change)}`}>
            {pct(opening.changePercent)} ({opening.change >= 0 ? "+" : "−"}
            {usd(Math.abs(opening.change))})
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">
          {fmt(p.reference, { price: usd(opening.reference), note: p.phaseNote[opening.phase] })}
          {opening.time && fmt(p.quoteTime, { time: time(opening.time) })}.
        </p>
      </div>
      {gap && atr && (
        <p className="rounded-lg bg-background/60 p-3 text-sm">
          <strong>{p.gapLabel[gap.size]}:</strong> {fmt(p.gapAtr, { atrs: num(gap.atrs), atr: usd(atr) })} {p.gapText[gap.size]}
        </p>
      )}
      {report.kind === "etf" && opening.phase !== "open" && <p className="text-xs text-muted">{p.etfLiquidity}</p>}
      {crossed && (
        <p
          role="status"
          className={`rounded-lg border p-3 text-sm ${crossed.kind === "resistance" ? "border-positive/40 bg-positive/10" : "border-negative/40 bg-negative/10"}`}
        >
          {p.alreadyAbove}{" "}
          <strong>{fmt(crossed.kind === "resistance" ? p.aboveResistance : p.belowSupport, { price: usd(crossed.level.price) })}</strong>{" "}
          {fmt(crossed.kind === "resistance" ? p.peakOf : p.troughOf, { date: date(crossed.level.date) })}
        </p>
      )}
    </div>
  );
}

function Technical({ report, c }: { report: PremarketReport; c: Ctx }) {
  const { p, t, usd, num, pct, compact, date } = c;
  const tm = report.technical;
  if (!tm) return <p className="text-sm text-muted">{p.noTechnical}</p>;
  const reference = report.opening?.reference ?? tm.close;
  const sma = (period: number) => maLabel({ kind: "sma", period }, t.ma.short);
  const side = (avg: number | null, name: string) =>
    avg === null ? fmt(p.avgUnavailable, { name }) : fmt(tm.close >= avg ? p.aboveAvg : p.belowAvg, { name, value: num(avg) });
  const distance = (level: Level) => pct(((level.price - reference) / reference) * 100);

  return (
    <dl>
      <Row label={p.rows.trend}>
        {fmt(p.trendText, { date: date(tm.closeDate), price: usd(tm.close), sma50: side(tm.sma50, sma(50)), sma200: side(tm.sma200, sma(200)) })}
      </Row>
      <Row label={p.rows.resistance}>
        {report.levels.resistance ? (
          <>
            {usd(report.levels.resistance.price)}{" "}
            <span className="text-muted">
              {fmt(p.peakDistance, { date: date(report.levels.resistance.date), distance: distance(report.levels.resistance) })}
            </span>
          </>
        ) : (
          <span className="text-muted">{p.noPeak}</span>
        )}
      </Row>
      <Row label={p.rows.support}>
        {report.levels.support ? (
          <>
            {usd(report.levels.support.price)}{" "}
            <span className="text-muted">
              {fmt(p.troughDistance, { date: date(report.levels.support.date), distance: distance(report.levels.support) })}
            </span>
          </>
        ) : (
          <span className="text-muted">{p.noTrough}</span>
        )}
      </Row>
      <Row label={p.rows.range52w}>
        {fmt(p.range52wText, {
          fromHigh: num(Math.abs(tm.range52w.fromHighPercent), 1),
          high: usd(tm.range52w.high),
          fromLow: num(tm.range52w.fromLowPercent, 1),
          low: usd(tm.range52w.low),
        })}
      </Row>
      <Row label={p.rows.volume}>
        {tm.volume ? (
          <>
            {compact(tm.volume.last)} ·{" "}
            <span className={tm.volume.ratio >= 1 ? "font-semibold text-positive" : ""}>
              {fmt(p.volumeText, { percent: num(tm.volume.ratio * 100, 0) })}
            </span>
          </>
        ) : (
          <span className="text-muted">{p.noVolume}</span>
        )}
      </Row>
      <Row label={fmt(p.rows.cross, { pair: `${sma(10)} × 50` })}>
        {tm.cross.last ? (
          <>
            {p.lastSignal}{" "}
            <strong className={tm.cross.last.kind.startsWith("buy") ? "text-positive" : "text-negative"}>
              {t.cross.labels[tm.cross.last.kind]}
            </strong>{" "}
            {fmt(p.signalOn, { date: date(tm.cross.last.date), price: usd(tm.cross.last.close) })}
          </>
        ) : (
          p.noCross
        )}
        {tm.cross.position && fmt(tm.cross.position === "above" ? p.crossNowAbove : p.crossNowBelow, { short: sma(10), long: sma(50) })}
      </Row>
      <Row label={p.rows.divergence}>
        {tm.divergence ? (
          <>
            <strong className={tm.divergence.kind === "bearish" ? "text-negative" : "text-positive"}>
              {tm.divergence.kind === "bearish" ? p.bearish : p.bullish}
            </strong>{" "}
            {fmt(p.divergenceOn, { date: date(tm.divergence.date), bars: tm.divergence.barsAgo })}
          </>
        ) : (
          <span className="text-muted">{p.noDivergence}</span>
        )}
      </Row>
    </dl>
  );
}

function Events({ report, c }: { report: PremarketReport; c: Ctx }) {
  const { p, usd, date, time } = c;
  const { earnings, analysts, news } = report;
  return (
    <div className="flex flex-col gap-4">
      {report.kind === "etf" ? (
        <p className="text-sm text-muted">{p.etfEvents}</p>
      ) : (
        <dl>
          <Row label={p.rows.earnings}>
            {earnings ? (
              <span className={earnings.daysAway <= 7 ? "font-semibold text-warning" : ""}>
                {date(earnings.date)}
                {earnings.estimate && p.estimated}
                {earnings.daysAway === 1 ? p.inOneDay : fmt(p.inDays, { n: earnings.daysAway })}
                {earnings.daysAway <= 7 && p.earningsSoon}
              </span>
            ) : (
              <span className="text-muted">{p.noEarnings}</span>
            )}
          </Row>
          <Row label={p.rows.analysts}>
            {analysts.length === 0 ? (
              <span className="text-muted">{p.noAnalysts}</span>
            ) : (
              <ul className="flex flex-col gap-1">
                {analysts.map((a) => (
                  <li key={`${a.firm}-${a.date}`}>
                    <span className="text-muted">{date(a.date)} · </span>
                    {a.firm} {p.analystAction[a.action as keyof typeof p.analystAction] ?? a.action} <strong>{a.toGrade}</strong>
                    {a.priceTarget !== null && (
                      <span className="text-muted">
                        {" "}
                        ·{" "}
                        {a.priorPriceTarget === null || a.priorPriceTarget === a.priceTarget ? (
                          fmt(p.target, { price: usd(a.priceTarget) })
                        ) : (
                          <>
                            <span className={a.priceTarget > a.priorPriceTarget ? "text-positive" : "text-negative"}>
                              {fmt(a.priceTarget > a.priorPriceTarget ? p.targetRaised : p.targetCut, { price: usd(a.priceTarget) })}
                            </span>{" "}
                            {fmt(p.targetBefore, { price: usd(a.priorPriceTarget) })}
                          </>
                        )}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Row>
        </dl>
      )}
      <div>
        <p className="mb-2 text-sm font-medium text-muted">{fmt(p.newsTitle, { symbol: report.symbol })}</p>
        {news.length === 0 ? (
          <p className="text-sm text-muted">{p.noNews}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {news.map((n) => (
              <li key={n.link} className="text-sm">
                <a href={n.link} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-accent hover:underline">
                  {n.title}
                </a>
                <span className="block text-xs text-muted">
                  {n.publisher} · {date(n.time)} {time(n.time)}
                  {n.tickers > 1 && fmt(p.mentions, { n: n.tickers })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Context({ report, c }: { report: PremarketReport; c: Ctx }) {
  const { p, num, pct } = c;
  if (report.context.length === 0) return <p className="text-sm text-muted">{p.noContext}</p>;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {report.context.map((item) => (
        <div key={item.symbol} className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted">{p.contextLabels[item.symbol as keyof typeof p.contextLabels] ?? item.label}</p>
          <p className="mt-1 font-semibold tabular-nums">{num(item.price)}</p>
          <p className={`text-sm font-semibold tabular-nums ${tone(item.changePercent)}`}>{pct(item.changePercent)}</p>
        </div>
      ))}
    </div>
  );
}

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; report: PremarketReport };

/** Relatório pré-market de uma ação ou ETF americano, aberto pelo botão do card do ativo. */
export function PremarketDialog({ symbol, onClose }: { symbol: string; onClose: () => void }) {
  const c = useCtx();
  const { p, t } = c;
  const ref = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<State>({ kind: "loading" });
  /** Incrementada pelo botão "Atualizar" para buscar o relatório de novo. */
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  // O estado só muda nos callbacks da resposta; o esqueleto de carregamento é marcado por quem pede.
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/premarket?symbol=${encodeURIComponent(symbol)}`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(apiErrorMessage(t.errors, data, t.errors.reportFailed));
        setState({ kind: "ready", report: data.report });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setState({ kind: "error", message: err instanceof Error ? err.message : String(err) });
      });
    return () => controller.abort();
  }, [symbol, reloadKey, t.errors]);

  const refresh = () => {
    setState({ kind: "loading" });
    setReloadKey((k) => k + 1);
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="premarket-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto max-h-[92vh] w-[min(52rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/60"
    >
      <article className="flex flex-col gap-6 p-5 sm:p-7">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id="premarket-title" className="text-2xl font-bold tracking-tight">
              {p.title} · <span className="font-mono">{symbol}</span>
            </h2>
            <p className="text-sm text-muted">
              {state.kind === "ready"
                ? fmt(p.generated, {
                    kind: state.report.kind === "etf" ? p.etfTag : "",
                    name: state.report.name,
                    time: c.time(state.report.generatedAt),
                  })
                : p.subtitleIdle}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={refresh}
              disabled={state.kind === "loading"}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-border/60 hover:text-foreground disabled:opacity-40"
            >
              {p.refresh}
            </button>
            <button type="button" onClick={onClose} aria-label={p.close} className="rounded-lg p-2 text-muted hover:bg-border/60 hover:text-foreground">
              <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="m5 5 10 10M15 5 5 15" />
              </svg>
            </button>
          </div>
        </header>

        {state.kind === "loading" && (
          <div role="status" aria-label={p.loading} className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-border/40" />
            ))}
          </div>
        )}
        {state.kind === "error" && (
          <div role="alert" className="rounded-xl border border-negative/40 bg-negative/10 p-4 text-sm text-negative">
            {state.message}
          </div>
        )}
        {state.kind === "ready" && (
          <>
            <Section title={p.sections.opening}>
              <Opening report={state.report} c={c} />
            </Section>
            <Section title={p.sections.technical}>
              <Technical report={state.report} c={c} />
            </Section>
            <Section title={p.sections.events}>
              <Events report={state.report} c={c} />
            </Section>
            <Section title={p.sections.context}>
              <Context report={state.report} c={c} />
            </Section>
            <footer className="border-t border-border pt-4 text-xs text-muted">{p.footer}</footer>
          </>
        )}
      </article>
    </dialog>
  );
}
