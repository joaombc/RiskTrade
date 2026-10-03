import type { Metadata } from "next";
import { CandleBrowser } from "@/components/candles/CandleBrowser";
import { CandleIntro } from "@/components/candles/CandleIntro";
import { SiteHeader } from "@/components/SiteHeader";
import { CANDLE_PATTERNS } from "@/lib/candles/patterns";

export const metadata: Metadata = {
  title: "Padrões de candles · RiskTrade",
  description: `Os ${CANDLE_PATTERNS.length} padrões de candlesticks japoneses: velas básicas, reversões e continuações, com diagramas, psicologia e confirmação.`,
};

export default function CandlesPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6">
      <SiteHeader current="/candles" />
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Padrões de candles</h2>
        <p className="mt-1 text-muted">Candlesticks japoneses: velas básicas, padrões de reversão e de continuação.</p>
      </div>
      <CandleIntro />
      <section aria-labelledby="padroes-title" className="flex flex-col gap-3">
        <h2 id="padroes-title" className="text-xl font-semibold">
          Padrões
        </h2>
        <CandleBrowser />
      </section>
    </main>
  );
}
