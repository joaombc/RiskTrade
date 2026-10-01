import type { Metadata } from "next";
import { GlossaryBrowser } from "@/components/glossary/GlossaryBrowser";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Glossário · RiskTrade",
  description: "Dicionário de análise técnica com diagramas: padrões, gaps, linhas e volume.",
};

export default function GlossaryPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6">
      <SiteHeader current="/glossario" />
      <GlossaryBrowser />
    </main>
  );
}
