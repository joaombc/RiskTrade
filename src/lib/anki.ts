import type { Dictionary } from "@/i18n/dictionary";
import { fmt } from "@/i18n/format";
import type { CandlePattern, CandleVariant } from "./candles/types";
import type { Category, GlossaryTerm } from "./glossary/types";
import type { PnfPattern, PnfVariant } from "./pnfPatterns/patterns";

/**
 * Baralhos do Anki com o material didático do app: frente com o desenho do padrão, verso com o
 * nome, a classificação e o porquê. O arquivo é o texto do Anki separado por tabulação, com
 * cabeçalho (`#html:true`, baralho e coluna de etiquetas): no Anki, Arquivo → Importar.
 */

type Labels = Dictionary["anki"];

/** Cores do tema claro: o desenho vai para o Anki com cores fixas. */
export const ANKI_COLORS = {
  positive: "#059669",
  negative: "#dc2626",
  target: "#9333ea",
  muted: "#6b7280",
  border: "#e3e6eb",
  accent: "#2563eb",
  foreground: "#14171c",
  surface: "#ffffff",
  background: "#ffffff",
} as const;

const C = ANKI_COLORS;

/** Classes de cor usadas nos desenhos do app, como estilo em linha. */
const CLASS_STYLE: Record<string, string> = {
  "text-positive": `color:${C.positive}`,
  "text-negative": `color:${C.negative}`,
  "text-target": `color:${C.target}`,
  "text-muted": `color:${C.muted}`,
  "text-border": `color:${C.border}`,
  "text-accent": `color:${C.accent}`,
  "text-foreground": `color:${C.foreground}`,
  "fill-positive": `fill:${C.positive}`,
  "fill-negative": `fill:${C.negative}`,
  "fill-surface": `fill:${C.surface}`,
  "fill-muted": `fill:${C.muted}`,
  "fill-foreground": `fill:${C.foreground}`,
  "stroke-surface": `stroke:${C.surface}`,
  "fill-accent/10": "fill:rgba(37,99,235,0.1)",
};

export type SvgSize = { maxWidth: number; scale?: number } | { height: number };

/**
 * SVG do app → SVG independente para o Anki: cores fixas no lugar das classes e das variáveis do
 * tema, sem títulos nem rótulos de acessibilidade (que entregariam a resposta) e com tamanho
 * próprio: largura fluida até um máximo, ou altura fixa (velas, estreitas e altas). `scale` amplia
 * o tamanho natural dos desenhos que já trazem `max-width`.
 */
export function standaloneSvg(markup: string, size: SvgSize): string {
  let svg = markup
    .replace(/<title>[^<]*<\/title>/g, "")
    .replace(/ aria-label="[^"]*"/g, "")
    .replace(/ role="img"/g, "")
    .replace(/var\(--([a-z]+)\)/g, (_, name: string) => C[name as keyof typeof C] ?? "#000")
    .replace(/ class="([^"]*)"/g, (_, classes: string) => {
      const styles = classes.split(/\s+/).map((c) => CLASS_STYLE[c]).filter(Boolean);
      return styles.length ? ` style="${styles.join(";")}"` : "";
    })
    .replace(/[\t\n\r]+/g, " ");
  svg = svg.replace(/^<svg([^>]*)>/, (_m, attrs: string) => {
    const natural = Number(/max-width:\s*(\d+(?:\.\d+)?)px/.exec(attrs)?.[1] ?? 0);
    const clean = attrs.replace(/ style="[^"]*"/, "").replace(/ (width|height)="[^"]*"/g, "");
    const sizing =
      "height" in size
        ? [`height:${size.height}px`, "width:auto", "max-width:100%"]
        : ["width:100%", `max-width:${natural && size.scale ? Math.round(natural * size.scale) : size.maxWidth}px`, "height:auto"];
    return `<svg${clean} style="${[...sizing, `background:${C.surface}`].join(";")}">`;
  });
  return svg;
}

export const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/[\t\n\r]+/g, " ");

/** Frente: o desenho e a pergunta. O comentário com o id deixa cada frente única (o Anki acha duplicados pelo 1º campo). */
export function ankiFront(id: string, svg: string, question: string): string {
  return `<!--${id}--><div style="text-align:center">${svg}</div><div style="text-align:center;color:${C.muted};font-size:15px;margin-top:8px">${escapeHtml(question)}</div>`;
}

/** Verso: nome, selos de classificação e as seções de explicação. */
export function ankiBack(name: string, tags: { text: string; color: string }[], sections: [title: string, text: string][]): string {
  const badge = ({ text, color }: { text: string; color: string }) =>
    `<span style="display:inline-block;padding:2px 10px;border-radius:999px;background:${color}1f;color:${color};font-weight:600;font-size:14px">${escapeHtml(text)}</span>`;
  return [
    `<div style="text-align:left;line-height:1.5">`,
    `<div style="font-size:22px;font-weight:700;margin-bottom:6px">${escapeHtml(name)}</div>`,
    `<div style="margin-bottom:10px">${tags.map(badge).join(" ")}</div>`,
    ...sections.filter(([, text]) => text).map(([title, text]) => `<div style="margin-bottom:8px"><b>${escapeHtml(title)}:</b> ${escapeHtml(text)}</div>`),
    `</div>`,
  ].join("");
}

export interface AnkiRow {
  front: string;
  back: string;
  tags: string[];
}

/** Arquivo de texto do Anki: cabeçalho e uma linha por cartão (campos separados por tabulação). */
export function ankiDeckFile(deckName: string, rows: AnkiRow[]): string {
  const clean = (field: string) => field.replace(/[\t\n\r]+/g, " ");
  const header = ["#separator:tab", "#html:true", `#deck:${deckName}`, "#tags column:3"];
  return [...header, ...rows.map((r) => [clean(r.front), clean(r.back), r.tags.join(" ")].join("\t"))].join("\n") + "\n";
}

const tag = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "");

// ─── Baralhos ──────────────────────────────────────────────────────────────────

const CATEGORY_COLOR: Record<Category, string> = {
  "Padrões de Reversão": C.accent,
  "Padrões de Continuação": C.target,
  Gaps: C.muted,
  Linhas: C.muted,
  Volume: C.muted,
  Indicadores: C.muted,
};

/** Glossário: um cartão por termo. */
export function glossaryDeck(terms: GlossaryTerm[], svgOf: (term: GlossaryTerm) => string, a: Labels, categoryName: (c: Category) => string): string {
  return ankiDeckFile(
    a.decks.glossary,
    terms.map((t) => ({
      front: ankiFront(`rt-glossario-${t.slug}`, standaloneSvg(svgOf(t), { maxWidth: 420 }), a.question),
      back: ankiBack(t.name, [{ text: categoryName(t.category), color: CATEGORY_COLOR[t.category] }], [
        [a.definition, t.definition],
        [a.validation, t.validation],
      ]),
      tags: ["risktrade", "glossario", tag(t.category)],
    })),
  );
}

const BIAS_COLOR = { bullish: C.positive, bearish: C.negative, neutral: C.muted } as const;

/** Candles: um cartão por versão (ex.: engolfo de alta e engolfo de baixa). */
export function candleDeck(patterns: CandlePattern[], svgOf: (variant: CandleVariant) => string, a: Labels): string {
  return ankiDeckFile(
    a.decks.candles,
    patterns.flatMap((p) =>
      p.variants.map((v, i) => ({
        front: ankiFront(`rt-candle-${p.slug}-${i}`, standaloneSvg(svgOf(v), { height: 200 }), a.question),
        back: ankiBack(v.name, [{ text: fmt(a.candleLabel, { kind: a.candleKind[p.kind], bias: a.candleBias[v.bias] }), color: BIAS_COLOR[v.bias] }], [
          [a.pattern, `${p.name}${p.englishName !== p.name ? ` (${p.englishName})` : ""} · ${p.candleCount === 1 ? a.candleOne : fmt(a.candleMany, { n: p.candleCount })}`],
          [a.why, p.summary],
          [a.market, p.psychology],
          [a.confirmation, p.confirmation],
        ]),
        tags: ["risktrade", "candles", p.kind, v.bias],
      })),
    ),
  );
}

/**
 * Ponto e figura: um cartão por versão (fundo e topo, compra e venda). O último item de
 * reconhecimento descreve a versão de baixa; os outros, a de alta. A explicação do mercado está
 * escrita para a versão de alta: no cartão de baixa, o título avisa que é o espelho.
 */
export function pnfDeck(patterns: PnfPattern[], svgOf: (variant: PnfVariant) => string, a: Labels): string {
  return ankiDeckFile(
    a.decks.pnf,
    patterns.flatMap((p) =>
      p.variants.map((v) => {
        const bullish = v.side === "bottom";
        const kind = p.group === "reversal" ? (bullish ? a.pnfKind.reversalBottom : a.pnfKind.reversalTop) : bullish ? a.pnfKind.signalBuy : a.pnfKind.signalSell;
        const recognition = bullish ? p.recognition.slice(0, -1) : p.recognition.slice(-1);
        return {
          front: ankiFront(`rt-pnf-${p.slug}-${v.side}`, standaloneSvg(svgOf(v), { maxWidth: 360, scale: 1.4 }), a.question),
          back: ankiBack(v.name, [{ text: kind, color: bullish ? C.positive : C.negative }], [
            [a.pattern, `${p.name}${p.englishName !== p.name ? ` (${p.englishName})` : ""}`],
            [a.why, p.summary],
            [a.recognize, recognition.join(" ")],
            [bullish ? a.market : fmt(a.marketMirror, { side: a.mirrorSide[p.group] }), p.psychology],
            [a.confirmationUse, p.confirmation],
          ]),
          tags: ["risktrade", "ponto_e_figura", p.group === "reversal" ? "reversao" : "sinal", bullish ? "alta" : "baixa"],
        };
      }),
    ),
  );
}
