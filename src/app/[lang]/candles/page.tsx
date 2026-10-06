import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CandleBrowser } from "@/components/candles/CandleBrowser";
import { CandleIntro } from "@/components/candles/CandleIntro";
import { ContentNotice } from "@/components/ContentNotice";
import { SiteHeader } from "@/components/SiteHeader";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { fmt } from "@/i18n/format";
import { CANDLE_PATTERNS } from "@/lib/candles/patterns";

export async function generateMetadata({ params }: PageProps<"/[lang]/candles">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { pages } = await getDictionary(lang);
  return { title: pages.candlesTitle, description: fmt(pages.candlesDescription, { count: CANDLE_PATTERNS.length }) };
}

export default async function CandlesPage({ params }: PageProps<"/[lang]/candles">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = await getDictionary(lang);
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6">
      <SiteHeader current="/candles" lang={lang} />
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t.pages.candlesHeading}</h2>
        <p className="mt-1 text-muted">{t.pages.candlesSubtitle}</p>
      </div>
      <ContentNotice text={t.contentNotice} />
      <CandleIntro />
      <section aria-labelledby="padroes-title" className="flex flex-col gap-3">
        <h2 id="padroes-title" className="text-xl font-semibold">
          {t.pages.patterns}
        </h2>
        <CandleBrowser />
      </section>
    </main>
  );
}
