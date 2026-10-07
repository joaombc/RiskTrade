import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MarketDashboard } from "@/components/MarketDashboard";
import { SiteHeader } from "@/components/SiteHeader";
import { hasLocale } from "@/i18n/config";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6">
      <SiteHeader current="/" lang={lang} />
      {/* O painel lê o ativo e o exemplo da URL (links do glossário). */}
      <Suspense>
        <MarketDashboard />
      </Suspense>
    </main>
  );
}
