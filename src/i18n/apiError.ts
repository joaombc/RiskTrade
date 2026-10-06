import type { Dictionary } from "./dictionary";
import { fmt } from "./format";

/** Corpo de erro das rotas /api: mensagem em português e um código para traduzir. */
export interface ApiError {
  error?: string;
  code?: string;
  symbol?: string;
}

type ErrorCode = "invalid_symbol" | "not_found" | "no_history" | "invalid_range" | "invalid_list" | "not_us_listed" | "unavailable";

/** Mensagem no idioma da interface pelo código do erro; sem código conhecido, a mensagem da API ou o padrão. */
export function apiErrorMessage(errors: Dictionary["errors"], data: ApiError, fallback: string): string {
  const template = data.code && Object.hasOwn(errors, data.code) ? errors[data.code as ErrorCode] : undefined;
  return template ? fmt(template, { symbol: data.symbol ?? "" }) : (data.error ?? fallback);
}
