import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, LOCALES } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { I18nProvider } from "@/i18n/I18nProvider";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Só os idiomas do app; qualquer outro primeiro segmento vira 404 (o proxy já redireciona os sem idioma).
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { meta } = await getDictionary(lang);
  return { title: meta.title, description: meta.description };
}

/**
 * Aplica o tema salvo antes da página ser desenhada, para que ela não "pisque" no tema errado.
 * Sem tema salvo, o CSS segue o sistema. A chave é a mesma de src/lib/theme.ts.
 */
const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("risktrade:theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dictionary = await getDictionary(lang);
  return (
    <html
      lang={lang}
      // O script do <head> muda data-theme antes da hidratação.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          // No cliente vira text/plain: o script só precisa rodar no HTML do servidor, e assim o React não avisa.
          type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={lang} dictionary={dictionary}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
