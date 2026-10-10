import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PnfBrowser } from "@/components/pnf/PnfBrowser";
import { PnfIntro } from "@/components/pnf/PnfIntro";
import { SiteHeader } from "@/components/SiteHeader";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { fmt } from "@/i18n/format";
import { getPnfPatterns, PNF_ALL } from "@/lib/pnfPatterns/localize";

export async function generateMetadata({ params }: PageProps<"/[lang]/ponto-e-figura">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { pages } = await getDictionary(lang);
  return { title: pages.pnfTitle, description: fmt(pages.pnfDescription, { count: PNF_ALL.length }) };
}

export default async function PointFigurePatternsPage({ params }: PageProps<"/[lang]/ponto-e-figura">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [t, patterns] = await Promise.all([getDictionary(lang), getPnfPatterns(lang)]);
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6">
      <SiteHeader current="/ponto-e-figura" lang={lang} />
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t.pages.pnfHeading}</h2>
        <p className="mt-1 text-muted">{t.pages.pnfSubtitle}</p>
      </div>
      <PnfIntro t={t.pnfIntro} lang={lang} />
      <section aria-labelledby="padroes-pnf-title" className="flex flex-col gap-3">
        <h2 id="padroes-pnf-title" className="text-xl font-semibold">
          {t.pages.patterns}
        </h2>
        <PnfBrowser patterns={patterns} />
      </section>
    </main>
  );
}
