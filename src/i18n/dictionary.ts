import type { ptBR } from "./dictionaries/pt-BR";
import type { Locale } from "./config";

/** Mesma forma do dicionário em português, com qualquer texto no lugar de cada frase. */
type DeepString<T> = T extends string ? string : T extends readonly (infer U)[] ? DeepString<U>[] : { [K in keyof T]: DeepString<T[K]> };
export type Dictionary = DeepString<typeof ptBR>;

/** Carrega só o dicionário do idioma pedido (cada página envia apenas o seu). */
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return locale === "en-US"
    ? (await import("./dictionaries/en-US")).enUS
    : (await import("./dictionaries/pt-BR")).ptBR;
}
