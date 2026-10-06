import Link from "next/link";
import type { Bar } from "@/lib/drawings/types";
import type { ChannelSignal, ChannelSystemState, FourWeekSettings } from "@/lib/priceChannel";

const MAX_LISTED = 5;
const RECENT_BARS = 5;

const LABEL: Record<ChannelSignal["kind"], string> = { buy: "Compra", sell: "Venda", exit: "Saída" };
const TONE: Record<ChannelSignal["kind"], string> = {
  buy: "bg-positive/15 text-positive",
  sell: "bg-negative/15 text-negative",
  exit: "bg-target/15 text-target",
};

const num = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const weeks = (n: number) => `${n} ${n === 1 ? "semana" : "semanas"}`;

interface Props {
  bars: Bar[];
  settings: FourWeekSettings;
  /** null nos períodos intradiários: a regra só vale em candles diários. */
  system: {
    state: ChannelSystemState;
    /** Níveis do próximo candle: canal de entrada e, na versão não contínua, o de saída. */
    upper: number | null;
    lower: number | null;
    exitUpper: number | null;
    exitLower: number | null;
  } | null;
  show: boolean;
  onShowChange: (show: boolean) => void;
}

/** Painel da regra das 4 semanas: posição do sistema, níveis do próximo pregão e sinais recentes. */
export function FourWeekPanel({ bars, settings, system, show, onShowChange }: Props) {
  const title = (
    <h3 className="text-sm font-semibold">
      Regra das 4 semanas{" "}
      <span className="font-normal text-muted">
        · entrada em {weeks(settings.entryWeeks)},{" "}
        {settings.exitWeeks === null ? "contínua" : `saída em ${weeks(settings.exitWeeks)}`}
      </span>
    </h3>
  );

  if (!system) {
    return (
      <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
        {title}
        <p className="text-muted">
          A regra é definida em semanas de pregões e só vale em candles diários: use um período de 3M em diante, ou 23 dias ou
          mais no campo Dias.
        </p>
      </div>
    );
  }

  const { state, upper, lower, exitUpper, exitLower } = system;
  const date = (i: number) =>
    new Date(bars[i].time * 1000).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  const latest = state.signals.at(-1);
  const recent = latest && bars.length - 1 - latest.index < RECENT_BARS ? latest : null;
  const listed = state.signals.slice(-MAX_LISTED).reverse();
  const continuous = settings.exitWeeks === null;

  const explain = (s: ChannelSignal) => {
    const close = num(bars[s.index].close);
    if (s.kind === "buy") return `fechou em ${close}, acima da máxima de ${weeks(settings.entryWeeks)}`;
    if (s.kind === "sell") return `fechou em ${close}, abaixo da mínima de ${weeks(settings.entryWeeks)}`;
    return `fechou em ${close} e rompeu o canal de saída de ${weeks(settings.exitWeeks ?? settings.entryWeeks)}: posição zerada`;
  };

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {title}
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={show} onChange={(e) => onShowChange(e.target.checked)} />
          Mostrar sinais no gráfico
        </label>
      </div>

      <p className="text-sm">
        <strong>Posição do sistema:</strong>{" "}
        {state.position === "flat" || state.since === null ? (
          "de fora, esperando um rompimento do canal de entrada."
        ) : (
          <>
            {state.position === "long" ? "comprado" : "vendido"} desde {date(state.since)} (fechamento {num(bars[state.since].close)}).
          </>
        )}
      </p>

      {upper !== null && lower !== null && (
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
          {/* De fora: os dois rompimentos de entrada valem. */}
          {state.position === "flat" && (
            <>
              <li>
                Compra se fechar acima de <strong>{num(upper)}</strong> (máxima de {weeks(settings.entryWeeks)}).
              </li>
              <li>
                Venda se fechar abaixo de <strong>{num(lower)}</strong> (mínima de {weeks(settings.entryWeeks)}).
              </li>
            </>
          )}
          {/* Contínua: o rompimento contrário do canal de entrada inverte a posição. */}
          {continuous && state.position === "long" && (
            <li>
              Inverte para venda se fechar abaixo de <strong>{num(lower)}</strong> (mínima de {weeks(settings.entryWeeks)}).
            </li>
          )}
          {continuous && state.position === "short" && (
            <li>
              Inverte para compra se fechar acima de <strong>{num(upper)}</strong> (máxima de {weeks(settings.entryWeeks)}).
            </li>
          )}
          {/* Não contínua: a posição sai pelo canal curto; depois, só um novo rompimento de entrada abre outra. */}
          {!continuous && state.position === "long" && exitLower !== null && (
            <li>
              Sai da compra se fechar abaixo de <strong>{num(exitLower)}</strong> (mínima de {weeks(settings.exitWeeks!)}).
            </li>
          )}
          {!continuous && state.position === "short" && exitUpper !== null && (
            <li>
              Sai da venda se fechar acima de <strong>{num(exitUpper)}</strong> (máxima de {weeks(settings.exitWeeks!)}).
            </li>
          )}
        </ul>
      )}

      {recent ? (
        <div
          role="alert"
          className={`rounded-lg border p-3 text-sm ${recent.kind === "buy" ? "border-positive/40 bg-positive/10 text-positive" : recent.kind === "sell" ? "border-negative/40 bg-negative/10 text-negative" : "border-target/40 bg-target/10 text-target"}`}
        >
          <strong>
            {LABEL[recent.kind]} em {date(recent.index)}:
          </strong>{" "}
          {explain(recent)}.
          {recent.index === bars.length - 1 && (
            <span className="mt-1 block text-xs opacity-80">
              O sinal está no último candle: se ele ainda estiver em formação, pode se desfazer até o fechamento.
            </span>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted">Nenhum sinal nos últimos {RECENT_BARS} pregões.</p>
      )}

      {listed.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs font-medium text-muted">Sinais no período ({state.signals.length})</summary>
          <ul className="mt-2 flex flex-col gap-2">
            {listed.map((s) => (
              <li key={`${s.kind}-${s.index}`} className="flex gap-2">
                <span className={`mt-0.5 h-fit shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE[s.kind]}`}>
                  {LABEL[s.kind]}
                </span>
                <span className="text-muted">
                  {date(s.index)}: {explain(s)}.
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="text-[11px] text-muted">
        Sistema de Donchian (Murphy, cap. 9), pelo fechamento. O canal usa a máxima e a mínima das semanas anteriores (5 pregões por
        semana) e precisa desse histórico para começar.{" "}
        <Link href="/glossario/teorias/regra-das-4-semanas" className="font-medium text-accent hover:underline">
          Aula da regra das 4 semanas
        </Link>
      </p>
    </div>
  );
}
