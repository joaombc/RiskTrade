"use client";

import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
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
  const { drawings: d } = useI18n().t;
  const tool = (kind: DrawingKind) => d.tools[kind];
  return (
    <div className="flex flex-col gap-2">
      <div role="toolbar" aria-label={d.toolbar} className="flex flex-wrap gap-1.5">
        <button
          type="button"
          aria-pressed={activeTool === null}
          onClick={() => onToolChange(null)}
          className={`${buttonBase} ${activeTool === null ? "bg-accent text-white" : "bg-border/60 hover:bg-border"}`}
        >
          {d.select}
        </button>
        {DRAWING_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            aria-pressed={activeTool === kind}
            title={tool(kind).hint}
            onClick={() => onToolChange(activeTool === kind ? null : kind)}
            className={`${buttonBase} ${activeTool === kind ? "bg-accent text-white" : "bg-border/60 hover:bg-border"}`}
          >
            {tool(kind).label}
          </button>
        ))}
        <button
          type="button"
          onClick={onClearAll}
          disabled={drawingCount === 0}
          className={`${buttonBase} ml-auto text-negative hover:bg-negative/10 disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {d.clearAll}
        </button>
      </div>

      <div className="flex min-h-8 flex-wrap items-center gap-3 text-xs text-muted" aria-live="polite">
        {activeTool ? (
          <span>
            <strong className="text-foreground">
              {tool(activeTool).label} ({pendingPoints}/{TOOLS[activeTool].points})
            </strong>{" "}
            {tool(activeTool).hint} <span className="opacity-70">{d.escCancels}</span>
          </span>
        ) : selected ? (
          <>
            <strong className="text-foreground">{fmt(d.selected, { tool: tool(selected.kind).label })}</strong>
            {selected.kind === "trendline" && (
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={Boolean(selected.options.extend)}
                  onChange={(e) => onOptionsChange({ ...selected.options, extend: e.target.checked })}
                />
                {d.extendRight}
              </label>
            )}
            {selected.kind === "horizontal" && (
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={Boolean(selected.options.roleReversal)}
                  onChange={(e) => onOptionsChange({ ...selected.options, roleReversal: e.target.checked })}
                />
                {d.roleReversal}
              </label>
            )}
            <button type="button" onClick={onDeleteSelected} className="font-medium text-negative hover:underline">
              {d.delete}
            </button>
          </>
        ) : (
          <span>{d.idle}</span>
        )}
      </div>
    </div>
  );
}
