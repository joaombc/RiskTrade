import Link from "next/link";
import { LESSONS } from "@/lib/glossary/lessons";

/** Seção "Teorias" do glossário: aulas mais longas, cada uma com página própria. */
export function LessonCards() {
  return (
    <section aria-labelledby="teorias-title" className="flex flex-col gap-3">
      <div>
        <h2 id="teorias-title" className="text-xl font-semibold">
          Teorias
        </h2>
        <p className="text-sm text-muted">Aulas para aprofundar os fundamentos por trás dos padrões.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {LESSONS.map((lesson) => (
          <Link
            key={lesson.slug}
            href={`/glossario/teorias/${lesson.slug}`}
            className="group flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-accent/60"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-lg font-semibold group-hover:text-accent">{lesson.title}</h3>
              <span className="shrink-0 text-xs text-muted">{lesson.readingMinutes} min</span>
            </div>
            <p className="text-sm text-muted">{lesson.subtitle}</p>
            <p className="text-sm leading-relaxed">{lesson.summary}</p>
            <span className="mt-auto pt-1 text-sm font-medium text-accent">Ler aula →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
