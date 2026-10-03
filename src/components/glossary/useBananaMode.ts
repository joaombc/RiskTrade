import { useSyncExternalStore } from "react";

const STORAGE_KEY = "risktrade:banana-mode";
const CHANGE_EVENT = "risktrade:banana-mode-change";
/** Usado quando o navegador bloqueia o storage: a escolha vale até recarregar a página. */
let fallback = false;

function read(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return fallback;
  }
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function setBananaMode(on: boolean) {
  fallback = on;
  try {
    if (on) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sem storage, vale o fallback em memória.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Modo banana dos cards do glossário. A escolha fica salva no navegador e vale para todos os
 * cards (e para as outras abas) até ser desligada.
 */
export function useBananaMode(): [boolean, (on: boolean) => void] {
  return [useSyncExternalStore(subscribe, read, () => false), setBananaMode];
}
