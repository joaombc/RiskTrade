"use client";

import { createContext, useContext, useMemo } from "react";
import { localePath, type Locale } from "./config";
import type { Dictionary } from "./dictionary";

interface I18n {
  locale: Locale;
  t: Dictionary;
  /** Endereço interno no idioma atual. */
  href: (path: string) => string;
}

const I18nContext = createContext<I18n | null>(null);

/** Entrega o idioma e o dicionário (já carregado no servidor) aos componentes do navegador. */
export function I18nProvider({ locale, dictionary, children }: { locale: Locale; dictionary: Dictionary; children: React.ReactNode }) {
  const value = useMemo(() => ({ locale, t: dictionary, href: (path: string) => localePath(locale, path) }), [locale, dictionary]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n precisa estar dentro de <I18nProvider>");
  return value;
}
