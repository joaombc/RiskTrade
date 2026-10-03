import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RiskTrade",
  description: "Análise técnica de mercado",
};

/**
 * Aplica o tema salvo antes da página ser desenhada, para que ela não "pisque" no tema errado.
 * Sem tema salvo, o CSS segue o sistema. A chave é a mesma de src/lib/theme.ts.
 */
const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("risktrade:theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
