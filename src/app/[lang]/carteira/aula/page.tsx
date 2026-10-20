import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortfolioLessonBody } from "@/components/portfolio/PortfolioLesson";
import { SiteHeader } from "@/components/SiteHeader";
import { hasLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/carteira/aula">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { portfolioLesson } = await getDictionary(lang);
  return { title: `${portfolioLesson.title} · RiskTrade`, description: portfolioLesson.summary };
}

/** Aula de gestão do dinheiro e táticas de trading (Murphy, cap. 16). */
export default async function PortfolioLessonPage({ params }: PageProps<"/[lang]/carteira/aula">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { portfolioLesson: l } = await getDictionary(lang);
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6">
      <SiteHeader current="/carteira" lang={lang} />
      <article className="flex max-w-5xl flex-col gap-6">
        <div>
          <nav aria-label={l.lessons} className="mb-4 text-sm text-muted">
            <Link href={localePath(lang, "/carteira")} className="hover:underline">
              {l.back}
            </Link>{" "}
            › {l.lessons}
          </nav>
          <h2 className="text-3xl font-bold tracking-tight">{l.title}</h2>
          <p className="mt-1 text-lg text-muted">{l.subtitle}</p>
        </div>
        <PortfolioLessonBody />
      </article>
    </main>
  );
}
