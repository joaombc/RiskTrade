import { Suspense } from "react";
import { MarketDashboard } from "@/components/MarketDashboard";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6">
      <SiteHeader current="/" />
      {/* O painel lê o ativo e o exemplo da URL (links do glossário). */}
      <Suspense>
        <MarketDashboard />
      </Suspense>
    </main>
  );
}
