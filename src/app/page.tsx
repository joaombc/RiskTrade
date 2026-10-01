import { MarketDashboard } from "@/components/MarketDashboard";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">RiskTrade</h1>
        <p className="mt-1 text-muted">Análise técnica de mercado</p>
      </header>
      <MarketDashboard />
    </main>
  );
}
