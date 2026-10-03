import { formatPrice } from "@/lib/drawings/geometry";
import type { Bar } from "@/lib/drawings/types";
import { DIVERGENCE_SWING_WINDOW, isRecent, RECENT_DIVERGENCE_BARS, type Divergence } from "@/lib/indicators";

const MAX_LISTED = 5;

const dateFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });

function dateOf(bars: Bar[], index: number) {
  return dateFormat.format(new Date(bars[index].time * 1000));
}

function describe(d: Divergence, bars: Bar[]) {
  const from = dateOf(bars, d.from);
  const to = dateOf(bars, d.to);
  return d.kind === "bearish"
    ? `Topo mais alto no preço (${formatPrice(d.priceFrom)} em ${from} → ${formatPrice(d.priceTo)} em ${to}), mas o OBV fez topo mais baixo: a alta não tem fluxo comprador.`
    : `Fundo mais baixo no preço (${formatPrice(d.priceFrom)} em ${from} → ${formatPrice(d.priceTo)} em ${to}), mas o OBV fez fundo mais alto: a queda não tem fluxo vendedor.`;
}

interface Props {
  bars: Bar[];
  divergences: Divergence[];
  show: boolean;
  onShowChange: (show: boolean) => void;
}

export function DivergencePanel({ bars, divergences, show, onShowChange }: Props) {
  const latest = divergences[divergences.length - 1];
  const recent = latest && isRecent(latest, bars.length) ? latest : null;
  const listed = divergences.slice(-MAX_LISTED).reverse();

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Confirmação por volume (OBV)</h3>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={show} onChange={(e) => onShowChange(e.target.checked)} />
          Mostrar divergências no gráfico
        </label>
      </div>

      {recent ? (
        <div
          role="alert"
          className={`rounded-lg border p-3 text-sm ${recent.kind === "bearish" ? "border-negative/40 bg-negative/10 text-negative" : "border-positive/40 bg-positive/10 text-positive"}`}
        >
          <strong>Divergência {recent.kind === "bearish" ? "baixista" : "altista"} recente.</strong> {describe(recent, bars)}
        </div>
      ) : (
        <p className="text-sm text-muted">
          Nenhuma divergência nos últimos {RECENT_DIVERGENCE_BARS} candles: os topos e fundos recentes do preço não
          contrariam o OBV.
        </p>
      )}

      {listed.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs font-medium text-muted">
            Divergências no período ({divergences.length})
          </summary>
          <ul className="mt-2 flex flex-col gap-2">
            {listed.map((d) => (
              <li key={`${d.kind}-${d.to}`} className="flex gap-2">
                <span
                  className={`mt-0.5 h-fit shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${d.kind === "bearish" ? "bg-negative/15 text-negative" : "bg-positive/15 text-positive"}`}
                >
                  {d.kind === "bearish" ? "Baixista" : "Altista"}
                </span>
                <span className="text-muted">{describe(d, bars)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="text-[11px] text-muted">
        Topos e fundos são confirmados {DIVERGENCE_SWING_WINDOW} candles depois de formados, então o sinal chega com
        esse atraso. Divergência é um alerta, não um sinal de entrada: aguarde a confirmação pelo preço.
      </p>
    </div>
  );
}
