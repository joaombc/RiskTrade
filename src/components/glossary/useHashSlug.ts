import { useCallback, useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/**
 * Termo aberto no card ampliado, guardado no hash da URL (/glossario#oco): o link pode ser
 * compartilhado e o "voltar" do navegador fecha o card.
 */
export function useHashSlug(): [string, () => void] {
  const slug = useSyncExternalStore(
    subscribe,
    () => decodeURIComponent(window.location.hash.slice(1)),
    () => "",
  );
  const clear = useCallback(() => {
    // replaceState não dispara hashchange, então avisamos os assinantes manualmente.
    history.replaceState(null, "", window.location.pathname + window.location.search);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }, []);
  return [slug, clear];
}
