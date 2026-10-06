import type { Diagram, DiagramCurve, DiagramLine, DiagramPoint, DiagramTone, Pt } from "@/lib/glossary/types";

const TONE_CLASS: Record<DiagramTone, string> = {
  primary: "text-accent",
  support: "text-positive",
  resistance: "text-negative",
  target: "text-target",
  muted: "text-muted",
};

const LABEL_OFFSET = 4;

function Line({ line }: { line: DiagramLine }) {
  const [x1, y1] = line.from;
  const [x2, y2] = line.to;
  const vertical = Math.abs(x2 - x1) < 0.5;
  return (
    <g className={TONE_CLASS[line.tone]}>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="currentColor"
        strokeWidth={1.1}
        strokeDasharray={line.dashed ? "3 2" : undefined}
        vectorEffect="non-scaling-stroke"
      />
      {line.label && (
        <text
          x={vertical ? (line.labelAt === "start" ? x1 - 2 : x2 + 2) : line.labelAt === "start" ? x1 : x2}
          y={vertical ? (y1 + y2) / 2 : (line.labelAt === "start" ? y1 : y2) - 2}
          textAnchor={vertical ? (line.labelAt === "start" ? "end" : "start") : line.labelAt === "start" ? "start" : "end"}
          dominantBaseline={vertical ? "middle" : "auto"}
          fontSize={6}
          fill="currentColor"
        >
          {line.label}
        </text>
      )}
    </g>
  );
}

function Curve({ curve }: { curve: DiagramCurve }) {
  const last = curve.path[curve.path.length - 1];
  return (
    <g className={TONE_CLASS[curve.tone]}>
      <polyline
        points={toPoints(curve.path)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeDasharray={curve.dashed ? "3 2" : undefined}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {curve.label && last && (
        <text
          x={last[0]}
          y={curve.labelPlacement === "below" ? last[1] + 7 : last[1] - 3}
          textAnchor="end"
          fontSize={6}
          fontWeight={600}
          fill="currentColor"
          className="stroke-surface"
          strokeWidth={2}
          paintOrder="stroke"
        >
          {curve.label}
        </text>
      )}
    </g>
  );
}

function Point({ point }: { point: DiagramPoint }) {
  const [x, y] = point.at;
  const placement = point.placement ?? "above";
  const offset: Record<NonNullable<DiagramPoint["placement"]>, { dx: number; dy: number; anchor: "start" | "middle" | "end" }> = {
    above: { dx: 0, dy: -LABEL_OFFSET, anchor: "middle" },
    below: { dx: 0, dy: LABEL_OFFSET + 5, anchor: "middle" },
    left: { dx: -LABEL_OFFSET, dy: 2, anchor: "end" },
    right: { dx: LABEL_OFFSET, dy: 2, anchor: "start" },
  };
  const { dx, dy, anchor } = offset[placement];
  return (
    <g className="text-foreground">
      <circle cx={x} cy={y} r={1.8} className="fill-surface" stroke="currentColor" strokeWidth={0.9} />
      <text
        x={x + dx}
        y={y + dy}
        textAnchor={anchor}
        fontSize={6.5}
        fontWeight={600}
        fill="currentColor"
        // Contorno na cor do fundo: o rótulo continua legível quando cai sobre uma linha.
        className="stroke-surface"
        strokeWidth={2}
        paintOrder="stroke"
      >
        {point.label}
      </text>
    </g>
  );
}

/** Rótulo do painel inferior, com contorno na cor de fundo para ficar legível sobre as barras. */
function PanelLabel({ text }: { text: string }) {
  return (
    <text
      x={4}
      y={104}
      fontSize={5.5}
      className="fill-muted stroke-surface"
      strokeWidth={2}
      paintOrder="stroke"
      strokeLinejoin="round"
    >
      {text}
    </text>
  );
}

const toPoints = (path: Pt[]) => path.map(([x, y]) => `${x},${y}`).join(" ");

/** Diagrama vetorial de um termo do glossário (viewBox 200×120, ver tipos). */
export function GlossaryDiagram({
  diagram,
  title,
  labels = { diagram: "Diagrama: {title}", volume: "Volume" },
}: {
  diagram: Diagram;
  title: string;
  /** Textos no idioma da página (o padrão é português). */
  labels?: { diagram: string; volume: string };
}) {
  const hasSub = Boolean(diagram.volume || diagram.sub);
  const height = hasSub ? 120 : 96;
  const slot = diagram.candles ? 180 / diagram.candles.length : 0;
  const barSlot = diagram.volume ? 180 / diagram.volume.length : 0;

  return (
    <svg role="img" aria-label={labels.diagram.replace("{title}", title)} viewBox={`0 0 200 ${height}`} className="h-auto w-full">
      {hasSub && <line x1={4} x2={196} y1={95} y2={95} className="text-border" stroke="currentColor" strokeWidth={0.5} />}

      {diagram.path && (
        <polyline
          points={toPoints(diagram.path)}
          fill="none"
          className="text-foreground"
          stroke="currentColor"
          strokeWidth={1.4}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      )}

      {diagram.curves?.map((c, i) => <Curve key={i} curve={c} />)}

      {diagram.candles?.map((c, i) => {
        const x = 10 + slot * (i + 0.5);
        // Coordenadas y: menor y = preço maior.
        const up = c.c <= c.o;
        const top = Math.min(c.o, c.c);
        const bodyHeight = Math.max(Math.abs(c.c - c.o), 0.6);
        return (
          <g key={i} className={up ? "text-positive" : "text-negative"}>
            <line x1={x} x2={x} y1={c.h} y2={c.l} stroke="currentColor" strokeWidth={0.8} />
            <rect x={x - slot * 0.3} y={top} width={slot * 0.6} height={bodyHeight} fill="currentColor" />
          </g>
        );
      })}

      {diagram.volume?.map((v, i) => {
        const x = 10 + barSlot * (i + 0.5);
        const h = v.h * 18;
        return (
          <rect
            key={i}
            x={x - barSlot * 0.3}
            y={118 - h}
            width={barSlot * 0.6}
            height={h}
            className={v.up ? "text-positive" : "text-negative"}
            fill="currentColor"
            opacity={0.6}
          />
        );
      })}
      {diagram.volume && <PanelLabel text={labels.volume} />}

      {diagram.sub && (
        <g>
          <polyline
            points={toPoints(diagram.sub.path)}
            fill="none"
            className="text-target"
            stroke="currentColor"
            strokeWidth={1.2}
            vectorEffect="non-scaling-stroke"
          />
          <PanelLabel text={diagram.sub.label} />
          {diagram.sub.lines?.map((l, i) => <Line key={i} line={l} />)}
        </g>
      )}

      {diagram.notes?.map((n, i) => (
        <text
          key={i}
          x={n.at[0]}
          y={n.at[1]}
          textAnchor={n.anchor ?? "middle"}
          fontSize={6}
          fontStyle="italic"
          className={TONE_CLASS[n.tone ?? "muted"]}
          fill="currentColor"
        >
          {n.text}
        </text>
      ))}
      {diagram.lines?.map((l, i) => <Line key={i} line={l} />)}
      {diagram.points?.map((p, i) => <Point key={i} point={p} />)}
    </svg>
  );
}
