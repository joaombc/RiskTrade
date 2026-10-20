import { useSyncExternalStore } from "react";
import { ACCOUNT_CHANGE_EVENT, DEFAULT_ACCOUNT, loadAccount, type Account } from "@/lib/portfolioAccount";

// O snapshot precisa ser estável entre leituras; só recarrega quando a conta muda.
let cached: Account | null = null;

function getSnapshot(): Account {
  cached ??= loadAccount();
  return cached;
}

function subscribe(onChange: () => void) {
  const reload = () => {
    cached = null;
    onChange();
  };
  window.addEventListener("storage", reload);
  window.addEventListener(ACCOUNT_CHANGE_EVENT, reload);
  return () => {
    window.removeEventListener("storage", reload);
    window.removeEventListener(ACCOUNT_CHANGE_EVENT, reload);
  };
}

/** Conta da carteira salva, atualizada quando o painel da conta (ou outra aba) a muda. */
export function useAccount(): Account {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_ACCOUNT);
}
