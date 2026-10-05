import type { Bar } from "@/lib/drawings/types";
import {
  CROSS_SIGNAL_LABELS,
  maLabel,
  RECENT_CROSS_BARS,
  type CrossSignal,
  type MovingAverage,
} from "@/lib/movingAverages";

const MAX_LISTED = 5;

const TONE: Record<CrossSignal["kind"], string> = {
  buy: "bg-positive/15 text-positive",
  sell: "bg-negative/15 text-negative",
  "buy-alert": "bg-positive/10 text-positive",
  "sell-alert": "bg-negative/10 text-negative",
};

/** O que aconteceu em cada sinal, com os nomes das médias (curta, do meio e longa). */
function explain(kind: CrossSignal["kind"], averages: MovingAverage[]): string {
  const [short, long] = [maLabel(averages[0]), maLabel(averages[averages.length - 1])];
  if (averages.length === 2) {
    return kind === "buy" ? `a ${short} cruzou a ${long} para cima` : `a ${short} cruzou a ${long} para baixo`;
  }
  const mid = maLabel(averages[1]);
  switch (kind) {
    case "buy":
      return `a ${mid} cruzou a ${long} para cima, confirmando a compra`;
    case "sell":
      return `a ${mid} cruzou a ${long} para baixo, confirmando a venda`;
    case "buy-alert":
      return `a ${short} passou para cima da ${mid} e da ${long}; a compra se confirma quando a ${mid} cruzar a ${long}`;
    case "sell-alert":
      return `a ${short} passou para baixo da ${mid} e da ${long}; a venda se confirma quando a ${mid} perder a ${long}`;
  }
}

const price = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

interface Props {
  bars: Bar[];
  /** Médias visíveis, já ordenadas pelo período (da curta para a longa). */
  averages: MovingAverage[];
  /** Último valor de cada média visível, na mesma ordem. */
  lastValues: (number | null)[];
  signals: CrossSignal[];
  intraday: boolean;
  show: boolean;
  onShowChange: (show: boolean) => void;
}

/**
 * Painel dos sinais de cruzamento (Murphy, cap. 9): qual par ou trio está sendo lido, a posição
 * atual das médias, um alerta para cruzamentos recentes e a lista dos últimos sinais.
 */
export function CrossSignalPanel({ bars, averages, lastValues, signals, intraday, show, onShowChange }: Props) {
  if (averages.length < 2) return null;

  const dateFormat = new Intl.DateTimeFormat(
    "pt-BR",
    intraday
      ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "2-digit", year: "2-digit" },
  );
  const dateOf = (s: CrossSignal) => dateFormat.format(new Date(bars[s.index].time * 1000));
  const names = averages.map(maLabel).join(" × ");

  if (averages.length > 3) {
    return (
      <div className="mt-4 border-t border-border pt-4 text-sm text-muted">
        <h3 className="mb-1 text-sm font-semibold text-foreground">Sinais de cruzamento</h3>
        Com {averages.length} médias visíveis não há regra de cruzamento: Murphy define sinais para duas médias (cruzamento duplo)
        ou três (cruzamento triplo). Oculte ou remova médias até ficarem duas ou três.
      </div>
    );
  }

  const latest = signals[signals.length - 1];
  const recent = latest && bars.length - 1 - latest.index < RECENT_CROSS_BARS ? latest : null;
  const listed = signals.slice(-MAX_LISTED).reverse();
  const [short, long] = [lastValues[0], lastValues[lastValues.length - 1]];
  const position =
    short === null || long === null
      ? null
      : short > long
        ? `${maLabel(averages[0])} acima da ${maLabel(averages[averages.length - 1])}: posição de compra`
        : `${maLabel(averages[0])} abaixo da ${maLabel(averages[averages.length - 1])}: posição de venda`;

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          Sinais de cruzamento <span className="font-normal text-muted">· {names}</span>
        </h3>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={show} onChange={(e) => onShowChange(e.target.checked)} />
          Mostrar sinais no gráfico
        </label>
      </div>

      {recent ? (
        <div
          role="alert"
          className={`rounded-lg border p-3 text-sm ${recent.kind.startsWith("buy") ? "border-positive/40 bg-positive/10 text-positive" : "border-negative/40 bg-negative/10 text-negative"}`}
        >
          <strong>
            {CROSS_SIGNAL_LABELS[recent.kind]} em {dateOf(recent)}:
          </strong>{" "}
          {explain(recent.kind, averages)} (fechamento {price(bars[recent.index].close)}).
          {recent.index === bars.length - 1 && (
            <span className="mt-1 block text-xs opacity-80">
              O sinal está no último candle: se ele ainda estiver em formação, o cruzamento pode se desfazer até o fechamento.
            </span>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted">
          Nenhum cruzamento nos últimos {RECENT_CROSS_BARS} candles.
          {position && ` Agora: ${position}.`}
        </p>
      )}

      {listed.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs font-medium text-muted">Sinais no período ({signals.length})</summary>
          <ul className="mt-2 flex flex-col gap-2">
            {listed.map((s) => (
              <li key={`${s.kind}-${s.index}`} className="flex gap-2">
                <span className={`mt-0.5 h-fit shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE[s.kind]}`}>
                  {CROSS_SIGNAL_LABELS[s.kind]}
                </span>
                <span className="text-muted">
                  {dateOf(s)}: {explain(s.kind, averages)} (fechamento {price(bars[s.index].close)}).
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="text-[11px] text-muted">
        Regras de Murphy (cap. 9). O cruzamento vale no fechamento do candle: o último, ainda aberto, pode mudar. Médias
        seguem a tendência e erram em mercado lateral, então confirme com o preço e o volume.
      </p>
    </div>
  );
}
