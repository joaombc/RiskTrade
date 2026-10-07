"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { PremarketDialog } from "./PremarketDialog";

/** Abre o relatório pré-market do ativo (só aparece para ações e ETFs americanos). */
export function PremarketButton({ symbol }: { symbol: string }) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground hover:bg-border/60"
      >
        {t.premarket.button}
      </button>
      {open && <PremarketDialog symbol={symbol} onClose={() => setOpen(false)} />}
    </>
  );
}
