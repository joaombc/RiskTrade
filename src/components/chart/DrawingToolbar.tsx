import { DRAWING_KINDS, TOOLS, type Drawing, type DrawingKind, type DrawingOptions } from "@/lib/drawings/types";

interface Props {
  activeTool: DrawingKind | null;
  pendingPoints: number;
  selected: Drawing | null;
  drawingCount: number;
  onToolChange: (tool: DrawingKind | null) => void;
  onOptionsChange: (options: DrawingOptions) => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
}

const buttonBase = "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors";

export function DrawingToolbar({
  activeTool,
  pendingPoints,
  selected,
  drawingCount,
  onToolChange,
  onOptionsChange,
  onDeleteSelected,
  onClearAll,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div role="toolbar" aria-label="Ferramentas de desenho" className="flex flex-wrap gap-1.5">
        <button
          type="button"
          aria-pressed={activeTool === null}
          onClick={() => onToolChange(null)}
          className={`${buttonBase} ${activeTool === null ? "bg-accent text-white" : "bg-border/60 hover:bg-border"}`}
        >
          Selecionar
        </button>
        {DRAWING_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            aria-pressed={activeTool === kind}
            title={TOOLS[kind].hint}
            onClick={() => onToolChange(activeTool === kind ? null : kind)}
            className={`${buttonBase} ${activeTool === kind ? "bg-accent text-white" : "bg-border/60 hover:bg-border"}`}
          >
            {TOOLS[kind].label}
          </button>
        ))}
        <button
          type="button"
          onClick={onClearAll}
          disabled={drawingCount === 0}
          className={`${buttonBase} ml-auto text-negative hover:bg-negative/10 disabled:cursor-not-allowed disabled:opacity-40`}
        >
          Limpar tudo
        </button>
      </div>

      <div className="flex min-h-8 flex-wrap items-center gap-3 text-xs text-muted" aria-live="polite">
        {activeTool ? (
          <span>
            <strong className="text-foreground">
              {TOOLS[activeTool].label} ({pendingPoints}/{TOOLS[activeTool].points})
            </strong>{" "}
            {TOOLS[activeTool].hint} <span className="opacity-70">Esc cancela.</span>
          </span>
        ) : selected ? (
          <>
            <strong className="text-foreground">{TOOLS[selected.kind].label} selecionado</strong>
            {selected.kind === "trendline" && (
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={Boolean(selected.options.extend)}
                  onChange={(e) => onOptionsChange({ ...selected.options, extend: e.target.checked })}
                />
                Estender à direita
              </label>
            )}
            {selected.kind === "horizontal" && (
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={Boolean(selected.options.roleReversal)}
                  onChange={(e) => onOptionsChange({ ...selected.options, roleReversal: e.target.checked })}
                />
                Inverter papel após rompimento (suporte ↔ resistência)
              </label>
            )}
            <button type="button" onClick={onDeleteSelected} className="font-medium text-negative hover:underline">
              Excluir (Del)
            </button>
          </>
        ) : (
          <span>Escolha uma ferramenta para desenhar, ou clique em um desenho para selecioná-lo.</span>
        )}
      </div>
    </div>
  );
}
