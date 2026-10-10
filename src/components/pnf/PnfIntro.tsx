import Link from "next/link";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionary";

/** Introdução da página: como ler X e O e as regras de uso dos padrões de reversão (Murphy, cap. 11). */
export function PnfIntro({ t, lang }: { t: Dictionary["pnfIntro"]; lang: Locale }) {
  return (
    <section aria-labelledby="como-ler-pnf" className="grid gap-6 rounded-2xl border border-border bg-surface p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] sm:p-6">
      <div className="flex flex-col gap-3">
        <h2 id="como-ler-pnf" className="text-xl font-semibold">
          {t.heading}
        </h2>
        <p className="text-sm leading-relaxed text-foreground/90">{t.reading}</p>
        <p className="text-sm leading-relaxed text-foreground/90">{t.patterns}</p>
        <Link href={localePath(lang, "/")} className="text-sm font-medium text-accent hover:underline">
          {t.chartLink} →
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {t.rules.map((r) => (
          <div key={r.title} className="rounded-xl bg-accent/10 p-3">
            <h3 className="text-sm font-semibold text-accent">{r.title}</h3>
            <p className="mt-1 text-sm leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
