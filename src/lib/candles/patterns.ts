import type { CandleKind, CandlePattern, CandleVariant, Ohlc } from "./types";

/**
 * Biblioteca de padrões de candles. A lista segue a tabela de padrões do capítulo 12 de
 * Murphy, "Technical Analysis of the Financial Markets" (capítulo escrito por Greg Morris).
 * O capítulo detalha só alguns padrões; os demais foram descritos com base na literatura
 * clássica de candlesticks (Steve Nison; Greg Morris). Texto autoral.
 *
 * Nas velas, "branca" = alta (fechamento acima da abertura) e "preta" = baixa.
 */

const CH12 = "Murphy, Technical Analysis of the Financial Markets, cap. 12 (Morris)";
const CH12_DETAIL = `${CH12}: padrão detalhado no capítulo`;
const CLASSIC = `${CH12}: padrão da lista do capítulo; descrição com base em Nison e Morris`;

const k = (o: number, h: number, l: number, c: number): Ohlc => ({ o, h, l, c });

/** Versão espelhada (de baixa) de uma sequência de velas de alta. */
const mirror = (candles: Ohlc[]): Ohlc[] => candles.map(({ o, h, l, c }) => ({ o: 100 - o, h: 100 - l, l: 100 - h, c: 100 - c }));

function contextFor(kind: CandleKind, bias: CandleVariant["bias"]): CandleVariant["context"] {
  if (kind === "basic" || bias === "neutral") return "none";
  if (kind === "reversal") return bias === "bullish" ? "down" : "up";
  return bias === "bullish" ? "up" : "down";
}

type PatternInput = Omit<CandlePattern, "variants" | "candleCount"> & {
  variants: Omit<CandleVariant, "context">[];
};

function pattern(input: PatternInput): CandlePattern {
  return {
    ...input,
    candleCount: input.variants[0].candles.length,
    variants: input.variants.map((v) => ({ ...v, context: contextFor(input.kind, v.bias) })),
  };
}

// ─── Velas usadas em mais de um padrão ─────────────────────────────────────────

const LONG_BLACK = k(70, 72, 38, 40);
const LONG_WHITE = k(30, 62, 28, 60);

const ENGULFING = [k(50, 52, 40, 42), k(38, 58, 36, 56)];
const HARAMI = [LONG_BLACK, k(44, 54, 42, 52)];
const HARAMI_CROSS = [LONG_BLACK, k(48, 54, 42, 48)];
const MORNING_STAR = [LONG_BLACK, k(32, 35, 28, 34), k(40, 66, 38, 64)];
const MORNING_DOJI_STAR = [LONG_BLACK, k(32, 36, 28, 32), k(40, 66, 38, 64)];
const ABANDONED_BABY = [LONG_BLACK, k(30, 33, 27, 30), k(38, 64, 36, 62)];
const THREE_SOLDIERS = [k(30, 48, 28, 46), k(40, 62, 38, 60), k(54, 76, 52, 74)];

export const CANDLE_PATTERNS: CandlePattern[] = [
  // ─── Velas básicas ───────────────────────────────────────────────────────────
  pattern({
    slug: "dia-longo",
    name: "Dia longo",
    englishName: "Long Day",
    aliases: ["vela longa", "corpo longo", "long day"],
    kind: "basic",
    summary: "Corpo grande: grande diferença entre abertura e fechamento. Mostra domínio claro de um dos lados.",
    recognition: [
      "O corpo é bem maior que o das velas recentes; o tamanho das sombras não entra na definição.",
      "Branca (de alta) quando fecha bem acima da abertura; preta (de baixa) quando fecha bem abaixo.",
    ],
    psychology:
      "Um lado controlou o pregão do começo ao fim. Na alta, os compradores levaram o preço para cima sem resistência relevante; na baixa, os vendedores fizeram o mesmo.",
    confirmation: "Sozinho, só confirma a força da tendência. Ganha significado como parte de padrões (engolfo, estrela da manhã…).",
    source: CH12_DETAIL,
    variants: [
      { bias: "neutral", name: "Dia longo de alta", candles: [k(30, 72, 26, 70)] },
      { bias: "neutral", name: "Dia longo de baixa", candles: [k(70, 74, 28, 30)] },
    ],
  }),
  pattern({
    slug: "dia-curto",
    name: "Dia curto",
    englishName: "Short Day",
    aliases: ["vela curta", "corpo pequeno", "short day"],
    kind: "basic",
    summary: "Corpo pequeno: abertura e fechamento próximos. Mostra pouca convicção.",
    recognition: ["O corpo é pequeno em relação às velas recentes.", "A cor do corpo importa pouco."],
    psychology: "Nenhum lado conseguiu impor direção. Depois de uma tendência longa, pode indicar cansaço.",
    confirmation: "É peça de vários padrões (harami, estrelas). Sozinho, pede atenção à próxima vela.",
    source: CH12_DETAIL,
    variants: [
      { bias: "neutral", name: "Dia curto de alta", candles: [k(46, 56, 42, 52)] },
      { bias: "neutral", name: "Dia curto de baixa", candles: [k(52, 58, 44, 46)] },
    ],
  }),
  pattern({
    slug: "piao",
    name: "Pião",
    englishName: "Spinning Top",
    aliases: ["peão", "spinning top", "indecisão"],
    kind: "basic",
    summary: "Corpo pequeno com sombras superior e inferior maiores que o corpo. É indecisão.",
    recognition: ["Corpo pequeno.", "Sombras superior e inferior mais longas que o corpo.", "A cor do corpo é pouco relevante."],
    psychology:
      "Compradores e vendedores levaram o preço longe nas duas direções, mas ninguém sustentou o movimento: o pregão terminou perto de onde começou.",
    confirmation: "Indecisão depois de uma tendência forte é um alerta. Espere a próxima vela para saber quem venceu.",
    source: CH12_DETAIL,
    variants: [
      { bias: "neutral", name: "Pião de alta", candles: [k(48, 68, 30, 53)] },
      { bias: "neutral", name: "Pião de baixa", candles: [k(53, 70, 32, 48)] },
    ],
  }),
  pattern({
    slug: "marubozu",
    name: "Marubozu",
    englishName: "Marubozu",
    aliases: ["sem sombras", "vela careca", "marubozu"],
    kind: "basic",
    summary: "Vela longa sem sombras (ou quase): abre na mínima e fecha na máxima, ou o contrário.",
    recognition: [
      "Branca: abre na mínima e fecha na máxima.",
      "Preta: abre na máxima e fecha na mínima.",
      "Corpo longo, sem sombras relevantes.",
    ],
    psychology: "Domínio total de um lado: o preço nunca voltou além da abertura e terminou no extremo do pregão.",
    confirmation: "Indica força no sentido da vela. É a base do padrão kicking e do belt hold.",
    source: CLASSIC,
    variants: [
      { bias: "neutral", name: "Marubozu branco", candles: [k(30, 70, 30, 70)] },
      { bias: "neutral", name: "Marubozu preto", candles: [k(70, 70, 30, 30)] },
    ],
  }),
  pattern({
    slug: "doji",
    name: "Doji",
    englishName: "Doji",
    aliases: ["doji", "cruz", "indecisão"],
    kind: "basic",
    summary: "Abertura e fechamento iguais (ou quase): o corpo vira uma linha. É o retrato da indecisão.",
    recognition: [
      "Abertura e fechamento iguais ou muito próximos.",
      "As sombras podem ter qualquer tamanho; elas definem o tipo de doji.",
    ],
    psychology:
      "Depois de todo o pregão, compradores e vendedores terminaram empatados. Depois de uma tendência, o empate é sinal de que o lado dominante perdeu força.",
    confirmation:
      "Num gráfico com grande variação de preço, velas que parecem doji na tela podem não ser: confira os números. A próxima vela confirma a direção.",
    source: CH12_DETAIL,
    variants: [{ bias: "neutral", name: "Doji", candles: [k(50, 62, 38, 50)] }],
  }),
  pattern({
    slug: "doji-pernas-longas",
    name: "Doji pernas longas",
    englishName: "Long-legged Doji",
    aliases: ["long-legged doji", "doji pernalta"],
    kind: "basic",
    summary: "Doji com sombras longas nos dois lados: muita indecisão.",
    recognition: ["Abertura e fechamento praticamente iguais.", "Sombras superior e inferior longas."],
    psychology: "O mercado foi forte para cima e para baixo durante o pregão, mas terminou exatamente onde começou: a disputa está aberta.",
    confirmation: "Em topos e fundos, é um alerta de virada; a vela seguinte define o lado.",
    source: CH12_DETAIL,
    variants: [{ bias: "neutral", name: "Doji pernas longas", candles: [k(50, 80, 20, 50)] }],
  }),
  pattern({
    slug: "doji-lapide",
    name: "Doji lápide",
    englishName: "Gravestone Doji",
    aliases: ["gravestone doji", "lápide", "lapide"],
    kind: "basic",
    summary: "Doji só com sombra superior longa. Quanto maior a sombra, mais baixista.",
    recognition: ["Abertura, fechamento e mínima no mesmo nível (ou quase).", "Sombra superior longa, sem sombra inferior."],
    psychology: "Os compradores levaram o preço bem para cima, mas os vendedores devolveram tudo até a abertura: a alta foi rejeitada.",
    confirmation: "Mais relevante depois de uma alta. Confirme com uma vela de baixa no pregão seguinte.",
    source: CH12_DETAIL,
    variants: [{ bias: "bearish", name: "Doji lápide", candles: [k(30, 74, 30, 30)] }],
  }),
  pattern({
    slug: "doji-libelula",
    name: "Doji libélula",
    englishName: "Dragonfly Doji",
    aliases: ["dragonfly doji", "libélula", "libelula"],
    kind: "basic",
    summary: "Doji só com sombra inferior longa. Costuma ser altista.",
    recognition: ["Abertura, fechamento e máxima no mesmo nível (ou quase).", "Sombra inferior longa, sem sombra superior."],
    psychology: "Os vendedores derrubaram o preço, mas os compradores recuperaram tudo até a abertura: a queda foi rejeitada.",
    confirmation: "Mais relevante depois de uma queda. Confirme com uma vela de alta no pregão seguinte.",
    source: CH12_DETAIL,
    variants: [{ bias: "bullish", name: "Doji libélula", candles: [k(70, 70, 26, 70)] }],
  }),

  // ─── Reversões de 1 vela ─────────────────────────────────────────────────────
  pattern({
    slug: "corpo-longo",
    name: "Corpo longo branco / preto",
    englishName: "Long White Body / Long Black Body",
    aliases: ["long white body", "long black body", "vela longa"],
    kind: "reversal",
    summary: "Um dia longo contra a tendência anterior: o primeiro sinal de que o outro lado apareceu.",
    recognition: ["Depois de uma queda, uma vela branca longa (ou, depois de uma alta, uma preta longa).", "O corpo é bem maior que o das velas anteriores."],
    psychology: "Depois de dias seguidos num sentido, um pregão inteiro dominado pelo lado oposto mostra mudança de pressão.",
    confirmation: "É dos sinais de reversão mais fracos da lista; use como alerta e espere confirmação.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Corpo longo branco", candles: [k(40, 76, 38, 74)] },
      { bias: "bearish", name: "Corpo longo preto", candles: mirror([k(40, 76, 38, 74)]) },
    ],
  }),
  pattern({
    slug: "martelo-enforcado",
    name: "Martelo / Enforcado",
    englishName: "Hammer / Hanging Man",
    aliases: ["hammer", "hanging man", "martelo", "enforcado"],
    kind: "reversal",
    summary: "Corpo pequeno no alto da vela e sombra inferior longa. Martelo numa queda (alta); enforcado numa alta (baixa).",
    recognition: [
      "Corpo pequeno perto da máxima; a cor importa pouco.",
      "Sombra inferior de pelo menos duas vezes o tamanho do corpo.",
      "Pouca ou nenhuma sombra superior.",
      "É a mesma vela: o nome depende da tendência anterior.",
    ],
    psychology:
      "Martelo: numa queda, os vendedores derrubam o preço, mas os compradores reagem e fecham perto da máxima, rejeitando a queda. Enforcado: numa alta, a mesma sombra mostra que houve uma venda forte durante o pregão, um primeiro sinal de que a oferta apareceu.",
    confirmation:
      "O enforcado precisa de confirmação: abertura ou fechamento abaixo do corpo no pregão seguinte. O martelo é mais confiável quando a vela seguinte fecha acima dele.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Martelo", candles: [k(46, 50, 20, 49)] },
      { bias: "bearish", name: "Enforcado", candles: [k(49, 50, 22, 46)] },
    ],
  }),
  pattern({
    slug: "martelo-invertido-estrela-cadente",
    name: "Martelo invertido / Estrela cadente",
    englishName: "Inverted Hammer / Shooting Star",
    aliases: ["inverted hammer", "shooting star", "estrela cadente", "martelo invertido"],
    kind: "reversal",
    summary: "Corpo pequeno na parte de baixo da vela e sombra superior longa. Martelo invertido numa queda; estrela cadente numa alta.",
    recognition: [
      "Corpo pequeno perto da mínima.",
      "Sombra superior de pelo menos duas vezes o tamanho do corpo.",
      "Pouca ou nenhuma sombra inferior.",
      "A estrela cadente costuma abrir com gap acima do corpo anterior.",
    ],
    psychology:
      "Estrela cadente: numa alta, os compradores tentam subir mais, mas os vendedores devolvem quase tudo; a alta foi rejeitada. Martelo invertido: numa queda, os compradores ensaiam uma alta forte; mesmo devolvida, mostra que a demanda começou a aparecer.",
    confirmation: "O martelo invertido depende muito de confirmação (abertura acima do corpo no dia seguinte). A estrela cadente ganha força com uma vela de baixa em seguida.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Martelo invertido", candles: [k(22, 52, 20, 25)] },
      { bias: "bearish", name: "Estrela cadente", candles: [k(52, 80, 48, 49)] },
    ],
  }),
  pattern({
    slug: "belt-hold",
    name: "Belt hold (cinturão)",
    englishName: "Belt Hold",
    aliases: ["belt hold", "yorikiri", "cinturão", "cinturao"],
    kind: "reversal",
    summary: "Vela longa que abre no extremo do pregão, contra a tendência anterior.",
    recognition: [
      "De alta: numa queda, vela branca longa que abre na mínima (sem sombra inferior), muitas vezes com gap de baixa.",
      "De baixa: numa alta, vela preta longa que abre na máxima (sem sombra superior).",
    ],
    psychology: "O mercado abre seguindo a tendência, mas desde o primeiro minuto o lado contrário toma conta e não devolve mais o controle.",
    confirmation: "Quanto mais longa a vela, mais significativa. Fechamento além do corpo da vela, no pregão seguinte, a invalida.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Belt hold de alta", candles: [k(20, 56, 20, 54)] },
      { bias: "bearish", name: "Belt hold de baixa", candles: mirror([k(20, 56, 20, 54)]) },
    ],
  }),

  // ─── Reversões de 2 velas ────────────────────────────────────────────────────
  pattern({
    slug: "engolfo",
    name: "Engolfo",
    englishName: "Engulfing Pattern",
    aliases: ["engulfing", "engolfo de alta", "engolfo de baixa", "envolvente"],
    kind: "reversal",
    summary: "O corpo da segunda vela engole totalmente o corpo da primeira, de cor oposta.",
    recognition: [
      "De alta: numa queda, uma vela preta pequena seguida de uma branca cujo corpo envolve todo o corpo da preta.",
      "De baixa: numa alta, uma vela branca pequena seguida de uma preta que envolve todo o corpo da branca.",
      "As sombras não precisam ser engolidas, só o corpo.",
    ],
    psychology:
      "A segunda vela abre ainda no sentido da tendência, mas o lado contrário domina o pregão inteiro e fecha além de todo o pregão anterior. Quem estava na tendência fica no prejuízo.",
    confirmation: "Mais forte quando a primeira vela é pequena, a segunda é grande e o volume aumenta na segunda.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Engolfo de alta", candles: ENGULFING },
      { bias: "bearish", name: "Engolfo de baixa", candles: mirror(ENGULFING) },
    ],
  }),
  pattern({
    slug: "harami",
    name: "Harami",
    englishName: "Harami",
    aliases: ["harami", "grávida", "mulher grávida"],
    kind: "reversal",
    summary: "Uma vela longa seguida de uma pequena cujo corpo fica dentro do corpo da primeira. É o inverso do engolfo.",
    recognition: [
      "Primeira vela longa, no sentido da tendência.",
      "Segunda vela pequena, com o corpo inteiro dentro do corpo da primeira; normalmente de cor oposta.",
    ],
    psychology: "Depois de um pregão forte, o mercado encolhe: a tendência perde ímpeto e a dúvida aparece.",
    confirmation: "Sinal mais fraco que o engolfo; peça confirmação. O \"três de dentro\" é o harami já confirmado.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Harami de alta", candles: HARAMI },
      { bias: "bearish", name: "Harami de baixa", candles: mirror(HARAMI) },
    ],
  }),
  pattern({
    slug: "harami-cross",
    name: "Harami cross",
    englishName: "Harami Cross",
    aliases: ["harami cross", "harami cruz"],
    kind: "reversal",
    summary: "Harami em que a segunda vela é um doji. Mais forte que o harami comum.",
    recognition: ["Primeira vela longa, no sentido da tendência.", "Segunda vela é um doji dentro do corpo da primeira."],
    psychology: "Depois de um pregão de domínio, empate total: a força da tendência sumiu de um dia para o outro.",
    confirmation: "Ainda assim, peça confirmação na vela seguinte.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Harami cross de alta", candles: HARAMI_CROSS },
      { bias: "bearish", name: "Harami cross de baixa", candles: mirror(HARAMI_CROSS) },
    ],
  }),
  pattern({
    slug: "linha-de-perfuracao-nuvem-negra",
    name: "Linha de perfuração / Nuvem negra",
    englishName: "Piercing Line / Dark Cloud Cover",
    aliases: ["piercing line", "dark cloud cover", "piercing", "nuvem negra", "perfuração", "perfuracao"],
    kind: "reversal",
    summary: "A segunda vela abre além da primeira e fecha além do meio do corpo dela, no sentido contrário.",
    recognition: [
      "Linha de perfuração (alta): numa queda, uma vela preta longa; a seguinte abre abaixo da mínima anterior e fecha acima do meio do corpo da preta.",
      "Nuvem negra (baixa): numa alta, uma vela branca longa; a seguinte abre acima da máxima anterior e fecha abaixo do meio do corpo da branca.",
      "Se a segunda vela fechar além do corpo inteiro, vira um engolfo.",
    ],
    psychology:
      "Nuvem negra: a abertura acima da máxima anterior anima os comprados, mas o preço cai o dia todo e fecha abaixo do meio do pregão anterior, um golpe forte na confiança, que leva muitos a sair. A linha de perfuração é o espelho num fundo.",
    confirmation: "Quanto mais fundo a segunda vela penetrar no corpo da primeira, mais forte o sinal.",
    source: CH12_DETAIL,
    variants: [
      { bias: "bullish", name: "Linha de perfuração", candles: [LONG_BLACK, k(34, 62, 32, 60)] },
      { bias: "bearish", name: "Nuvem negra", candles: [LONG_WHITE, k(66, 68, 38, 40)] },
    ],
  }),
  pattern({
    slug: "estrela-doji",
    name: "Estrela doji",
    englishName: "Doji Star",
    aliases: ["doji star", "estrela"],
    kind: "reversal",
    summary: "Uma vela longa seguida de um doji que abre com gap no sentido da tendência.",
    recognition: [
      "Primeira vela longa, no sentido da tendência.",
      "Segunda vela é um doji separado do corpo da primeira por um gap.",
    ],
    psychology: "A tendência ainda empurra o preço para um novo extremo, mas ali o mercado empata: o movimento parou.",
    confirmation: "Precisa da terceira vela: se ela vier no sentido contrário, forma a estrela doji da manhã ou da tarde.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Estrela doji de alta", candles: [LONG_BLACK, k(32, 36, 28, 32)] },
      { bias: "bearish", name: "Estrela doji de baixa", candles: mirror([LONG_BLACK, k(32, 36, 28, 32)]) },
    ],
  }),
  pattern({
    slug: "linhas-de-encontro",
    name: "Linhas de encontro",
    englishName: "Meeting Lines",
    aliases: ["meeting lines", "linhas de contra-ataque", "counterattack"],
    kind: "reversal",
    summary: "Duas velas longas de cores opostas que fecham no mesmo preço.",
    recognition: [
      "De alta: numa queda, vela preta longa; a seguinte abre bem abaixo e sobe até fechar no mesmo nível do fechamento anterior.",
      "De baixa: o espelho, numa alta.",
    ],
    psychology: "A segunda vela abre com um gap a favor da tendência, mas o lado contrário reage com força e anula toda a vantagem.",
    confirmation: "Menos forte que a linha de perfuração, porque a segunda vela não entra no corpo da primeira. Peça confirmação.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Linhas de encontro de alta", candles: [LONG_BLACK, k(18, 42, 16, 40)] },
      { bias: "bearish", name: "Linhas de encontro de baixa", candles: mirror([LONG_BLACK, k(18, 42, 16, 40)]) },
    ],
  }),
  pattern({
    slug: "kicking",
    name: "Kicking (chute)",
    englishName: "Kicking",
    aliases: ["kicking", "chute"],
    kind: "reversal",
    summary: "Um marubozu seguido de outro marubozu de cor oposta, separados por gap.",
    recognition: [
      "De alta: marubozu preto e, em seguida, marubozu branco que abre com gap acima do anterior.",
      "De baixa: marubozu branco e, em seguida, marubozu preto com gap abaixo.",
      "A direção vem da segunda vela; a tendência anterior importa menos que nos outros padrões.",
    ],
    psychology: "Uma virada brusca: o mercado muda de lado de um pregão para o outro, com domínio total nos dois.",
    confirmation: "É dos sinais mais fortes; o gap entre as velas deve se manter aberto.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Kicking de alta", candles: [k(60, 60, 30, 30), k(66, 96, 66, 96)] },
      { bias: "bearish", name: "Kicking de baixa", candles: mirror([k(60, 60, 30, 30), k(66, 96, 66, 96)]) },
    ],
  }),
  pattern({
    slug: "fundo-topo-igual",
    name: "Fundo igual / Topo igual",
    englishName: "Matching Low / Matching High",
    aliases: ["matching low", "matching high", "fechamento igual"],
    kind: "reversal",
    summary: "Duas velas da mesma cor, no sentido da tendência, que fecham exatamente no mesmo preço.",
    recognition: [
      "Fundo igual (alta): numa queda, duas velas pretas com o mesmo fechamento.",
      "Topo igual (baixa): numa alta, duas velas brancas com o mesmo fechamento.",
    ],
    psychology: "O mercado volta a fechar no mesmo nível: ali existe um suporte (ou resistência) que segurou duas vezes.",
    confirmation: "Funciona como um suporte ou resistência de curtíssimo prazo; confirme com a vela seguinte.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Fundo igual", candles: [LONG_BLACK, k(56, 58, 38, 40)] },
      { bias: "bearish", name: "Topo igual", candles: [LONG_WHITE, k(44, 62, 42, 60)] },
    ],
  }),
  pattern({
    slug: "pombo-correio",
    name: "Pombo-correio",
    englishName: "Homing Pigeon",
    aliases: ["homing pigeon", "pombo correio"],
    kind: "reversal",
    summary: "Numa queda, duas velas pretas em que a segunda fica dentro do corpo da primeira. Um harami de mesma cor.",
    recognition: ["Primeira vela preta longa.", "Segunda vela preta menor, com o corpo dentro do corpo da primeira."],
    psychology: "A queda continua, mas com amplitude bem menor: os vendedores estão perdendo força.",
    confirmation: "Sinal fraco; espere uma vela de alta em seguida.",
    source: CLASSIC,
    variants: [{ bias: "bullish", name: "Pombo-correio", candles: [LONG_BLACK, k(62, 64, 46, 48)] }],
  }),

  // ─── Reversões de 3 velas ────────────────────────────────────────────────────
  pattern({
    slug: "tres-soldados-tres-corvos",
    name: "Três soldados brancos / Três corvos negros",
    englishName: "Three White Soldiers / Three Black Crows",
    aliases: ["three white soldiers", "three black crows", "soldados", "corvos"],
    kind: "reversal",
    summary: "Três velas longas seguidas da mesma cor, cada uma abrindo dentro da anterior e fechando num novo extremo.",
    recognition: [
      "Três soldados (alta): numa queda, três velas brancas longas, cada uma abrindo dentro do corpo da anterior e fechando perto da máxima.",
      "Três corvos (baixa): numa alta, três velas pretas longas, cada uma abrindo dentro do corpo da anterior e fechando perto da mínima.",
    ],
    psychology: "Três pregões seguidos de domínio do mesmo lado, cada um avançando mais: a reversão é clara e consistente.",
    confirmation: "Se as velas encolherem ou ganharem sombras longas, a força está acabando (veja bloco de avanço e deliberação).",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Três soldados brancos", candles: THREE_SOLDIERS },
      { bias: "bearish", name: "Três corvos negros", candles: mirror(THREE_SOLDIERS) },
    ],
  }),
  pattern({
    slug: "estrela-da-manha-tarde",
    name: "Estrela da manhã / Estrela da tarde",
    englishName: "Morning Star / Evening Star",
    aliases: ["morning star", "evening star", "estrela da manhã", "estrela da tarde"],
    kind: "reversal",
    summary: "Vela longa, uma estrela (corpo pequeno com gap) e uma vela longa no sentido contrário. Dois dos padrões mais confiáveis.",
    recognition: [
      "Estrela da tarde (baixa): numa alta, vela branca longa; segunda vela pequena (a estrela) abre com gap acima do corpo anterior; terceira vela preta abre abaixo da estrela e fecha abaixo do meio do corpo da primeira.",
      "Estrela da manhã (alta): o espelho, num fundo.",
      "Na prática se aceitam variações: a terceira vela pode não ter gap ou fechar um pouco acima do meio da primeira.",
    ],
    psychology:
      "Estrela da tarde: a vela longa reforça a alta e a abertura com gap anima ainda mais, mas a estrela mostra que o avanço travou. A queda da terceira vela, até abaixo do meio da primeira, confirma que os vendedores assumiram.",
    confirmation: "Mais forte quando há gaps dos dois lados da estrela e a terceira vela penetra fundo na primeira.",
    source: CH12_DETAIL,
    variants: [
      { bias: "bullish", name: "Estrela da manhã", candles: MORNING_STAR },
      { bias: "bearish", name: "Estrela da tarde", candles: mirror(MORNING_STAR) },
    ],
  }),
  pattern({
    slug: "estrela-doji-manha-tarde",
    name: "Estrela doji da manhã / da tarde",
    englishName: "Morning Doji Star / Evening Doji Star",
    aliases: ["morning doji star", "evening doji star"],
    kind: "reversal",
    summary: "Estrela da manhã ou da tarde em que a estrela é um doji. Ainda mais significativa.",
    recognition: ["Mesmas regras da estrela da manhã ou da tarde.", "A vela do meio é um doji, com gap em relação à primeira."],
    psychology: "O empate do doji, logo depois de um pregão de domínio, marca com precisão o ponto em que a tendência parou.",
    confirmation: "A terceira vela confirma; sem ela, é só uma estrela doji.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Estrela doji da manhã", candles: MORNING_DOJI_STAR },
      { bias: "bearish", name: "Estrela doji da tarde", candles: mirror(MORNING_DOJI_STAR) },
    ],
  }),
  pattern({
    slug: "bebe-abandonado",
    name: "Bebê abandonado",
    englishName: "Abandoned Baby",
    aliases: ["abandoned baby", "bebe abandonado"],
    kind: "reversal",
    summary: "Estrela doji isolada por gaps nos dois lados, inclusive nas sombras. É uma ilha de reversão em velas.",
    recognition: [
      "Vela longa no sentido da tendência.",
      "Doji com gap: nem as sombras tocam as velas vizinhas.",
      "Terceira vela no sentido contrário, também com gap.",
    ],
    psychology: "Quem negociou no dia do doji ficou preso: o mercado abandonou aquele nível nas duas direções.",
    confirmation: "Raro e forte. Os gaps devem se manter abertos.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Bebê abandonado de alta", candles: ABANDONED_BABY },
      { bias: "bearish", name: "Bebê abandonado de baixa", candles: mirror(ABANDONED_BABY) },
    ],
  }),
  pattern({
    slug: "tri-star",
    name: "Tri-star (três estrelas)",
    englishName: "Tri-Star",
    aliases: ["tri-star", "tristar", "três dojis"],
    kind: "reversal",
    summary: "Três dojis seguidos, com o do meio separado por gap. Raro.",
    recognition: [
      "De alta: numa queda, três dojis; o do meio fica abaixo dos outros dois.",
      "De baixa: numa alta, três dojis; o do meio fica acima dos outros dois.",
    ],
    psychology: "Três pregões de empate depois de uma tendência mostram que o movimento se esgotou.",
    confirmation: "Muito raro; quando aparece, merece atenção, mas confirme com a vela seguinte.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Tri-star de alta", candles: [k(40, 44, 36, 40), k(30, 34, 26, 30), k(38, 42, 35, 38)] },
      { bias: "bearish", name: "Tri-star de baixa", candles: mirror([k(40, 44, 36, 40), k(30, 34, 26, 30), k(38, 42, 35, 38)]) },
    ],
  }),
  pattern({
    slug: "tres-de-dentro",
    name: "Três de dentro",
    englishName: "Three Inside Up / Three Inside Down",
    aliases: ["three inside up", "three inside down", "três de dentro"],
    kind: "reversal",
    summary: "Um harami confirmado: a terceira vela fecha além da abertura da primeira.",
    recognition: [
      "De alta: harami de alta (vela preta longa e branca pequena dentro dela) seguido de uma vela branca que fecha acima do corpo da primeira.",
      "De baixa: o espelho.",
    ],
    psychology: "O harami mostrou dúvida; a terceira vela mostra que o lado contrário venceu.",
    confirmation: "Já é o harami com confirmação, por isso é mais confiável que ele.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Três de dentro de alta", candles: [...HARAMI, k(52, 76, 50, 74)] },
      { bias: "bearish", name: "Três de dentro de baixa", candles: mirror([...HARAMI, k(52, 76, 50, 74)]) },
    ],
  }),
  pattern({
    slug: "tres-de-fora",
    name: "Três de fora",
    englishName: "Three Outside Up / Three Outside Down",
    aliases: ["three outside up", "three outside down", "três de fora"],
    kind: "reversal",
    summary: "Um engolfo confirmado: a terceira vela continua no sentido do engolfo e fecha num novo extremo.",
    recognition: [
      "De alta: engolfo de alta seguido de uma vela branca que fecha acima do engolfo.",
      "De baixa: o espelho.",
    ],
    psychology: "O engolfo virou o controle; a terceira vela mostra que o novo lado continua no comando.",
    confirmation: "É o engolfo já confirmado.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Três de fora de alta", candles: [...ENGULFING, k(56, 70, 54, 68)] },
      { bias: "bearish", name: "Três de fora de baixa", candles: mirror([...ENGULFING, k(56, 70, 54, 68)]) },
    ],
  }),
  pattern({
    slug: "fundo-unico-tres-rios",
    name: "Fundo único de três rios",
    englishName: "Unique Three River Bottom",
    aliases: ["unique three river bottom", "três rios"],
    kind: "reversal",
    summary: "Vela preta longa, uma preta menor com nova mínima e sombra inferior longa, e uma vela branca pequena abaixo dela.",
    recognition: [
      "Primeira vela preta longa.",
      "Segunda vela preta com corpo dentro do da primeira, mas com nova mínima (sombra inferior longa).",
      "Terceira vela branca pequena, abaixo do fechamento da segunda.",
    ],
    psychology: "A segunda vela tenta uma nova queda e é rejeitada; a terceira, pequena e branca, mostra que a venda secou.",
    confirmation: "Padrão raro; confirme com uma alta acima da segunda vela.",
    source: CLASSIC,
    variants: [{ bias: "bullish", name: "Fundo único de três rios", candles: [LONG_BLACK, k(58, 60, 26, 48), k(42, 46, 40, 45)] }],
  }),
  pattern({
    slug: "tres-estrelas-no-sul",
    name: "Três estrelas no sul",
    englishName: "Three Stars in the South",
    aliases: ["three stars in the south", "estrelas no sul"],
    kind: "reversal",
    summary: "Três velas pretas cada vez menores, com mínimas mais altas: a queda está perdendo força.",
    recognition: [
      "Primeira vela preta longa com sombra inferior longa.",
      "Segunda vela preta menor, com mínima acima da mínima da primeira.",
      "Terceira vela preta pequena, sem sombras, dentro da amplitude da segunda.",
    ],
    psychology: "A queda continua, mas cada pregão vai menos longe: os vendedores estão se esgotando.",
    confirmation: "Raro; espere uma vela de alta para confirmar.",
    source: CLASSIC,
    variants: [{ bias: "bullish", name: "Três estrelas no sul", candles: [k(70, 72, 30, 44), k(52, 54, 38, 42), k(44, 44, 40, 40)] }],
  }),
  pattern({
    slug: "sanduiche",
    name: "Sanduíche de vela",
    englishName: "Stick Sandwich",
    aliases: ["stick sandwich", "sanduiche"],
    kind: "reversal",
    summary: "Duas velas pretas com o mesmo fechamento, com uma branca entre elas.",
    recognition: [
      "Primeira vela preta numa queda.",
      "Segunda vela branca que fecha acima do fechamento da primeira.",
      "Terceira vela preta que fecha no mesmo nível da primeira.",
    ],
    psychology: "O mesmo preço de fechamento duas vezes mostra um suporte: os vendedores não conseguem fechar abaixo dele.",
    confirmation: "Funciona como um suporte; a quebra do fechamento comum invalida o padrão.",
    source: CLASSIC,
    variants: [{ bias: "bullish", name: "Sanduíche de vela", candles: [k(60, 62, 38, 40), k(42, 58, 40, 56), k(60, 62, 38, 40)] }],
  }),
  pattern({
    slug: "dois-corvos-gap-alta",
    name: "Dois corvos com gap de alta",
    englishName: "Upside Gap Two Crows",
    aliases: ["upside gap two crows", "dois corvos"],
    kind: "reversal",
    summary: "Numa alta, vela branca longa e duas pretas acima dela; a segunda preta engole a primeira, mas o gap continua aberto.",
    recognition: [
      "Primeira vela branca longa.",
      "Segunda vela preta pequena, com gap acima do corpo da branca.",
      "Terceira vela preta que abre acima da segunda e fecha abaixo dela, mas ainda acima do fechamento da branca.",
    ],
    psychology: "Os compradores tentam continuar duas vezes, e nas duas os vendedores empurram o preço para baixo. O gap ainda aberto é a última defesa da alta.",
    confirmation: "O fechamento do gap, no pregão seguinte, confirma a reversão.",
    source: CLASSIC,
    variants: [{ bias: "bearish", name: "Dois corvos com gap de alta", candles: [LONG_WHITE, k(70, 72, 64, 66), k(74, 76, 62, 63)] }],
  }),
  pattern({
    slug: "tres-corvos-identicos",
    name: "Três corvos idênticos",
    englishName: "Identical Three Crows",
    aliases: ["identical three crows", "corvos idênticos"],
    kind: "reversal",
    summary: "Três corvos negros em que cada vela abre exatamente no fechamento da anterior.",
    recognition: ["Numa alta, três velas pretas longas.", "Cada uma abre no fechamento da anterior e fecha num novo nível mais baixo."],
    psychology: "A venda não dá trégua nem na abertura: cada pregão começa onde o anterior terminou e cai mais.",
    confirmation: "Versão mais forte dos três corvos negros.",
    source: CLASSIC,
    variants: [{ bias: "bearish", name: "Três corvos idênticos", candles: [k(74, 76, 54, 56), k(56, 58, 38, 40), k(40, 42, 22, 24)] }],
  }),
  pattern({
    slug: "deliberacao",
    name: "Deliberação",
    englishName: "Deliberation",
    aliases: ["deliberation", "stalled pattern", "padrão parado"],
    kind: "reversal",
    summary: "Duas velas brancas longas seguidas de uma branca pequena: a alta está parando.",
    recognition: [
      "Numa alta, duas velas brancas longas.",
      "Terceira vela branca pequena, abrindo perto do fechamento anterior (às vezes com gap), como uma estrela.",
    ],
    psychology: "Depois de dois pregões fortes, o mercado delibera: ainda sobe, mas sem força. Os comprados devem proteger a posição.",
    confirmation: "É um alerta de desgaste, não um sinal de venda imediato.",
    source: CLASSIC,
    variants: [{ bias: "bearish", name: "Deliberação", candles: [k(30, 52, 28, 50), k(46, 72, 44, 70), k(71, 76, 69, 73)] }],
  }),
  pattern({
    slug: "bloco-de-avanco",
    name: "Bloco de avanço",
    englishName: "Advance Block",
    aliases: ["advance block", "bloco de avanço"],
    kind: "reversal",
    summary: "Três velas brancas com corpos cada vez menores e sombras superiores cada vez maiores.",
    recognition: [
      "Numa alta, três velas brancas, cada uma abrindo dentro do corpo da anterior.",
      "Os corpos diminuem e as sombras superiores crescem.",
    ],
    psychology: "Parece com três soldados, mas cada avanço é mais fraco e mais rejeitado: a alta está perdendo fôlego.",
    confirmation: "Sinal de alerta; proteja as posições compradas.",
    source: CLASSIC,
    variants: [{ bias: "bearish", name: "Bloco de avanço", candles: [k(30, 54, 28, 52), k(44, 66, 42, 58), k(54, 74, 52, 60)] }],
  }),
  pattern({
    slug: "dois-corvos",
    name: "Dois corvos",
    englishName: "Two Crows",
    aliases: ["two crows", "dois corvos"],
    kind: "reversal",
    summary: "Vela branca longa, uma preta com gap acima e outra preta que fecha dentro do corpo da branca.",
    recognition: [
      "Primeira vela branca longa.",
      "Segunda vela preta, com gap acima do corpo da branca.",
      "Terceira vela preta que abre dentro do corpo da segunda e fecha dentro do corpo da branca.",
    ],
    psychology: "Diferente dos dois corvos com gap, aqui o gap é fechado: os vendedores já devolveram parte do pregão de alta.",
    confirmation: "Mais forte que os dois corvos com gap de alta, porque o gap já foi fechado.",
    source: CLASSIC,
    variants: [{ bias: "bearish", name: "Dois corvos", candles: [LONG_WHITE, k(70, 72, 64, 66), k(68, 70, 48, 50)] }],
  }),

  // ─── Reversões de 4 e 5 velas ────────────────────────────────────────────────
  pattern({
    slug: "andorinha-escondida",
    name: "Andorinha escondida",
    englishName: "Concealing Baby Swallow",
    aliases: ["concealing baby swallow", "andorinha"],
    kind: "reversal",
    summary: "Quatro velas pretas numa queda; a última engole a terceira inteira, inclusive a sombra.",
    recognition: [
      "Duas primeiras velas: marubozus pretos.",
      "Terceira vela preta que abre com gap abaixo e tem sombra superior longa, entrando no corpo da segunda.",
      "Quarta vela preta que engole completamente a terceira, inclusive a sombra.",
    ],
    psychology: "A queda continua, mas as sombras mostram compradores testando o mercado. A última vela, mesmo preta, costuma ser a capitulação dos vendedores.",
    confirmation: "Raro; espere confirmação de alta.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Andorinha escondida", candles: [k(80, 80, 62, 62), k(62, 62, 46, 46), k(42, 54, 38, 40), k(56, 56, 32, 34)] },
    ],
  }),
  pattern({
    slug: "breakaway",
    name: "Breakaway (rompimento em 5 velas)",
    englishName: "Breakaway",
    aliases: ["breakaway", "rompimento", "fuga"],
    kind: "reversal",
    summary: "Cinco velas: uma tendência que acelera com gap e perde força, e uma vela longa contrária que fecha dentro do gap.",
    recognition: [
      "De alta: vela preta longa; segunda vela preta com gap abaixo; terceira e quarta seguindo para baixo, menores; quinta vela branca longa que fecha dentro do gap entre a primeira e a segunda.",
      "De baixa: o espelho.",
    ],
    psychology: "O gap parece confirmar a tendência, mas os pregões seguintes avançam pouco. A quinta vela devolve tudo até o gap: o movimento acelerado era exaustão.",
    confirmation: "Fechar o gap por completo, nos pregões seguintes, reforça a reversão.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Breakaway de alta", candles: [k(80, 82, 60, 62), k(56, 58, 46, 48), k(48, 50, 40, 42), k(42, 44, 34, 36), k(36, 60, 34, 58)] },
      {
        bias: "bearish",
        name: "Breakaway de baixa",
        candles: mirror([k(80, 82, 60, 62), k(56, 58, 46, 48), k(48, 50, 40, 42), k(42, 44, 34, 36), k(36, 60, 34, 58)]),
      },
    ],
  }),
  pattern({
    slug: "fundo-topo-em-escada",
    name: "Fundo em escada / Topo em escada",
    englishName: "Ladder Bottom / Ladder Top",
    aliases: ["ladder bottom", "ladder top", "escada"],
    kind: "reversal",
    summary: "Três velas longas descendo em escada, uma quarta com sombra contrária e uma quinta que abre com gap no sentido oposto.",
    recognition: [
      "Fundo em escada (alta): três velas pretas longas, cada uma abrindo e fechando mais baixo; quarta vela preta com sombra superior; quinta vela branca que abre acima do corpo da quarta.",
      "Topo em escada (baixa): o espelho.",
    ],
    psychology: "A queda em degraus perde força na quarta vela, cuja sombra mostra compradores. O gap da quinta vela confirma que a pressão mudou de lado.",
    confirmation: "A quinta vela é a confirmação; acompanhe se ela segura o gap.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Fundo em escada", candles: [k(80, 82, 66, 68), k(70, 72, 56, 58), k(60, 62, 46, 48), k(48, 58, 40, 42), k(52, 68, 50, 66)] },
      { bias: "bearish", name: "Topo em escada", candles: mirror([k(80, 82, 66, 68), k(70, 72, 56, 58), k(60, 62, 46, 48), k(48, 58, 40, 42), k(52, 68, 50, 66)]) },
    ],
  }),

  // ─── Continuação ─────────────────────────────────────────────────────────────
  pattern({
    slug: "linhas-de-separacao",
    name: "Linhas de separação",
    englishName: "Separating Lines",
    aliases: ["separating lines", "separação"],
    kind: "continuation",
    summary: "Uma vela contra a tendência seguida de outra que abre no mesmo preço e segue a tendência.",
    recognition: [
      "De alta: numa alta, uma vela preta; a seguinte é branca, abre na mesma abertura da preta e sobe (como um belt hold).",
      "De baixa: numa queda, uma vela branca; a seguinte é preta, abre na mesma abertura e cai.",
    ],
    psychology: "A vela contrária parecia uma correção, mas o pregão seguinte apaga a dúvida desde a abertura.",
    confirmation: "Sinal de continuação; a tendência segue enquanto a abertura comum não for rompida.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Linhas de separação de alta", candles: [k(56, 58, 44, 46), k(56, 78, 56, 76)] },
      { bias: "bearish", name: "Linhas de separação de baixa", candles: mirror([k(56, 58, 44, 46), k(56, 78, 56, 76)]) },
    ],
  }),
  pattern({
    slug: "tres-metodos",
    name: "Três métodos de alta / de baixa",
    englishName: "Rising Three Methods / Falling Three Methods",
    aliases: ["rising three methods", "falling three methods", "três métodos", "período de descanso"],
    kind: "continuation",
    summary: "Uma vela longa, três velas pequenas de correção dentro dela e uma nova vela longa que rompe para um novo extremo.",
    recognition: [
      "De alta: numa alta, vela branca longa; três velas pequenas que descem como grupo, sem sair do corpo da primeira, ao menos duas pretas; quinta vela branca longa que fecha numa nova máxima.",
      "De baixa: o espelho, numa queda.",
      "Na prática se aceitam variações: as velas pequenas podem ficar dentro da amplitude (com sombras) da primeira, não só do corpo, e podem ser mais de três.",
    ],
    psychology:
      "Os japoneses chamam as velas pequenas de \"período de descanso\": o mercado parece não ir a lugar nenhum, mas não devolve a vela longa. A quinta vela rompe a faixa e a tendência segue.",
    confirmation: "Ajuda a decidir se você deve manter a posição: enquanto o descanso fica dentro da primeira vela, a tendência está intacta.",
    source: CH12_DETAIL,
    variants: [
      { bias: "bullish", name: "Três métodos de alta", candles: [k(30, 72, 28, 70), k(64, 66, 56, 58), k(58, 62, 52, 54), k(54, 60, 48, 56), k(56, 82, 54, 80)] },
      { bias: "bearish", name: "Três métodos de baixa", candles: mirror([k(30, 72, 28, 70), k(64, 66, 56, 58), k(58, 62, 52, 54), k(54, 60, 48, 56), k(56, 82, 54, 80)]) },
    ],
  }),
  pattern({
    slug: "tasuki-gap",
    name: "Tasuki com gap",
    englishName: "Upside Tasuki Gap / Downside Tasuki Gap",
    aliases: ["upside tasuki gap", "downside tasuki gap", "tasuki"],
    kind: "continuation",
    summary: "Duas velas no sentido da tendência separadas por gap, e uma terceira contrária que não consegue fechar o gap.",
    recognition: [
      "De alta: numa alta, vela branca; segunda vela branca com gap acima; terceira vela preta que abre dentro do corpo da segunda e fecha dentro do gap, sem fechá-lo.",
      "De baixa: o espelho.",
    ],
    psychology: "A correção da terceira vela tenta fechar o gap e falha: o gap continua funcionando como suporte.",
    confirmation: "Se o gap for fechado, o padrão perde validade.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Tasuki com gap de alta", candles: [k(30, 52, 28, 50), k(56, 74, 54, 72), k(66, 68, 52, 54)] },
      { bias: "bearish", name: "Tasuki com gap de baixa", candles: mirror([k(30, 52, 28, 50), k(56, 74, 54, 72), k(66, 68, 52, 54)]) },
    ],
  }),
  pattern({
    slug: "linhas-brancas-lado-a-lado",
    name: "Linhas brancas lado a lado",
    englishName: "Side-by-Side White Lines",
    aliases: ["side by side white lines", "lado a lado"],
    kind: "continuation",
    summary: "Depois de um gap no sentido da tendência, duas velas brancas parecidas, abrindo no mesmo nível.",
    recognition: [
      "De alta: numa alta, vela branca; gap de alta; duas velas brancas de tamanho e abertura parecidos.",
      "De baixa: numa queda, vela preta; gap de baixa; duas velas brancas lado a lado, abaixo do gap. Mesmo brancas, a tendência de baixa segue.",
    ],
    psychology: "Na alta, o mercado se firma acima do gap. Na baixa, as velas brancas são só recompra de quem estava vendido: não conseguem fechar o gap.",
    confirmation: "O gap deve permanecer aberto.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Linhas brancas lado a lado de alta", candles: [k(30, 52, 28, 50), k(56, 68, 54, 66), k(56, 68, 54, 67)] },
      { bias: "bearish", name: "Linhas brancas lado a lado de baixa", candles: [k(70, 72, 48, 50), k(34, 44, 32, 42), k(34, 44, 32, 43)] },
    ],
  }),
  pattern({
    slug: "ataque-de-tres-linhas",
    name: "Ataque de três linhas",
    englishName: "Three Line Strike",
    aliases: ["three line strike", "ataque", "três linhas"],
    kind: "continuation",
    summary: "Três velas seguidas no sentido da tendência e uma quarta, longa e contrária, que apaga as três.",
    recognition: [
      "De alta: três soldados brancos; quarta vela preta longa que abre acima do terceiro fechamento e fecha abaixo da abertura da primeira.",
      "De baixa: o espelho, com três corvos e uma vela branca longa.",
    ],
    psychology:
      "A quarta vela é uma realização de lucros intensa, que zera os três pregões anteriores. Na leitura de Morris, é uma pausa: a tendência anterior costuma ser retomada.",
    confirmation: "É um padrão de interpretação controversa; observe o pregão seguinte antes de agir.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Ataque de três linhas de alta", candles: [...THREE_SOLDIERS, k(78, 80, 26, 28)] },
      { bias: "bearish", name: "Ataque de três linhas de baixa", candles: mirror([...THREE_SOLDIERS, k(78, 80, 26, 28)]) },
    ],
  }),
  pattern({
    slug: "tres-metodos-com-gap",
    name: "Três métodos com gap",
    englishName: "Upside Gap Three Methods / Downside Gap Three Methods",
    aliases: ["upside gap three methods", "downside gap three methods"],
    kind: "continuation",
    summary: "Duas velas no sentido da tendência separadas por gap e uma terceira contrária que fecha o gap.",
    recognition: [
      "De alta: numa alta, duas velas brancas longas com gap entre elas; terceira vela preta que abre dentro do corpo da segunda e fecha dentro do corpo da primeira, fechando o gap.",
      "De baixa: o espelho.",
    ],
    psychology: "Diferente do tasuki, a correção fecha o gap, mas fica dentro da primeira vela: é uma realização normal dentro da tendência.",
    confirmation: "A tendência segue enquanto o preço não perder o corpo da primeira vela.",
    source: CLASSIC,
    variants: [
      { bias: "bullish", name: "Três métodos com gap de alta", candles: [k(30, 52, 28, 50), k(56, 76, 54, 74), k(66, 68, 42, 44)] },
      { bias: "bearish", name: "Três métodos com gap de baixa", candles: mirror([k(30, 52, 28, 50), k(56, 76, 54, 74), k(66, 68, 42, 44)]) },
    ],
  }),
  pattern({
    slug: "on-neck",
    name: "On neck (no pescoço)",
    englishName: "On Neck Line",
    aliases: ["on neck", "on-neck", "pescoço"],
    kind: "continuation",
    summary: "Uma vela longa no sentido da tendência e uma contrária que abre além dela e fecha exatamente no extremo dela.",
    recognition: [
      "De baixa (forma clássica): numa queda, vela preta longa; vela branca que abre abaixo da mínima e fecha na mínima da preta.",
      "De alta: o espelho, numa alta. Morris inclui essa versão, menos comum.",
    ],
    psychology: "A reação contrária mal chega ao extremo do pregão anterior: é fraca demais para mudar a tendência.",
    confirmation: "Uma linha de perfuração fraca que não deu certo; a tendência deve continuar.",
    source: CLASSIC,
    variants: [
      { bias: "bearish", name: "On neck de baixa", candles: [LONG_BLACK, k(30, 38, 28, 38)] },
      { bias: "bullish", name: "On neck de alta", candles: mirror([LONG_BLACK, k(30, 38, 28, 38)]) },
    ],
  }),
  pattern({
    slug: "in-neck",
    name: "In neck (dentro do pescoço)",
    englishName: "In Neck Line",
    aliases: ["in neck", "in-neck", "pescoço"],
    kind: "continuation",
    summary: "Como o on neck, mas a vela contrária fecha um pouco dentro do corpo da vela longa.",
    recognition: [
      "De baixa (forma clássica): numa queda, vela preta longa; vela branca que abre abaixo da mínima e fecha um pouco acima do fechamento da preta.",
      "De alta: o espelho. Morris inclui essa versão, menos comum.",
    ],
    psychology: "A reação contrária entra só um pouco no corpo anterior, longe do meio dele: não é uma linha de perfuração.",
    confirmation: "A tendência deve continuar; se a vela seguinte confirmar a reação, reavalie.",
    source: CLASSIC,
    variants: [
      { bias: "bearish", name: "In neck de baixa", candles: [LONG_BLACK, k(30, 43, 28, 42)] },
      { bias: "bullish", name: "In neck de alta", candles: mirror([LONG_BLACK, k(30, 43, 28, 42)]) },
    ],
  }),
];
