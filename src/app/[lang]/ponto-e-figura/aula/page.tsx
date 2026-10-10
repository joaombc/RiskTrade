import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PnfLessonBody } from "@/components/pnf/PnfLesson";
import { SiteHeader } from "@/components/SiteHeader";
import { hasLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/ponto-e-figura/aula">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { pnfLesson } = await getDictionary(lang);
  return { title: `${pnfLesson.title} · RiskTrade`, description: pnfLesson.summary };
}

/** Aula de mensuração e táticas de trading do ponto e figura (Murphy, cap. 11). */
export default async function PointFigureLessonPage({ params }: PageProps<"/[lang]/ponto-e-figura/aula">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { pnfLesson: l } = await getDictionary(lang);
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6">
      <SiteHeader current="/ponto-e-figura" lang={lang} />
      <article className="flex max-w-5xl flex-col gap-6">
        <div>
          <nav aria-label={l.lessons} className="mb-4 text-sm text-muted">
            <Link href={localePath(lang, "/ponto-e-figura")} className="hover:underline">
              {l.back}
            </Link>{" "}
            › {l.lessons}
          </nav>
          <h2 className="text-3xl font-bold tracking-tight">{l.title}</h2>
          <p className="mt-1 text-lg text-muted">{l.subtitle}</p>
        </div>
        <PnfLessonBody />
      </article>
    </main>
  );
}
