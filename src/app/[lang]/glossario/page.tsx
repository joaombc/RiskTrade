import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentNotice } from "@/components/ContentNotice";
import { GlossaryBrowser } from "@/components/glossary/GlossaryBrowser";
import { LessonCards } from "@/components/glossary/LessonCards";
import { SiteHeader } from "@/components/SiteHeader";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/glossario">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { pages } = await getDictionary(lang);
  return { title: pages.glossaryTitle, description: pages.glossaryDescription };
}

export default async function GlossaryPage({ params }: PageProps<"/[lang]/glossario">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6">
      <SiteHeader current="/glossario" lang={lang} />
      <ContentNotice text={t.contentNotice} />
      <LessonCards />
      <section aria-labelledby="termos-title" className="flex flex-col gap-3">
        <h2 id="termos-title" className="text-xl font-semibold">
          {t.pages.terms}
        </h2>
        <GlossaryBrowser />
      </section>
    </main>
  );
}
