import Link from "next/link";
import { BANDWIDTH_LOOKBACK, STRONG_TREND_BARS, type BollingerReading } from "@/lib/bollinger";
import type { Bar } from "@/lib/drawings/types";

const num = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  bars: Bar[];
  reading: BollingerReading | null;
  intraday: boolean;
}

/** Leitura das bandas de Bollinger no último candle, com as regras de Murphy (cap. 9). */
export function BollingerPanel({ bars, reading, intraday }: Props) {
  const dateFormat = new Intl.DateTimeFormat(
    "pt-BR",
    intraday ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit", year: "2-digit" },
  );
  const dateOf = (i: number) => dateFormat.format(new Date(bars[i].time * 1000));

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <h3 className="text-sm font-semibold">
        Bandas de Bollinger <span className="font-normal text-muted">· MMS 20 ± 2 desvios-padrão</span>
      </h3>

      {!reading ? (
        <p className="text-sm text-muted">Histórico insuficiente para as bandas (são precisos 20 candles).</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <strong>Posição:</strong> fechamento {num(reading.close)}, entre a banda de baixo ({num(reading.lower)}) e a de cima (
            {num(reading.upper)}), com %B de {num(reading.percentB)}
            {reading.percentB >= 1
              ? ": acima da banda de cima, sobrecomprado."
              : reading.percentB <= 0
                ? ": abaixo da banda de baixo, sobrevendido."
                : reading.percentB >= 0.5
                  ? ", na metade de cima."
                  : ", na metade de baixo."}
          </li>

          {reading.touch && (
            <li
              role="status"
              className={`rounded-lg border p-3 ${reading.touch.band === "upper" ? "border-negative/40 bg-negative/10" : "border-positive/40 bg-positive/10"}`}
            >
              <strong>{reading.touch.band === "upper" ? "Sobrecompra" : "Sobrevenda"}:</strong> o preço tocou a banda de{" "}
              {reading.touch.band === "upper" ? "cima" : "baixo"} em {dateOf(reading.touch.index)}. Murphy lembra que o preço costuma
              achar {reading.touch.band === "upper" ? "resistência na banda de cima" : "suporte na banda de baixo"}, e que o sinal
              fica mais forte confirmado por um oscilador.
              {reading.strongTrend === (reading.touch.band === "upper" ? "up" : "down") &&
                " Mas o mercado está em tendência forte nessa direção: aqui o toque é sinal de força, não de reversão."}
            </li>
          )}

          <li>
            <strong>Alvo:</strong>{" "}
            {reading.target ? (
              <>
                o preço cruzou a média de 20 para {reading.target.direction === "up" ? "cima" : "baixo"} em{" "}
                {dateOf(reading.target.crossIndex)}
                {reading.target.fromBand &&
                  `, depois de tocar a banda de ${reading.target.direction === "up" ? "baixo" : "cima"} (o caso clássico do livro)`}
                , então o alvo é a <strong>banda de {reading.target.direction === "up" ? "cima" : "baixo"}</strong>, hoje em{" "}
                {num(reading.target.price)}.
                {reading.target.crossIndex === bars.length - 1 &&
                  " O cruzamento está no último candle: se ele ainda estiver em formação, pode se desfazer até o fechamento."}
              </>
            ) : (
              "sem cruzamento da média de 20 no período."
            )}
          </li>

          {reading.strongTrend && (
            <li>
              <strong>Tendência forte de {reading.strongTrend === "up" ? "alta" : "baixa"}:</strong> os últimos {STRONG_TREND_BARS}{" "}
              fechamentos ficaram {reading.strongTrend === "up" ? "acima" : "abaixo"} da média, com toque na banda de{" "}
              {reading.strongTrend === "up" ? "cima" : "baixo"}. O preço tende a oscilar entre essa banda e a média, e{" "}
              {reading.strongTrend === "up" ? "fechar abaixo" : "fechar acima"} da média ({num(reading.middle)}) avisa de virada.
            </li>
          )}

          <li>
            <strong>Largura:</strong> {num(reading.width.current)}% do preço
            {reading.width.state === "squeeze" ? (
              <>
                , entre as menores dos últimos {BANDWIDTH_LOOKBACK} candles: <strong>aperto</strong>. Bandas apertadas costumam
                anteceder o início de um movimento forte; observe a direção do rompimento.
              </>
            ) : reading.width.state === "wide" ? (
              <>
                , entre as maiores dos últimos {BANDWIDTH_LOOKBACK} candles: <strong>bandas muito abertas</strong>. Isso costuma
                aparecer perto do fim da tendência atual.
              </>
            ) : (
              <>, dentro do normal para os últimos {BANDWIDTH_LOOKBACK} candles.</>
            )}
          </li>
        </ul>
      )}

      <p className="text-[11px] text-muted">
        Regras de Murphy (cap. 9). As bandas funcionam melhor junto com osciladores de sobrecompra e sobrevenda.{" "}
        <Link href="/glossario#bandas-de-bollinger" className="font-medium text-accent hover:underline">
          Como operar com as bandas
        </Link>
      </p>
    </div>
  );
}
