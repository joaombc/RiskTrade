import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountPanel } from "@/components/portfolio/AccountPanel";
import { AssetsPanel } from "@/components/portfolio/AssetsPanel";
import { PlanPanel } from "@/components/portfolio/PlanPanel";
import { PortfolioIntro, PortfolioLessonCard } from "@/components/portfolio/PortfolioLesson";
import { SiteHeader } from "@/components/SiteHeader";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";

export async function generateMetadata({ params }: PageProps<"/[lang]/carteira">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { pages } = await getDictionary(lang);
  return { title: pages.portfolioTitle, description: pages.portfolioDescription };
}

/** Minha carteira: gestão do dinheiro e táticas de trading (Murphy, cap. 16). */
export default async function PortfolioPage({ params }: PageProps<"/[lang]/carteira">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6">
      <SiteHeader current="/carteira" lang={lang} />
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t.pages.portfolioHeading}</h2>
        <p className="mt-1 text-muted">{t.pages.portfolioSubtitle}</p>
      </div>
      <PortfolioLessonCard />
      <PortfolioIntro>
        <AccountPanel />
        <AssetsPanel />
        <PlanPanel />
      </PortfolioIntro>
    </main>
  );
}
