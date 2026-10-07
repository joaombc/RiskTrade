/** Aviso das páginas de estudo ainda não traduzidas (só aparece quando há texto). */
export function ContentNotice({ text }: { text: string }) {
  if (!text) return null;
  return (
    <p role="note" className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
      {text}
    </p>
  );
}
