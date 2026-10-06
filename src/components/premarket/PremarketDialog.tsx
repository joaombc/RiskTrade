"use client";

import { useEffect, useRef, useState } from "react";
import type { GapSize, Level, OpeningPhase, PremarketReport } from "@/lib/premarket";
import { CROSS_SIGNAL_LABELS } from "@/lib/movingAverages";

const PHASE_TITLE: Record<OpeningPhase, string> = {
  pre: "Pré-mercado agora",
  open: "Abertura de hoje",
  after: "After-hours",
};

const PHASE_NOTE: Record<OpeningPhase, string> = {
  pre: "comparado ao fechamento do último pregão",
  open: "o pregão já abriu: este é o gap real da abertura sobre o fechamento anterior",
  after: "negócios depois do fechamento, como prévia do próximo pregão",
};

const GAP_TEXT: Record<GapSize, string> = {
  small: "Dentro do ruído normal do ativo; sozinho, não muda a leitura do gráfico.",
  moderate: "Relevante; observe se o preço sustenta o nível depois da abertura.",
  large:
    "Maior que a oscilação de um dia inteiro. Gaps assim costumam vir de notícia; veja no gráfico se é de rompimento, de continuação ou de exaustão.",
};

const GAP_LABEL: Record<GapSize, string> = { small: "Gap pequeno", moderate: "Gap moderado", large: "Gap grande" };

const ANALYST_ACTION: Record<string, string> = {
  up: "elevou para",
  down: "rebaixou para",
  main: "manteve",
  reit: "reiterou",
  init: "iniciou cobertura com",
};

const usd = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "USD" });
const num = (v: number, digits = 2) => v.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const pct = (v: number) => `${v >= 0 ? "+" : ""}${num(v)}%`;
const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 2 });
const date = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
const time = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const tone = (v: number) => (v >= 0 ? "text-positive" : "text-negative");
const distance = (level: Level, from: number) => pct(((level.price - from) / from) * 100);

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

function Opening({ report }: { report: PremarketReport }) {
  const { opening, gap, atr, crossed } = report;
  if (!opening) {
    return (
      <p className="text-sm text-muted">
        Sem negócios fora do pregão no momento. O pré-mercado americano vai das 4h às 9h30 de Nova York, e o after-hours, das 16h às 20h.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold">{PHASE_TITLE[opening.phase]}</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-3xl font-semibold tabular-nums">{usd(opening.price)}</span>
          <span className={`text-lg font-semibold tabular-nums ${tone(opening.change)}`}>
            {pct(opening.changePercent)} ({opening.change >= 0 ? "+" : "−"}
            {usd(Math.abs(opening.change))})
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">
          Fechamento de referência {usd(opening.reference)}; {PHASE_NOTE[opening.phase]}
          {opening.time && `. Cotação das ${time(opening.time)} (seu horário)`}.
        </p>
      </div>
      {gap && atr && (
        <p className="rounded-lg bg-background/60 p-3 text-sm">
          <strong>{GAP_LABEL[gap.size]}:</strong> {num(gap.atrs)} ATR (a oscilação média diária dos últimos 14 pregões é{" "}
          {usd(atr)}). {GAP_TEXT[gap.size]}
        </p>
      )}
      {report.kind === "etf" && opening.phase !== "open" && (
        <p className="text-xs text-muted">
          ETF fora do pregão: nos mais negociados (SPY, QQQ) o preço é confiável, mas em ETFs menores pode haver poucos negócios e
          spread largo, e o preço pode se afastar do valor da carteira até a abertura.
        </p>
      )}
      {crossed && (
        <p
          role="status"
          className={`rounded-lg border p-3 text-sm ${crossed.kind === "resistance" ? "border-positive/40 bg-positive/10" : "border-negative/40 bg-negative/10"}`}
        >
          {crossed.kind === "resistance" ? (
            <>
              O preço já está <strong>acima da resistência de {usd(crossed.level.price)}</strong> (topo de {date(crossed.level.date)}). Se a
              abertura confirmar, pode ser um gap de rompimento para cima.
            </>
          ) : (
            <>
              O preço já está <strong>abaixo do suporte de {usd(crossed.level.price)}</strong> (fundo de {date(crossed.level.date)}). Se a
              abertura confirmar, pode ser um gap de rompimento para baixo.
            </>
          )}
        </p>
      )}
    </div>
  );
}

function Technical({ report }: { report: PremarketReport }) {
  const t = report.technical;
  if (!t) return <p className="text-sm text-muted">Histórico insuficiente para o mapa técnico.</p>;
  const reference = report.opening?.reference ?? t.close;
  const side = (avg: number | null, name: string) =>
    avg === null ? `${name} indisponível` : `${t.close >= avg ? "acima" : "abaixo"} da ${name} (${num(avg)})`;

  return (
    <dl>
      <Row label="Tendência pelas médias">
        Fechamento de {date(t.closeDate)} ({usd(t.close)}) {side(t.sma50, "MMS 50")} e {side(t.sma200, "MMS 200")}.
      </Row>
      <Row label="Resistência mais próxima">
        {report.levels.resistance ? (
          <>
            {usd(report.levels.resistance.price)} <span className="text-muted">(topo de {date(report.levels.resistance.date)}, {distance(report.levels.resistance, reference)})</span>
          </>
        ) : (
          <span className="text-muted">nenhum topo acima do preço no último ano</span>
        )}
      </Row>
      <Row label="Suporte mais próximo">
        {report.levels.support ? (
          <>
            {usd(report.levels.support.price)} <span className="text-muted">(fundo de {date(report.levels.support.date)}, {distance(report.levels.support, reference)})</span>
          </>
        ) : (
          <span className="text-muted">nenhum fundo abaixo do preço no último ano</span>
        )}
      </Row>
      <Row label="52 semanas">
        {num(Math.abs(t.range52w.fromHighPercent), 1)}% abaixo da máxima ({usd(t.range52w.high)}) ·{" "}
        {num(t.range52w.fromLowPercent, 1)}% acima da mínima ({usd(t.range52w.low)})
      </Row>
      <Row label="Volume do último pregão">
        {t.volume ? (
          <>
            {compact.format(t.volume.last)} ·{" "}
            <span className={t.volume.ratio >= 1 ? "font-semibold text-positive" : ""}>{num(t.volume.ratio * 100, 0)}% da média de 20 dias</span>
          </>
        ) : (
          <span className="text-muted">sem dados de volume</span>
        )}
      </Row>
      <Row label="Cruzamento MMS 10 × 50">
        {t.cross.last ? (
          <>
            Último sinal: <strong className={t.cross.last.kind.startsWith("buy") ? "text-positive" : "text-negative"}>{CROSS_SIGNAL_LABELS[t.cross.last.kind]}</strong> em{" "}
            {date(t.cross.last.date)} (fechamento {usd(t.cross.last.close)}).
          </>
        ) : (
          "Nenhum cruzamento no último ano."
        )}
        {t.cross.position && ` Agora a MMS 10 está ${t.cross.position === "above" ? "acima" : "abaixo"} da MMS 50.`}
      </Row>
      <Row label="Divergência de OBV">
        {t.divergence ? (
          <>
            <strong className={t.divergence.kind === "bearish" ? "text-negative" : "text-positive"}>
              {t.divergence.kind === "bearish" ? "Baixista" : "Altista"}
            </strong>{" "}
            em {date(t.divergence.date)} (há {t.divergence.barsAgo} pregões).
          </>
        ) : (
          <span className="text-muted">nenhuma nos últimos 30 pregões</span>
        )}
      </Row>
    </dl>
  );
}

function Events({ report }: { report: PremarketReport }) {
  const { earnings, analysts, news } = report;
  return (
    <div className="flex flex-col gap-4">
      {report.kind === "etf" ? (
        <p className="text-sm text-muted">
          ETF não divulga balanço trimestral nem tem cobertura de analistas como as ações. Os eventos que movem um ETF são os das
          empresas da carteira e os indicadores econômicos.
        </p>
      ) : (
        <dl>
          <Row label="Próximo balanço">
            {earnings ? (
              <span className={earnings.daysAway <= 7 ? "font-semibold text-warning" : ""}>
                {date(earnings.date)}
                {earnings.estimate && " (data estimada)"} · em {earnings.daysAway} {earnings.daysAway === 1 ? "dia" : "dias"}
                {earnings.daysAway <= 7 && " · atenção: balanço costuma abrir gaps"}
              </span>
            ) : (
              <span className="text-muted">sem data divulgada</span>
            )}
          </Row>
          <Row label="Analistas (30 dias)">
            {analysts.length === 0 ? (
              <span className="text-muted">nenhuma mudança recente</span>
            ) : (
              <ul className="flex flex-col gap-1">
                {analysts.map((a) => (
                  <li key={`${a.firm}-${a.date}`}>
                    <span className="text-muted">{date(a.date)} · </span>
                    {a.firm} {ANALYST_ACTION[a.action] ?? a.action} <strong>{a.toGrade}</strong>
                    {a.priceTarget !== null && (
                      <span className="text-muted">
                        {" "}
                        ·{" "}
                        {a.priorPriceTarget === null || a.priorPriceTarget === a.priceTarget ? (
                          <>alvo {usd(a.priceTarget)}</>
                        ) : (
                          <>
                            alvo{" "}
                            <span className={a.priceTarget > a.priorPriceTarget ? "text-positive" : "text-negative"}>
                              {a.priceTarget > a.priorPriceTarget ? "elevado" : "cortado"} para {usd(a.priceTarget)}
                            </span>{" "}
                            (antes {usd(a.priorPriceTarget)})
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
        <p className="mb-2 text-sm font-medium text-muted">Notícias que citam {report.symbol}</p>
        {news.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma notícia recente.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {news.map((n) => (
              <li key={n.link} className="text-sm">
                <a href={n.link} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-accent hover:underline">
                  {n.title}
                </a>
                <span className="block text-xs text-muted">
                  {n.publisher} · {date(n.time)} {time(n.time)}
                  {n.tickers > 1 && ` · cita ${n.tickers} empresas`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Context({ report }: { report: PremarketReport }) {
  if (report.context.length === 0) return <p className="text-sm text-muted">Contexto indisponível no momento.</p>;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {report.context.map((c) => (
        <div key={c.symbol} className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted">{c.label}</p>
          <p className="mt-1 font-semibold tabular-nums">{num(c.price)}</p>
          <p className={`text-sm font-semibold tabular-nums ${tone(c.changePercent)}`}>{pct(c.changePercent)}</p>
        </div>
      ))}
    </div>
  );
}

type State = { kind: "loading" } | { kind: "error"; message: string } | { kind: "ready"; report: PremarketReport };

/** Relatório pré-market de uma ação americana, aberto pelo botão do card do ativo. */
export function PremarketDialog({ symbol, onClose }: { symbol: string; onClose: () => void }) {
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
        if (!res.ok) throw new Error(data.error ?? "Falha ao gerar o relatório.");
        setState({ kind: "ready", report: data.report });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setState({ kind: "error", message: err instanceof Error ? err.message : String(err) });
      });
    return () => controller.abort();
  }, [symbol, reloadKey]);

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
              Relatório pré-market · <span className="font-mono">{symbol}</span>
            </h2>
            <p className="text-sm text-muted">
              {state.kind === "ready"
                ? `${state.report.kind === "etf" ? "ETF · " : ""}${state.report.name} · gerado às ${time(state.report.generatedAt)}`
                : "Ações e ETFs do mercado americano"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={refresh}
              disabled={state.kind === "loading"}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-border/60 hover:text-foreground disabled:opacity-40"
            >
              Atualizar
            </button>
            <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-lg p-2 text-muted hover:bg-border/60 hover:text-foreground">
              <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="m5 5 10 10M15 5 5 15" />
              </svg>
            </button>
          </div>
        </header>

        {state.kind === "loading" && (
          <div role="status" aria-label="Gerando o relatório" className="flex flex-col gap-3">
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
            <Section title="1. Abertura esperada">
              <Opening report={state.report} />
            </Section>
            <Section title="2. Mapa técnico">
              <Technical report={state.report} />
            </Section>
            <Section title="3. Eventos">
              <Events report={state.report} />
            </Section>
            <Section title="4. Contexto do mercado">
              <Context report={state.report} />
            </Section>
            <footer className="border-t border-border pt-4 text-xs text-muted">
              Dados do Yahoo Finance, que podem ter atraso. Topos e fundos são confirmados por 5 pregões de cada lado; médias e
              sinais seguem Murphy (cap. 9). O relatório mostra fatos e níveis a observar: não é recomendação de compra ou venda.
            </footer>
          </>
        )}
      </article>
    </dialog>
  );
}
