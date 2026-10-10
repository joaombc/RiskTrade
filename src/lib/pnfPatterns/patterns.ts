/**
 * Padrões do ponto e figura listados por Murphy (Technical Analysis of the Financial Markets,
 * cap. 11):
 * - reversões de fundo e de topo, que ele reproduz de A. H. Wheelan (Study Helps in Point & Figure
 *   Technique), no gráfico de 1 caixa;
 * - os sinais de compra e venda do gráfico de 3 caixas (método de A. W. Cohen / Chartcraft).
 * Murphy só desenha os padrões; as descrições são autorais.
 *
 * Cada padrão tem a versão de alta (fundo, ou compra) e a de baixa (topo, ou venda); a de baixa é o
 * espelho da de alta.
 */

/** Coluna do diagrama: de `from` a `to` em níveis de caixa. Subindo = X; descendo = O. */
export type PnfColumn = readonly [from: number, to: number];

/** Ponto do diagrama: coluna e nível. */
export type PnfPoint = readonly [column: number, level: number];

/** Linha inclinada do diagrama (lados do triângulo, linhas de 45°), de centro de caixa a centro de caixa. */
export interface PnfLine {
  from: PnfPoint;
  to: PnfPoint;
}

export interface PnfVariant {
  /** bottom = versão de alta (fundo ou compra); top = de baixa (topo ou venda). */
  side: "bottom" | "top";
  name: string;
  columns: PnfColumn[];
  /** Quantas colunas do começo são a tendência anterior (desenhadas apagadas). */
  context: number;
  /** Linha horizontal do rompimento (entre dois níveis, ex.: 9,5); null quando a linha é inclinada. */
  breakout: number | null;
  lines: PnfLine[];
  /** Caixa em que sai o sinal: compra na versão de alta, venda na de baixa. */
  signal: PnfPoint;
}

export type PnfGroup = "reversal" | "signal";

export interface PnfPattern {
  slug: string;
  group: PnfGroup;
  /** Nome no idioma da página. */
  name: string;
  /** Nome original em inglês, como na lista de Murphy. */
  englishName: string;
  aliases: string[];
  summary: string;
  recognition: string[];
  psychology: string;
  confirmation: string;
  /** Fundo e topo, nessa ordem. */
  variants: [PnfVariant, PnfVariant];
  source: string;
}

export const PNF_SOURCE = "Murphy, Technical Analysis of the Financial Markets, cap. 11 (padrões de Wheelan); descrição autoral";
export const PNF_SIGNAL_SOURCE = "Murphy, Technical Analysis of the Financial Markets, cap. 11 (sinais do gráfico de 3 caixas); descrição autoral";

/** Os diagramas vão do nível 0 ao 16: a versão de baixa é a de alta espelhada nesse intervalo. */
const HEIGHT = 16;

type Shape = Omit<PnfVariant, "side" | "name">;

const flip = ([column, level]: PnfPoint): PnfPoint => [column, HEIGHT - level];

const mirror = (v: Shape): Shape => ({
  columns: v.columns.map(([from, to]) => [HEIGHT - from, HEIGHT - to] as const),
  context: v.context,
  breakout: v.breakout === null ? null : HEIGHT - v.breakout,
  lines: v.lines.map((l) => ({ from: flip(l.from), to: flip(l.to) })),
  signal: flip(v.signal),
});

/** Caixa do sinal de um padrão de reversão: a primeira caixa da base acima da linha de rompimento. */
function breakoutSignal(columns: PnfColumn[], context: number, breakout: number): PnfPoint {
  const column = columns.findIndex(([from, to], k) => k >= context && to > from && to > breakout);
  return [column, Math.ceil(breakout)];
}

type PatternInput = Omit<PnfPattern, "variants" | "source" | "group"> & {
  group?: PnfGroup;
  /** Versão de alta; a de baixa sai espelhada. Sem `signal`, a caixa sai da linha de rompimento. */
  bottom: Pick<Shape, "columns"> & Partial<Shape>;
  names: [bottom: string, top: string];
};

function pattern({ bottom, names, group = "reversal", ...rest }: PatternInput): PnfPattern {
  const context = bottom.context ?? 0;
  const breakout = bottom.breakout ?? null;
  const shape: Shape = {
    columns: bottom.columns,
    context,
    breakout,
    lines: bottom.lines ?? [],
    signal: bottom.signal ?? breakoutSignal(bottom.columns, context, breakout!),
  };
  return {
    ...rest,
    group,
    source: group === "reversal" ? PNF_SOURCE : PNF_SIGNAL_SOURCE,
    variants: [
      { side: "bottom", name: names[0], ...shape },
      { side: "top", name: names[1], ...mirror(shape) },
    ],
  };
}

/** Queda que leva aos fundos (tendência anterior, apagada nos diagramas). */
const DECLINE: PnfColumn[] = [
  [16, 11],
  [12, 13],
];

export const PNF_PATTERNS: PnfPattern[] = [
  pattern({
    slug: "fulcro",
    name: "Fulcro",
    englishName: "Fulcrum",
    aliases: ["fulcrum", "fulcro invertido", "inverse fulcrum", "acumulação", "distribuição"],
    names: ["Fulcro (fundo)", "Fulcro invertido (topo)"],
    summary:
      "O padrão de reversão mais comum do ponto e figura: depois de uma queda forte, o preço forma uma área de congestão no fundo, testa as mínimas e rompe para cima o topo da congestão.",
    recognition: [
      "Vem depois de uma queda longa; a primeira coluna de O da base costuma ser a mais longa (a queda final, às vezes um clímax de venda).",
      "Segue-se um repique no meio da base e um novo teste das mínimas, que segura acima do fundo anterior ou nele.",
      "O padrão se completa quando uma coluna de X passa o topo do repique do meio: o mesmo sinal de compra do gráfico (X acima do X anterior).",
      "No topo (fulcro invertido) é o espelho: congestão depois de uma alta forte, repique de baixa no meio e rompimento para baixo do fundo da congestão.",
    ],
    psychology:
      "A queda final assusta os últimos vendedores. Na congestão, compradores pacientes absorvem a oferta (acumulação): cada nova queda encontra demanda num nível parecido. Quando a oferta acaba, o preço sobe sem resistência e passa o topo da base.",
    confirmation:
      "Só vale com o rompimento do topo da congestão. Recuos depois do rompimento que seguram acima do nível rompido são uma segunda chance de entrada. A largura da base (número de colunas) dá o alvo pela contagem horizontal: quanto mais larga, maior o movimento esperado.",
    bottom: {
      columns: [...DECLINE, [12, 5], [6, 9], [8, 6], [7, 9], [8, 6], [7, 11], [10, 9], [10, 15]],
      context: 2,
      breakout: 9.5,
    },
  }),
  pattern({
    slug: "fulcro-composto",
    name: "Fulcro composto",
    englishName: "Compound Fulcrum",
    aliases: ["compound fulcrum", "fulcro composto invertido", "inverse compound fulcrum", "base dupla"],
    names: ["Fulcro composto (fundo)", "Fulcro composto invertido (topo)"],
    summary:
      "Dois fulcros lado a lado, no mesmo nível: a base é mais larga, com dois testes completos das mínimas antes do rompimento para cima.",
    recognition: [
      "Depois da queda, forma-se um primeiro fulcro (fundo, repique e teste), mas o rompimento não vem: o preço volta às mínimas.",
      "Um segundo fulcro se forma ao lado, com o fundo no mesmo nível do primeiro.",
      "Completa-se quando uma coluna de X passa o topo de toda a congestão.",
      "No topo (fulcro composto invertido): dois fulcros invertidos lado a lado e rompimento para baixo do fundo da congestão.",
    ],
    psychology:
      "A acumulação demora mais: a oferta ainda aparece no primeiro rompimento e devolve o preço às mínimas. Mas as mínimas seguram de novo, sinal de que a demanda continua lá. A base mais longa costuma preceder uma alta maior.",
    confirmation:
      "Rompimento do topo da congestão inteira, não só do segundo fulcro. Por ser mais largo, dá uma contagem horizontal maior que a do fulcro simples e costuma ser mais confiável.",
    bottom: {
      columns: [...DECLINE, [12, 5], [6, 9], [8, 6], [7, 9], [8, 5], [6, 8], [7, 6], [7, 11], [10, 9], [10, 15]],
      context: 2,
      breakout: 9.5,
    },
  }),
  pattern({
    slug: "final-retardado",
    name: "Final retardado",
    englishName: "Delayed Ending",
    aliases: ["delayed ending", "final atrasado", "fulcro de final retardado"],
    names: ["Final retardado (fundo)", "Final retardado (topo)"],
    summary:
      "Um fulcro composto em que o segundo fundo fica abaixo do primeiro: a queda parece ter acabado, mas ainda faz uma última mínima antes de virar.",
    recognition: [
      "Depois da queda, forma-se uma base que parece um fulcro.",
      "Em vez de romper para cima, o preço cai para uma nova mínima, um pouco abaixo do primeiro fundo (a queda termina com atraso).",
      "Da nova mínima sai um segundo fulcro; o padrão se completa quando uma coluna de X passa o topo da congestão.",
      "No topo: depois de uma base de distribuição, uma última máxima um pouco acima da anterior, e então o rompimento para baixo.",
    ],
    psychology:
      "A última mínima tira do mercado quem tinha stops logo abaixo do primeiro fundo e engana os vendedores atrasados, que vendem no pior momento. Sem nova oferta abaixo desse nível, a reversão vem com força.",
    confirmation:
      "A nova mínima sozinha é um sinal de venda no gráfico (O abaixo do O anterior): o padrão só se confirma quando o preço volta e passa o topo da congestão. Murphy considera os fulcros compostos mais fortes que o simples, depois de confirmados.",
    bottom: {
      columns: [...DECLINE, [12, 6], [7, 9], [8, 7], [8, 9], [8, 4], [5, 7], [6, 5], [6, 10], [9, 8], [9, 15]],
      context: 2,
      breakout: 9.5,
    },
  }),
  pattern({
    slug: "oco",
    name: "Ombro-cabeça-ombro",
    englishName: "Head & Shoulders",
    aliases: ["head and shoulders", "oco", "ocoi", "oco invertido", "inverse head and shoulders"],
    names: ["OCO invertido (fundo)", "OCO (topo)"],
    summary:
      "O mesmo padrão do gráfico de barras: três fundos, com o do meio (a cabeça) mais baixo, e uma linha de pescoço que, rompida, confirma a reversão.",
    recognition: [
      "No fundo (OCO invertido): um primeiro fundo (ombro esquerdo), um repique até a linha de pescoço, um fundo mais baixo (cabeça) e outro repique até o pescoço.",
      "O terceiro fundo (ombro direito) fica acima da cabeça, mais ou menos na altura do ombro esquerdo.",
      "Completa-se quando uma coluna de X passa a linha de pescoço (o topo dos repiques).",
      "No topo (OCO): três topos com o do meio mais alto e rompimento para baixo da linha de pescoço.",
    ],
    psychology:
      "A cabeça é a última tentativa dos vendedores. No ombro direito, eles já não conseguem levar o preço até a mínima anterior: a oferta perdeu força, e o rompimento do pescoço mostra que os compradores assumiram.",
    confirmation:
      "O rompimento do pescoço é o sinal. É comum um recuo até o pescoço antes de a alta seguir. No gráfico de barras o alvo é a distância da cabeça ao pescoço; no ponto e figura, a contagem horizontal da base.",
    bottom: {
      columns: [[16, 12], [13, 14], [13, 7], [8, 10], [9, 4], [5, 10], [9, 7], [8, 13], [12, 11], [12, 15]],
      context: 2,
      breakout: 10.5,
    },
  }),
  pattern({
    slug: "v",
    name: "Formação em V",
    englishName: "V Formation",
    aliases: ["v base", "base em v", "inverted v", "v invertido", "reversão em v"],
    names: ["Base em V (fundo)", "V invertido (topo)"],
    summary:
      "Reversão brusca, sem congestão: o preço cai forte e logo sobe forte, quase na mesma coluna seguinte.",
    recognition: [
      "Uma coluna de O longa (queda acentuada) seguida imediatamente de uma coluna de X longa.",
      "Não há área lateral no fundo: quase nada de acumulação.",
      "A coluna de X passa o topo da última coluna de X antes da queda, dando o sinal de compra.",
      "No topo (V invertido): alta forte seguida de queda forte, sem distribuição.",
    ],
    psychology:
      "Normalmente vem de uma notícia ou de um clímax: os vendedores se esgotam de uma vez e os compradores entram em massa. O mercado muda de lado sem tempo de formar uma base.",
    confirmation:
      "É a reversão mais difícil de operar: sem congestão, não há base para medir alvo nem nível claro para o stop, e o sinal chega tarde, depois de boa parte da alta. Murphy observa que é difícil de identificar enquanto se forma.",
    bottom: {
      columns: [[16, 12], [13, 14], [13, 3], [4, 15]],
      context: 2,
      breakout: 14.5,
    },
  }),
  pattern({
    slug: "v-estendido",
    name: "V estendido",
    englishName: "V Extended",
    aliases: ["v extended", "inverted v extended", "v invertido estendido", "v com plataforma"],
    names: ["V estendido (fundo)", "V invertido estendido (topo)"],
    summary:
      "Uma formação em V que, depois da reversão, faz uma pausa lateral (uma pequena congestão) antes de a nova tendência seguir.",
    recognition: [
      "Queda forte e virada rápida para cima, como no V.",
      "Na subida, o preço para e forma uma congestão estreita (a extensão), sem voltar ao fundo.",
      "Completa-se quando uma coluna de X passa o topo dessa congestão.",
      "No topo: V invertido seguido de uma congestão na descida e rompimento para baixo do fundo dela.",
    ],
    psychology:
      "A primeira arrancada atrai realização de lucro e vendedores que ainda acreditam na queda. A pausa absorve essa oferta sem devolver a alta; quando ela acaba, a subida continua.",
    confirmation:
      "Mais fácil de operar que o V: a congestão dá um nível de rompimento, um stop (abaixo da congestão) e uma contagem horizontal para o alvo.",
    bottom: {
      columns: [[16, 12], [13, 14], [13, 3], [4, 10], [9, 7], [8, 10], [9, 7], [8, 15]],
      context: 2,
      breakout: 10.5,
    },
  }),
  pattern({
    slug: "duplex-horizontal",
    name: "Duplex horizontal",
    englishName: "Duplex Horizontal",
    aliases: ["duplex horizontal", "base horizontal dupla", "duas congestões"],
    names: ["Duplex horizontal (fundo)", "Duplex horizontal (topo)"],
    summary:
      "Duas áreas de congestão horizontais no mesmo nível, separadas por um repique que fracassa; a reversão se confirma quando o preço passa o topo desse repique.",
    recognition: [
      "Depois da queda, forma-se uma primeira faixa lateral estreita no fundo.",
      "Um repique sai da faixa, mas não se sustenta: o preço volta ao mesmo nível do fundo.",
      "Forma-se uma segunda faixa lateral, ao lado da primeira e na mesma altura.",
      "Completa-se quando uma coluna de X passa o topo do repique entre as duas faixas. No topo, é o espelho: duas faixas de distribuição e rompimento para baixo.",
    ],
    psychology:
      "As duas faixas mostram a mesma demanda no mesmo preço, em dois momentos: os compradores defendem aquele nível. O repique que falha tira os impacientes; quando a oferta acaba, o rompimento vem.",
    confirmation:
      "Rompimento do topo do repique entre as faixas. Como a base é larga, a contagem horizontal costuma ser grande. Um stop natural fica abaixo do fundo comum das duas faixas.",
    bottom: {
      columns: [[16, 12], [13, 14], [13, 5], [6, 8], [7, 5], [6, 11], [10, 5], [6, 8], [7, 5], [6, 13], [12, 11], [12, 15]],
      context: 2,
      breakout: 11.5,
    },
  }),
  pattern({
    slug: "pires",
    name: "Pires",
    englishName: "Saucer",
    aliases: ["saucer", "fundo arredondado", "rounding bottom", "inverse saucer", "pires invertido", "topo arredondado"],
    names: ["Pires (fundo)", "Pires invertido (topo)"],
    summary:
      "Reversão gradual: as mínimas descem cada vez menos, se estabilizam e começam a subir aos poucos, desenhando uma curva parecida com um pires.",
    recognition: [
      "As colunas ficam curtas e as mínimas vão se aproximando umas das outras.",
      "No meio, as mínimas param de cair; depois, passam a subir devagar, assim como as máximas.",
      "Completa-se quando uma coluna de X passa a borda esquerda do pires (o topo da primeira coluna de X da base).",
      "No topo (pires invertido): as máximas sobem cada vez menos, viram e começam a cair aos poucos.",
    ],
    psychology:
      "Mostra uma troca lenta de controle: a pressão de venda vai sumindo sem um clímax, e a demanda cresce aos poucos. Leva tempo, mas reflete uma mudança ampla de opinião.",
    confirmation:
      "O rompimento da borda do pires confirma. Por ser lento, dá tempo de se preparar; o difícil é saber quando o fundo acabou. A largura do pires entra na contagem horizontal.",
    bottom: {
      columns: [
        [16, 12],
        [13, 14],
        [13, 9],
        [10, 11],
        [10, 7],
        [8, 9],
        [8, 6],
        [7, 8],
        [7, 6],
        [7, 9],
        [8, 7],
        [8, 10],
        [9, 8],
        [9, 12],
        [11, 10],
        [11, 15],
      ],
      context: 2,
      breakout: 11.5,
    },
  }),
];

/**
 * Sinais de compra e venda do gráfico de 3 caixas. Toda coluna depois da primeira tem pelo menos
 * 3 caixas; as linhas de tendência são de 45° (uma caixa por coluna), como no método de Cohen.
 */
export const PNF_SIGNALS: PnfPattern[] = [
  pattern({
    group: "signal",
    slug: "sinal-simples",
    name: "Sinal simples",
    englishName: "Simple Buy / Sell Signal",
    aliases: ["topo duplo", "fundo duplo", "double top", "double bottom", "simple bullish buy signal", "simple sell signal"],
    names: ["Sinal simples de compra", "Sinal simples de venda"],
    summary:
      "O sinal básico do ponto e figura: compra quando uma coluna de X passa o topo da coluna de X anterior; venda quando uma coluna de O perde o fundo da coluna de O anterior.",
    recognition: [
      "Compra: a coluna de X atual sobe uma caixa acima do topo da coluna de X anterior (rompimento de topo duplo).",
      "Nesta versão simples, o fundo entre as duas colunas de X pode ser mais baixo que o fundo anterior: o sinal vale mesmo assim.",
      "Venda: a coluna de O atual cai uma caixa abaixo do fundo da coluna de O anterior (rompimento de fundo duplo).",
    ],
    psychology:
      "O preço voltou a um topo onde antes encontrou vendedores e, desta vez, passou. A oferta naquele nível acabou, e a demanda manda no curto prazo.",
    confirmation:
      "É o sinal mais frequente e o mais fraco: sozinho, gera muitos falsos em mercados laterais. Ganha força quando os fundos sobem junto (próximo sinal), quando o rompimento passa mais de um topo e quando vai a favor da tendência maior. O stop natural fica abaixo do fundo da última coluna de O.",
    bottom: { columns: [[9, 5], [6, 10], [9, 4], [5, 11]], breakout: 10.5, signal: [3, 11] },
  }),
  pattern({
    group: "signal",
    slug: "sinal-simples-fundo-ascendente",
    name: "Sinal simples com fundo ascendente",
    englishName: "Simple Signal with a Rising Bottom / Declining Top",
    aliases: ["fundo ascendente", "topo descendente", "rising bottom", "declining top"],
    names: ["Compra com fundo ascendente", "Venda com topo descendente"],
    summary:
      "O sinal simples com mais uma condição: na compra, o fundo entre as colunas de X é mais alto que o anterior; na venda, o topo entre as colunas de O é mais baixo.",
    recognition: [
      "Compra: a coluna de O do meio para acima do fundo da coluna de O anterior (fundo ascendente).",
      "Depois, a coluna de X passa o topo da coluna de X anterior: sai o sinal de compra.",
      "Venda: a coluna de X do meio para abaixo do topo anterior (topo descendente) e depois a coluna de O perde o fundo da coluna de O anterior.",
    ],
    psychology:
      "Topos e fundos subindo juntos é a definição de alta: os compradores defendem o preço cada vez mais alto e depois vencem a resistência. É a mesma ideia da tendência pelos topos e fundos (Murphy, cap. 4).",
    confirmation:
      "Mais confiável que o sinal simples, porque já mostra a tendência se formando. O stop fica abaixo do fundo ascendente: se ele for perdido, o padrão de alta deixou de existir.",
    bottom: { columns: [[9, 4], [5, 10], [9, 6], [7, 11]], breakout: 10.5, signal: [3, 11] },
  }),
  pattern({
    group: "signal",
    slug: "topo-triplo",
    name: "Rompimento de topo triplo",
    englishName: "Triple Top / Triple Bottom Breakout",
    aliases: ["topo triplo", "fundo triplo", "triple top", "triple bottom", "breakout of a triple top"],
    names: ["Rompimento de topo triplo", "Rompimento de fundo triplo"],
    summary:
      "Três colunas de X param no mesmo topo; a terceira passa: compra. Na venda, três colunas de O param no mesmo fundo e a terceira perde.",
    recognition: [
      "Compra: duas colunas de X terminam no mesmo nível (resistência testada duas vezes).",
      "Uma terceira coluna de X sobe uma caixa acima desse nível: é o sinal.",
      "Venda: duas colunas de O terminam no mesmo fundo, e a terceira cai uma caixa abaixo dele.",
    ],
    psychology:
      "A resistência segurou duas vezes; quando cede na terceira, quem vendia ali se esgotou. Quanto mais vezes um nível é testado, mais importante é o rompimento.",
    confirmation:
      "Mais forte que o sinal simples, porque rompe uma resistência (ou suporte) testada mais vezes. A largura da congestão entra na contagem horizontal. Recuos até o nível rompido costumam segurar: a resistência vira suporte.",
    bottom: { columns: [[8, 4], [5, 10], [9, 6], [7, 10], [9, 6], [7, 12]], breakout: 10.5, signal: [5, 11] },
  }),
  pattern({
    group: "signal",
    slug: "topo-triplo-ascendente",
    name: "Topo triplo ascendente",
    englishName: "Ascending Triple Top / Descending Triple Bottom",
    aliases: ["topo triplo ascendente", "fundo triplo descendente", "ascending triple top", "descending triple bottom"],
    names: ["Topo triplo ascendente", "Fundo triplo descendente"],
    summary:
      "Três topos, cada um mais alto que o anterior, com fundos também subindo: a terceira coluna de X passa o segundo topo e confirma a alta em degraus.",
    recognition: [
      "Compra: a segunda coluna de X já passa a primeira (um sinal simples).",
      "Os fundos sobem, e a terceira coluna de X passa o topo da segunda: é o sinal.",
      "Venda: três fundos, cada um mais baixo, com topos também caindo; a terceira coluna de O perde o fundo da segunda.",
    ],
    psychology:
      "A alta avança em degraus: cada recuo para mais acima e cada repique vai mais longe. Mostra demanda persistente, mas também um mercado que já subiu bastante.",
    confirmation:
      "É uma sequência de sinais simples na mesma direção; confirma uma tendência já em curso. Como o preço já andou, o risco até o stop (abaixo do último fundo) costuma ser maior.",
    bottom: { columns: [[7, 3], [4, 8], [7, 5], [6, 10], [9, 7], [8, 12]], breakout: 10.5, signal: [5, 11] },
  }),
  pattern({
    group: "signal",
    slug: "topo-triplo-espalhado",
    name: "Topo triplo espalhado",
    englishName: "Spread Triple Top / Spread Triple Bottom",
    aliases: ["topo triplo espalhado", "fundo triplo espalhado", "spread triple top", "spread triple bottom"],
    names: ["Topo triplo espalhado", "Fundo triplo espalhado"],
    summary:
      "Um topo triplo em que os três topos não estão em colunas seguidas: entre eles há colunas de X mais baixas. A congestão é mais larga, e o rompimento, mais forte.",
    recognition: [
      "Compra: três colunas de X param no mesmo topo, mas separadas por pelo menos uma coluna de X mais baixa.",
      "Uma coluna de X passa esse topo comum: é o sinal.",
      "Venda: três colunas de O param no mesmo fundo, separadas por colunas de O menos profundas, e uma delas perde o fundo comum.",
    ],
    psychology:
      "O nível de resistência segurou por mais tempo, com o preço indo e voltando várias vezes. Quanto mais longa a disputa, mais oferta foi absorvida antes do rompimento.",
    confirmation:
      "Como a base é larga, dá uma contagem horizontal maior que a do topo triplo comum. O stop fica abaixo do fundo da última coluna de O.",
    bottom: {
      columns: [[8, 4], [5, 10], [9, 6], [7, 9], [8, 5], [6, 10], [9, 6], [7, 10], [9, 7], [8, 12]],
      breakout: 10.5,
      signal: [9, 11],
    },
  }),
  pattern({
    group: "signal",
    slug: "triangulo",
    name: "Rompimento de triângulo",
    englishName: "Bullish / Bearish Triangle Breakout",
    aliases: ["triângulo", "triangulo de alta", "triangulo de baixa", "bullish triangle", "bearish triangle"],
    names: ["Rompimento para cima de triângulo de alta", "Rompimento para baixo de triângulo de baixa"],
    summary:
      "Topos caindo e fundos subindo formam um triângulo; quando o preço sai dele para cima (depois de uma alta), é compra; para baixo (depois de uma queda), é venda.",
    recognition: [
      "Triângulo de alta: depois de uma alta, pelo menos cinco colunas com topos cada vez mais baixos e fundos cada vez mais altos.",
      "As linhas pelos topos e pelos fundos se aproximam.",
      "Compra quando uma coluna de X passa o topo da coluna de X anterior, saindo do triângulo pela linha de cima.",
      "Triângulo de baixa: o mesmo desenho depois de uma queda, com a coluna de O perdendo o fundo anterior pela linha de baixo.",
    ],
    psychology:
      "As oscilações encolhem: compradores e vendedores ficam indecisos e o preço se comprime. O rompimento mostra quem venceu; em geral, o lado da tendência anterior (triângulo de continuação).",
    confirmation:
      "O sinal é o rompimento do topo anterior (ou fundo), não só da linha. Rompimentos contra a tendência anterior são menos confiáveis. A largura do triângulo entra na contagem horizontal.",
    bottom: {
      columns: [[3, 12], [11, 4], [5, 11], [10, 5], [6, 10], [9, 6], [7, 12]],
      breakout: 10.5,
      lines: [
        { from: [0, 12], to: [6, 9] },
        { from: [1, 4], to: [6, 6.5] },
      ],
      signal: [6, 11],
    },
  }),
  pattern({
    group: "signal",
    slug: "linha-resistencia-alta",
    name: "Linha de resistência de alta / suporte de baixa",
    englishName: "Bullish Resistance / Bearish Support Line Breakout",
    aliases: ["linha de resistência de alta", "linha de suporte de baixa", "bullish resistance line", "bearish support line", "linha de canal"],
    names: ["Rompimento acima da linha de resistência de alta", "Rompimento abaixo da linha de suporte de baixa"],
    summary:
      "Numa alta, a linha de resistência de alta passa pelos topos, paralela à linha de suporte de 45°. Quando uma coluna de X passa por cima dela, a alta está acelerando.",
    recognition: [
      "Alta em canal: a linha de suporte de alta (45°) passa pelos fundos, e uma paralela a ela, pelos topos: a linha de resistência de alta.",
      "Compra quando uma coluna de X sobe acima dessa linha de resistência.",
      "Venda (no canal de baixa): a linha de suporte de baixa passa pelos fundos, paralela à linha de resistência de baixa; o sinal é uma coluna de O caindo abaixo dela.",
    ],
    psychology:
      "O preço sai do ritmo do canal a favor da tendência: a demanda (ou a oferta, na baixa) ficou mais forte que antes. É uma aceleração, não uma reversão.",
    confirmation:
      "É um sinal de força a favor da tendência, bom para aumentar posição. Movimentos acelerados podem se esgotar depressa: vigie recuos fortes de volta para dentro do canal.",
    bottom: {
      columns: [[3, 8], [7, 5], [6, 10], [9, 7], [8, 12], [11, 9], [10, 16]],
      lines: [
        { from: [0, 8], to: [6, 14] },
        { from: [1, 5], to: [6, 10] },
      ],
      signal: [6, 15],
    },
  }),
  pattern({
    group: "signal",
    slug: "linha-resistencia-baixa",
    name: "Linha de resistência de baixa / suporte de alta",
    englishName: "Bearish Resistance / Bullish Support Line Breakout",
    aliases: ["linha de resistência de baixa", "linha de suporte de alta", "bearish resistance line", "bullish support line", "linha de 45"],
    names: ["Rompimento acima da linha de resistência de baixa", "Rompimento abaixo da linha de suporte de alta"],
    summary:
      "A linha de 45° que define a tendência é rompida: numa baixa, uma coluna de X passa acima da linha de resistência de baixa (compra); numa alta, uma coluna de O cai abaixo da linha de suporte de alta (venda).",
    recognition: [
      "Linha de resistência de baixa: começa uma caixa acima do topo da coluna de X mais alta e desce a 45° (uma caixa por coluna).",
      "Enquanto as colunas ficam abaixo dela, a tendência é de baixa. Compra quando uma coluna de X passa acima da linha.",
      "Linha de suporte de alta: começa uma caixa abaixo do fundo mais baixo e sobe a 45°; venda quando uma coluna de O cai abaixo dela.",
    ],
    psychology:
      "A linha de 45° mostra o ritmo da tendência. Quando o preço a atravessa, a tendência perdeu força o bastante para mudar de lado.",
    confirmation:
      "A regra do método de Cohen, citada por Murphy, é operar a favor da tendência dada por essas linhas: compras acima da linha de suporte de alta e vendas abaixo da linha de resistência de baixa. O rompimento da linha é o aviso de mudança; o ideal é que venha junto com um sinal simples na mesma direção.",
    bottom: {
      columns: [[15, 9], [10, 13], [12, 7], [8, 11], [10, 5], [6, 12]],
      lines: [{ from: [1, 14], to: [5, 10] }],
      signal: [5, 11],
    },
  }),
];
