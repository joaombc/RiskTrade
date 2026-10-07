import Link from "next/link";
import { localePath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";

const LINKS = [
  { href: "/", key: "dashboard" },
  { href: "/glossario", key: "glossary" },
  { href: "/candles", key: "candles" },
] as const;

export async function SiteHeader({ current, lang }: { current: (typeof LINKS)[number]["href"]; lang: Locale }) {
  const { header } = await getDictionary(lang);
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          <Link href={localePath(lang, "/")}>RiskTrade</Link>
        </h1>
        <p className="mt-1 text-muted">{header.tagline}</p>
      </div>
      <div className="flex items-center gap-2">
        <nav aria-label={header.nav} className="flex gap-1 text-sm font-medium">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={localePath(lang, link.href)}
              aria-current={current === link.href ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 ${current === link.href ? "bg-foreground text-background" : "text-muted hover:bg-border/60"}`}
            >
              {header[link.key]}
            </Link>
          ))}
        </nav>
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
