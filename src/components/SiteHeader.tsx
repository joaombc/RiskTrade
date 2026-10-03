import Link from "next/link";

const LINKS = [
  { href: "/", label: "Painel" },
  { href: "/glossario", label: "Glossário" },
  { href: "/candles", label: "Candles" },
] as const;

export function SiteHeader({ current }: { current: (typeof LINKS)[number]["href"] }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          <Link href="/">RiskTrade</Link>
        </h1>
        <p className="mt-1 text-muted">Análise técnica de mercado</p>
      </div>
      <nav aria-label="Principal" className="flex gap-1 text-sm font-medium">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current === link.href ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 ${current === link.href ? "bg-foreground text-background" : "text-muted hover:bg-border/60"}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
