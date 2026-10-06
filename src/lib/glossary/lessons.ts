import { MA_DIAGRAMS } from "./ma-diagrams";
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
          "Regra das 4 semanas, de Richard Donchian: compre quando o preço passar a máxima das quatro semanas anteriores e venda quando perder a mínima delas. Em testes de sistemas de futuros, ficou entre os melhores, ao lado do cruzamento de médias. Para sair antes, use uma regra de 1 ou 2 semanas; para filtrar a lateralidade, aumente para 8.",
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
