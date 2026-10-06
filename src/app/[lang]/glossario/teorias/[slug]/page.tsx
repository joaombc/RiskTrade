import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentNotice } from "@/components/ContentNotice";
import { GlossaryDiagram } from "@/components/glossary/GlossaryDiagram";
import { SiteHeader } from "@/components/SiteHeader";
import { hasLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { fmt } from "@/i18n/format";
import { LESSONS } from "@/lib/glossary/lessons";
import { GLOSSARY } from "@/lib/glossary/terms";

// Só existem as aulas cadastradas; qualquer outro endereço vira 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return LESSONS.map((lesson) => ({ slug: lesson.slug }));
}

type Props = PageProps<"/[lang]/glossario/teorias/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lesson = LESSONS.find((l) => l.slug === slug);
  return lesson ? { title: `${lesson.title} · RiskTrade`, description: lesson.summary } : {};
}

const anchor = (heading: string) =>
  heading
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default async function LessonPage({ params }: Props) {
  const { slug, lang } = await params;
  const lesson = LESSONS.find((l) => l.slug === slug);
  if (!lesson || !hasLocale(lang)) notFound();
  const t = await getDictionary(lang);

  const toc = lesson.sections.filter((s) => s.heading);
  const related = GLOSSARY.filter((t) => lesson.relatedTerms.includes(t.slug));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6">
      <SiteHeader current="/glossario" lang={lang} />
      <ContentNotice text={t.contentNotice} />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_240px]">
        <article className="min-w-0 max-w-3xl">
          <nav aria-label={t.lesson.trail} className="mb-4 text-sm text-muted">
            <Link href={localePath(lang, "/glossario")} className="hover:underline">
              {t.header.glossary}
            </Link>{" "}
            › {t.lesson.theories}
          </nav>
          <h2 className="text-3xl font-bold tracking-tight">{lesson.title}</h2>
          <p className="mt-1 text-lg text-muted">{lesson.subtitle}</p>
          <p className="mt-1 text-xs text-muted">{fmt(t.lesson.reading, { minutes: lesson.readingMinutes })}</p>
          <p className="mt-5 leading-relaxed">{lesson.summary}</p>

          {lesson.sections.map((section, i) => (
            <section key={i} id={section.heading ? anchor(section.heading) : undefined} className="scroll-mt-6">
              {section.heading && <h3 className="mt-10 mb-3 text-xl font-semibold">{section.heading}</h3>}
              {section.paragraphs.map((p, j) => (
                <p key={j} className="mt-3 leading-relaxed text-foreground/90">
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-foreground/90">
                  {section.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              )}
              {section.diagram && (
                <figure className="mt-5 rounded-xl border border-border bg-surface p-3">
                  <GlossaryDiagram
                    diagram={section.diagram.diagram}
                    title={section.diagram.caption}
                    labels={{ diagram: t.glossary.diagram, volume: t.glossary.volume }}
                  />
                  <figcaption className="mt-2 text-sm text-muted">{section.diagram.caption}</figcaption>
                </figure>
              )}
            </section>
          ))}

          <section className="mt-10 rounded-xl bg-accent/10 p-5">
            <h3 className="mb-2 font-semibold text-accent">{t.lesson.takeaways}</h3>
            <ul className="list-disc space-y-1.5 pl-5 leading-relaxed">
              {lesson.takeaways.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          {related.length > 0 && (
            <section className="mt-8">
              <h3 className="mb-2 font-semibold">{t.lesson.related}</h3>
              <div className="flex flex-wrap gap-2">
                {related.map((term) => (
                  <Link
                    key={term.slug}
                    href={localePath(lang, `/glossario#${term.slug}`)}
                    className="rounded-full border border-border px-3 py-1 text-sm hover:bg-border/60"
                  >
                    {term.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <p className="mt-8 text-xs text-muted">{fmt(t.lesson.source, { source: lesson.source })}</p>
        </article>

        <aside className="hidden lg:block">
          <nav aria-label={t.lesson.toc} className="sticky top-6 text-sm">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t.lesson.toc}</h3>
            <ol className="space-y-1.5">
              {toc.map((s) => (
                <li key={s.heading}>
                  <a href={`#${anchor(s.heading)}`} className="text-muted hover:text-foreground">
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
      </div>
    </main>
  );
}
