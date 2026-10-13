"use client";

import { useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { I18nProvider, useI18n } from "@/i18n/I18nProvider";

/** Desenha um componente fora da tela e devolve o HTML (o SVG do diagrama). */
export type RenderMarkup = (node: ReactNode) => string;

/**
 * Botão que gera e baixa um baralho do Anki. `build` recebe uma função que desenha os diagramas
 * (os mesmos componentes da página) e devolve o texto do arquivo.
 */
export function AnkiDownloadButton({ fileName, build }: { fileName: string; build: (render: RenderMarkup) => string }) {
  const { t, locale } = useI18n();
  const [busy, setBusy] = useState(false);

  const download = () => {
    setBusy(true);
    // Deixa o "Gerando…" aparecer antes do trabalho (que trava a página por um instante).
    setTimeout(() => {
      const container = document.createElement("div");
      const root = createRoot(container);
      const render: RenderMarkup = (node) => {
        flushSync(() =>
          root.render(
            <I18nProvider locale={locale} dictionary={t}>
              {node}
            </I18nProvider>,
          ),
        );
        return container.innerHTML;
      };
      try {
        const text = build(render);
        const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } finally {
        root.unmount();
        setBusy(false);
      }
    }, 0);
  };

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      title={t.anki.hint}
      className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-border/60 disabled:opacity-60"
    >
      <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 3v10m0 0-4-4m4 4 4-4M4 16h12" />
      </svg>
      {busy ? t.anki.generating : t.anki.button}
    </button>
  );
}
