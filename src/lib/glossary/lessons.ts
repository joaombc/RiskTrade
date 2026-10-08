import { CHANNEL_DIAGRAMS } from "./channel-diagrams";
import { MA_DIAGRAMS } from "./ma-diagrams";
import { MACD_DIAGRAMS } from "./macd-diagrams";
import { RSI_DIAGRAMS } from "./rsi-diagrams";
import { STOCHASTIC_DIAGRAMS } from "./stochastic-diagrams";
import { WILLIAMS_DIAGRAMS } from "./williams-diagrams";
import type { Diagram, Lesson } from "./types";

/**
 * Aulas de aprofundamento. Texto autoral, com base em John J. Murphy, "Technical Analysis of
 * the Financial Markets" (NYIF, 1999): cap. 2 (Teoria de Dow) e cap. 13 (Teoria das Ondas de
 * Elliott). As regras clássicas do impulso de Elliott seguem Frost & Prechter, citados por Murphy.
 */

// ─── Diagramas da Teoria de Dow ────────────────────────────────────────────────

const DOW_THREE_TRENDS: Diagram = {
  path: [
    [10, 88], [20, 80], [24, 83], [32, 70], [36, 73], [44, 60], [50, 66], [54, 63], [62, 74], [70, 64], [74, 67],
    [84, 50], [88, 53], [98, 38], [104, 45], [108, 42], [118, 56], [126, 46], [130, 49], [140, 32], [146, 35],
    [156, 20], [162, 27], [166, 24], [176, 38], [186, 28], [194, 18],
  ],
  lines: [{ from: [10, 88], to: [195, 38], tone: "support" }],
  points: [
    { at: [62, 74], label: "secundária", placement: "below" },
    { at: [24, 83], label: "menor", placement: "below" },
  ],
  notes: [
    { at: [192, 58], text: "primária (a maré)", tone: "support", anchor: "end" },
    { at: [10, 18], text: "correções secundárias: 3 semanas a 3 meses", anchor: "start" },
  ],
};

const DOW_PHASES: Diagram = {
  path: [
    [5, 85], [15, 80], [25, 86], [35, 80], [45, 84], [55, 74], [65, 78], [80, 55], [88, 60], [105, 35], [112, 40],
    [125, 25], [135, 30], [145, 20], [155, 28], [165, 18], [175, 30], [185, 24], [195, 40],
  ],
  lines: [
    { from: [52, 12], to: [52, 92], tone: "muted", dashed: true },
    { from: [128, 12], to: [128, 92], tone: "muted", dashed: true },
  ],
  notes: [
    { at: [28, 70], text: "Acumulação" },
    { at: [92, 89], text: "Participação pública" },
    { at: [162, 52], text: "Distribuição" },
  ],
  volume: [0.3, 0.32, 0.28, 0.4, 0.55, 0.65, 0.72, 0.8, 0.88, 1, 0.95, 0.85].map((h, i) => ({ h, up: i % 3 !== 2 })),
};

const DOW_CONFIRMATION: Diagram = {
  path: [[10, 80], [40, 50], [60, 62], [90, 38], [115, 55], [150, 25], [170, 35], [190, 18]],
  lines: [{ from: [90, 38], to: [195, 38], tone: "muted", dashed: true }],
  points: [
    { at: [132, 38], label: "novo topo", placement: "above" },
    { at: [175.7, 104], label: "confirma", placement: "above" },
  ],
  notes: [{ at: [12, 30], text: "Industriais", anchor: "start" }],
  sub: {
    label: "Transportes",
    path: [[10, 116], [40, 108], [60, 112], [90, 104], [115, 110], [150, 105], [165, 107], [190, 100]],
    lines: [{ from: [90, 104], to: [195, 104], tone: "muted", dashed: true }],
  },
};

const DOW_FAILURE_SWING: Diagram = {
  path: [[10, 85], [40, 30], [60, 55], [80, 40], [95, 58], [110, 75], [125, 68], [145, 88]],
  lines: [{ from: [60, 55], to: [140, 55], tone: "support", dashed: true }],
  points: [
    { at: [40, 30], label: "A", placement: "above" },
    { at: [60, 55], label: "B", placement: "below" },
    { at: [80, 40], label: "C", placement: "above" },
    { at: [92.5, 55], label: "S", placement: "right" },
  ],
  notes: [{ at: [150, 30], text: "C não supera A: sinal mais forte" }],
};

const DOW_NONFAILURE_SWING: Diagram = {
  path: [[10, 85], [40, 35], [58, 55], [78, 25], [98, 62], [112, 42], [130, 75], [150, 85]],
  lines: [
    { from: [58, 55], to: [140, 55], tone: "support", dashed: true },
    { from: [98, 62], to: [150, 62], tone: "support", dashed: true },
  ],
  points: [
    { at: [40, 35], label: "A", placement: "above" },
    { at: [58, 55], label: "B", placement: "below" },
    { at: [78, 25], label: "C", placement: "above" },
    { at: [98, 62], label: "D", placement: "below" },
    { at: [112, 42], label: "E", placement: "above" },
    { at: [94.2, 55], label: "S1", placement: "left" },
    { at: [122.9, 62], label: "S2", placement: "right" },
  ],
};

// ─── Diagramas das Ondas de Elliott ────────────────────────────────────────────

const ELLIOTT_CYCLE: Diagram = {
  path: [[10, 88], [35, 58], [48, 72], [90, 22], [105, 40], [130, 12], [148, 40], [160, 28], [185, 58]],
  points: [
    { at: [35, 58], label: "1", placement: "above" },
    { at: [48, 72], label: "2", placement: "below" },
    { at: [90, 22], label: "3", placement: "above" },
    { at: [105, 40], label: "4", placement: "below" },
    { at: [130, 12], label: "5", placement: "above" },
    { at: [148, 40], label: "a", placement: "below" },
    { at: [160, 28], label: "b", placement: "above" },
    { at: [185, 58], label: "c", placement: "below" },
  ],
  notes: [
    { at: [70, 88], text: "impulso: 5 ondas", tone: "support" },
    { at: [160, 80], text: "correção: 3 ondas", tone: "resistance" },
  ],
};

const ELLIOTT_SUBDIVISION: Diagram = {
  path: [[10, 88], [22, 72], [28, 78], [44, 55], [50, 62], [62, 42], [72, 60], [78, 52], [92, 74], [130, 30], [150, 20]],
  points: [
    { at: [22, 72], label: "(1)", placement: "left" },
    { at: [28, 78], label: "(2)", placement: "below" },
    { at: [44, 55], label: "(3)", placement: "left" },
    { at: [50, 62], label: "(4)", placement: "below" },
    { at: [62, 42], label: "(5) = 1", placement: "above" },
    { at: [72, 60], label: "(a)", placement: "below" },
    { at: [78, 52], label: "(b)", placement: "above" },
    { at: [92, 74], label: "(c) = 2", placement: "below" },
  ],
  notes: [{ at: [150, 50], text: "onda 3 começa…" }],
};

const ELLIOTT_ZIGZAG: Diagram = {
  path: [
    [10, 60], [35, 15], [40, 28], [45, 23], [52, 40], [57, 35], [64, 52], [70, 42], [74, 47], [80, 36], [85, 50],
    [90, 45], [97, 62], [102, 57], [110, 74], [140, 40], [170, 20],
  ],
  lines: [{ from: [35, 15], to: [195, 15], tone: "muted", dashed: true }],
  points: [
    { at: [64, 52], label: "A (5)", placement: "below" },
    { at: [80, 36], label: "B (3)", placement: "above" },
    { at: [110, 74], label: "C (5)", placement: "below" },
  ],
  notes: [{ at: [150, 75], text: "B não volta ao início de A" }],
};

const ELLIOTT_FLAT: Diagram = {
  path: [
    [10, 60], [35, 15], [42, 30], [47, 24], [55, 40], [62, 26], [67, 32], [75, 15], [80, 27], [84, 22], [90, 38],
    [94, 33], [100, 42], [130, 20], [160, 8],
  ],
  lines: [
    { from: [35, 15], to: [110, 15], tone: "muted", dashed: true },
    { from: [55, 40], to: [110, 40], tone: "muted", dashed: true },
  ],
  points: [
    { at: [55, 40], label: "A (3)", placement: "below" },
    { at: [75, 15], label: "B (3)", placement: "above" },
    { at: [100, 42], label: "C (5)", placement: "below" },
  ],
  notes: [{ at: [150, 70], text: "consolidação: sinal de força" }],
};

const ELLIOTT_TRIANGLE: Diagram = {
  path: [[10, 85], [30, 30], [40, 55], [50, 38], [60, 52], [70, 42], [78, 49], [110, 12]],
  lines: [
    { from: [45, 37], to: [84, 44.8], tone: "resistance" },
    { from: [40, 55], to: [84, 48.4], tone: "support" },
  ],
  points: [
    { at: [30, 30], label: "3", placement: "above" },
    { at: [40, 55], label: "a", placement: "below" },
    { at: [50, 38], label: "b", placement: "above" },
    { at: [60, 52], label: "c", placement: "below" },
    { at: [70, 42], label: "d", placement: "above" },
    { at: [78, 49], label: "e", placement: "below" },
    { at: [110, 12], label: "5", placement: "right" },
  ],
  notes: [{ at: [140, 60], text: "triângulo na onda 4" }],
};

const ELLIOTT_CHANNEL: Diagram = {
  path: [[10, 88], [35, 58], [48, 72], [90, 22], [105, 40], [124, 5]],
  lines: [
    { from: [40, 76.5], to: [150, 14.8], tone: "support" },
    { from: [40, 50.1], to: [126, 1.8], tone: "resistance" },
  ],
  notes: [
    { at: [12, 22], text: "paralela pelo topo da 3", tone: "resistance", anchor: "start" },
    { at: [192, 62], text: "base: fundos de 2 e 4", tone: "support", anchor: "end" },
  ],
  points: [
    { at: [48, 72], label: "2", placement: "below" },
    { at: [90, 22], label: "3", placement: "left" },
    { at: [105, 40], label: "4", placement: "below" },
    { at: [124, 5], label: "5", placement: "right" },
  ],
};

// ─── Aulas ─────────────────────────────────────────────────────────────────────

export const LESSONS: Lesson[] = [
  {
    slug: "teoria-de-dow",
    title: "Teoria de Dow",
    subtitle: "A base de toda a análise técnica moderna",
    summary:
      "Os seis princípios de Charles Dow: as médias descontam tudo, as três tendências e as três fases do mercado, a confirmação entre índices, o papel do volume e o sinal de reversão.",
    readingMinutes: 9,
    source: "Murphy, Technical Analysis of the Financial Markets, cap. 2 (Teoria de Dow)",
    relatedTerms: ["linha-de-tendencia", "suporte-e-resistencia", "retracoes", "volume", "rompimento"],
    sections: [
      {
        heading: "Origem",
        paragraphs: [
          "Charles Dow fundou a Dow Jones & Company com Edward Jones em 1882 e publicou suas ideias numa série de editoriais no Wall Street Journal. Ele nunca escreveu um livro sobre a teoria: quem organizou seus princípios foram William Hamilton, seu sucessor no jornal, em 1922, e Robert Rhea, em 1932.",
          "Dow criou os primeiros índices de ações para medir a saúde da economia, separando as empresas industriais das ferroviárias (hoje, de transportes). Quase tudo o que se usa em análise técnica descende de ideias dele: a definição de tendência, a classificação em três graus, a confirmação e a divergência, o papel do volume e as retrações percentuais.",
        ],
      },
      {
        heading: "1. As médias descontam tudo",
        paragraphs: [
          "Tudo o que pode afetar a oferta e a demanda já está refletido no preço: notícias, expectativas, dados econômicos. Mesmo acontecimentos imprevisíveis, como uma catástrofe natural, são absorvidos pelo preço quase imediatamente.",
          "É a premissa que permite ao analista técnico estudar só o preço: ele é o resumo de todo o conhecimento do mercado.",
        ],
      },
      {
        heading: "2. O mercado tem três tendências",
        paragraphs: [
          "Para Dow, uma tendência de alta é uma sequência de topos e fundos cada vez mais altos; uma de baixa, de topos e fundos cada vez mais baixos. A definição continua sendo a base da análise de tendência até hoje.",
          "Ele comparava o mercado ao mar. A tendência primária é a maré: dura mais de um ano, às vezes vários. A secundária são as ondas, que corrigem a primária e duram de três semanas a três meses, devolvendo de um terço a dois terços do movimento anterior, com mais frequência cerca de metade. A menor são as marolas, com menos de três semanas.",
        ],
        diagram: {
          diagram: DOW_THREE_TRENDS,
          caption: "A tendência primária (maré) contém correções secundárias (ondas), que por sua vez contêm oscilações menores (marolas).",
        },
      },
      {
        heading: "3. As tendências primárias têm três fases",
        paragraphs: [
          "Acumulação: os investidores mais bem informados compram enquanto as notícias ainda são ruins, porque percebem que o mercado já absorveu o pior.",
          "Participação pública: os preços sobem rápido, as notícias melhoram e os seguidores de tendência entram. É a fase mais longa e a que os sinais técnicos costumam capturar.",
          "Distribuição: o noticiário está mais otimista que nunca, o volume especulativo e a participação do público crescem, e os mesmos investidores que acumularam no fundo começam a vender para quem chega por último.",
        ],
        diagram: {
          diagram: DOW_PHASES,
          caption: "As três fases de um mercado de alta, com o volume crescendo até a distribuição.",
        },
      },
      {
        heading: "4. Os índices devem se confirmar",
        paragraphs: [
          "Nenhum sinal importante de alta ou de baixa vale se só um índice o der. Para Dow, Industriais e Ferroviárias precisavam superar um topo secundário anterior para confirmar o início ou a continuação de um mercado de alta. Os sinais não precisam ser simultâneos, mas quanto mais próximos, mais forte a confirmação. Quando os índices divergem, presume-se que a tendência anterior continua.",
          "A lógica é econômica: se as indústrias produzem mais, as transportadoras precisam levar mais mercadorias. Hoje a mesma ideia aparece quando se compara uma ação com o índice do seu setor ou com o índice geral.",
        ],
        diagram: {
          diagram: DOW_CONFIRMATION,
          caption: "O novo topo dos Industriais só é confirmado quando os Transportes também superam o seu topo anterior.",
        },
      },
      {
        heading: "5. O volume deve confirmar a tendência",
        paragraphs: [
          "O volume deve crescer no sentido da tendência principal: numa alta, aumentar quando o preço sobe e diminuir nas quedas; numa baixa, o contrário. Dow considerava o volume um indicador secundário. Seus sinais de compra e venda vinham só dos preços de fechamento, e o volume servia para confirmá-los.",
        ],
        bullets: [
          "Alta com volume crescente: tendência saudável.",
          "Alta com volume caindo, ou volume crescendo nas quedas: alerta de desgaste.",
          "O volume costuma mudar antes do preço: a perda de pressão aparece primeiro no volume.",
        ],
      },
      {
        heading: "6. A tendência continua até um sinal claro de reversão",
        paragraphs: [
          "É a base de todo o trend following: um mercado em movimento tende a continuar em movimento até que algo o faça mudar. A parte difícil é distinguir uma correção secundária normal da primeira perna de uma nova tendência, e os próprios seguidores de Dow discordam sobre quando o sinal acontece.",
          "No padrão de falha (failure swing), o repique C não supera o topo A, e o rompimento do fundo B gera o sinal de venda em S: já existem topos e fundos descendentes. No padrão sem falha (nonfailure swing), C supera A antes de o preço romper B. Alguns vendem logo em S1; outros esperam um repique mais baixo (E) e o rompimento de D, em S2, para ter dois topos e dois fundos descendentes. O padrão de falha é o sinal mais forte.",
        ],
        diagram: { diagram: DOW_FAILURE_SWING, caption: "Padrão de falha: C não supera A e o rompimento de B gera o sinal de venda em S." },
      },
      {
        heading: "",
        paragraphs: [],
        diagram: {
          diagram: DOW_NONFAILURE_SWING,
          caption: "Padrão sem falha: C supera A. O sinal vem em S1 (rompimento de B) ou, para os mais conservadores, em S2 (rompimento de D depois do topo mais baixo E).",
        },
      },
      {
        heading: "Fechamentos e \"linhas\"",
        paragraphs: [
          "Dow usava só preços de fechamento: um índice precisava fechar acima de um topo ou abaixo de um fundo para que o movimento tivesse significado. Penetrações durante o dia não contavam. É a origem dos filtros de rompimento usados até hoje.",
          "As \"linhas\" eram faixas laterais em que o preço oscila entre dois níveis, normalmente como consolidação dentro da tendência. Hoje chamamos isso de retângulo.",
        ],
      },
      {
        heading: "Críticas e como usar hoje",
        paragraphs: [
          "A crítica mais comum é que o sinal chega tarde: em média, a Teoria de Dow perde de 20% a 25% do movimento antes de confirmar a nova tendência. Mas Dow nunca quis antecipar topos e fundos. Ele queria reconhecer os grandes mercados de alta e de baixa e capturar o miolo do movimento. Entre 1920 e 1975, seus sinais capturaram cerca de dois terços dos movimentos dos índices.",
          "Na prática, use a tendência primária para decidir a direção e a secundária para escolher o momento de entrada: compre os recuos numa alta e venda os repiques numa baixa. Para quem opera prazos mais curtos, como no mercado futuro, a tendência menor ganha importância para o timing.",
        ],
      },
    ],
    takeaways: [
      "Tendência de alta = topos e fundos ascendentes; de baixa = topos e fundos descendentes.",
      "Três graus de tendência: primária (mais de 1 ano), secundária (3 semanas a 3 meses, corrige de 1/3 a 2/3) e menor (menos de 3 semanas).",
      "Três fases: acumulação, participação pública e distribuição.",
      "Sinais importantes precisam de confirmação entre índices e de volume.",
      "Use fechamentos, não sombras, e presuma que a tendência continua até um sinal claro de reversão.",
    ],
  },
  {
    slug: "medias-moveis",
    title: "Médias Móveis",
    subtitle: "Os tipos, os sinais e quando não confiar neles",
    summary:
      "Média simples, ponderada e exponencial; sinais com uma, duas e três médias; envelopes e bandas de Bollinger; os períodos mais usados e por que as médias só funcionam quando há tendência.",
    readingMinutes: 12,
    source: "Murphy, Technical Analysis of the Financial Markets, cap. 9 (Médias móveis)",
    relatedTerms: ["linha-de-tendencia", "suporte-e-resistencia", "rompimento", "canal", "retracoes", "obv", "bandas-de-bollinger"],
    sections: [
      {
        heading: "O que é uma média móvel",
        paragraphs: [
          "Uma média móvel de 10 dias soma os 10 últimos fechamentos e divide por 10. No dia seguinte, entra o fechamento novo e sai o mais antigo: a janela de dados anda junto com o gráfico, daí o nome.",
          "É um dos indicadores mais versáteis e usados, e a base de muitos sistemas automáticos de seguir tendência. A vantagem sobre a leitura de padrões é a objetividade: dois analistas podem discordar se uma figura é triângulo ou cunha, mas não sobre o preço ter fechado acima ou abaixo da média.",
        ],
      },
      {
        heading: "Um seguidor, não um líder",
        paragraphs: [
          "A média suaviza o preço e deixa a tendência mais fácil de ver. Mas, por ser feita de preços passados, ela sempre chega atrasada: não antecipa nada, só confirma que uma tendência começou ou terminou depois que isso aconteceu. Pense nela como uma linha de tendência curva.",
          "Quanto mais curta, mais colada ao preço e menor o atraso; quanto mais longa, mais suave e mais atrasada. Uma média de 20 dias acompanha o preço de perto; a de 200 mostra só a direção de fundo. O atraso diminui nas médias curtas, mas nunca desaparece.",
        ],
      },
      {
        heading: "Que preço usar",
        paragraphs: [
          "O fechamento é o preço mais usado, e o que Murphy considera o mais importante do dia. Há variações: o ponto médio do dia, (máxima + mínima) ÷ 2; o preço típico, (máxima + mínima + fechamento) ÷ 3; e duas médias separadas, uma das máximas e outra das mínimas, que formam uma faixa neutra em volta do preço.",
        ],
      },
      {
        heading: "Os três tipos de média",
        paragraphs: ["As médias diferem em quanto peso dão a cada preço da janela."],
        bullets: [
          "Simples (MMS): a média aritmética, em que cada dia pesa igual (numa de 10 dias, 10% cada). É a mais usada. Recebe duas críticas: só considera os dias da janela e dá ao dia mais antigo o mesmo peso do mais recente.",
          "Ponderada linearmente: multiplica o dia mais recente pelo tamanho da janela (10), o anterior por 9, e assim por diante, e divide pela soma dos pesos (55 numa de 10 dias). Corrige o peso, mas ainda ignora o que ficou fora da janela.",
          "Exponencial (MME): soma uma porcentagem do preço de hoje a uma porcentagem do valor anterior da própria média, e as duas somam 100%. Dá mais peso ao recente e, indiretamente, inclui todo o histórico, com peso cada vez menor. Dar 10% ao último dia equivale a uma média de cerca de 20 dias; 5%, a uma de cerca de 40. Na prática, você escolhe o período e o programa calcula o peso: 2 ÷ (período + 1).",
        ],
        diagram: {
          diagram: MA_DIAGRAMS.types,
          caption: "A mesma série com MMS 20 e MME 20: na virada, a exponencial reage antes e fica mais perto do preço.",
        },
      },
      {
        heading: "Sinais com uma média",
        paragraphs: [
          "O sinal mais simples: compra quando o preço fecha acima da média, venda quando fecha abaixo. Para mais confirmação, espere a própria média virar na direção do cruzamento.",
          "Aqui aparece a principal troca da análise com médias. Uma média curta (5 ou 10 dias) dá sinais mais cedo, mas também muitos sinais falsos, as violinadas, porque o ruído do dia a dia a cruza o tempo todo. Uma longa erra menos enquanto a tendência dura, mas devolve muito mais lucro quando ela vira, porque segue o preço de longe. Murphy resume: médias longas funcionam melhor com a tendência em vigor; curtas, quando ela está virando.",
        ],
        diagram: {
          diagram: MA_DIAGRAMS.single,
          caption: "Com uma MMS 10: compra quando o preço passa para cima da média e venda quando volta para baixo dela.",
        },
      },
      {
        heading: "Duas médias: o cruzamento duplo",
        paragraphs: [
          "Por isso é mais comum usar duas médias. O sinal de compra vem quando a curta cruza a longa para cima; o de venda, quando cruza para baixo. As combinações mais populares são 5 e 20 dias, muito usada em futuros, e 10 e 50 dias, em ações. O método atrasa um pouco mais que o de uma média, mas gera menos violinadas.",
          "Em ações, um cruzamento muito acompanhado é o da MMS 50 com a MMS 200, com a mesma lógica: para cima, costuma ser chamado de cruz dourada; para baixo, de cruz da morte.",
        ],
        diagram: {
          diagram: MA_DIAGRAMS.double,
          caption: "Cruzamento duplo com MMS 5 e MMS 20: os sinais vêm um pouco depois dos de uma média só, mas com menos ruído.",
        },
      },
      {
        heading: "Três médias: o sistema 4-9-18",
        paragraphs: [
          "O cruzamento triplo mais conhecido usa médias de 4, 9 e 18 dias, divulgadas por R. C. Allen nos anos 1970, uma variação das clássicas 5, 10 e 20. Numa alta, a ordem correta é a de 4 acima da de 9, acima da de 18; numa baixa, o contrário.",
          "No fim de uma queda, a média de 4 cruzando para cima as outras duas é só um alerta de compra; a confirmação vem quando a de 9 também passa a de 18. Na virada para baixo, vale o inverso. Durante correções, as médias podem se entrelaçar sem que a tendência acabe: há quem realize lucro nesse momento e quem aproveite para comprar.",
        ],
      },
      {
        heading: "Envelopes",
        paragraphs: [
          "Envelopes são linhas a uma porcentagem fixa acima e abaixo da média. Mostram quando o preço se afastou demais dela, ou seja, quando o movimento esticou. No curto prazo, é comum usar 3% em volta de uma MMS 21; no longo, 5% em volta de uma média de 10 semanas, ou 10% em volta de uma de 40 semanas.",
        ],
        diagram: {
          diagram: MA_DIAGRAMS.envelope,
          caption: "Envelopes de 3% em volta de uma MMS 21: o preço encostando na linha de cima indica uma alta esticada no curto prazo.",
        },
      },
      {
        heading: "Envelopes no mercado lateral: reversão à média",
        paragraphs: [
          "Murphy usa os envelopes para medir quando o preço esticou. Na prática, os traders de curto prazo transformam isso em duas táticas, e a escolha depende do contexto. A primeira vale quando o mercado está andando de lado, numa consolidação sem tendência definida: o preço tende a voltar para a média depois de se afastar dela.",
        ],
        bullets: [
          "Venda curta: o preço sobe até a banda de cima (por exemplo, +3%) ou a ultrapassa, sinal de sobrecompra. O primeiro alvo é a volta do preço até a média central.",
          "Compra curta: o preço cai até a banda de baixo (−3%) ou a ultrapassa, sinal de sobrevenda. O alvo é a volta do preço até a média central.",
          "O stop fica além da banda tocada: se o preço continuar se afastando, a lateralidade pode estar virando tendência, e aí a tática certa é a próxima.",
        ],
      },
      {
        heading: "Envelopes em tendência: operar a favor",
        paragraphs: [
          "Com uma tendência de alta ou de baixa bem estabelecida, a leitura muda: tocar a banda deixa de ser excesso e passa a ser sinal de força. O preço pode andar colado na banda, arrastando-a junto, e quem opera contra perde a tendência inteira.",
        ],
        bullets: [
          "Em tendência de alta: não venda na banda de cima. Os recuos até a média central ou até a banda de baixo são os pontos de compra a favor da tendência, e a banda de cima passa a ser o alvo para realizar o lucro.",
          "Em tendência de baixa: o inverso. Os repiques até a média central ou até a banda de cima são usados para abrir posições vendidas a favor da tendência principal, com a banda de baixo como alvo.",
          "Para saber em qual caso você está, olhe a inclinação da média e a sequência de topos e fundos: média de lado e preço oscilando entre as bandas indicam lateralidade; média inclinada e topos e fundos subindo (ou caindo) indicam tendência.",
        ],
      },
      {
        heading: "Bandas de Bollinger",
        paragraphs: [
          "Criadas por John Bollinger, ficam a dois desvios-padrão acima e abaixo de uma média de 20 períodos. Com dois desvios, cerca de 95% dos preços ficam dentro das bandas. Tocar a de cima indica sobrecompra; a de baixo, sobrevenda.",
          "Elas também servem de alvo: se o preço sai da banda de baixo e cruza a média de 20, a banda de cima vira o alvo; se cruza a média para baixo, o alvo passa a ser a banda de baixo. Numa alta forte, o preço costuma oscilar entre a banda de cima e a média, e perder a média avisa que a tendência pode virar.",
          "A diferença para os envelopes é que a distância entre as bandas muda com a volatilidade. Bandas muito abertas costumam aparecer no fim de uma tendência; bandas muito apertadas, antes do começo de uma nova. Funcionam melhor junto com osciladores de sobrecompra e sobrevenda.",
        ],
        diagram: {
          diagram: MA_DIAGRAMS.bollinger,
          caption: "Bandas de Bollinger (MMS 20 ± 2 desvios-padrão): apertadas na fase calma e abrindo quando o preço rompe.",
        },
      },
      {
        heading: "Por que 5, 10, 20, 40 e 21",
        paragraphs: [
          "O ciclo mensal, de cerca de 20 pregões, é um dos mais fortes nos mercados, e ciclos vizinhos costumam ser o dobro ou a metade uns dos outros. Isso explica a popularidade das médias de 5, 10, 20 e 40 dias, e das variações 4, 9 e 18.",
          "Números de Fibonacci (13, 21, 34, 55) também funcionam bem como períodos: a média de 21 dias é um exemplo no diário, e a de 13 semanas, no semanal.",
          "Estatisticamente, o certo seria centralizar a média, desenhando a de 10 dias cinco dias para trás. Como isso atrasa ainda mais os sinais, só quem estuda ciclos faz assim; no gráfico comum, a média fica no último dia da janela.",
        ],
      },
      {
        heading: "Médias no longo prazo",
        paragraphs: [
          "Em gráficos semanais, as médias de 10 ou 13 semanas, junto com as de 30 ou 40, acompanham a tendência primária. A MMS 200 diária equivale mais ou menos à de 40 semanas, e a MMS 100, à de 20 semanas. Em correções de mercados de alta, a média de 40 semanas costuma servir de suporte.",
          "A média também pode ser aplicada a outros dados além do preço: volume, interesse aberto, OBV e até osciladores.",
        ],
      },
      {
        heading: "Quando as médias não funcionam",
        paragraphs: [
          "Por seguirem a tendência, as médias obrigam a cumprir velhas regras do mercado: operar a favor da tendência, deixar o lucro correr e cortar o prejuízo cedo.",
          "O preço disso é que elas vão mal em mercados laterais, que podem ocupar de um terço à metade do tempo. Nessas fases, cada cruzamento é um sinal falso. Por isso não dá para confiar só nelas: na lateralidade, osciladores funcionam melhor, e o ADX ajuda a dizer se há tendência ou não. A diferença entre duas médias também vira um oscilador: o MACD compara duas exponenciais.",
        ],
        diagram: {
          diagram: MA_DIAGRAMS.sideways,
          caption: "Num mercado lateral, o preço cruza a MMS 10 o tempo todo: cada ponto marca um sinal que não deu em nada.",
        },
      },
      {
        heading: "Alternativas e ajustes",
        paragraphs: [
          "Regra das 4 semanas, de Richard Donchian (com aula própria nesta seção): compre quando o preço passar a máxima das quatro semanas anteriores e venda quando perder a mínima delas. Em testes de sistemas de futuros, ficou entre os melhores, ao lado do cruzamento de médias. Para sair antes, use uma regra de 1 ou 2 semanas; para filtrar a lateralidade, aumente para 8.",
          "Otimizar ou não: dá para pedir ao computador o melhor período de média para cada mercado, mas o resultado só vale se for testado em dados que não foram usados na escolha. Murphy sugere otimizar quem acompanha poucos mercados, e usar os mesmos parâmetros em todos quem acompanha muitos, como quem segue milhares de ações.",
          "Média adaptativa, de Perry Kaufman: ajusta a própria velocidade comparando direção com volatilidade. Fica lenta quando o mercado anda de lado e rápida quando ele tem tendência.",
        ],
      },
      {
        heading: "Na prática, segundo Murphy",
        paragraphs: [
          "A maioria dos analistas usa duas médias simples. As exponenciais ficaram populares, mas não há prova real de que funcionem melhor. As combinações mais usadas:",
        ],
        bullets: [
          "Futuros, no diário: 4 e 9, 9 e 18, 5 e 20, 10 e 40.",
          "Ações: MMS 50 (ou 10 semanas) no médio prazo; 30 e 40 semanas, ou a MMS 200, no longo.",
          "Bandas de Bollinger: média de 20 dias ou de 20 semanas (que corresponde a uma MMS 100 no diário).",
        ],
      },
      {
        heading: "No RiskTrade",
        paragraphs: [
          "A barra Médias móveis, acima das ferramentas de desenho do gráfico, tem atalhos para as médias simples de 5, 10, 20, 21, 50 e 200 períodos, que montam as combinações recomendadas por Murphy, e para as exponenciais de 9 e 21, populares no mercado brasileiro. O botão + Personalizada cria qualquer média simples ou exponencial de 2 a 400 candles. Cabem até quatro ao mesmo tempo. A linha Combinações aplica de uma vez as formações de cruzamento, substituindo as médias do gráfico; clicar de novo na combinação ativa a remove. Com duas ou três médias visíveis, o gráfico marca os cruzamentos com as regras deste capítulo: compra e venda no cruzamento duplo; alerta e confirmação no triplo. O painel Sinais de cruzamento avisa quando há um sinal nos últimos cinco candles. Cada média simples visível ganha caixas de envelope de 3%, 5% e 10%; a MMS 21 com 3% é a combinação de curto prazo do livro. Com um envelope marcado, o gráfico mostra os sinais das táticas acima (compra, venda e realizar), conforme o contexto medido pela inclinação da média, e o painel Sinais dos envelopes avisa os sinais dos últimos cinco candles. A caixa Bandas de Bollinger desenha as bandas (MMS 20 ± 2 desvios) e um painel aplica as regras da seção sobre elas. Ainda não há média ponderada no gráfico.",
        ],
        bullets: [
          "Cruzamento duplo de futuros: a combinação 5-20 (MMS 5 e MMS 20).",
          "Cruzamento duplo de ações: a combinação 10-50 (MMS 10 e MMS 50).",
          "Tendência de longo prazo: atalhos MMS 50 e MMS 200, no período 1A ou mais.",
          "Sistema 4-9-18: a combinação 4-9-18 coloca as três médias de uma vez, com a de 4 na primeira cor.",
          "O período conta candles do gráfico: no 1D, uma MME 21 cobre 21 candles de 5 minutos, não 21 dias.",
        ],
      },
    ],
    takeaways: [
      "A média móvel segue a tendência: confirma, nunca antecipa.",
      "Média curta dá sinais mais cedo e mais violinadas; a longa erra menos, mas atrasa na virada.",
      "A exponencial reage antes da simples, mas não há prova de que seja melhor.",
      "Duas médias (cruzamento duplo) erram menos que uma só.",
      "Envelopes e bandas de Bollinger mostram quando o preço esticou; bandas apertadas antecedem movimentos fortes.",
      "No mercado lateral, as médias falham: aí entram os osciladores.",
    ],
  },
  {
    slug: "regra-das-4-semanas",
    title: "Regra das 4 Semanas",
    subtitle: "O sistema de rompimento de Donchian: simples e testado",
    summary:
      "Comprar quando o preço passa a máxima das quatro semanas anteriores e vender quando perde a mínima. Como usar a regra, a versão que sai antes, os ajustes de sensibilidade e por que 1, 2, 4 e 8 semanas têm a ver com ciclos.",
    readingMinutes: 8,
    source: "Murphy, Technical Analysis of the Financial Markets, cap. 9 (A regra semanal, pp. 215–219)",
    relatedTerms: ["rompimento", "suporte-e-resistencia", "canal", "pullback", "linha-de-tendencia"],
    sections: [
      {
        heading: "Origem",
        paragraphs: [
          "A regra das 4 semanas foi criada por Richard Donchian, um dos pioneiros dos sistemas mecânicos de seguir tendência em futuros. Em 1970, o Trader's Notebook, da Dunn & Hargitt, testou em computador os sistemas mais conhecidos da época e concluiu que o mais lucrativo de todos era justamente essa regra.",
          "Estudos posteriores de Louis Lukac confirmaram o resultado. Entre 12 sistemas testados de 1975 a 1984, só 4 deram lucro significativo, e 2 deles eram de rompimento de canal (o terceiro, um cruzamento duplo de médias). Num estudo maior, com 23 sistemas de 1976 a 1986, os rompimentos de canal e as médias móveis voltaram a ficar no topo, e Lukac passou a usar o rompimento de canal como ponto de partida para desenvolver qualquer sistema.",
        ],
      },
      {
        heading: "A regra",
        paragraphs: [
          "A versão original, pensada para futuros, tem só duas linhas:",
        ],
        bullets: [
          "Zere as vendas e compre quando o preço passar a máxima das quatro semanas completas anteriores.",
          "Zere as compras e venda quando o preço perder a mínima das quatro semanas completas anteriores.",
        ],
        diagram: {
          diagram: CHANNEL_DIAGRAMS.breakout,
          caption: "O canal de 4 semanas (cerca de 20 pregões) acompanha a máxima e a mínima recentes; a compra vem quando o preço sai da lateralidade e passa a máxima.",
        },
      },
      {
        heading: "Contínua ou não contínua",
        paragraphs: [
          "Do jeito original, a regra é contínua: o sistema está sempre posicionado, comprado ou vendido, porque cada sinal zera a posição anterior e abre a oposta. O ponto fraco de todo sistema contínuo é ficar no mercado durante as fases sem tendência, levando violinadas, e os sistemas de seguir tendência vão mal justamente nessas fases.",
          "A correção é torná-la não contínua: um rompimento de 4 semanas abre a posição, mas um sinal contrário mais curto, de 1 ou 2 semanas, já a encerra. Depois disso, o trader fica de fora até aparecer um novo rompimento de 4 semanas.",
        ],
        diagram: {
          diagram: CHANNEL_DIAGRAMS.nonContinuous,
          caption: "Versão não contínua: a compra entra no rompimento de 4 semanas e sai quando o preço perde a mínima de 2 semanas, bem antes da mínima de 4 semanas.",
        },
      },
      {
        heading: "Por que funciona",
        paragraphs: [
          "A regra segue princípios técnicos sólidos e dá sinais mecânicos e claros. Por seguir a tendência, garante participação do lado certo de toda tendência importante e cumpre a velha máxima de deixar o lucro correr e cortar o prejuízo cedo. Ela também opera pouco, o que reduz custos, e pode ser aplicada com ou sem computador.",
          "A crítica é a mesma de qualquer sistema de seguir tendência: não pega topos nem fundos. Mas nenhum sistema desse tipo pega, e Murphy observa que a regra das 4 semanas vai pelo menos tão bem quanto a maioria deles, com a vantagem da simplicidade.",
        ],
      },
      {
        heading: "Ajustes",
        paragraphs: [
          "A regra não precisa ser usada como sistema completo. Os sinais semanais também servem como indicador para identificar rompimentos e viradas, ou como filtro para outras técnicas. Por exemplo, um cruzamento de médias só é operado se um rompimento de 2 semanas na mesma direção o confirmar.",
          "O período também pode ser encurtado ou alongado, de acordo com o risco e a sensibilidade desejados:",
        ],
        bullets: [
          "Mais curto, para ficar mais sensível: num mercado que subiu forte, quem comprou no rompimento de 4 semanas com stop abaixo da mínima de 2 semanas pode passar a usar a mínima de 1 semana, protegendo mais o lucro.",
          "Mais longo, para filtrar a lateralidade: num mercado de lado, ampliar para 8 semanas evita entrar em sinais curtos e prematuros, à espera de um rompimento importante.",
          "Para entradas mais sensíveis, dá para usar 2 semanas também na entrada.",
        ],
        diagram: {
          diagram: CHANNEL_DIAGRAMS.filter,
          caption: "Num mercado lateral, a regra de 4 semanas dá vários sinais falsos (pontos), enquanto o canal de 8 semanas não é rompido nenhuma vez.",
        },
      },
      {
        heading: "Ciclos: por que 1, 2, 4 e 8 semanas",
        paragraphs: [
          "O ciclo mensal, de 4 semanas ou cerca de 20 pregões, é um dos mais fortes nos mercados, o que ajuda a explicar o sucesso das 4 semanas. Pelo princípio dos harmônicos, cada ciclo se relaciona com os vizinhos pelo fator 2: o próximo mais longo tem o dobro do tamanho, e o mais curto, a metade.",
          "É a mesma lógica das médias de 5, 10, 20 e 40 dias, que em semanas viram 1, 2, 4 e 8. Por isso os ajustes funcionam melhor dividindo ou multiplicando por 2: para encurtar, de 4 para 2 semanas, e daí para 1; para alongar, de 4 para 8.",
        ],
      },
      {
        heading: "Canais de preço nos gráficos",
        paragraphs: [
          "Os programas de gráfico mostram a regra como um canal de preço: uma linha na máxima e outra na mínima dos últimos 20 pregões, acompanhando o preço. O sinal de compra vem quando o preço fecha acima do canal de cima, e só um fechamento abaixo do canal de baixo inverte o sinal. O canal funciona no diário, no semanal e no mensal.",
        ],
      },
      {
        heading: "No RiskTrade",
        paragraphs: [
          "Marque Regra das 4 semanas na barra de médias do gráfico, num período de candles diários (3M em diante, ou 23 dias ou mais no campo Dias):",
        ],
        bullets: [
          "O canal de entrada aparece em degraus: a máxima (vermelha) e a mínima (verde) das semanas anteriores. Escolha 4 semanas (original), 2 (mais sensível) ou 8 (filtra a lateralidade).",
          "Na saída, escolha a versão contínua, que inverte a posição no próprio canal, ou a não contínua, que sai pela mínima (ou máxima) de 2 ou 1 semana, desenhada pontilhada.",
          "Os marcadores mostram cada Compra, Venda e Saída, e o painel diz a posição do sistema, os níveis que o fechamento precisa romper e os sinais recentes.",
          "Combine com o painel de cruzamento de médias para usar o rompimento de 2 semanas como filtro, como Murphy sugere.",
        ],
      },
    ],
    takeaways: [
      "Compre quando o preço passar a máxima das 4 semanas anteriores; venda quando perder a mínima.",
      "A regra foi o sistema mais lucrativo nos testes de 1970, e os rompimentos de canal seguiram no topo em estudos posteriores.",
      "A versão contínua sofre na lateralidade; sair com um sinal de 1 ou 2 semanas a torna não contínua.",
      "Encurte (2 ou 1 semana) para mais sensibilidade e alongue (8 semanas) para filtrar a lateralidade.",
      "Os ajustes funcionam melhor multiplicando ou dividindo por 2, seguindo os ciclos: 1, 2, 4 e 8 semanas.",
      "Como todo sistema de seguir tendência, não pega topos nem fundos, e não precisa pegar.",
    ],
  },
  {
    slug: "ifr-de-wilder",
    title: "IFR de Wilder",
    subtitle: "O Índice de Força Relativa: zonas, failure swings e divergências",
    summary:
      "O oscilador mais usado da análise técnica: como ele é calculado, como ler as zonas de 70 e 30, por que o sinal vem na volta para dentro da faixa, o failure swing, as divergências e como ajustar o período e os níveis à tendência.",
    readingMinutes: 10,
    source:
      "Murphy, Technical Analysis of the Financial Markets, cap. 10 (Osciladores e opinião contrária); J. Welles Wilder, New Concepts in Technical Trading Systems (1978)",
    relatedTerms: ["linha-de-momentum", "divergencia-de-volume", "bandas-de-bollinger", "linha-de-tendencia", "suporte-e-resistencia"],
    sections: [
      {
        heading: "Origem",
        paragraphs: [
          "J. Welles Wilder apresentou o Índice de Força Relativa (IFR, ou RSI em inglês) em 1978, no livro New Concepts in Technical Trading Systems. Ele queria corrigir dois defeitos da linha de momentum simples: os saltos bruscos que aparecem quando um preço muito alto ou muito baixo sai da janela de cálculo, e a falta de uma escala fixa para comparar ativos e momentos diferentes.",
          "O resultado é um oscilador que vai sempre de 0 a 100, com movimento mais suave. Murphy o descreve como um dos osciladores mais populares entre os analistas técnicos.",
        ],
      },
      {
        heading: "Como é calculado",
        paragraphs: [
          "O IFR compara o tamanho médio das altas com o tamanho médio das baixas dos últimos 14 períodos. Primeiro calcula-se a força relativa: RS = média das altas ÷ média das baixas. Depois, IFR = 100 − 100 ÷ (1 + RS).",
          "As médias usam a suavização de Wilder: a primeira é a média simples das 14 primeiras variações; daí em diante, cada nova média é (média anterior × 13 + variação de hoje) ÷ 14. Assim, um dia antigo nunca sai da conta de uma vez, e a linha não dá saltos.",
        ],
        bullets: [
          "Exemplo: se a média das altas é 1,20 e a das baixas é 0,60, RS = 2 e IFR = 100 − 100 ÷ 3 ≈ 66,7.",
          "Só altas na janela: o IFR chega a 100. Só baixas: chega a 0.",
          "Altas e baixas do mesmo tamanho: o IFR fica em 50.",
        ],
      },
      {
        heading: "Sobrecompra e sobrevenda: 70 e 30",
        paragraphs: [
          "Acima de 70, o mercado está sobrecomprado; abaixo de 30, sobrevendido. São zonas de alerta, não sinais: um movimento forte pode deixar o IFR muito tempo numa zona extrema, e a primeira entrada nela costuma ser só um aviso de que o movimento esticou.",
          "Por isso Murphy recomenda esperar a volta: o sinal de venda vem quando o IFR, depois de passar de 70, volta para baixo dele; o de compra, quando volta para cima de 30.",
        ],
        diagram: {
          diagram: RSI_DIAGRAMS.zones,
          caption: "IFR de 14 períodos sobre um preço oscilante: a venda vem quando ele volta para baixo de 70, e a compra quando volta para cima de 30.",
        },
      },
      {
        heading: "Os níveis se ajustam à tendência",
        paragraphs: [
          "Num mercado de alta forte, o IFR costuma oscilar entre 40 e 80 e raramente chega a 30: 70 deixa de ser um bom nível de venda, e muitos analistas passam a usar 80 como sobrecompra. Num mercado de baixa, o espelho: o IFR anda entre 20 e 60, e 20 vira o nível de sobrevenda.",
          "A linha de 50 também ajuda: acima dela, os ganhos recentes superam as perdas; abaixo, o contrário. Recuos que param perto de 40 a 50 numa alta, sem chegar a 30, mostram que a tendência continua forte.",
        ],
      },
      {
        heading: "Failure swing",
        paragraphs: [
          "Wilder considerava o failure swing o sinal mais forte do IFR. No de topo, o IFR passa de 70 (A), recua (B), repica sem superar o topo A (C) e então perde o fundo B: é o sinal de venda. O padrão mostra que a força compradora não conseguiu repetir o pico, mesmo com o preço ainda alto.",
          "O failure swing de fundo é o espelho: o IFR cai abaixo de 30, repica, recua sem perder o fundo e então supera o topo intermediário, sinal de compra. Em ambos, o sinal depende só do IFR, sem precisar olhar o gráfico de preço.",
        ],
        diagram: { diagram: RSI_DIAGRAMS.failureTop, caption: "Failure swing de topo: C não supera A, e a venda vem quando o IFR perde o fundo B." },
      },
      {
        heading: "Divergências",
        paragraphs: [
          "Quando o preço faz um novo topo e o IFR faz um topo mais baixo, há uma divergência de baixa: o movimento continua, mas com menos força. O espelho, preço num fundo mais baixo e IFR num fundo mais alto, é a divergência de alta.",
          "Para Murphy, a divergência é o sinal mais importante dos osciladores, principalmente quando o primeiro topo do IFR está acima de 70 (ou o primeiro fundo, abaixo de 30). Ela é um alerta: a confirmação vem pelo preço, como o rompimento de uma linha de tendência, ou pelo próprio IFR, num failure swing.",
        ],
        diagram: {
          diagram: RSI_DIAGRAMS.divergence,
          caption: "O preço faz um topo mais alto, mas o IFR de 14 períodos faz um topo mais baixo: a alta perdeu força.",
        },
      },
      {
        heading: "Linhas de tendência e padrões no próprio IFR",
        paragraphs: [
          "O IFR forma os mesmos desenhos do preço: linhas de tendência, suportes, resistências e até padrões como triângulos ou ombro-cabeça-ombro. Muitas vezes eles aparecem com mais clareza no IFR, e o rompimento de uma linha de tendência do IFR pode vir antes do rompimento correspondente no preço.",
        ],
      },
      {
        heading: "Qual período usar",
        paragraphs: [
          "Wilder usava 14 períodos, e esse continua sendo o padrão. Quanto menor o período, mais sensível o IFR e maior a amplitude: o de 9 períodos chega às zonas extremas com mais frequência e dá mais sinais, inclusive falsos. Quanto maior o período, mais suave a linha: o de 25 raramente sai da faixa de 30 a 70.",
          "Murphy observa que quem encurta o período costuma alargar os níveis (80 e 20), e quem alonga costuma estreitá-los, para que os sinais continuem aparecendo.",
        ],
      },
      {
        heading: "Em tendência e no mercado lateral",
        paragraphs: [
          "Os osciladores funcionam melhor em mercados laterais, onde o preço vai e volta entre suporte e resistência. Numa tendência forte, sobrecompra e sobrevenda podem durar muito, e operar contra a tendência a cada toque em 70 ou 30 sai caro.",
          "A regra de Murphy é usar o oscilador a favor da tendência principal: numa alta, comprar quando o IFR sai da sobrevenda (ou recua até 40 a 50) e só realizar lucro na sobrecompra; numa baixa, vender quando ele sai da sobrecompra.",
        ],
      },
      {
        heading: "Semanal e mensal",
        paragraphs: [
          "O IFR também funciona em gráficos semanais e mensais, com 14 semanas ou 14 meses. Nesses prazos, as zonas extremas são raras e costumam marcar viradas importantes do mercado, e as divergências ganham ainda mais peso.",
        ],
      },
      {
        heading: "No RiskTrade",
        paragraphs: ["Use os botões IFR de Wilder na barra de médias do gráfico:"],
        bullets: [
          "Escolha 14 (Wilder), 9 (mais sensível) ou 25 (mais suave). Clicar de novo no botão ativo desliga o IFR.",
          "O painel do IFR tem escala fixa de 0 a 100, com as linhas de 70 e 30 tracejadas e a de 50 pontilhada.",
          "Setas marcam as voltas para dentro da faixa (compra acima de 30, venda abaixo de 70), e círculos marcam os failure swings.",
          "O painel de leitura diz a zona atual, a última saída das zonas e o último failure swing.",
          "Arraste o painel pela alça ⋮⋮ para colocá-lo logo abaixo do preço e comparar as divergências.",
        ],
      },
    ],
    takeaways: [
      "IFR = 100 − 100 ÷ (1 + média das altas ÷ média das baixas), com a suavização de Wilder; vai de 0 a 100.",
      "70 e 30 marcam sobrecompra e sobrevenda; o sinal vem na volta para dentro da faixa, não no toque.",
      "Em tendência forte, os níveis se deslocam: use 80 numa alta e 20 numa baixa.",
      "O failure swing, quando o IFR não repete o extremo e rompe o ponto intermediário, é o sinal mais forte de Wilder.",
      "Divergências entre o IFR e o preço, com o IFR numa zona extrema, são o alerta mais importante.",
      "Opere o IFR a favor da tendência principal; ele funciona melhor no mercado lateral.",
    ],
  },
  {
    slug: "estocastico",
    title: "Estocástico %K %D",
    subtitle: "O oscilador de George Lane: onde o fechamento cai na faixa recente",
    summary:
      "Como o estocástico mede a posição do fechamento entre a máxima e a mínima recentes, a diferença entre as versões rápida e lenta, as zonas de 80 e 20, os cruzamentos do %K com o %D, as divergências e como combiná-lo com a tendência.",
    readingMinutes: 9,
    source: "Murphy, Technical Analysis of the Financial Markets, cap. 10 (Osciladores e opinião contrária)",
    relatedTerms: ["linha-de-momentum", "divergencia-de-volume", "bandas-de-bollinger", "suporte-e-resistencia", "linha-de-tendencia"],
    sections: [
      {
        heading: "Origem",
        paragraphs: [
          "O oscilador estocástico foi popularizado por George Lane, presidente da Investment Educators, nos anos 1950 e 1960. Junto com o IFR de Wilder, é um dos osciladores mais usados pelos analistas técnicos.",
        ],
      },
      {
        heading: "A ideia: onde o fechamento cai na faixa",
        paragraphs: [
          "Lane partiu de uma observação simples: numa alta, os fechamentos tendem a ficar perto das máximas do período; numa baixa, perto das mínimas. Quando, numa alta, os fechamentos começam a se afastar das máximas, a força compradora está diminuindo, mesmo que o preço ainda suba.",
          "O estocástico mede isso: em que ponto da faixa entre a máxima e a mínima dos últimos períodos está o fechamento de hoje. Perto de 100, o fechamento está no topo da faixa; perto de 0, no fundo.",
        ],
      },
      {
        heading: "Como é calculado",
        paragraphs: [
          "São duas linhas. A principal, %K, é 100 × (fechamento − mínima de N) ÷ (máxima de N − mínima de N), com N normalmente igual a 14. A segunda, %D, é uma média de 3 períodos do %K e funciona como linha de sinal.",
        ],
        bullets: [
          "Exemplo: nos últimos 14 dias, a máxima foi 120 e a mínima 100. Fechando hoje em 115, o %K é 100 × (115 − 100) ÷ (120 − 100) = 75.",
          "Fechando na máxima da faixa, o %K é 100; na mínima, é 0.",
          "Como usa máximas e mínimas, e não só fechamentos, o estocástico reage a movimentos dentro do pregão que o IFR não vê.",
        ],
      },
      {
        heading: "Rápido e lento",
        paragraphs: [
          "O %K calculado direto (o estocástico rápido) é muito sensível e oscila demais. Por isso a maioria dos analistas usa o estocástico lento: o %D do rápido vira o novo %K, e o novo %D é uma média de 3 dele. É a versão (14, 3, 3), mais suave e confiável.",
        ],
        diagram: {
          diagram: STOCHASTIC_DIAGRAMS.fastSlow,
          caption: "O %K rápido (cinza) e o lento (azul) sobre o mesmo preço: o lento elimina boa parte do ruído.",
        },
      },
      {
        heading: "Zonas de 80 e 20",
        paragraphs: [
          "Acima de 80, o mercado está sobrecomprado; abaixo de 20, sobrevendido. Algumas pessoas usam 70 e 30, como no IFR. Como nos outros osciladores, estar numa zona extrema é um alerta, não um sinal: numa tendência forte, o estocástico pode passar muito tempo perto de 100 ou de 0.",
        ],
      },
      {
        heading: "Cruzamentos do %K com o %D",
        paragraphs: [
          "O momento de agir vem do cruzamento das duas linhas. A compra acontece quando o %K cruza o %D para cima com as linhas abaixo de 20; a venda, quando o %K cruza para baixo com as linhas acima de 80. Cruzamentos no meio da faixa têm pouco valor.",
          "Murphy observa que o cruzamento à direita, quando o %K cruza o %D depois de o %D já ter virado, costuma ser mais confiável que o cruzamento à esquerda, quando o %K cruza o %D ainda na direção do movimento anterior.",
        ],
        diagram: {
          diagram: STOCHASTIC_DIAGRAMS.crosses,
          caption: "Estocástico lento (14, 3, 3): a venda vem quando o %K cruza o %D para baixo acima de 80, e a compra quando cruza para cima abaixo de 20.",
        },
      },
      {
        heading: "Divergências",
        paragraphs: [
          "Para Murphy, o sinal mais importante do estocástico é a divergência entre o %D e o preço com o %D numa zona extrema. Numa divergência de baixa, o preço faz um topo mais alto e o %D, acima de 80, faz um topo mais baixo: os fechamentos estão se afastando das máximas. A divergência de alta é o espelho, abaixo de 20.",
          "Como em todo oscilador, a divergência é um alerta. O cruzamento do %K com o %D, ou o rompimento de uma linha de tendência no preço, dá a confirmação.",
        ],
        diagram: {
          diagram: STOCHASTIC_DIAGRAMS.divergence,
          caption: "O preço faz um topo mais alto, mas o %D, acima de 80, faz um topo mais baixo: a alta perdeu força.",
        },
      },
      {
        heading: "Estocástico e tendência",
        paragraphs: [
          "O estocástico funciona melhor em mercados laterais. Numa tendência forte, ele pode ficar dias na zona extrema e gerar sinais contra a tendência que não dão em nada.",
          "A regra de Murphy é usar o oscilador a favor da tendência principal: numa alta, aproveitar as quedas do estocástico abaixo de 20 para comprar e usar a sobrecompra só para realizar lucro; numa baixa, o contrário. Uma forma de definir a tendência é o estocástico semanal: o sinal do semanal dá a direção, e o do diário, o momento de entrar.",
        ],
      },
      {
        heading: "Qual período usar",
        paragraphs: [
          "Lane usava 14 períodos, e esse é o padrão. Períodos curtos, como 5 ou 9, deixam o estocástico mais nervoso, com mais sinais e mais sinais falsos; servem para quem opera no curtíssimo prazo. Períodos longos, como 21, aproximam o indicador do ciclo mensal e reduzem o ruído.",
        ],
      },
      {
        heading: "Semanal e mensal",
        paragraphs: [
          "O estocástico pode ser aplicado a gráficos semanais e mensais. Nesses prazos, os sinais são raros e mais importantes, e servem como filtro para os sinais do diário.",
        ],
      },
      {
        heading: "Estocástico e IFR",
        paragraphs: [
          "Os dois medem sobrecompra e sobrevenda, mas de jeitos diferentes. O IFR compara o tamanho das altas com o das baixas, só com fechamentos. O estocástico compara o fechamento com a faixa entre máxima e mínima, e por isso reage mais rápido. Muitos analistas usam os dois juntos: um sinal confirmado pelos dois é mais forte.",
        ],
      },
      {
        heading: "No RiskTrade",
        paragraphs: ["Use os botões Estocástico na barra de médias do gráfico:"],
        bullets: [
          "Escolha 14 (padrão), 5 (curto prazo) ou 21 (ciclo mensal), sempre na versão lenta (N, 3, 3). Clicar de novo no botão ativo desliga o estocástico.",
          "O painel mostra o %K (linha cheia) e o %D (outra cor), com as linhas de 80 e 20 tracejadas e a de 50 pontilhada.",
          "Setas marcam os cruzamentos nas zonas: compra quando o %K cruza o %D para cima abaixo de 20, venda quando cruza para baixo acima de 80.",
          "O painel de leitura diz o %K, o %D, a zona, o último cruzamento e o último sinal nas zonas.",
          "Arraste o painel pela alça ⋮⋮ para perto do preço e compare as divergências; combine com o IFR para confirmar os sinais.",
        ],
      },
    ],
    takeaways: [
      "%K = 100 × (fechamento − mínima de N) ÷ (máxima de N − mínima de N); %D é a média de 3 do %K.",
      "Use a versão lenta (14, 3, 3): o estocástico rápido oscila demais.",
      "80 e 20 marcam sobrecompra e sobrevenda; estar na zona é alerta, não sinal.",
      "O sinal vem do %K cruzando o %D nas zonas extremas; o cruzamento à direita é mais confiável.",
      "A divergência entre o %D e o preço, com o %D acima de 80 ou abaixo de 20, é o sinal mais importante.",
      "Opere a favor da tendência principal; o estocástico semanal ajuda a defini-la.",
    ],
  },
  {
    slug: "r-de-williams",
    title: "%R de Larry Williams",
    subtitle: "Onde o fechamento está em relação à máxima recente",
    summary:
      "Como o %R mede a distância do fechamento até a máxima da faixa, por que a escala vai de 0 a −100, as zonas de −20 e −80, por que o sinal está na saída das zonas, as divergências e como ele se compara ao estocástico e ao IFR.",
    readingMinutes: 7,
    source:
      "Murphy, Technical Analysis of the Financial Markets, cap. 10 (Osciladores e opinião contrária); Larry Williams, How I Made One Million Dollars Last Year Trading Commodities (1973)",
    relatedTerms: ["linha-de-momentum", "divergencia-de-volume", "suporte-e-resistencia", "linha-de-tendencia", "bandas-de-bollinger"],
    sections: [
      {
        heading: "Origem",
        paragraphs: [
          "O %R foi apresentado por Larry Williams em 1973, no livro How I Made One Million Dollars Last Year Trading Commodities. Murphy o descreve no capítulo dos osciladores, ao lado do estocástico, com o qual tem parentesco direto.",
        ],
      },
      {
        heading: "A ideia",
        paragraphs: [
          "O %R responde a uma pergunta: quão longe o fechamento de hoje está da máxima dos últimos N períodos, em proporção à faixa inteira? Fechando na máxima, o mercado mostra força total; fechando na mínima, fraqueza total.",
        ],
      },
      {
        heading: "Como é calculado",
        paragraphs: [
          "%R = −100 × (máxima de N − fechamento) ÷ (máxima de N − mínima de N). Williams usava N = 10.",
        ],
        bullets: [
          "Exemplo: nos últimos 10 dias, a máxima foi 60 e a mínima 42. Fechando em 58, o %R é −100 × (60 − 58) ÷ (60 − 42) ≈ −11: perto do topo da faixa.",
          "Fechando na máxima, o %R é 0; na mínima, −100.",
          "É o %K rápido do estocástico deslocado: %R = %K − 100. O estocástico mede a distância até a mínima; o %R, até a máxima.",
        ],
        diagram: {
          diagram: WILLIAMS_DIAGRAMS.range,
          caption: "Dez candles com a máxima e a mínima da faixa: o último fecha perto da máxima, e o %R fica perto de 0.",
        },
      },
      {
        heading: "A escala invertida",
        paragraphs: [
          "Como o %R mede a distância até a máxima, a escala fica de cabeça para baixo: 0 é o topo e −100 o fundo. Murphy desenha o %R de 0 a 100 com o eixo invertido; a maioria dos programas atuais, inclusive o RiskTrade, usa valores negativos. A leitura é a mesma: quanto mais perto de 0, mais perto da máxima.",
        ],
      },
      {
        heading: "Zonas de −20 e −80",
        paragraphs: [
          "Acima de −20 (de 0 a −20), o mercado está sobrecomprado; abaixo de −80 (de −80 a −100), sobrevendido. Como o %R não é suavizado, ele é muito sensível e toca as zonas extremas com frequência, muito mais que o IFR.",
        ],
      },
      {
        heading: "O sinal está na saída das zonas",
        paragraphs: [
          "Por ser tão sensível, operar o simples toque nas zonas gera sinais demais. A leitura mais usada é esperar a saída: a venda vem quando o %R, depois de estar acima de −20, volta para baixo dele; a compra, quando volta para cima de −80.",
        ],
        diagram: {
          diagram: WILLIAMS_DIAGRAMS.zones,
          caption: "%R de 10 períodos: a venda vem quando ele sai de cima de −20, e a compra quando sai de baixo de −80.",
        },
      },
      {
        heading: "Divergências e falhas",
        paragraphs: [
          "Como nos outros osciladores, a divergência é um alerta importante: o preço faz um novo topo, mas o %R faz um topo mais baixo. Um caso típico é o %R que, numa alta, não consegue mais chegar à zona de sobrecompra, enquanto o preço ainda sobe: os fechamentos já não ficam tão perto das máximas.",
          "A confirmação vem do preço, como o rompimento de uma linha de tendência, ou da saída das zonas.",
        ],
        diagram: {
          diagram: WILLIAMS_DIAGRAMS.divergence,
          caption: "O preço faz um topo mais alto, mas o %R de 10 períodos não volta acima de −20: a alta perdeu força.",
        },
      },
      {
        heading: "%R, estocástico e IFR",
        paragraphs: [
          "O %R é o estocástico rápido de cabeça para baixo, sem a suavização do %D: por isso é o mais sensível dos três. O estocástico lento suaviza a mesma informação e dá menos sinais. O IFR usa só fechamentos e é o mais estável. Usar o %R junto com um deles ajuda a filtrar os sinais.",
        ],
      },
      {
        heading: "Qual período usar",
        paragraphs: [
          "Williams usava 10 períodos. Uma regra prática ligada aos ciclos é usar cerca de metade do ciclo dominante: 10 dias para o ciclo mensal de cerca de 20 pregões. Períodos maiores, como 14 ou 20, deixam o %R mais lento e reduzem os sinais falsos.",
        ],
      },
      {
        heading: "A favor da tendência",
        paragraphs: [
          "Numa tendência forte, o %R pode passar dias colado em 0 ou em −100. A regra de Murphy vale aqui também: use o oscilador a favor da tendência principal. Numa alta, compre quando o %R sai da sobrevenda e use a sobrecompra só para realizar lucro; numa baixa, venda quando ele sai da sobrecompra.",
        ],
      },
      {
        heading: "No RiskTrade",
        paragraphs: ["Use os botões %R de Williams na barra de médias do gráfico:"],
        bullets: [
          "Escolha 10 (Williams), 14 ou 20. Clicar de novo no botão ativo desliga o %R.",
          "O painel tem escala fixa de 0 a −100, com as linhas de −20 e −80 tracejadas e a de −50 pontilhada.",
          "Setas marcam as saídas das zonas: venda ao sair de cima de −20, compra ao sair de baixo de −80.",
          "O painel de leitura diz o valor, a zona e a última saída.",
          "Combine com o estocástico ou o IFR, e arraste o painel pela alça ⋮⋮ para perto do preço para ver as divergências.",
        ],
      },
    ],
    takeaways: [
      "%R = −100 × (máxima de N − fechamento) ÷ (máxima de N − mínima de N); vai de 0 (na máxima) a −100 (na mínima).",
      "É o estocástico rápido de cabeça para baixo: %R = %K − 100.",
      "Acima de −20 é sobrecompra; abaixo de −80, sobrevenda.",
      "O %R é muito sensível: o sinal está na saída das zonas, não no toque.",
      "Na alta, o %R que não chega mais a −20 enquanto o preço sobe é um aviso de divergência.",
      "Use a favor da tendência principal e combine com um oscilador mais lento.",
    ],
  },
  {
    slug: "macd",
    title: "MACD e histograma do MACD",
    subtitle: "Duas médias exponenciais, uma linha de sinal e o histograma que vira antes",
    summary:
      "Como o MACD de Gerald Appel é montado, os cruzamentos com a linha de sinal, a linha zero, os extremos e as divergências, e como o histograma de Thomas Aspray avisa dos cruzamentos antes que eles aconteçam.",
    readingMinutes: 9,
    source: "Murphy, Technical Analysis of the Financial Markets, cap. 10 (Osciladores e opinião contrária)",
    relatedTerms: ["linha-de-momentum", "linha-de-tendencia", "divergencia-de-volume", "suporte-e-resistencia", "bandas-de-bollinger"],
    sections: [
      {
        heading: "Origem",
        paragraphs: [
          "O MACD (Moving Average Convergence/Divergence, convergência e divergência de médias móveis) foi criado por Gerald Appel. Ele junta duas ideias que Murphy trata no capítulo das médias móveis, o cruzamento de duas médias e o oscilador da diferença entre elas, num indicador só. O histograma do MACD foi proposto depois por Thomas Aspray.",
        ],
      },
      {
        heading: "As duas linhas",
        paragraphs: [
          "A linha principal, o MACD, é a diferença entre duas médias móveis exponenciais dos fechamentos: a de 12 períodos menos a de 26. A segunda, a linha de sinal, é uma média exponencial de 9 períodos do próprio MACD. Os parâmetros (12, 26, 9) são o padrão.",
        ],
        bullets: [
          "MACD positivo: a média de 12 está acima da de 26, ou seja, os preços recentes estão acima dos mais antigos.",
          "MACD subindo: a média curta está se afastando da longa para cima, e o movimento de alta ganha força.",
          "A linha de sinal é uma versão mais lenta do MACD: o cruzamento das duas mostra uma mudança de ritmo.",
        ],
      },
      {
        heading: "Cruzamentos com a linha de sinal",
        paragraphs: [
          "O sinal principal é o cruzamento das duas linhas. Quando o MACD cruza a linha de sinal para cima, é compra; quando cruza para baixo, é venda. É a mesma lógica do cruzamento de duas médias, aplicada a um indicador que já mede a distância entre duas médias.",
        ],
        diagram: {
          diagram: MACD_DIAGRAMS.lines,
          caption: "MACD (12, 26, 9) sobre um preço que oscila: compra quando o MACD cruza o sinal para cima, venda quando cruza para baixo.",
        },
      },
      {
        heading: "A linha zero",
        paragraphs: [
          "O MACD cruzar o zero é o mesmo que a média de 12 cruzar a de 26. Acima de zero, o quadro é de alta; abaixo, de baixa. Alguns analistas usam a linha zero como filtro: só compram nos cruzamentos com o MACD acima de zero, a favor da tendência.",
        ],
      },
      {
        heading: "Sobrecompra e sobrevenda",
        paragraphs: [
          "O MACD não tem limites fixos como o IFR, mas funciona como oscilador: quando as linhas ficam muito acima de zero, o mercado está sobrecomprado; muito abaixo, sobrevendido. Por isso Murphy dá mais peso às vendas que acontecem bem acima de zero e às compras bem abaixo dele.",
        ],
      },
      {
        heading: "Divergências",
        paragraphs: [
          "Quando o preço faz um novo topo e o MACD faz um topo mais baixo, há uma divergência de baixa: a média curta já não se afasta tanto da longa, e a alta perde fôlego. O espelho, preço num fundo mais baixo e MACD num fundo mais alto, é a divergência de alta. Como nos outros osciladores, é um alerta que pede confirmação.",
        ],
        diagram: {
          diagram: MACD_DIAGRAMS.divergence,
          caption: "O preço faz um topo mais alto, mas o MACD faz um topo mais baixo: a alta perdeu força.",
        },
      },
      {
        heading: "O histograma do MACD",
        paragraphs: [
          "O histograma é a diferença entre o MACD e a linha de sinal, desenhada em barras em volta de zero. Ele é positivo quando o MACD está acima do sinal e negativo quando está abaixo. O histograma cruza o zero exatamente quando as duas linhas se cruzam.",
          "O que ele acrescenta é a distância entre as linhas: barras crescendo mostram o MACD se afastando do sinal, e o movimento ganhando força; barras encolhendo mostram as linhas se aproximando.",
        ],
      },
      {
        heading: "O histograma vira antes",
        paragraphs: [
          "Como o histograma mede a distância entre as linhas, ele começa a encolher assim que o MACD perde velocidade, bem antes de as linhas se cruzarem. Essa virada do histograma é um aviso antecipado de que o cruzamento está chegando.",
          "Murphy recomenda usar a virada do histograma como alerta para proteger lucros ou se preparar, e não como sinal de entrada por si só: o sinal continua sendo o cruzamento das linhas.",
        ],
        diagram: {
          diagram: MACD_DIAGRAMS.histogram,
          caption: "O histograma faz o pico e começa a encolher bem antes do cruzamento do MACD com o sinal.",
        },
      },
      {
        heading: "Semanal e diário",
        paragraphs: [
          "O MACD funciona em qualquer prazo. Uma forma clássica de usá-lo é deixar o MACD semanal dar a direção e o diário dar o momento: compras no diário só quando o semanal está em sinal de compra, e vendas só quando ele está em sinal de venda.",
        ],
      },
      {
        heading: "MACD e o histograma das médias",
        paragraphs: [
          "O MACD é parente do histograma da diferença entre duas médias, que o RiskTrade mostra quando você deixa duas médias visíveis. A diferença é que o MACD usa médias exponenciais fixas (12 e 26) e acrescenta a linha de sinal, que dá os cruzamentos.",
        ],
      },
      {
        heading: "No RiskTrade",
        paragraphs: ["Marque a caixa MACD (12, 26, 9) na barra de médias do gráfico:"],
        bullets: [
          "O painel mostra o histograma em barras (verde acima de zero, vermelho abaixo, claro quando encolhe), a linha do MACD, a linha de sinal e a linha zero.",
          "Setas marcam os cruzamentos do MACD com o sinal: compra para cima, venda para baixo.",
          "O painel de leitura diz os valores, se o histograma está aumentando ou diminuindo, o último cruzamento (acima ou abaixo de zero) e o último cruzamento da linha zero.",
          "Arraste o painel pela alça ⋮⋮ para perto do preço e compare as divergências.",
        ],
      },
    ],
    takeaways: [
      "MACD = MME 12 − MME 26; linha de sinal = MME 9 do MACD; histograma = MACD − sinal.",
      "O sinal principal é o cruzamento do MACD com a linha de sinal.",
      "MACD acima de zero é quadro de alta; vendas bem acima de zero e compras bem abaixo pesam mais.",
      "Divergências entre o MACD e o preço avisam que o movimento perde força.",
      "O histograma vira antes do cruzamento: use como alerta, não como sinal sozinho.",
      "O MACD semanal dá a direção; o diário, o momento de entrar.",
    ],
  },
  {
    slug: "ondas-de-elliott",
    title: "Teoria das Ondas de Elliott",
    subtitle: "Padrão, razão e tempo: o ritmo de 5 + 3 ondas",
    summary:
      "O ciclo de cinco ondas a favor e três contra, os graus de tendência, as regras do impulso, os tipos de correção, a alternação, os canais e as razões de Fibonacci.",
    readingMinutes: 13,
    source: "Murphy, Technical Analysis of the Financial Markets, cap. 13 (Teoria das Ondas de Elliott)",
    relatedTerms: ["retracoes", "canal", "triangulo-simetrico", "linha-de-tendencia"],
    sections: [
      {
        heading: "Origem",
        paragraphs: [
          "Ralph Nelson Elliott apresentou o Princípio das Ondas na década de 1930, fortemente influenciado pela Teoria de Dow: ele assinava o serviço de Robert Rhea e via seu trabalho como um complemento a Dow. Sua obra definitiva, Nature's Law, saiu em 1946. A teoria foi mantida viva por Hamilton Bolton e popularizada por A. J. Frost e Robert Prechter no livro Elliott Wave Principle, de 1978.",
          "A teoria tem três aspectos, nesta ordem de importância: o padrão (a forma das ondas), a razão (as proporções entre as ondas, usadas para retrações e alvos) e o tempo (as relações de duração, consideradas as menos confiáveis).",
        ],
      },
      {
        heading: "O ciclo básico: 5 + 3",
        paragraphs: [
          "Na forma mais simples, o mercado segue um ritmo repetitivo: cinco ondas a favor da tendência, seguidas de três ondas contra. Um ciclo completo tem oito ondas.",
          "Na alta, as ondas 1, 3 e 5 são impulsivas: sobem. As ondas 2 e 4 são corretivas: corrigem a 1 e a 3. Terminado o impulso de cinco ondas, vem uma correção em três ondas, identificadas pelas letras a, b e c.",
        ],
        diagram: { diagram: ELLIOTT_CYCLE, caption: "Um ciclo completo: impulso em cinco ondas (1 a 5) e correção em três (a, b, c)." },
      },
      {
        heading: "Graus e subdivisões",
        paragraphs: [
          "Elliott classificou nove graus de tendência, do Grande Superciclo, de cerca de duzentos anos, ao Subminuete, de poucas horas. O ciclo básico de oito ondas é o mesmo em qualquer grau: cada onda se divide em ondas do grau menor e faz parte de uma onda do grau maior.",
          "O que decide se uma onda se divide em cinco ou em três é a direção da onda maior da qual ela faz parte. Ondas a favor da onda maior se dividem em cinco; ondas contra ela, em três. Por isso, as ondas 1 e 2 juntas se dividem em 8 ondas menores, depois em 34, depois em 144: todos números da sequência de Fibonacci.",
        ],
        diagram: {
          diagram: ELLIOTT_SUBDIVISION,
          caption: "A onda 1 se divide em cinco ondas menores, porque vai a favor da tendência; a onda 2, em três (a-b-c), porque vai contra.",
        },
      },
      {
        heading: "Cincos e três: o que esperar a seguir",
        paragraphs: [
          "Saber distinguir um movimento de cinco ondas de um de três é o que torna a teoria útil, porque diz o que vem depois. Uma regra fundamental: uma correção nunca acontece em cinco ondas (a exceção são os triângulos).",
        ],
        bullets: [
          "Num mercado de alta, uma queda em cinco ondas provavelmente é só a primeira perna (a) de uma correção a-b-c: ainda há mais queda pela frente.",
          "Num mercado de baixa, um repique em três ondas deve ser seguido da retomada da queda.",
          "Um repique em cinco ondas num mercado de baixa é um aviso de alta mais forte, e pode ser a primeira onda de um novo mercado de alta.",
          "Uma sequência completa de cinco ondas normalmente é só parte de uma onda maior: ainda há mais por vir, a não ser que seja a quinta onda de uma quinta onda.",
        ],
      },
      {
        heading: "As regras do impulso",
        paragraphs: [
          "Três regras clássicas, de Frost e Prechter, delimitam uma contagem de impulso válida. Se alguma for violada, a contagem está errada e precisa ser refeita.",
        ],
        bullets: [
          "A onda 2 nunca retrocede além do início da onda 1.",
          "A onda 3 nunca é a menor das três ondas impulsivas (1, 3 e 5).",
          "A onda 4 não entra no território da onda 1: seu fundo não pode ficar abaixo do topo da onda 1. Em ações essa regra é rígida; no mercado futuro, penetrações durante o dia são toleradas.",
        ],
      },
      {
        heading: "Extensões",
        paragraphs: [
          "Uma das três ondas impulsivas costuma se estender, ficando bem mais longa que as outras. Quando isso acontece, as outras duas tendem a ser parecidas em tamanho e duração: se a 3 se estende, a 1 e a 5 tendem à igualdade; se a 5 se estende, a 1 e a 3. Em ações, a onda que mais se estende é a 3; em commodities, a 5.",
        ],
      },
      {
        heading: "As correções",
        paragraphs: [
          "As ondas corretivas são menos nítidas e mais difíceis de prever que as impulsivas. Murphy as divide em três tipos.",
          "Zigue-zague (5-3-5): a onda A cai em cinco, a B repica em três sem voltar ao início de A, e a C cai em cinco, indo bem além do fim de A. Existe também o duplo zigue-zague: dois zigue-zagues ligados por um a-b-c.",
        ],
        diagram: { diagram: ELLIOTT_ZIGZAG, caption: "Zigue-zague (5-3-5) numa correção de mercado de alta." },
      },
      {
        heading: "",
        paragraphs: [
          "Plana (3-3-5): a onda A tem só três ondas, a B volta até o topo de A e a C termina perto do fundo de A. É mais uma consolidação que uma correção, e num mercado de alta é sinal de força. Há variações irregulares: na primeira, B supera o topo de A e C vai além do fundo de A; na segunda, B alcança o topo de A, mas C não chega ao fundo de A, um sinal de força ainda maior.",
        ],
        diagram: { diagram: ELLIOTT_FLAT, caption: "Correção plana (3-3-5): B volta ao topo de A e C termina perto do fundo de A." },
      },
      {
        heading: "",
        paragraphs: [
          "Triângulos: aparecem normalmente na onda 4 (às vezes na onda B) e antecedem a última onda na direção da tendência principal. Por isso são de alta e de baixa ao mesmo tempo: indicam que a alta vai continuar, mas também que, depois de mais uma onda, o topo provavelmente estará próximo. O triângulo de Elliott tem cinco ondas (a, b, c, d, e), cada uma com três ondas menores, e pode ser ascendente, descendente, simétrico ou expandido.",
          "A quinta onda depois do triângulo costuma percorrer a largura do triângulo, a mesma medida do alvo clássico. Segundo Prechter, o ápice do triângulo costuma marcar o momento em que a quinta onda termina. A onda e às vezes rompe a linha do triângulo num sinal falso antes do impulso final.",
        ],
        diagram: { diagram: ELLIOTT_TRIANGLE, caption: "Triângulo na onda 4, seguido do impulso final (onda 5)." },
      },
      {
        heading: "A regra da alternação",
        paragraphs: [
          "O mercado raramente faz a mesma coisa duas vezes seguidas. Aplicada às correções: se a onda 2 foi simples, como um a-b-c, a onda 4 provavelmente será complexa, como um triângulo, e vice-versa. A regra não diz exatamente o que vai acontecer, mas diz o que provavelmente não vai.",
        ],
      },
      {
        heading: "Canais",
        paragraphs: [
          "Elliott usava canais para projetar alvos e confirmar contagens. Depois das ondas 1 e 2, trace uma linha pelos fundos de 1 e 2 e uma paralela pelo topo de 1. Se a onda 3 acelerar e romper o canal, redesenhe: a linha passa pelo topo de 1 e pelo fundo de 2.",
          "O canal final é traçado pelos fundos das ondas 2 e 4, com a paralela pelo topo da onda 3. A onda 5 costuma terminar perto da linha superior. Em tendências longas, Murphy recomenda usar escala logarítmica junto com a aritmética.",
        ],
        diagram: { diagram: ELLIOTT_CHANNEL, caption: "Canal final: base nos fundos das ondas 2 e 4 e paralela pelo topo da 3. A onda 5 termina perto da linha superior." },
      },
      {
        heading: "A onda 4 como suporte",
        paragraphs: [
          "Terminadas as cinco ondas de alta, o mercado de baixa que se segue costuma não cair abaixo do fundo da onda 4 anterior, de um grau menor. Há exceções, mas essa referência é útil para estimar até onde uma queda pode ir.",
        ],
      },
      {
        heading: "Fibonacci: a base matemática",
        paragraphs: [
          "Elliott apontou a sequência de Fibonacci (1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144…) como base da teoria. Cada número é a soma dos dois anteriores. A razão entre um número e o seguinte se aproxima de 0,618; entre um número e o anterior, de 1,618; e entre números alternados, de 0,382 e 2,618. As primeiras razões, 1/1, 1/2 e 2/3, dão as retrações clássicas de 100%, 50% e 66%.",
          "Essas razões são usadas para estimar alvos e retrações.",
        ],
        bullets: [
          "Alvo mínimo da onda 3: o tamanho da onda 1 × 1,618, somado ao fundo da onda 2.",
          "Alvo da onda 5: o tamanho da onda 1 × 3,236, somado ao topo ou ao fundo da onda 1 (alvos máximo e mínimo).",
          "Se as ondas 1 e 3 forem parecidas e a 5 se estender: a distância do fundo da 1 ao topo da 3, × 1,618, somada ao fundo da 4.",
          "Zigue-zague: a onda c costuma ter o mesmo tamanho da a; ou mede 0,618 × a, a partir do fim de a.",
          "Correção plana em que b chega ao topo de a: a onda c costuma medir 1,618 × a.",
          "Retrações mais comuns: 38%, 50% e 62%. Numa tendência forte, a retração mínima costuma ficar perto de 38%; numa fraca, a máxima perto de 62%.",
          "Tempo: topos e fundos podem cair em dias, semanas ou meses de Fibonacci (13, 21, 34, 55, 89) contados de um ponto de virada importante. É o aspecto menos confiável, porque há relações demais para escolher depois do fato.",
        ],
      },
      {
        heading: "Elliott e Dow",
        paragraphs: [
          "As três fases de alta de Dow correspondem às três ondas impulsivas de Elliott (1, 3 e 5), com as ondas 2 e 4 entre elas. Os dois também se inspiraram no mar: Dow falava em maré, ondas e marolas; Elliott chamou sua teoria de princípio das ondas.",
        ],
      },
      {
        heading: "Na prática",
        paragraphs: [
          "Há momentos em que a contagem de Elliott é clara e outros em que não é. Forçar o mercado num formato de Elliott, ignorando as outras ferramentas, é um mau uso da teoria. Use-a como uma parte da resposta, junto com tendências, padrões, volume e indicadores.",
          "A teoria foi criada para os índices de ações e funciona melhor onde há muita participação, porque se apoia na psicologia de massa. Em ações individuais e em mercados pouco negociados, ela funciona pior.",
          "No RiskTrade, use a ferramenta Fibonacci para medir as retrações das ondas 2 e 4, a ferramenta Canal para traçar o canal das ondas 2 e 4, e a calculadora de risco para posicionar o stop abaixo do início da onda 1 numa entrada na onda 2 (a regra que invalida a contagem).",
        ],
      },
    ],
    takeaways: [
      "Um ciclo tem 8 ondas: 5 a favor (1–5) e 3 contra (a-b-c).",
      "Ondas a favor da onda maior se dividem em 5; ondas contra, em 3. Correções nunca têm 5 ondas, exceto triângulos.",
      "Regras do impulso: a onda 2 não passa do início da 1, a 3 não é a menor e a 4 não entra no território da 1.",
      "Correções: zigue-zague (5-3-5), plana (3-3-5) e triângulo (normalmente na onda 4). Pela alternação, se a 2 foi simples, a 4 tende a ser complexa.",
      "Fibonacci dá alvos e retrações (38%, 50% e 62%). A ordem de importância é padrão, depois razão, depois tempo.",
      "Use Elliott junto com as outras ferramentas e não force contagens.",
    ],
  },
];
