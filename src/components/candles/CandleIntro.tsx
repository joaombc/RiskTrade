import type { Dictionary } from "@/i18n/dictionary";

type IntroText = Dictionary["candleIntro"];

/** Introdução da página: anatomia da vela e as regras de uso dos padrões (Murphy, cap. 12). */
function Anatomy({ t }: { t: IntroText }) {
  // Vela de alta à esquerda e de baixa à direita, com os rótulos dos preços.
  return (
    <svg role="img" aria-label={t.diagramLabel} viewBox="0 0 260 150" className="h-auto w-full max-w-md">
      <g className="text-positive">
        <line x1={60} x2={60} y1={15} y2={135} stroke="currentColor" strokeWidth={2} />
        <rect x={45} y={40} width={30} height={65} fill="currentColor" rx={2} />
      </g>
      <g className="text-negative">
        <line x1={190} x2={190} y1={15} y2={135} stroke="currentColor" strokeWidth={2} />
        <rect x={175} y={40} width={30} height={65} fill="currentColor" rx={2} />
      </g>
      <g className="fill-foreground text-[8px]">
        <text x={80} y={18}>{t.high}</text>
        <text x={80} y={43}>{t.close}</text>
        <text x={80} y={108}>{t.open}</text>
        <text x={80} y={138}>{t.low}</text>
        <text x={6} y={28} className="fill-muted">{t.shadow}</text>
        <text x={6} y={75} className="fill-muted">{t.body}</text>
        <text x={6} y={124} className="fill-muted">{t.shadow}</text>
        <text x={210} y={43}>{t.open}</text>
        <text x={210} y={108}>{t.close}</text>
      </g>
      <g className="fill-muted text-[8px]">
        <text x={60} y={149} textAnchor="middle">
          {t.bullish}
        </text>
        <text x={190} y={149} textAnchor="middle">
          {t.bearish}
        </text>
      </g>
    </svg>
  );
}

export function CandleIntro({ t }: { t: IntroText }) {
  return (
    <section aria-labelledby="como-ler" className="grid gap-6 rounded-2xl border border-border bg-surface p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:p-6">
      <div className="flex flex-col gap-3">
        <h2 id="como-ler" className="text-xl font-semibold">
          {t.heading}
        </h2>
        <p className="text-sm leading-relaxed text-foreground/90">{t.anatomy}</p>
        <Anatomy t={t} />
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-sm leading-relaxed text-foreground/90">{t.patterns}</p>
        {t.rules.map((r) => (
          <div key={r.title} className="rounded-xl bg-accent/10 p-3">
            <h3 className="text-sm font-semibold text-accent">{r.title}</h3>
            <p className="mt-1 text-sm leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
