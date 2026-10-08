"use client";

import { useRef, useState } from "react";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { PANE_IDS, type PaneId } from "@/lib/paneOrder";

/** Posição de um painel aberto dentro da área do gráfico, em px. */
export interface PaneBox {
  id: PaneId;
  index: number;
  top: number;
  height: number;
}

/** Uma série na legenda do painel: nome e cor da linha. */
export interface LegendItem {
  label: string;
  color: string;
}

interface Props {
  /** Painéis abertos, de cima para baixo. */
  boxes: PaneBox[];
  /** Nomes das séries de cada painel. Ficam aqui, e não no eixo, onde cobririam os candles. */
  legends: Partial<Record<PaneId, LegendItem[]>>;
  /** Move o painel para a posição `to` (0 = topo) entre os abertos (arrastando). */
  onMove: (id: PaneId, to: number) => void;
  /** Sobe (-1) ou desce (+1) o painel uma posição (teclado). */
  onStep: (id: PaneId, delta: -1 | 1) => void;
}

interface Drag {
  id: PaneId;
  /** Posição do ponteiro dentro da área do gráfico. */
  y: number;
}

/** Posição de destino: quantos dos outros painéis ficam acima do ponteiro. */
function dropTarget(boxes: PaneBox[], drag: Drag): number {
  return boxes.filter((b) => b.id !== drag.id && b.top + b.height / 2 < drag.y).length;
}

/**
 * Camada sobre o gráfico, no canto superior esquerdo de cada painel: a alça ⋮⋮ (arrastar muda a
 * ordem, com uma linha mostrando onde o painel vai cair; com a alça em foco, ↑ e ↓ fazem o mesmo)
 * e a legenda com o nome das séries. Só a alça recebe o mouse; a legenda deixa o gráfico livre.
 */
export function PaneHandles({ boxes, legends, onMove, onStep }: Props) {
  const { t } = useI18n();
  const layerRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const movable = boxes.length > 1;

  const position = (id: PaneId) => boxes.findIndex((b) => b.id === id);
  const pointerY = (clientY: number) => clientY - (layerRef.current?.getBoundingClientRect().top ?? 0);

  // Linha de destino: no topo do painel que ficará logo abaixo do arrastado, ou no fim do último.
  const target = drag ? dropTarget(boxes, drag) : null;
  const others = drag ? boxes.filter((b) => b.id !== drag.id) : [];
  const indicatorY =
    target === null ? null : target < others.length ? others[target].top : others[others.length - 1].top + others[others.length - 1].height;
  const dragged = drag ? boxes.find((b) => b.id === drag.id) : null;

  return (
    <div ref={layerRef} className="pointer-events-none absolute inset-0 z-10">
      {dragged && <div className="absolute inset-x-0 rounded bg-accent/10" style={{ top: dragged.top, height: dragged.height }} />}
      {indicatorY !== null && <div className="absolute inset-x-0 h-0.5 -translate-y-1/2 bg-accent" style={{ top: indicatorY }} />}
      {boxes.map((box) => {
        const items = legends[box.id] ?? [];
        if (items.length === 0) return null;
        return (
          <ul
            key={`legend-${box.id}`}
            style={{ top: box.top + 4 }}
            className={`absolute flex max-w-[60%] flex-wrap gap-x-2.5 gap-y-0.5 rounded bg-surface/75 px-1.5 py-0.5 text-[11px] font-medium leading-5 ${movable ? "left-6" : "left-1"}`}
          >
            {items.map((item) => (
              <li key={item.label} className="flex items-center gap-1" style={{ color: item.color }}>
                <span aria-hidden className="h-0.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </li>
            ))}
          </ul>
        );
      })}
      {/* Ordem fixa no DOM (a posição vem do style): assim a alça não perde o foco ao mover pelo teclado. */}
      {PANE_IDS.map((id) => {
        const box = boxes.find((b) => b.id === id);
        if (!box || !movable) return null;
        const name = t.panes.names[id];
        const i = position(id);
        return (
          <button
            key={id}
            type="button"
            aria-label={fmt(t.panes.move, { name })}
            title={fmt(t.panes.move, { name })}
            style={{ top: box.top + 4 }}
            className={`pointer-events-auto absolute left-1 flex h-7 w-4 cursor-grab touch-none items-center justify-center rounded border border-border bg-surface/90 text-muted shadow-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent ${
              drag?.id === id ? "cursor-grabbing text-accent" : ""
            }`}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              setDrag({ id, y: pointerY(e.clientY) });
            }}
            onPointerMove={(e) => {
              if (drag?.id === id) setDrag({ id, y: pointerY(e.clientY) });
            }}
            onPointerUp={() => {
              if (drag?.id !== id) return;
              const to = dropTarget(boxes, drag);
              setDrag(null);
              if (to !== i) onMove(id, to);
            }}
            onPointerCancel={() => setDrag(null)}
            onKeyDown={(e) => {
              // A posição atual vem da ordem salva (no componente pai), não da medição, que
              // pode estar um quadro atrasada quando as setas são apertadas em sequência.
              if (e.key === "ArrowUp") onStep(id, -1);
              else if (e.key === "ArrowDown") onStep(id, 1);
              else return;
              e.preventDefault();
            }}
          >
            <svg aria-hidden viewBox="0 0 6 14" className="h-3.5 w-1.5" fill="currentColor">
              {[2, 7, 12].flatMap((cy) => [<circle key={`l${cy}`} cx={1} cy={cy} r={1} />, <circle key={`r${cy}`} cx={5} cy={cy} r={1} />])}
            </svg>
          </button>
        );
      })}
    </div>
  );
}
