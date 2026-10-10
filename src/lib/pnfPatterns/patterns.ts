/**
 * Padrões de reversão do ponto e figura listados por Murphy (Technical Analysis of the Financial
 * Markets, cap. 11), que os reproduz de A. H. Wheelan (Study Helps in Point & Figure Technique).
 * Murphy só desenha os padrões; as descrições são autorais, com base em Murphy e Wheelan.
 *
 * Cada padrão tem a versão de fundo e a de topo; a de topo é o espelho da de fundo.
 */

/** Coluna do diagrama: de `from` a `to` em níveis de caixa. Subindo = X; descendo = O. */
export type PnfColumn = readonly [from: number, to: number];

export interface PnfVariant {
  side: "bottom" | "top";
  name: string;
  columns: PnfColumn[];
  /** Quantas colunas do começo são a tendência anterior (desenhadas apagadas). */
  context: number;
  /** Linha do rompimento que confirma o padrão (entre dois níveis, ex.: 9,5). */
  breakout: number;
}

export interface PnfPattern {
  slug: string;
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

/** Os diagramas vão do nível 0 ao 16: o topo é o fundo espelhado nesse intervalo. */
const HEIGHT = 16;

const mirror = (v: Omit<PnfVariant, "side" | "name">) => ({
  columns: v.columns.map(([from, to]) => [HEIGHT - from, HEIGHT - to] as const),
  context: v.context,
  breakout: HEIGHT - v.breakout,
});

type PatternInput = Omit<PnfPattern, "variants" | "source"> & {
  /** Versão de fundo; a de topo sai espelhada. */
  bottom: Omit<PnfVariant, "side" | "name">;
  names: [bottom: string, top: string];
};

function pattern({ bottom, names, ...rest }: PatternInput): PnfPattern {
  return {
    ...rest,
    source: PNF_SOURCE,
    variants: [
      { side: "bottom", name: names[0], ...bottom },
      { side: "top", name: names[1], ...mirror(bottom) },
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
