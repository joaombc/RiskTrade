import { BANANAS } from "./banana-data";
import { DETAILS } from "./details-data";
import { EXAMPLES } from "./examples-data";
import type { Diagram, DiagramCandle, DiagramPoint, GlossaryTerm, Pt } from "./types";

// ─── Helpers de diagrama ───────────────────────────────────────────────────────

/** x do centro da i-ésima vela de n (as velas ocupam de x=10 a x=190). */
export const candleX = (i: number, n: number) => 10 + (180 / n) * (i + 0.5);

/**
 * Velas descritas em preço [abertura, máxima, mínima, fechamento], escaladas para ocupar a
 * área do diagrama (y de 18 a 86). Devolve também `py`, para posicionar linhas no mesmo preço.
 */
function candleSeries(rows: [number, number, number, number][]) {
  const min = Math.min(...rows.map((r) => r[2]));
  const max = Math.max(...rows.map((r) => r[1]));
  const py = (price: number) => 86 - ((price - min) / (max - min)) * 68;
  const candles: DiagramCandle[] = rows.map(([o, h, l, c]) => ({ o: py(o), h: py(h), l: py(l), c: py(c) }));
  return { candles, py, n: rows.length };
}

/**
 * Barras de volume a partir de [altura 0–1, candle de alta?]. As 12 barras ocupam a largura
 * toda (x de 17,5 a 182,5, de 15 em 15), alinhadas ao caminho de preço do diagrama.
 */
const bars = (rows: [number, boolean][]) => rows.map(([h, up]) => ({ h, up }));

/** Espelha verticalmente a área de preço: transforma um padrão de topo no de fundo. */
function mirror(d: Diagram): Diagram {
  const flip = ([x, y]: Pt): Pt => [x, 102 - y];
  const swap = (p: DiagramPoint["placement"]) => (p === "above" ? "below" : p === "below" ? "above" : p);
  return {
    ...d,
    path: d.path?.map(flip),
    lines: d.lines?.map((l) => ({
      ...l,
      from: flip(l.from),
      to: flip(l.to),
      tone: l.tone === "support" ? "resistance" : l.tone === "resistance" ? "support" : l.tone,
    })),
    points: d.points?.map((p) => ({ ...p, at: flip(p.at), placement: swap(p.placement ?? "above") })),
  };
}

// ─── Diagramas ─────────────────────────────────────────────────────────────────

const HEAD_SHOULDERS: Diagram = {
  path: [[10, 75], [30, 28], [45, 50], [70, 12], [95, 51], [115, 29], [135, 52], [148, 62], [158, 54], [180, 80], [195, 88]],
  lines: [
    { from: [45, 50], to: [195, 53], tone: "support", label: "pescoço" },
    { from: [70, 12], to: [70, 50.5], tone: "muted", dashed: true, label: "altura" },
    { from: [143, 52.5], to: [143, 88], tone: "target", dashed: true },
    { from: [143, 88], to: [195, 88], tone: "target", dashed: true, label: "Alvo" },
  ],
  points: [
    { at: [30, 28], label: "OE", placement: "above" },
    { at: [70, 12], label: "C", placement: "above" },
    { at: [115, 29], label: "OD", placement: "above" },
    { at: [143, 52.5], label: "Rompimento", placement: "left" },
  ],
  // Ombro esquerdo forte, cabeça mais fraca, ombro direito bem mais fraco; volume no rompimento.
  volume: bars([[0.85, true], [0.5, false], [0.65, true], [0.6, true], [0.55, false], [0.45, false],
    [0.28, true], [0.45, false], [0.95, false], [0.3, true], [0.8, false], [0.7, false]]),
};

const DOUBLE_TOP: Diagram = {
  path: [[10, 85], [40, 20], [65, 55], [90, 21], [115, 57], [125, 70], [140, 62], [165, 82], [190, 90]],
  lines: [
    { from: [40, 55], to: [195, 55], tone: "support", label: "Fundo intermediário" },
    { from: [40, 20], to: [90, 21], tone: "resistance", dashed: true },
    { from: [65, 21], to: [65, 55], tone: "muted", dashed: true, label: "altura" },
    { from: [118, 55], to: [118, 90], tone: "target", dashed: true },
    { from: [118, 90], to: [195, 90], tone: "target", dashed: true, label: "Alvo" },
  ],
  points: [
    { at: [40, 20], label: "Topo 1", placement: "above" },
    { at: [90, 21], label: "Topo 2", placement: "above" },
    { at: [118, 55], label: "Rompimento", placement: "left" },
  ],
  // Mais volume no primeiro topo que no segundo; aumento no rompimento.
  volume: bars([[0.7, true], [0.85, true], [0.5, false], [0.45, false], [0.5, true], [0.42, true],
    [0.6, false], [0.9, false], [0.35, true], [0.7, false], [0.6, false], [0.5, false]]),
};

const SYMMETRIC_TRIANGLE: Diagram = {
  path: [[10, 85], [25, 47], [45, 80], [65, 53], [85, 74], [100, 58.5], [110, 70], [125, 48], [145, 30], [170, 20]],
  lines: [
    { from: [10, 45], to: [150, 66], tone: "primary" },
    { from: [10, 85], to: [150, 66.8], tone: "primary" },
    { from: [10, 45], to: [10, 85], tone: "muted", dashed: true, label: "altura" },
    { from: [117, 61], to: [117, 21], tone: "target", dashed: true },
    { from: [117, 21], to: [195, 21], tone: "target", dashed: true, label: "Alvo" },
  ],
  points: [{ at: [117, 61], label: "Rompimento", placement: "right" }],
  // O volume seca conforme as oscilações se estreitam e volta forte no rompimento.
  volume: bars([[0.8, true], [0.7, false], [0.6, true], [0.5, false], [0.42, true], [0.35, false],
    [0.28, true], [0.95, true], [0.8, true], [0.65, true], [0.55, true], [0.5, true]]),
};

const ASCENDING_TRIANGLE: Diagram = {
  path: [[10, 82], [25, 45], [45, 72], [65, 45], [85, 62], [100, 45], [115, 53], [125, 38], [145, 22], [175, 10]],
  lines: [
    { from: [10, 45], to: [150, 45], tone: "resistance", label: "resistência plana", labelAt: "start" },
    { from: [10, 82], to: [150, 47], tone: "support" },
    { from: [10, 45], to: [10, 82], tone: "muted", dashed: true, label: "altura" },
    { from: [120, 45], to: [120, 8], tone: "target", dashed: true },
    { from: [120, 8], to: [195, 8], tone: "target", dashed: true, label: "Alvo" },
  ],
  points: [{ at: [120, 45], label: "Rompimento", placement: "right" }],
  // Volume em queda, um pouco maior nas subidas internas; forte no rompimento.
  volume: bars([[0.75, true], [0.55, false], [0.62, true], [0.45, false], [0.5, true], [0.35, false],
    [0.4, true], [0.95, true], [0.8, true], [0.65, true], [0.55, true], [0.5, true]]),
};

const DESCENDING_TRIANGLE: Diagram = {
  path: [[10, 20], [25, 55], [45, 30], [65, 55], [85, 40], [100, 55], [115, 47], [125, 62], [145, 78], [175, 88]],
  lines: [
    { from: [10, 55], to: [150, 55], tone: "support", label: "suporte plano", labelAt: "start" },
    { from: [10, 20], to: [150, 53], tone: "resistance" },
    { from: [10, 20], to: [10, 55], tone: "muted", dashed: true, label: "altura" },
    { from: [120, 55], to: [120, 90], tone: "target", dashed: true },
    { from: [120, 90], to: [195, 90], tone: "target", dashed: true, label: "Alvo" },
  ],
  points: [{ at: [120, 55], label: "Rompimento", placement: "left" }],
  // Volume em queda, um pouco maior nas descidas internas; aumenta no rompimento.
  volume: bars([[0.75, false], [0.55, true], [0.62, false], [0.45, true], [0.5, false], [0.35, true],
    [0.4, false], [0.85, false], [0.75, false], [0.6, false], [0.5, false], [0.45, false]]),
};

// Bandeira de alta: mastro vertical e consolidação num canal estreito inclinado contra a tendência.
const FLAG: Diagram = {
  path: [[10, 90], [30, 70], [40, 72], [55, 45], [63, 60], [72, 49.3], [82, 64.9], [92, 54.4], [100, 69.5], [108, 58.5], [118, 45], [135, 30], [160, 18], [185, 12]],
  lines: [
    { from: [55, 45], to: [115, 60.3], tone: "resistance" },
    { from: [55, 58], to: [115, 73.3], tone: "support" },
    { from: [10, 90], to: [10, 45], tone: "muted", dashed: true, label: "mastro" },
    { from: [108, 58.5], to: [108, 13.5], tone: "target", dashed: true },
    { from: [108, 13.5], to: [195, 13.5], tone: "target", dashed: true, label: "Alvo" },
  ],
  points: [{ at: [108, 58.5], label: "Rompimento", placement: "right" }],
  volume: [0.8, 0.9, 1, 0.35, 0.3, 0.25, 0.9, 0.8, 0.6, 0.5, 0.45, 0.4].map((h, i) => ({ h, up: i < 3 || i > 5 })),
};

// Flâmula de alta: mastro vertical e um pequeno triângulo simétrico.
const PENNANT: Diagram = {
  path: [[10, 90], [30, 70], [40, 72], [55, 45], [62, 67], [72, 49.4], [82, 64.1], [92, 54.6], [99, 61.1], [104, 57.7], [115, 44], [135, 30], [160, 18], [185, 12]],
  lines: [
    { from: [55, 45], to: [110, 59.3], tone: "resistance" },
    { from: [60, 68], to: [110, 59.1], tone: "support" },
    { from: [10, 90], to: [10, 45], tone: "muted", dashed: true, label: "mastro" },
    { from: [104, 57.7], to: [104, 12.7], tone: "target", dashed: true },
    { from: [104, 12.7], to: [195, 12.7], tone: "target", dashed: true, label: "Alvo" },
  ],
  points: [{ at: [104, 57.7], label: "Rompimento", placement: "right" }],
  volume: [0.8, 0.9, 1, 0.35, 0.3, 0.25, 0.9, 0.8, 0.6, 0.5, 0.45, 0.4].map((h, i) => ({ h, up: i < 3 || i > 5 })),
};

// Cunha descendente: duas linhas caindo e convergindo; rompe para cima.
const FALLING_WEDGE: Diagram = {
  path: [[5, 60], [15, 15], [30, 47.8], [50, 27.6], [70, 55.1], [90, 42], [110, 62.5], [125, 54.6], [135, 67.1], [150, 45], [170, 25], [190, 14]],
  lines: [
    { from: [15, 15], to: [160, 67.2], tone: "resistance" },
    { from: [15, 45], to: [160, 71.7], tone: "support" },
    { from: [140, 15], to: [195, 15], tone: "target", dashed: true, label: "Alvo: início da cunha" },
  ],
  points: [{ at: [140, 60], label: "Rompimento", placement: "right" }],
};
const RISING_WEDGE = mirror(FALLING_WEDGE);

const GAP_COMMON = candleSeries([
  [38, 42, 36, 40], [40, 43, 38, 39], [39, 41, 36, 37], [37, 40, 35, 39], [39, 42, 38, 41], [44, 46, 43.5, 45],
  [45, 46, 41.5, 43], [43, 44, 39, 40], [40, 42, 38, 41], [41, 43, 39, 40], [40, 41, 37, 38], [38, 41, 37, 40],
]);
const GAP_BREAKAWAY = candleSeries([
  [28, 32, 26, 30], [30, 33, 28, 29], [29, 31, 25, 27], [27, 30, 25, 29], [29, 33, 28, 32], [32, 33, 29, 30],
  [30, 32, 27, 31], [37, 41, 36, 40], [40, 45, 39, 44], [44, 47, 42, 46], [46, 48, 43, 44], [44, 50, 43, 49],
  [49, 54, 48, 53], [53, 57, 51, 56],
]);
const GAP_RUNAWAY = candleSeries([
  [10, 14, 9, 13], [13, 18, 12, 17], [17, 21, 16, 20], [20, 24, 19, 23], [23, 28, 22, 27], [27, 31, 26, 30],
  [35, 39, 34, 38], [38, 42, 37, 41], [41, 46, 40, 45], [45, 49, 44, 48], [48, 53, 47, 52], [52, 56, 50, 55],
  [55, 59, 54, 58], [58, 62, 56, 60],
]);
const GAP_EXHAUSTION = candleSeries([
  [10, 15, 9, 14], [14, 20, 13, 19], [19, 25, 18, 24], [24, 30, 23, 29], [29, 35, 28, 34], [34, 41, 33, 40],
  [40, 46, 39, 45], [50, 56, 49, 54], [54, 55, 48, 49], [49, 50, 44, 45], [45, 47, 40, 41], [41, 43, 36, 37],
  [37, 40, 33, 35], [35, 37, 30, 31],
]);
const ISLAND = candleSeries([
  [15, 19, 14, 18], [18, 23, 17, 22], [22, 27, 21, 26], [26, 31, 25, 30], [30, 35, 29, 34], [34, 38, 33, 37],
  [42, 46, 41, 45], [45, 48, 43, 44], [44, 47, 42, 43], [43, 46, 41, 45], [37, 38.5, 33, 34], [34, 36, 30, 31],
  [31, 33, 27, 28], [28, 30, 24, 25],
]);

const VOLUME_PATH: Pt[] = [[10, 85], [30, 60], [42, 68], [65, 40], [78, 50], [105, 25], [118, 35], [145, 15], [160, 24], [190, 8]];

// ─── Termos ────────────────────────────────────────────────────────────────────

const TERMS: GlossaryTerm[] = [
  // Linhas
  {
    slug: "linha-de-tendencia",
    name: "Linha de Tendência",
    aliases: ["LTA", "LTB", "trendline", "tendência", "Dow"],
    category: "Linhas",
    definition:
      "Reta que liga fundos ascendentes (LTA, tendência de alta) ou topos descendentes (LTB, tendência de baixa). Mostra a inclinação da tendência e onde o preço tende a encontrar suporte ou resistência.",
    validation:
      "Dois pontos traçam a linha; o terceiro toque a valida. Quanto mais toques e mais tempo ela resiste, mais importante. O rompimento só conta com fechamento além da linha (filtro de 1% a 3%) ou dois fechamentos seguidos do outro lado.",
    tool: "trendline",
    diagram: {
      path: [[10, 85], [35, 60], [50, 72], [80, 45], [95, 58], [125, 30], [140, 42], [175, 15], [190, 22]],
      lines: [{ from: [10, 85], to: [190, 26.5], tone: "support", label: "LTA" }],
      points: [
        { at: [10, 85], label: "1", placement: "below" },
        { at: [50, 72], label: "2", placement: "below" },
        { at: [95, 58], label: "3 valida", placement: "below" },
      ],
    },
  },
  {
    slug: "suporte-e-resistencia",
    name: "Suporte e Resistência",
    aliases: ["suporte", "resistência", "inversão de papel", "memória de preço", "S/R"],
    category: "Linhas",
    definition:
      "Suporte é a região onde a demanda costuma frear quedas; resistência, onde a oferta costuma frear altas. São memórias de preço: níveis em que muitos negociaram antes.",
    validation:
      "Ganha força com o número de toques, o volume negociado na região e o tempo desde que se formou. Rompido com folga (fechamento 1% a 3% além), o nível tende a inverter de papel: resistência vira suporte e vice-versa.",
    tool: "horizontal",
    diagram: {
      path: [[10, 88], [30, 51], [42, 68], [60, 51], [72, 66], [88, 38], [100, 28], [115, 49], [130, 32], [150, 22], [190, 12]],
      lines: [
        { from: [5, 50], to: [82, 50], tone: "resistance", label: "Resistência", labelAt: "start" },
        { from: [82, 50], to: [195, 50], tone: "support", label: "vira suporte" },
      ],
      points: [
        { at: [81, 50], label: "Rompimento", placement: "below" },
        { at: [115, 49], label: "Pullback", placement: "right" },
      ],
    },
  },
  {
    slug: "pullback",
    name: "Pullback",
    aliases: ["throwback", "reteste", "retorno ao nível"],
    category: "Linhas",
    definition:
      "Retorno do preço ao nível que acabou de romper (suporte, resistência, linha de tendência ou linha de pescoço) antes de seguir na direção do rompimento. Costuma oferecer um segundo ponto de entrada, com stop mais curto.",
    validation:
      "O pullback deve parar no nível rompido ou perto dele, de preferência com volume menor que o do rompimento. Se o preço fechar de volta do outro lado do nível, o rompimento falhou.",
    diagram: {
      path: [[10, 20], [30, 58], [45, 40], [62, 59], [75, 45], [90, 80], [105, 88], [120, 61], [135, 80], [160, 90], [190, 92]],
      lines: [
        { from: [5, 60], to: [81, 60], tone: "support", label: "Suporte", labelAt: "start" },
        { from: [81, 60], to: [195, 60], tone: "resistance", label: "vira resistência" },
      ],
      points: [
        { at: [81, 60], label: "Rompimento", placement: "left" },
        { at: [120, 61], label: "Pullback", placement: "above" },
        { at: [160, 90], label: "Retomada", placement: "above" },
      ],
    },
  },
  {
    slug: "rompimento",
    name: "Rompimento e filtro",
    aliases: ["breakout", "rompimento falso", "falso rompimento", "filtro de 3%", "filtro de tempo", "violação"],
    category: "Linhas",
    definition:
      "Quando o preço atravessa uma linha de tendência, suporte ou resistência. Como violações rápidas são comuns, usa-se um filtro para separar o rompimento real do ruído.",
    validation:
      "Considere o fechamento, não a sombra. Filtro de preço: fechamento 1% a 3% além da linha (o RiskTrade usa 1%). Filtro de tempo: dois fechamentos seguidos do outro lado. Rompimentos de alta precisam de volume crescente.",
    diagram: {
      path: [[10, 30], [40, 48], [55, 35], [80, 49], [95, 54], [105, 40], [118, 47], [135, 66], [150, 62], [175, 82], [190, 88]],
      lines: [
        { from: [5, 50], to: [195, 50], tone: "support", label: "Suporte" },
        { from: [5, 57], to: [195, 57], tone: "muted", dashed: true, label: "filtro 1–3%" },
      ],
      points: [
        { at: [95, 54], label: "Violação", placement: "below" },
        { at: [127, 57], label: "Rompimento", placement: "right" },
      ],
    },
  },
  {
    slug: "canal",
    name: "Canal de Tendência",
    aliases: ["canal paralelo", "linha de canal", "channel"],
    category: "Linhas",
    definition:
      "Linha paralela à linha de tendência, passando pelos topos (em alta) ou fundos (em baixa). O preço oscila entre as duas, o que ajuda a planejar realizações na linha do canal.",
    validation:
      "Precisa de ao menos dois toques em cada linha. Quando o preço não alcança mais a linha do canal, a tendência está perdendo força; romper a linha do canal no sentido da tendência indica aceleração.",
    tool: "channel",
    diagram: {
      path: [[10, 90], [30, 58], [55, 74], [80, 40.5], [105, 57], [130, 23], [155, 39], [180, 6]],
      lines: [
        { from: [10, 90], to: [190, 27], tone: "support", label: "Tendência" },
        { from: [10, 65], to: [190, 2], tone: "resistance", label: "Canal" },
        { from: [10, 77.5], to: [190, 14.5], tone: "muted", dashed: true },
      ],
    },
  },
  {
    slug: "leque",
    name: "Princípio do Leque",
    aliases: ["leque", "fan", "fan principle", "três linhas", "ponto crítico"],
    category: "Linhas",
    definition:
      "Após o rompimento de uma linha de tendência, traça-se uma nova linha a partir da mesma origem, passando pelo topo (ou fundo) seguinte; ela é mais plana. O processo se repete até três linhas.",
    validation:
      "O rompimento da 3ª linha é o ponto crítico: sinaliza a reversão da tendência. As linhas já rompidas costumam inverter de papel (a resistência vira suporte).",
    tool: "fan",
    diagram: {
      path: [[15, 12], [30, 40], [38, 44], [50, 80], [62, 47], [75, 85], [95, 72], [105, 88], [115, 47], [130, 75], [160, 30], [185, 20]],
      lines: [
        { from: [15, 12], to: [70, 89], tone: "resistance", label: "1" },
        { from: [15, 12], to: [120, 90.75], tone: "resistance", label: "2" },
        { from: [15, 12], to: [195, 75], tone: "resistance", label: "3" },
      ],
      points: [
        { at: [62, 47], label: "2", placement: "above" },
        { at: [115, 47], label: "3", placement: "above" },
        { at: [142, 57], label: "Ponto crítico", placement: "right" },
      ],
    },
  },
  {
    slug: "retracoes",
    name: "Retrações (Fibonacci e terços)",
    aliases: ["fibonacci", "fibo", "retração", "correção", "terços", "gann", "50%", "38,2%", "61,8%"],
    category: "Linhas",
    definition:
      "Correções costumam devolver uma fração previsível do movimento anterior. Os níveis mais observados são 50%, os terços (33% e 66%) e os de Fibonacci (38,2% e 61,8%).",
    validation:
      "A faixa entre 33% e 66% é a zona normal de correção; 50% é o nível mais comum. Correções que passam de 66% ameaçam a tendência. Procure confirmação do preço (candle de reversão, volume) no nível antes de agir.",
    tool: "fibonacci",
    diagram: {
      path: [[15, 88], [40, 60], [50, 66], [75, 35], [85, 40], [100, 15], [115, 38], [125, 30], [140, 51], [160, 35], [190, 10]],
      lines: [
        { from: [15, 15], to: [195, 15], tone: "muted", label: "0%" },
        { from: [15, 42.9], to: [195, 42.9], tone: "primary", label: "38,2%" },
        { from: [15, 51.5], to: [195, 51.5], tone: "primary", label: "50%" },
        { from: [15, 60.1], to: [195, 60.1], tone: "primary", label: "61,8%" },
        { from: [15, 88], to: [195, 88], tone: "muted", label: "100%" },
      ],
      points: [{ at: [140, 51], label: "Correção até 50%", placement: "below" }],
    },
  },
  {
    slug: "linhas-de-velocidade",
    name: "Linhas de Velocidade",
    aliases: ["speed lines", "speed resistance lines", "1/3", "2/3"],
    category: "Linhas",
    definition:
      "Dividem a altura de um movimento em terços e ligam o início do movimento a esses pontos. Medem o ritmo da tendência combinando preço e tempo.",
    validation:
      "Em alta, a correção tende a parar na linha de 2/3. Se ela for rompida, o preço tende a buscar a de 1/3; rompida também a de 1/3, a tendência provavelmente reverteu. As linhas rompidas viram resistência.",
    tool: "speedLines",
    diagram: {
      path: [[15, 92], [40, 62], [50, 68], [75, 35], [85, 42], [95, 12], [115, 35], [130, 44], [150, 28], [175, 40], [195, 30]],
      lines: [
        { from: [15, 92], to: [95, 12], tone: "muted" },
        { from: [95, 12], to: [95, 92], tone: "muted", dashed: true },
        { from: [15, 92], to: [140, 8.6], tone: "primary", label: "2/3" },
        { from: [15, 92], to: [195, 32], tone: "primary", label: "1/3" },
      ],
    },
  },

  // Padrões de reversão
  {
    slug: "oco",
    name: "OCO (Ombro-Cabeça-Ombro)",
    aliases: ["OCO", "ombro cabeça ombro", "head and shoulders", "H&S", "linha de pescoço", "neckline"],
    category: "Padrões de Reversão",
    definition:
      "Padrão de topo com três picos: o do meio (cabeça) mais alto que os laterais (ombros). A linha de pescoço liga os dois fundos entre eles. Marca a passagem de uma tendência de alta para baixa.",
    validation:
      "Só se completa com o fechamento abaixo da linha de pescoço (com filtro). O volume costuma ser menor na cabeça e no ombro direito e aumentar no rompimento. Alvo mínimo: distância da cabeça à linha de pescoço, projetada a partir do rompimento. Pullback à linha de pescoço é comum.",
    tool: "headShoulders",
    diagram: HEAD_SHOULDERS,
  },
  {
    slug: "oco-invertido",
    name: "OCO Invertido",
    aliases: ["OCOI", "ombro cabeça ombro invertido", "inverse head and shoulders", "fundo"],
    category: "Padrões de Reversão",
    definition:
      "Espelho do OCO em um fundo: três vales, com o do meio mais profundo. Marca a passagem de uma tendência de baixa para alta.",
    validation:
      "Exige aumento claro de volume no rompimento da linha de pescoço: fundos precisam de força compradora para se confirmar, ao contrário dos topos. Alvo: distância da cabeça à linha de pescoço, projetada para cima a partir do rompimento.",
    tool: "headShoulders",
    diagram: {
      ...mirror(HEAD_SHOULDERS),
      // Alta a partir da cabeça já com volume crescente, ombro direito seco e explosão no rompimento.
      volume: bars([[0.75, false], [0.5, true], [0.6, false], [0.58, false], [0.7, true], [0.78, true],
        [0.28, false], [0.5, true], [1, true], [0.3, false], [0.8, true], [0.75, true]]),
    },
  },
  {
    slug: "topo-duplo",
    name: "Topo Duplo",
    aliases: ["topo duplo", "double top", "M"],
    category: "Padrões de Reversão",
    definition:
      "Dois topos em nível parecido separados por um fundo intermediário, formando um M. O mercado tenta e falha duas vezes em superar a mesma resistência.",
    validation:
      "Só se confirma com o fechamento abaixo do fundo intermediário. O volume costuma ser menor no segundo topo. Alvo: altura dos topos até o fundo, projetada para baixo a partir do rompimento.",
    diagram: DOUBLE_TOP,
  },
  {
    slug: "fundo-duplo",
    name: "Fundo Duplo",
    aliases: ["fundo duplo", "double bottom", "W"],
    category: "Padrões de Reversão",
    definition: "Espelho do topo duplo: dois fundos em nível parecido separados por um topo intermediário, formando um W.",
    validation:
      "Confirma-se com o fechamento acima do topo intermediário, de preferência com aumento de volume. Alvo: altura dos fundos até o topo, projetada para cima.",
    diagram: {
      ...mirror(DOUBLE_TOP),
      lines: mirror(DOUBLE_TOP).lines?.map((l) => (l.label === "Fundo intermediário" ? { ...l, label: "Topo intermediário" } : l)),
      points: mirror(DOUBLE_TOP).points?.map((p) => ({ ...p, label: p.label.replace("Topo", "Fundo") })),
      // Segundo fundo com menos volume; o rompimento para cima precisa de volume.
      volume: bars([[0.7, false], [0.8, false], [0.5, true], [0.45, true], [0.5, false], [0.38, false],
        [0.65, true], [1, true], [0.32, false], [0.75, true], [0.65, true], [0.55, true]]),
    },
  },

  // Padrões de continuação
  {
    slug: "triangulo-simetrico",
    name: "Triângulo Simétrico",
    aliases: ["triângulo", "triangulo", "coil", "simétrico"],
    category: "Padrões de Continuação",
    definition:
      "Topos descendentes e fundos ascendentes convergindo. É uma pausa na tendência e costuma ser rompido na direção dela.",
    validation:
      "Precisa de ao menos quatro pontos (dois em cada linha). O rompimento ideal ocorre entre metade e três quartos do caminho até o ápice; perto do ápice o padrão perde força. O volume cai durante a formação e deve aumentar no rompimento. Alvo: altura da base projetada a partir do rompimento.",
    tool: "triangle",
    diagram: SYMMETRIC_TRIANGLE,
  },
  {
    slug: "triangulo-ascendente",
    name: "Triângulo Ascendente",
    aliases: ["triângulo", "triangulo", "ascendente"],
    category: "Padrões de Continuação",
    definition:
      "Resistência plana com fundos ascendentes: os compradores aceitam pagar cada vez mais enquanto a oferta segura um nível fixo. Tem viés de alta.",
    validation:
      "Confirma-se com fechamento acima da resistência plana e aumento de volume. Alvo: altura da base projetada para cima a partir do rompimento.",
    tool: "triangle",
    diagram: ASCENDING_TRIANGLE,
  },
  {
    slug: "triangulo-descendente",
    name: "Triângulo Descendente",
    aliases: ["triângulo", "triangulo", "descendente"],
    category: "Padrões de Continuação",
    definition:
      "Suporte plano com topos descendentes: os vendedores aceitam receber cada vez menos enquanto a demanda segura um nível fixo. Tem viés de baixa.",
    validation:
      "Confirma-se com fechamento abaixo do suporte plano; aqui o volume é menos decisivo que nos rompimentos de alta. Alvo: altura da base projetada para baixo.",
    tool: "triangle",
    diagram: DESCENDING_TRIANGLE,
  },
  {
    slug: "bandeira",
    name: "Bandeira",
    aliases: ["bandeira", "flag", "bull flag", "bear flag", "mastro", "meio mastro"],
    category: "Padrões de Continuação",
    definition:
      "Pausa curta depois de um movimento forte e quase vertical (o mastro). Os preços se consolidam num canal estreito, inclinado contra a tendência, antes de retomá-la.",
    validation:
      "O mastro vem com volume alto, e o volume cai durante a bandeira. A consolidação é breve: de uma a três semanas no gráfico diário. Confirma-se com o rompimento no sentido da tendência, com volume. Alvo: o tamanho do mastro, projetado a partir do rompimento. Como costuma aparecer na metade do movimento, diz-se que a bandeira tremula a meio mastro.",
    tool: "channel",
    diagram: FLAG,
  },
  {
    slug: "flamula",
    name: "Flâmula",
    aliases: ["flâmula", "flamula", "pennant", "galhardete", "mastro"],
    category: "Padrões de Continuação",
    definition:
      "Parente da bandeira: também vem depois de um mastro, mas a consolidação forma um pequeno triângulo simétrico, quase horizontal, em vez de um canal inclinado.",
    validation:
      "Mesmas regras da bandeira: mastro com volume forte, volume baixo na consolidação, duração de uma a três semanas e rompimento no sentido da tendência com volume. Alvo: tamanho do mastro projetado a partir do rompimento. Se durar muito mais, trate como um triângulo comum.",
    tool: "triangle",
    diagram: PENNANT,
  },
  {
    slug: "cunha-descendente",
    name: "Cunha Descendente",
    aliases: ["cunha", "cunha descendente", "falling wedge", "wedge"],
    category: "Padrões de Continuação",
    definition:
      "Duas linhas inclinadas para baixo e convergentes: os topos caem mais rápido que os fundos. Tem viés de alta. Numa tendência de alta, é uma correção que tende a ser retomada para cima; no fim de uma queda, pode marcar a reversão.",
    validation:
      "Leva mais tempo que bandeiras e flâmulas (normalmente mais de três semanas). O volume diminui durante a formação. Confirma-se com o fechamento acima da linha superior, de preferência entre 2/3 e 3/4 do caminho até o ápice. Alvo: no mínimo, a volta ao início da cunha.",
    diagram: FALLING_WEDGE,
  },
  {
    slug: "cunha-ascendente",
    name: "Cunha Ascendente",
    aliases: ["cunha", "cunha ascendente", "rising wedge", "wedge"],
    category: "Padrões de Continuação",
    definition:
      "Duas linhas inclinadas para cima e convergentes: os fundos sobem mais rápido que os topos. Tem viés de baixa. Numa tendência de baixa, é um repique que tende a ser retomado para baixo; no topo de uma alta, pode marcar a reversão.",
    validation:
      "Leva mais tempo que bandeiras e flâmulas (normalmente mais de três semanas). O volume diminui durante a formação. Confirma-se com o fechamento abaixo da linha inferior, de preferência entre 2/3 e 3/4 do caminho até o ápice. Alvo: no mínimo, a volta ao início da cunha.",
    diagram: RISING_WEDGE,
  },

  // Gaps
  {
    slug: "gap-comum",
    name: "Gap Comum",
    aliases: ["gap", "gap de área", "janela"],
    category: "Gaps",
    definition:
      "Intervalo de preço sem negócios entre um candle e o seguinte, dentro de uma faixa lateral. É o tipo menos importante de gap.",
    validation: "Aparece com volume baixo, em mercado lateral ou pouco líquido, e costuma ser fechado em poucos dias. Não tem valor de previsão.",
    diagram: {
      candles: GAP_COMMON.candles,
      lines: [
        { from: [candleX(4, 12), GAP_COMMON.py(42)], to: [candleX(6, 12), GAP_COMMON.py(42)], tone: "muted", dashed: true },
        { from: [candleX(4, 12), GAP_COMMON.py(43.5)], to: [candleX(6, 12), GAP_COMMON.py(43.5)], tone: "muted", dashed: true },
      ],
      points: [
        { at: [candleX(5, 12), GAP_COMMON.py(46)], label: "Gap comum", placement: "above" },
        { at: [candleX(6, 12), GAP_COMMON.py(41.5)], label: "fechado", placement: "below" },
      ],
    },
  },
  {
    slug: "gap-de-rompimento",
    name: "Gap de Rompimento",
    aliases: ["breakaway gap", "gap de fuga", "gap de rompimento"],
    category: "Gaps",
    definition: "Gap que rompe uma formação ou um nível importante e inicia um movimento novo.",
    validation:
      "Vem com volume alto. Normalmente não é fechado logo; a borda do gap passa a servir de suporte (ou resistência, na baixa). Quanto maior o gap e o volume, mais forte o sinal.",
    diagram: {
      candles: GAP_BREAKAWAY.candles,
      volume: [0.35, 0.3, 0.4, 0.3, 0.35, 0.3, 0.3, 1, 0.7, 0.55, 0.4, 0.6, 0.55, 0.5].map((h, i) => ({ h, up: GAP_BREAKAWAY.candles[i].c <= GAP_BREAKAWAY.candles[i].o })),
      lines: [
        { from: [candleX(0, 14), GAP_BREAKAWAY.py(33)], to: [candleX(7, 14), GAP_BREAKAWAY.py(33)], tone: "resistance", label: "Resistência" },
        { from: [candleX(6, 14), GAP_BREAKAWAY.py(32)], to: [190, GAP_BREAKAWAY.py(32)], tone: "support", dashed: true },
        { from: [candleX(6, 14), GAP_BREAKAWAY.py(36)], to: [190, GAP_BREAKAWAY.py(36)], tone: "support", dashed: true, label: "gap vira suporte" },
      ],
      points: [{ at: [candleX(7, 14), GAP_BREAKAWAY.py(41)], label: "Gap de rompimento", placement: "above" }],
    },
  },
  {
    slug: "gap-de-continuacao",
    name: "Gap de Continuação",
    aliases: ["runaway gap", "gap de medição", "measuring gap", "gap de fuga"],
    category: "Gaps",
    definition: "Gap que aparece no meio de um movimento forte, sem interrompê-lo. Também chamado de gap de medição.",
    validation:
      "Ocorre com volume moderado e costuma marcar a metade do movimento: o trecho restante tende a ter tamanho parecido com o já percorrido desde o início da tendência.",
    diagram: {
      candles: GAP_RUNAWAY.candles,
      lines: [
        { from: [candleX(5, 14), GAP_RUNAWAY.py(31)], to: [190, GAP_RUNAWAY.py(31)], tone: "muted", dashed: true },
        { from: [candleX(5, 14), GAP_RUNAWAY.py(34)], to: [190, GAP_RUNAWAY.py(34)], tone: "muted", dashed: true },
        { from: [18, GAP_RUNAWAY.py(9)], to: [18, GAP_RUNAWAY.py(32.5)], tone: "target", dashed: true, label: "1ª metade" },
        { from: [182, GAP_RUNAWAY.py(32.5)], to: [182, GAP_RUNAWAY.py(56)], tone: "target", dashed: true, label: "≈ igual", labelAt: "start" },
      ],
      points: [{ at: [candleX(6, 14), GAP_RUNAWAY.py(39)], label: "Gap de continuação", placement: "above" }],
    },
  },
  {
    slug: "gap-de-exaustao",
    name: "Gap de Exaustão",
    aliases: ["exhaustion gap", "gap de exaustão", "exaustão"],
    category: "Gaps",
    definition: "Gap no fim de um movimento prolongado: um último arranque antes de a tendência perder força.",
    validation:
      "Aparece depois de alta (ou queda) extensa, muitas vezes com volume muito alto. Se for fechado em poucos dias, confirma o esgotamento. Fechar o gap é o que distingue a exaustão da continuação.",
    diagram: {
      candles: GAP_EXHAUSTION.candles,
      volume: [0.3, 0.35, 0.4, 0.45, 0.5, 0.6, 0.7, 1, 0.8, 0.6, 0.5, 0.45, 0.4, 0.35].map((h, i) => ({ h, up: GAP_EXHAUSTION.candles[i].c <= GAP_EXHAUSTION.candles[i].o })),
      lines: [
        { from: [candleX(6, 14), GAP_EXHAUSTION.py(46)], to: [candleX(10, 14), GAP_EXHAUSTION.py(46)], tone: "muted", dashed: true },
        { from: [candleX(6, 14), GAP_EXHAUSTION.py(49)], to: [candleX(10, 14), GAP_EXHAUSTION.py(49)], tone: "muted", dashed: true },
      ],
      points: [
        { at: [candleX(7, 14), GAP_EXHAUSTION.py(56)], label: "Gap de exaustão", placement: "above" },
        { at: [candleX(9, 14), GAP_EXHAUSTION.py(44)], label: "fechado", placement: "below" },
      ],
    },
  },
  {
    slug: "ilha-de-reversao",
    name: "Ilha de Reversão",
    aliases: ["island reversal", "ilha", "ilha de reversão"],
    category: "Gaps",
    definition:
      "Gap de exaustão seguido, dias depois, de um gap na direção contrária. Os candles entre os dois ficam isolados, como uma ilha.",
    validation: "Os dois gaps devem acontecer em níveis parecidos. É sinal de reversão de curto prazo; ganha força com volume alto no segundo gap.",
    diagram: {
      candles: ISLAND.candles,
      lines: [
        { from: [candleX(6, 14) - 6, ISLAND.py(48.5)], to: [candleX(9, 14) + 6, ISLAND.py(48.5)], tone: "target", dashed: true },
        { from: [candleX(6, 14) - 6, ISLAND.py(40.5)], to: [candleX(9, 14) + 6, ISLAND.py(40.5)], tone: "target", dashed: true },
        { from: [candleX(6, 14) - 6, ISLAND.py(48.5)], to: [candleX(6, 14) - 6, ISLAND.py(40.5)], tone: "target", dashed: true },
        { from: [candleX(9, 14) + 6, ISLAND.py(48.5)], to: [candleX(9, 14) + 6, ISLAND.py(40.5)], tone: "target", dashed: true },
      ],
      points: [
        { at: [candleX(7.5, 14), ISLAND.py(48.5)], label: "Ilha", placement: "above" },
        { at: [candleX(6, 14), ISLAND.py(39)], label: "gap ↑", placement: "left" },
        { at: [candleX(10, 14), ISLAND.py(39)], label: "gap ↓", placement: "right" },
      ],
    },
  },

  // Volume
  {
    slug: "volume",
    name: "Volume",
    aliases: ["volume", "confirmação", "presença institucional"],
    category: "Volume",
    definition:
      "Quantidade negociada no período. Mede a intensidade por trás do movimento: preço mostra a direção, volume mostra a convicção.",
    validation:
      "Em tendência saudável, o volume aumenta no sentido da tendência e diminui nas correções. Rompimentos de alta precisam de volume; quedas podem acontecer sem ele. Volume desproporcional no fim de um movimento pode indicar clímax.",
    diagram: {
      path: VOLUME_PATH,
      volume: [1, 0.3, 0.75, 0.85, 0.3, 0.8, 0.25, 0.9, 0.95, 0.3, 0.85, 0.9].map((h) => ({ h, up: h > 0.5 })),
      points: [{ at: [78, 50], label: "correção com volume baixo", placement: "below" }],
    },
  },
  {
    slug: "obv",
    name: "On Balance Volume (OBV)",
    aliases: ["OBV", "on balance volume", "fluxo", "Granville"],
    category: "Volume",
    definition:
      "Linha que soma o volume dos dias de alta e subtrai o dos dias de baixa. Resume, num único traço, se o volume está entrando ou saindo do papel.",
    validation:
      "Importa a direção, não o valor. OBV subindo junto com o preço confirma a alta. OBV rompendo topos antes do preço pode antecipar o movimento; OBV caindo enquanto o preço sobe é divergência.",
    diagram: {
      path: VOLUME_PATH,
      sub: { path: [[10, 116], [30, 110], [42, 112], [65, 106], [78, 107], [105, 102], [118, 103], [145, 99], [160, 100], [190, 98]], label: "OBV" },
    },
  },
  {
    slug: "divergencia-de-volume",
    name: "Divergência de Volume",
    aliases: ["divergência", "divergencia", "OBV", "não confirmação", "divergência baixista", "divergência altista"],
    category: "Volume",
    definition:
      "Quando o preço faz um novo topo (ou fundo) e o volume, medido pelo OBV, não acompanha. Indica que o movimento acontece com cada vez menos participação.",
    validation:
      "É um alerta de enfraquecimento, não um sinal de entrada: espere a confirmação pelo preço, como o rompimento de uma linha de tendência. O RiskTrade compara topos e fundos confirmados (5 candles de cada lado) e tolera ±2 candles de defasagem no OBV.",
    diagram: {
      path: [[10, 85], [40, 35], [65, 62], [105, 25], [130, 58], [160, 70], [190, 80]],
      lines: [{ from: [40, 35], to: [105, 25], tone: "resistance", dashed: true, label: "topo mais alto", labelAt: "start" }],
      points: [{ at: [105, 25], label: "Divergência", placement: "above" }],
      sub: {
        path: [[10, 116], [40, 101], [65, 110], [105, 105], [130, 113], [160, 116], [190, 117]],
        label: "OBV",
        lines: [{ from: [40, 101], to: [105, 105], tone: "resistance", dashed: true, label: "OBV mais baixo", labelAt: "start" }],
      },
    },
  },
  {
    slug: "interesse-aberto",
    name: "Interesse Aberto (Open Interest)",
    aliases: ["open interest", "OI", "contratos em aberto", "posições em aberto", "COT", "CFTC", "futuros"],
    category: "Volume",
    definition:
      "Número de contratos de futuros (ou opções) ainda em aberto: posições abertas que não foram encerradas nem liquidadas. Cada contrato tem um comprado e um vendido. Só existe em derivativos: ações não têm interesse aberto, só volume.",
    validation:
      "Use o total de todos os vencimentos. Alta com interesse aberto subindo é saudável; alta com ele caindo é fraca (recompra de vendidos). Queda com interesse aberto subindo é forte; queda com ele caindo tende a perder força. No RiskTrade, o painel aparece nos futuros (ES=F, CL=F, GC=F…), com dados semanais da CFTC.",
    diagram: {
      path: [[10, 86], [35, 66], [50, 72], [80, 50], [95, 56], [125, 36], [140, 42], [175, 16], [190, 26]],
      points: [{ at: [175, 16], label: "Alerta", placement: "left" }],
      sub: {
        path: [[10, 116], [35, 111], [50, 111], [80, 106], [95, 105], [125, 101], [140, 100], [175, 108], [190, 110]],
        label: "Int. aberto",
        lines: [{ from: [140, 100], to: [175, 108], tone: "resistance", dashed: true, label: "cai na alta final", labelAt: "start" }],
      },
    },
  },
];

/** Termos com o exemplo histórico de "Ver no gráfico real", o conteúdo do card ampliado e o modo banana. */
export const GLOSSARY: GlossaryTerm[] = TERMS.map((term) => ({
  ...term,
  ...(EXAMPLES[term.slug] && { example: EXAMPLES[term.slug] }),
  ...(DETAILS[term.slug] && { details: DETAILS[term.slug] }),
  ...(BANANAS[term.slug] && { banana: BANANAS[term.slug] }),
}));
