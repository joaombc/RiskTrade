import type { Metadata } from "next";
import { GlossaryBrowser } from "@/components/glossary/GlossaryBrowser";
import { LessonCards } from "@/components/glossary/LessonCards";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Glossário · RiskTrade",
  description: "Dicionário de análise técnica com diagramas, detalhes de cada padrão e aulas sobre a Teoria de Dow e as Ondas de Elliott.",
};

export default function GlossaryPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6">
      <SiteHeader current="/glossario" />
      <LessonCards />
      <section aria-labelledby="termos-title" className="flex flex-col gap-3">
        <h2 id="termos-title" className="text-xl font-semibold">
          Termos
        </h2>
        <GlossaryBrowser />
      </section>
    </main>
  );
}
