"use client";

import Link from "next/link";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { LESSONS } from "@/lib/glossary/lessons";

/** Seção "Teorias" do glossário: aulas mais longas, cada uma com página própria. */
export function LessonCards() {
  const { t, href } = useI18n();
  const g = t.glossary;
  return (
    <section aria-labelledby="teorias-title" className="flex flex-col gap-3">
      <div>
        <h2 id="teorias-title" className="text-xl font-semibold">
          {g.lessonsTitle}
        </h2>
        <p className="text-sm text-muted">{g.lessonsSubtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {LESSONS.map((lesson) => (
          <Link
            key={lesson.slug}
            href={href(`/glossario/teorias/${lesson.slug}`)}
            className="group flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-accent/60"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-lg font-semibold group-hover:text-accent">{lesson.title}</h3>
              <span className="shrink-0 text-xs text-muted">{fmt(g.minutes, { n: lesson.readingMinutes })}</span>
            </div>
            <p className="text-sm text-muted">{lesson.subtitle}</p>
            <p className="text-sm leading-relaxed">{lesson.summary}</p>
            <span className="mt-auto pt-1 text-sm font-medium text-accent">{g.readLesson}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
