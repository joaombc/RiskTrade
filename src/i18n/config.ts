/** Idiomas do app. O primeiro é o padrão. */
export const LOCALES = ["pt-BR", "en-US"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "pt-BR";

/** Cookie com a escolha do botão PT/EN, lido pelo proxy. */
export const LOCALE_COOKIE = "risktrade-lang";

export const hasLocale = (value: string | undefined | null): value is Locale => LOCALES.includes(value as Locale);

/**
 * Idioma para um endereço sem idioma: a escolha salva no cookie ou, sem ela, o primeiro idioma
 * suportado na ordem de preferência do navegador (Accept-Language); senão, português.
 */
export function preferredLocale(cookie: string | undefined | null, acceptLanguage: string | undefined | null): Locale {
  if (hasLocale(cookie)) return cookie;
  const ranked = (acceptLanguage ?? "")
    .split(",")
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(";");
      const q = Number(params.find((p) => p.trim().startsWith("q="))?.trim().slice(2) ?? 1);
      return { tag: tag.toLowerCase(), q: Number.isFinite(q) ? q : 0, i };
    })
    .filter((l) => l.tag && l.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  for (const { tag } of ranked) {
    if (tag.startsWith("pt")) return "pt-BR";
    if (tag.startsWith("en")) return "en-US";
  }
  return DEFAULT_LOCALE;
}

/** Endereço dentro de um idioma: localePath("en-US", "/glossario#oco") → "/en-US/glossario#oco". */
export function localePath(locale: Locale, path: string): string {
  if (!path.startsWith("/")) return path;
  return path === "/" ? `/${locale}` : path.startsWith("/?") || path.startsWith("/#") ? `/${locale}${path.slice(1)}` : `/${locale}${path}`;
}

/** O mesmo endereço em outro idioma (para o botão PT/EN). */
export function switchLocalePath(pathname: string, to: Locale): string {
  const [, first, ...rest] = pathname.split("/");
  const tail = hasLocale(first) ? rest : [first, ...rest].filter(Boolean);
  return `/${to}${tail.length ? `/${tail.join("/")}` : ""}`;
}
