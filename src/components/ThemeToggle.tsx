"use client";

import { useLayoutEffect } from "react";
import { restoreSavedTheme, setTheme, useTheme } from "@/lib/theme";

/** Alterna entre tema claro e escuro. Sem escolha salva, o site segue o tema do sistema. */
export function ThemeToggle() {
  const theme = useTheme();
  useLayoutEffect(restoreSavedTheme, []);
  const next = theme === "dark" ? "light" : "dark";
  const label = next === "dark" ? "Ativar tema escuro" : "Ativar tema claro";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
      className="rounded-lg p-2 text-muted transition-colors hover:bg-border/60 hover:text-foreground"
    >
      {theme === "dark" ? (
        // Sol: no escuro, o botão leva ao claro.
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        // Lua: no claro, o botão leva ao escuro.
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        </svg>
      )}
    </button>
  );
}
