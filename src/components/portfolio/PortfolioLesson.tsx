"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";

/** Barras da conta do exemplo: cada uma com a fração do capital (0 a 1). */
function AllocationChart() {
  const a = useI18n().t.portfolioLesson.allocation;
  const bars = [
    { label: a.chartLabels.market, share: 0.1, className: "bg-accent/70" },
    { label: a.chartLabels.risk, share: 0.05, className: "bg-negative" },
  ];
  return (
    <figure className="flex flex-col gap-2 rounded-xl border border-border/70 bg-background/60 p-4">
      <figcaption className="text-xs font-semibold">{a.chart}</figcaption>
      <div className="flex h-6 overflow-hidden rounded-md text-[11px] font-medium">
        <div className="flex w-1/2 items-center justify-center bg-accent text-white">{a.chartLabels.invested}</div>
        <div className="flex w-1/2 items-center justify-center bg-border/70 text-muted">{a.chartLabels.cash}</div>
      </div>
      {bars.map((bar) => (
        <div key={bar.label} className="flex items-center gap-2 text-[11px]">
          <div className={`h-4 rounded-sm ${bar.className}`} style={{ width: `${bar.share * 100}%` }} />
          <span className="text-muted">{bar.label}</span>
        </div>
      ))}
    </figure>
  );
}

/** Entrada, stop a 1 unidade e alvo a 3 unidades. */
function RewardRiskDiagram() {
  const r = useI18n().t.portfolioLesson.reward;
  const [w, unit] = [260, 34];
  const y = (units: number) => 10 + (3 - units) * unit;
  const line = (units: number, label: string, className: string) => (
    <g className={className}>
      <line x1={80} x2={w - 10} y1={y(units)} y2={y(units)} stroke="currentColor" strokeWidth={1.5} strokeDasharray={units === 0 ? undefined : "5 3"} />
      <text x={w - 10} y={y(units) - 4} textAnchor="end" fontSize={11} fontWeight={600} fill="currentColor">
        {label}
      </text>
    </g>
  );
  return (
    <svg role="img" aria-label={r.diagram} viewBox={`0 0 ${w} ${y(-1) + 12}`} className="h-auto w-full max-w-sm">
      <rect x={14} y={y(3)} width={52} height={3 * unit} rx={3} className="fill-positive/20 stroke-positive" />
      <rect x={14} y={y(0)} width={52} height={unit} rx={3} className="fill-negative/20 stroke-negative" />
      <text x={40} y={y(1.5)} textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700} className="fill-positive" transform={`rotate(-90 40 ${y(1.5)})`}>
        {r.labels.reward}
      </text>
      <text x={40} y={y(-0.5)} textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={700} className="fill-negative">
        {r.labels.risk}
      </text>
      {line(3, r.labels.target, "text-positive")}
      {line(0, r.labels.entry, "text-foreground")}
      {line(-1, r.labels.stop, "text-negative")}
    </svg>
  );
}

const paragraph = "text-sm leading-relaxed text-foreground/90";

/** Corpo da aula (página /carteira/aula). */
export function PortfolioLessonBody() {
  const l = useI18n().t.portfolioLesson;
  return (
    <div className="flex flex-col gap-8">
      <p className={`max-w-3xl ${paragraph}`}>{l.intro}</p>

      <section className="flex flex-col gap-2">
        <h3 className="text-base font-semibold">{l.elements.heading}</h3>
        <p className={`max-w-3xl ${paragraph}`}>{l.elements.text}</p>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-base font-semibold">{l.allocation.heading}</h3>
        <p className={`max-w-3xl ${paragraph}`}>{l.allocation.text}</p>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <ul className="grid gap-3 sm:grid-cols-2">
            {l.allocation.rules.map((rule) => (
              <li key={rule.title} className="rounded-xl border border-border p-3">
                <div className="text-2xl font-bold tabular-nums text-accent">{rule.limit}</div>
                <div className="text-sm font-semibold">{rule.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-muted">{rule.text}</p>
              </li>
            ))}
          </ul>
          <AllocationChart />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">{l.diversification.heading}</h3>
          <p className={paragraph}>{l.diversification.text}</p>
        </section>
        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">{l.stops.heading}</h3>
          <p className={paragraph}>{l.stops.text}</p>
        </section>
      </div>

      <section className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">{l.reward.heading}</h3>
          {l.reward.paragraphs.map((p) => (
            <p key={p} className={paragraph}>
              {p}
            </p>
          ))}
        </div>
        <div className="flex justify-center rounded-xl border border-border/70 bg-background/60 p-4">
          <RewardRiskDiagram />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-base font-semibold">{l.units.heading}</h3>
        <p className={`max-w-3xl ${paragraph}`}>{l.units.text}</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {l.units.items.map((item) => (
            <li key={item.title} className="rounded-xl border border-border p-3">
              <div className="text-sm font-semibold">{item.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">{item.text}</p>
            </li>
          ))}
        </ul>
        <p className="rounded-xl bg-accent/10 p-3 text-sm leading-relaxed">{l.units.note}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-base font-semibold">{l.streaks.heading}</h3>
        {l.streaks.paragraphs.map((p) => (
          <p key={p} className={`max-w-3xl ${paragraph}`}>
            {p}
          </p>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-base font-semibold">{l.tactics.heading}</h3>
        <p className={`max-w-3xl ${paragraph}`}>{l.tactics.text}</p>
        <ul className="flex flex-col gap-2.5">
          {l.tactics.items.map((item) => (
            <li key={item.title} className="text-sm leading-relaxed">
              <strong>{item.title}.</strong> <span className="text-foreground/90">{item.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-base font-semibold">{l.combining.heading}</h3>
        {l.combining.paragraphs.map((p) => (
          <p key={p} className={`max-w-3xl ${paragraph}`}>
            {p}
          </p>
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-base font-semibold">{l.orders.heading}</h3>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {l.orders.items.map((order) => (
            <div key={order.name} className="rounded-xl border border-border p-3">
              <dt className="text-sm font-semibold">{order.name}</dt>
              <dd className="mt-1 text-xs leading-relaxed text-foreground/90">{order.text}</dd>
            </div>
          ))}
        </dl>
        <p className="rounded-xl bg-accent/10 p-3 text-sm leading-relaxed">{l.orders.note}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">{l.intraday.heading}</h3>
          {l.intraday.paragraphs.map((p) => (
            <p key={p} className={paragraph}>
              {p}
            </p>
          ))}
        </section>
        <section className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">{l.stocks.heading}</h3>
          {l.stocks.paragraphs.map((p) => (
            <p key={p} className={paragraph}>
              {p}
            </p>
          ))}
        </section>
      </div>

      <section className="flex flex-col gap-3">
        <h3 className="text-base font-semibold">{l.rulesHeading}</h3>
        <ol className="grid list-decimal gap-x-8 gap-y-1.5 pl-6 text-sm leading-relaxed text-foreground/90 marker:font-semibold marker:text-accent md:grid-cols-2">
          {l.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
      </section>

      <p className="border-t border-border pt-3 text-xs text-muted">{l.source}</p>
    </div>
  );
}

/** Card no topo da página da carteira, com o link para a aula. */
export function PortfolioLessonCard() {
  const { t, href } = useI18n();
  const l = t.portfolioLesson;
  return (
    <section aria-labelledby="aula-carteira" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent/30 bg-surface p-5 shadow-sm sm:p-6">
      <div className="max-w-3xl">
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">{l.eyebrow}</span>
        <h2 id="aula-carteira" className="mt-2 text-xl font-semibold">
          {l.title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">{l.summary}</p>
      </div>
      <Link href={href("/carteira/aula")} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
        {l.read} →
      </Link>
    </section>
  );
}

/** Os três elementos (o quê, quando, quanto), as seções prontas (children) e o que ainda vem. */
export function PortfolioIntro({ children }: { children?: React.ReactNode }) {
  const p = useI18n().t.portfolio;
  return (
    <>
      <section aria-labelledby="elementos" className="flex flex-col gap-3">
        <h2 id="elementos" className="text-xl font-semibold">
          {p.elementsTitle}
        </h2>
        <ol className="grid gap-3 md:grid-cols-3">
          {p.elements.map((element, k) => (
            <li key={element.name} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-semibold">
                  <span className="mr-1.5 text-accent">{k + 1}.</span>
                  {element.name}
                </h3>
                <span className="text-sm font-medium text-muted">{element.question}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">{element.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {children}

      <section aria-labelledby="secoes-carteira" className="flex flex-col gap-3">
        <h2 id="secoes-carteira" className="text-xl font-semibold">
          {p.sectionsTitle}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {p.sections.map((section) => (
            <li key={section.title} className="rounded-2xl border border-dashed border-border p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{section.title}</h3>
                <span className="rounded-full bg-border/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">{p.soon}</span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{section.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="rounded-xl border border-border bg-border/30 p-3 text-xs leading-relaxed text-muted">{p.disclaimer}</p>
    </>
  );
}
