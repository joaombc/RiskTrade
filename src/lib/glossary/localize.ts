import type { Locale } from "@/i18n/config";
import type { TermTranslation } from "./en/terms";
import { GLOSSARY } from "./terms";
import type { Diagram, DiagramLine, GlossaryTerm } from "./types";

type Labels = Record<string, string>;

/** Traduz um rótulo; os que não estão no mapa (números, siglas) ficam como estão. */
const label = (labels: Labels, text: string) => labels[text] ?? text;

const lines = (labels: Labels, items: DiagramLine[] | undefined) =>
  items?.map((l) => (l.label ? { ...l, label: label(labels, l.label) } : l));

/** Mesmo desenho, com os textos traduzidos. */
export function translateDiagram(diagram: Diagram, labels: Labels): Diagram {
  return {
    ...diagram,
    lines: lines(labels, diagram.lines),
    points: diagram.points?.map((p) => ({ ...p, label: label(labels, p.label) })),
    curves: diagram.curves?.map((c) => (c.label ? { ...c, label: label(labels, c.label) } : c)),
    notes: diagram.notes?.map((n) => ({ ...n, text: label(labels, n.text) })),
    sub: diagram.sub && { ...diagram.sub, label: label(labels, diagram.sub.label), lines: lines(labels, diagram.sub.lines) },
  };
}

/** O termo em inglês: textos da tradução, desenho e exemplo com os rótulos traduzidos. */
export function localizeTerm(term: GlossaryTerm, text: TermTranslation, labels: Labels): GlossaryTerm {
  return {
    ...term,
    name: text.name,
    // Os apelidos em português continuam valendo na busca.
    aliases: [...text.aliases, ...term.aliases],
    definition: text.definition,
    validation: text.validation,
    diagram: translateDiagram(term.diagram, labels),
    ...(term.details && text.details && { details: text.details }),
    ...(term.example && {
      example: {
        ...term.example,
        description: text.example ?? term.example.description,
        markers: term.example.markers?.map((m) => ({ ...m, text: label(labels, m.text) })),
      },
    }),
  };
}

/** Glossário no idioma pedido. O inglês só é carregado quando necessário (no servidor). */
export async function getGlossary(locale: Locale): Promise<GlossaryTerm[]> {
  if (locale === "pt-BR") return GLOSSARY;
  const [{ TERMS_EN }, { LABELS_EN }] = await Promise.all([import("./en/terms"), import("./en/labels")]);
  return GLOSSARY.map((term) => localizeTerm(term, TERMS_EN[term.slug], LABELS_EN));
}
