import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, LOCALES, preferredLocale } from "./i18n/config";

/**
 * Endereços sem idioma (ex.: /glossario) vão para o idioma escolhido no botão PT/EN ou, sem
 * escolha, para o do navegador. Os links antigos continuam funcionando.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (LOCALES.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`))) return;
  const locale = preferredLocale(request.cookies.get(LOCALE_COOKIE)?.value, request.headers.get("accept-language"));
  request.nextUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Fora: API, arquivos do Next e qualquer arquivo com extensão (favicon, imagens).
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
