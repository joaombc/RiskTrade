import type { Bar } from "@/lib/drawings/types";
import {
  ENVELOPE_REGIME_LABELS,
  ENVELOPE_SIGNAL_LABELS,
  maLabel,
  RECENT_CROSS_BARS,
  type EnvelopeRegime,
  type EnvelopeSignal,
  type MovingAverage,
} from "@/lib/movingAverages";

const MAX_LISTED = 5;

const TONE: Record<EnvelopeSignal["kind"], string> = {
  buy: "bg-positive/15 text-positive",
  sell: "bg-negative/15 text-negative",
  exit: "bg-target/15 text-target",
};

/** O que fazer em cada contexto, segundo as táticas da aula de médias móveis. */
const PLAYBOOK: Record<EnvelopeRegime, string> = {
  lateral: "reversão à média: venda na banda de cima, compra na de baixo, alvo na média central",
  up: "a favor da alta: compra nos recuos até a média, realização na banda de cima; não vender na banda de cima",
  down: "a favor da baixa: venda nos repiques até a média, realização na banda de baixo; não comprar na banda de baixo",
};

function explain(s: EnvelopeSignal, label: string, percent: number): string {
  // Sem artigo: cada frase põe o seu ("tocou a banda…", "alvo na banda…").
  const band = (side: "upper" | "lower") => `banda de ${side === "upper" ? "cima" : "baixo"} (${side === "upper" ? "+" : "−"}${percent}%)`;
  switch (s.regime) {
    case "lateral":
      return s.kind === "sell"
        ? `mercado lateral e a máxima tocou a ${band("upper")}: sobrecompra; alvo na ${label}`
        : `mercado lateral e a mínima tocou a ${band("lower")}: sobrevenda; alvo na ${label}`;
    case "up":
      return s.kind === "buy"
        ? `tendência de alta e o recuo tocou a ${label}: compra a favor da tendência; alvo na ${band("upper")}`
        : `tendência de alta e a máxima alcançou a ${band("upper")}: alvo da compra atingido`;
    case "down":
      return s.kind === "sell"
        ? `tendência de baixa e o repique tocou a ${label}: venda a favor da tendência; alvo na ${band("lower")}`
        : `tendência de baixa e a mínima alcançou a ${band("lower")}: alvo da venda atingido`;
  }
}

interface Props {
  bars: Bar[];
  average: MovingAverage;
  percent: number;
  signals: EnvelopeSignal[];
  /** Contexto no último candle (null enquanto a média não tem histórico suficiente). */
  regime: EnvelopeRegime | null;
  intraday: boolean;
  show: boolean;
  onShowChange: (show: boolean) => void;
}

/** Painel dos sinais dos envelopes: envelope usado, contexto atual, alerta recente e lista. */
export function EnvelopeSignalPanel({ bars, average, percent, signals, regime, intraday, show, onShowChange }: Props) {
  const label = maLabel(average);
  const dateFormat = new Intl.DateTimeFormat(
    "pt-BR",
    intraday
      ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "2-digit", year: "2-digit" },
  );
  const dateOf = (s: EnvelopeSignal) => dateFormat.format(new Date(bars[s.index].time * 1000));
  const price = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

  const latest = signals[signals.length - 1];
  const recent = latest && bars.length - 1 - latest.index < RECENT_CROSS_BARS ? latest : null;
  const listed = signals.slice(-MAX_LISTED).reverse();
  const recentTone = !recent ? "" : recent.kind === "buy" ? "border-positive/40 bg-positive/10 text-positive" : recent.kind === "sell" ? "border-negative/40 bg-negative/10 text-negative" : "border-target/40 bg-target/10 text-target";

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          Sinais dos envelopes{" "}
          <span className="font-normal text-muted">
            · {label} ± {percent}%
          </span>
        </h3>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={show} onChange={(e) => onShowChange(e.target.checked)} />
          Mostrar sinais no gráfico
        </label>
      </div>

      <p className="text-sm">
        {regime ? (
          <>
            Contexto agora: <strong>{ENVELOPE_REGIME_LABELS[regime]}</strong>. Tática: {PLAYBOOK[regime]}.
          </>
        ) : (
          <span className="text-muted">A média ainda não tem histórico suficiente para medir o contexto.</span>
        )}
      </p>

      {recent ? (
        <div role="alert" className={`rounded-lg border p-3 text-sm ${recentTone}`}>
          <strong>
            {ENVELOPE_SIGNAL_LABELS[recent.kind]} em {dateOf(recent)}:
          </strong>{" "}
          {explain(recent, label, percent)} (fechamento {price(bars[recent.index].close)}).
          {recent.index === bars.length - 1 && (
            <span className="mt-1 block text-xs opacity-80">
              O sinal está no último candle: se ele ainda estiver em formação, o toque pode se desfazer até o fechamento.
            </span>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted">Nenhum sinal nos últimos {RECENT_CROSS_BARS} candles.</p>
      )}

      {listed.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs font-medium text-muted">Sinais no período ({signals.length})</summary>
          <ul className="mt-2 flex flex-col gap-2">
            {listed.map((s) => (
              <li key={`${s.kind}-${s.index}`} className="flex gap-2">
                <span className={`mt-0.5 h-fit shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE[s.kind]}`}>
                  {ENVELOPE_SIGNAL_LABELS[s.kind]}
                </span>
                <span className="text-muted">
                  {dateOf(s)}: {explain(s, label, percent)} (fechamento {price(bars[s.index].close)}).
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="text-[11px] text-muted">
        Táticas de curto prazo da aula de médias móveis, além do Murphy. O contexto vem da inclinação da média: tendência quando ela
        anda mais que metade da largura do envelope em meio período. Defina o stop antes de entrar; na reversão, ele fica além da
        banda tocada.
      </p>
    </div>
  );
}
