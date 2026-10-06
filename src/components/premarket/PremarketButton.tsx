"use client";

import { useState } from "react";
import { PremarketDialog } from "./PremarketDialog";

/** Abre o relatório pré-market do ativo (só aparece para ações americanas). */
export function PremarketButton({ symbol }: { symbol: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground hover:bg-border/60"
      >
        Pré-market
      </button>
      {open && <PremarketDialog symbol={symbol} onClose={() => setOpen(false)} />}
    </>
  );
}
