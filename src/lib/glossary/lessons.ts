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
