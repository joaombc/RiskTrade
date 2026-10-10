"use client";

import Link from "next/link";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { PnfColumn } from "@/lib/pnfPatterns/patterns";
import { PnfColumnMarks } from "./PnfDiagram";

const CELL = 12;
/** Espaço à direita das colunas para os rótulos (alvo, stop). */
const LABEL = 70;

/** Quadro dos diagramas da aula: colunas de X e O num intervalo de níveis, com as anotações por cima. */
function Frame({
  label,
  columns,
  low,
  high,
  children,
}: {
  label: string;
  columns: PnfColumn[];
  low: number;
  high: number;
  children: (geo: { y: (level: number) => number; cy: (level: number) => number; x: (column: number) => number; right: number }) => React.ReactNode;
}) {
  const width = columns.length * CELL + 2 + LABEL;
  const height = (high - low + 1) * CELL;
  const y = (level: number) => (high - level) * CELL;
  const geo = { y, cy: (level: number) => y(level) + CELL / 2, x: (column: number) => column * CELL + 1, right: columns.length * CELL + 2 };
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" style={{ maxWidth: width * 1.6 }}>
      <PnfColumnMarks columns={columns} cell={CELL} y={y} />
      {children(geo)}
    </svg>
  );
}

/** Linha tracejada de alvo, com o rótulo à direita. */
function TargetLine({ cy, right, level, text }: { cy: (level: number) => number; right: number; level: number; text: string }) {
  return (
    <>
      <line x1={0} x2={right + LABEL} y1={cy(level)} y2={cy(level)} stroke="var(--accent)" strokeWidth={1.2} strokeDasharray="4 3" />
      <text x={right + LABEL - 2} y={cy(level) - 3} textAnchor="end" fontSize={9} fontWeight={600} fill="var(--accent)">
        {text}
      </text>
    </>
  );
}

/** Seta vertical do fundo ao alvo, com a conta ao lado. */
function CountArrow({ cy, x, from, to, text }: { cy: (level: number) => number; x: number; from: number; to: number; text: string }) {
  return (
    <g className="text-accent">
      <line x1={x} x2={x} y1={cy(from)} y2={cy(to) + 4} stroke="currentColor" strokeWidth={1.2} />
      <path d={`M${x} ${cy(to)}l-3.5 6h7z`} fill="currentColor" />
      <text x={x + 5} y={(cy(from) + cy(to)) / 2} fontSize={9} fill="currentColor" dominantBaseline="central">
        {text}
      </text>
    </g>
  );
}

// Fundo em 6, congestão de 6 colunas (da que fez a mínima até a que rompe): alvo 6 + 6 × 3 = 24.
const HORIZONTAL: PnfColumn[] = [[14, 6], [7, 9], [8, 6], [7, 9], [8, 6], [7, 12], [11, 9], [10, 17]];
// Fundo em 4; a primeira coluna de X tem 6 caixas: alvo 4 + 6 × 3 = 22.
const VERTICAL: PnfColumn[] = [[14, 4], [5, 10], [9, 7], [8, 14], [13, 11], [12, 18]];
// Compra em 10 (passa o X anterior, 9); recuo até 8; fundos sobem 6 → 8 → 10, e o stop vai junto.
const TACTICS: PnfColumn[] = [[11, 5], [6, 9], [8, 6], [7, 11], [10, 8], [9, 14], [13, 10], [11, 16]];

/** Corpo da aula (página /ponto-e-figura/aula). */
export function PnfLessonBody() {
  const { pnfLesson: l } = useI18n().t;
  const lb = l.labels;

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-3xl text-sm leading-relaxed text-foreground/90">{l.intro}</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold">{l.horizontal.heading}</h3>
          {l.horizontal.paragraphs.map((p) => (
            <p key={p} className="text-sm leading-relaxed text-foreground/90">
              {p}
            </p>
          ))}
          <div className="flex justify-center rounded-xl border border-border/70 bg-background/60 p-3">
            <Frame label={lb.horizontalDiagram} columns={HORIZONTAL} low={3} high={26}>
              {({ y, cy, x, right }) => (
                <>
                  {/* Largura contada: chave sob as 6 colunas da congestão. */}
                  <g className="text-accent">
                    <path d={`M${x(0) + 2} ${y(5)}v4H${x(5) + CELL - 2}v-4`} fill="none" stroke="currentColor" strokeWidth={1.2} />
                    <text x={(x(0) + x(5) + CELL) / 2} y={y(4) + 4} textAnchor="middle" fontSize={9} fontWeight={600} fill="currentColor">
                      {fmt(lb.columns, { n: 6 })}
                    </text>
                  </g>
                  <line x1={0} x2={right + 8} y1={cy(6)} y2={cy(6)} stroke="var(--muted)" strokeWidth={0.8} strokeDasharray="2 3" />
                  <CountArrow cy={cy} x={right + 8} from={6} to={24} text={fmt(lb.math, { n: 6, total: 18 })} />
                  <TargetLine cy={cy} right={right} level={24} text={fmt(lb.target, { price: 24 })} />
                </>
              )}
            </Frame>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold">{l.vertical.heading}</h3>
          {l.vertical.paragraphs.map((p) => (
            <p key={p} className="text-sm leading-relaxed text-foreground/90">
              {p}
            </p>
          ))}
          <div className="flex justify-center rounded-xl border border-border/70 bg-background/60 p-3">
            <Frame label={lb.verticalDiagram} columns={VERTICAL} low={2} high={24}>
              {({ y, cy, x, right }) => (
                <>
                  {/* A coluna medida: a primeira de X depois do fundo. */}
                  <rect x={x(1) - 1} y={y(10) - 1} width={CELL + 2} height={6 * CELL + 2} rx={3} fill="none" stroke="var(--accent)" strokeWidth={1.4} />
                  <text x={x(1) + CELL / 2} y={y(2) + 4} textAnchor="middle" fontSize={9} fontWeight={600} fill="var(--accent)">
                    {fmt(lb.boxes, { n: 6 })}
                  </text>
                  <line x1={0} x2={right + 8} y1={cy(4)} y2={cy(4)} stroke="var(--muted)" strokeWidth={0.8} strokeDasharray="2 3" />
                  <CountArrow cy={cy} x={right + 8} from={4} to={22} text={fmt(lb.math, { n: 6, total: 18 })} />
                  <TargetLine cy={cy} right={right} level={22} text={fmt(lb.target, { price: 22 })} />
                </>
              )}
            </Frame>
          </div>
        </div>
      </div>

      <p className="rounded-xl bg-accent/10 p-3 text-sm leading-relaxed">{l.estimates}</p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold">{l.tactics.heading}</h3>
          <ul className="flex flex-col gap-2.5">
            {l.tactics.items.map((item) => (
              <li key={item.title} className="text-sm leading-relaxed">
                <strong>{item.title}.</strong> <span className="text-foreground/90">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center justify-center rounded-xl border border-border/70 bg-background/60 p-3">
          <Frame label={lb.tacticsDiagram} columns={TACTICS} low={1} high={19}>
            {({ y, cy, x }) => (
              <>
                {/* Sinal de compra: caixa 10, que passa o topo do X anterior (9). */}
                <g className="text-positive">
                  <rect x={x(3) + 0.5} y={y(10) + 0.5} width={CELL - 1} height={CELL - 1} rx={2} fill="currentColor" fillOpacity={0.2} stroke="currentColor" strokeWidth={1.4} />
                  <rect x={x(3) + CELL / 2 - 6.5} y={y(11) - 15} width={13} height={13} rx={3} fill="currentColor" />
                  <text x={x(3) + CELL / 2} y={y(11) - 8.5} textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={700} fill="var(--background)">
                    C
                  </text>
                </g>
                {/* Entrada no recuo: fim da coluna de O que vem depois do sinal. */}
                <g className="text-accent">
                  <circle cx={x(4) + CELL / 2} cy={cy(8)} r={CELL / 2 + 1.5} fill="none" stroke="currentColor" strokeWidth={1.4} />
                  {/* Rótulo embaixo, ligado ao círculo, para não cruzar com o stop. */}
                  <line x1={x(4) + CELL / 2} x2={x(4) + CELL / 2} y1={cy(8) + CELL / 2 + 1.5} y2={y(2) + 1} stroke="currentColor" strokeWidth={0.8} strokeDasharray="1.5 2" />
                  <text x={x(4) + CELL / 2} y={y(2) + 2} textAnchor="middle" dominantBaseline="hanging" fontSize={9} fontWeight={600} fill="currentColor">
                    {lb.pullback}
                  </text>
                </g>
                {/* Stop: uma caixa abaixo do último fundo (6 → 5), subindo a cada fundo mais alto (8 → 7, 10 → 9). */}
                <g className="text-negative">
                  <path
                    d={`M${x(3)} ${cy(5)}H${x(5)}V${cy(7)}H${x(7)}V${cy(9)}H${x(8) + 4}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeDasharray="4 2"
                  />
                  <text x={x(3)} y={y(4) + 3} fontSize={9} fill="currentColor" dominantBaseline="hanging">
                    {lb.stop}
                  </text>
                  <text x={x(8) + 7} y={cy(9)} fontSize={9} fontWeight={600} fill="currentColor" dominantBaseline="central">
                    {lb.trailing}
                  </text>
                </g>
              </>
            )}
          </Frame>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold">{l.cautions.heading}</h3>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/90">
          {l.cautions.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <p className="border-t border-border pt-3 text-xs text-muted">{l.source}</p>
    </div>
  );
}

/** Card no topo da aba de ponto e figura, com o link para a página da aula. */
export function PnfLessonCard() {
  const { t, href } = useI18n();
  const l = t.pnfLesson;
  return (
    <section aria-labelledby="aula-pnf" className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent/30 bg-surface p-5 shadow-sm sm:p-6">
      <div className="max-w-3xl">
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">{l.eyebrow}</span>
        <h2 id="aula-pnf" className="mt-2 text-xl font-semibold">
          {l.title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">{l.summary}</p>
      </div>
      <Link href={href("/ponto-e-figura/aula")} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
        {l.read} →
      </Link>
    </section>
  );
}
