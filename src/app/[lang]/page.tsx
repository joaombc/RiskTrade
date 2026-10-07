import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MarketDashboard } from "@/components/MarketDashboard";
import { SiteHeader } from "@/components/SiteHeader";
import { hasLocale } from "@/i18n/config";
import { getGlossary } from "@/lib/glossary/localize";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const examples = (await getGlossary(lang)).flatMap((t) => (t.example ? [{ slug: t.slug, name: t.name, example: t.example }] : []));
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6">
      <SiteHeader current="/" lang={lang} />
      {/* O painel lê o ativo e o exemplo da URL (links do glossário). */}
      <Suspense>
        <MarketDashboard examples={examples} />
      </Suspense>
    </main>
  );
}
