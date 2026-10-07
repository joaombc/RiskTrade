"use client";

import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, switchLocalePath } from "@/i18n/config";
import { useI18n } from "@/i18n/I18nProvider";

/** Troca entre português e inglês mantendo a página (e a consulta e a âncora) e salva a escolha. */
export function LanguageToggle() {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const next = locale === "pt-BR" ? "en-US" : "pt-BR";

  return (
    <button
      type="button"
      onClick={() => {
        // Um ano; o proxy usa a escolha para os endereços sem idioma.
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
        // Navegação completa: o layout raiz (com o script de tema) muda inteiro, e o React não deve re-renderizá-lo no cliente.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`${switchLocalePath(pathname, next)}${window.location.search}${window.location.hash}`);
      }}
      aria-label={t.header.switchLanguage}
      title={t.header.switchLanguage}
      className="rounded-lg px-2 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-border/60 hover:text-foreground"
    >
      <span className={locale === "pt-BR" ? "text-foreground" : ""}>PT</span>
      <span aria-hidden className="mx-0.5">/</span>
      <span className={locale === "en-US" ? "text-foreground" : ""}>EN</span>
    </button>
  );
}
