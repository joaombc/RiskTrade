import Link from "next/link";
import type { Bar } from "@/lib/drawings/types";
import { isIntraday, type HistoryRange } from "@/lib/market";
import {
  cotMarketFor,
  readOpenInterest,
  type OpenInterestReading,
  type OpenInterestSeries,
} from "@/lib/openInterest";

/** As regras de Murphy (cap. 7) para cada combinação de preço e interesse aberto. */
const READINGS: Record<OpenInterestReading, { title: string; text: string; tone: "positive" | "negative" | "muted" }> = {
  "up-rising": {
    title: "Alta com dinheiro novo",
    text: "Preço e interesse aberto sobem juntos: novos compradores estão abrindo posições. A tendência de alta está saudável.",
    tone: "positive",
  },
  "up-falling": {
    title: "Alta sem dinheiro novo",
    text: "O preço sobe, mas o interesse aberto cai: a alta vem de vendidos zerando posição, não de compradores novos. Tende a perder força quando essa recompra acabar.",
    tone: "negative",
  },
  "down-rising": {
    title: "Queda com vendedores novos",
    text: "O preço cai e o interesse aberto sobe: há venda agressiva com posições novas. A tendência de baixa está forte.",
    tone: "negative",
  },
  "down-falling": {
    title: "Queda por liquidação",
    text: "Preço e interesse aberto caem juntos: comprados perdedores estão saindo. A queda tende a perder força quando essa liquidação terminar.",
    tone: "positive",
  },
  "flat-rising": {
    title: "Acúmulo na lateralidade",
    text: "O preço anda de lado enquanto o interesse aberto cresce: muitos estão se posicionando à espera do rompimento. Quando ele vier, quem ficou do lado errado terá de zerar, o que tende a intensificar o movimento.",
    tone: "muted",
  },
  stable: {
    title: "Sem sinal claro",
    text: "Preço sem tendência (menos de 1%) ou interesse aberto estável (menos de 2%): a combinação não confirma nem contraria um movimento. Se o interesse aberto vinha subindo numa tendência longa, a estabilização pode ser o primeiro aviso de mudança.",
    tone: "muted",
  },
};

const TONE_CLASS = {
  positive: "border-positive/40 bg-positive/10",
  negative: "border-negative/40 bg-negative/10",
  muted: "border-border bg-background/60",
};

const dateFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
const percent = (value: number) => `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1).replace(".", ",")}%`;

interface Props {
  symbol: string;
  range: HistoryRange;
  bars: Bar[];
  series: OpenInterestSeries | null;
  loading: boolean;
}

/** Explica o painel de interesse aberto (só para futuros) e aplica a leitura de Murphy às últimas semanas. */
export function OpenInterestNote({ symbol, range, bars, series, loading }: Props) {
  const market = cotMarketFor(symbol);
  if (!market || loading) return null;

  const glossaryLink = (
    <Link href="/glossario#interesse-aberto" className="font-medium text-accent hover:underline">
      Entenda o interesse aberto
    </Link>
  );

  if (isIntraday(range) || !series) {
    return (
      <p className="mt-4 border-t border-border pt-4 text-sm text-muted">
        {isIntraday(range)
          ? "O interesse aberto deste contrato aparece nos períodos diários (3M em diante): os dados da CFTC são semanais."
          : "O interesse aberto da CFTC está indisponível no momento."}{" "}
        {glossaryLink}
      </p>
    );
  }

  const trend = readOpenInterest(bars, series.values);
  const reading = trend && READINGS[trend.reading];

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <h3 className="text-sm font-semibold">Interesse aberto · {market.name}</h3>
      {trend && reading && (
        <div role="status" className={`rounded-lg border p-3 text-sm ${TONE_CLASS[reading.tone]}`}>
          <strong>{reading.title}.</strong> Nas últimas 4 semanas, o preço variou {percent(trend.priceChange)} e o interesse aberto{" "}
          {percent(trend.openInterestChange)}. {reading.text}
        </div>
      )}
      <p className="text-xs leading-relaxed text-muted">
        Contratos em aberto somando todos os vencimentos (o card do ativo mostra só o vencimento atual), do relatório semanal
        Commitments of Traders da CFTC. Cada degrau é a
        posição de terça-feira, divulgada na sexta; último relatório: {dateFormat.format(new Date(`${series.lastReport}T00:00:00Z`))}.
        Como todo indicador, confirma a tendência do preço, mas não a substitui. {glossaryLink}
      </p>
    </div>
  );
}
