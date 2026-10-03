import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

// A mesma chave é lida pelo script do <head> em src/app/layout.tsx.
const STORAGE_KEY = "risktrade:theme";
const CHANGE_EVENT = "risktrade:theme-change";
const DARK_QUERY = "(prefers-color-scheme: dark)";

const isTheme = (value: unknown): value is Theme => value === "light" || value === "dark";

/** Tema em uso: o escolhido pelo usuário (data-theme) ou, sem escolha, o do sistema. */
function getTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (isTheme(chosen)) return chosen;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  // Outra aba trocou o tema: aplica aqui também.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    if (isTheme(e.newValue)) document.documentElement.dataset.theme = e.newValue;
    else delete document.documentElement.dataset.theme;
    onChange();
  };
  media.addEventListener("change", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Reaplica o tema salvo. Em desenvolvimento, o Strict Mode remonta o <html> e apaga o data-theme
 * que o script do <head> colocou; em produção não muda nada.
 */
export function restoreSavedTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isTheme(saved) && document.documentElement.dataset.theme !== saved) {
      document.documentElement.dataset.theme = saved;
      window.dispatchEvent(new Event(CHANGE_EVENT));
    }
  } catch {
    // Sem storage não há tema salvo.
  }
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Sem storage, o tema vale só nesta página.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Tema em uso, atualizado quando o usuário troca, quando outra aba troca ou quando o sistema muda. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, () => "light");
}
