import type { TermExample } from "./types";

/**
 * Exemplos históricos do botão "Ver no gráfico real". As datas foram escolhidas com base nos
 * dados diários do Yahoo Finance; os preços vêm do próprio candle ao abrir o gráfico.
 * Todos usam o período de 5 anos, e o gráfico aproxima a janela do exemplo.
 */
export const EXAMPLES: Record<string, TermExample> = {
  "linha-de-tendencia": {
    symbol: "ITUB4.SA",
    range: "5y",
    description: "LTA ligando os fundos de jun e ago/2024, respeitada até o rompimento em nov/2024.",
    drawings: [{ kind: "trendline", points: [{ date: "2024-06-10", price: "low" }, { date: "2024-08-05", price: "low" }] }],
    markers: [{ date: "2024-11-13", text: "Rompimento", position: "belowBar" }],
  },
  "suporte-e-resistencia": {
    symbol: "AAPL",
    range: "5y",
    description: "A máxima de jan/2024 segurou o preço por meses; rompida em jun/2024, virou suporte no reteste de ago/2024.",
    drawings: [{ kind: "horizontal", points: [{ date: "2024-01-24", price: "high" }] }],
    markers: [
      { date: "2024-06-11", text: "Rompimento", position: "aboveBar" },
      { date: "2024-08-05", text: "Reteste", position: "belowBar" },
    ],
  },
  pullback: {
    symbol: "ABEV3.SA",
    range: "5y",
    description: "Rompimento da máxima de set/2025 em 04/11/2025 e pullback ao nível três pregões depois.",
    drawings: [{ kind: "horizontal", points: [{ date: "2025-09-17", price: "high" }] }],
    markers: [
      { date: "2025-11-04", text: "Rompimento", position: "aboveBar" },
      { date: "2025-11-07", text: "Pullback", position: "belowBar" },
    ],
  },
  leque: {
    symbol: "PETR4.SA",
    range: "5y",
    description: "Leque a partir do fundo de jun/2025: as linhas 2 e 3 são geradas a cada rompimento.",
    drawings: [{ kind: "fan", points: [{ date: "2025-06-09", price: "low" }, { date: "2025-06-30", price: "low" }] }],
  },
  retracoes: {
    symbol: "BBAS3.SA",
    range: "5y",
    description: "Alta de jan a fev/2025 corrigida até perto de 50% em mar/2025, antes de novo topo em mai/2025.",
    drawings: [{ kind: "fibonacci", points: [{ date: "2025-01-03", price: "low" }, { date: "2025-02-18", price: "high" }] }],
  },
  oco: {
    symbol: "AAPL",
    range: "5y",
    description: "OCO entre out/2024 e fev/2025; a linha de pescoço foi rompida em mar/2025 e o alvo, atingido em abr/2025.",
    drawings: [
      {
        kind: "headShoulders",
        points: [
          { date: "2024-10-15", price: "high" },
          { date: "2024-11-04", price: "low" },
          { date: "2024-12-26", price: "high" },
          { date: "2025-01-21", price: "low" },
          { date: "2025-02-25", price: "high" },
        ],
      },
    ],
  },
  "oco-invertido": {
    symbol: "GOOGL",
    range: "5y",
    description: "OCO invertido entre set e dez/2023; rompimento em 21/12/2023 e alvo atingido em abr/2024.",
    drawings: [
      {
        kind: "headShoulders",
        points: [
          { date: "2023-09-26", price: "low" },
          { date: "2023-10-12", price: "high" },
          { date: "2023-10-27", price: "low" },
          { date: "2023-11-22", price: "high" },
          { date: "2023-12-04", price: "low" },
        ],
      },
    ],
  },
  "topo-duplo": {
    symbol: "MSFT",
    range: "5y",
    description: "Topos em dez/2024 e jan/2025; o fundo intermediário foi rompido em fev/2025 e o alvo, atingido em abr/2025.",
    drawings: [{ kind: "horizontal", points: [{ date: "2025-01-14", price: "low" }] }],
    markers: [
      { date: "2024-12-12", text: "Topo 1", position: "aboveBar" },
      { date: "2025-01-28", text: "Topo 2", position: "aboveBar" },
      { date: "2025-02-24", text: "Rompimento", position: "belowBar" },
    ],
  },
  "fundo-duplo": {
    symbol: "AAPL",
    range: "5y",
    description: "Fundos em set e out/2023; o topo intermediário foi rompido em nov/2023 e o alvo, atingido em dez/2023.",
    drawings: [{ kind: "horizontal", points: [{ date: "2023-10-12", price: "high" }] }],
    markers: [
      { date: "2023-09-28", text: "Fundo 1", position: "belowBar" },
      { date: "2023-10-26", text: "Fundo 2", position: "belowBar" },
      { date: "2023-11-10", text: "Rompimento", position: "aboveBar" },
    ],
  },
  "triangulo-simetrico": {
    symbol: "TSLA",
    range: "5y",
    description: "Triângulo simétrico entre jun e jul/2025, rompido para cima em ago/2025; alvo atingido em set/2025.",
    drawings: [
      {
        kind: "triangle",
        points: [
          { date: "2025-06-23", price: "high" },
          { date: "2025-07-21", price: "high" },
          { date: "2025-06-05", price: "low" },
          { date: "2025-07-07", price: "low" },
        ],
      },
    ],
  },
  "triangulo-ascendente": {
    symbol: "AAPL",
    range: "5y",
    description: "Resistência plana com fundos ascendentes entre ago e out/2024; rompimento em 21/10/2024.",
    drawings: [
      {
        kind: "triangle",
        points: [
          { date: "2024-08-29", price: "high" },
          { date: "2024-09-20", price: "high" },
          { date: "2024-09-16", price: "low" },
          { date: "2024-10-07", price: "low" },
        ],
      },
    ],
  },
  "triangulo-descendente": {
    symbol: "PETR4.SA",
    range: "5y",
    description: "Topos descendentes sobre suporte plano entre mar e mai/2026; rompimento para baixo em 25/05/2026.",
    drawings: [
      {
        kind: "triangle",
        points: [
          { date: "2026-03-30", price: "high" },
          { date: "2026-04-13", price: "high" },
          { date: "2026-04-17", price: "low" },
          { date: "2026-05-13", price: "low" },
        ],
      },
    ],
  },
  "gap-de-rompimento": {
    symbol: "AAPL",
    range: "5y",
    description: "Gap de alta em 03/05/2024 acima das máximas anteriores, com volume 2,7 vezes a média; não foi fechado.",
    drawings: [{ kind: "horizontal", points: [{ date: "2024-05-02", price: "high" }] }],
    markers: [{ date: "2024-05-03", text: "Gap de rompimento", position: "belowBar" }],
  },
  "gap-de-exaustao": {
    symbol: "AMD",
    range: "5y",
    description: "Depois de alta de quase 30% em 30 pregões, gap em 13/08/2025 fechado em poucos dias. Foi o topo: veio queda de cerca de 20%.",
    drawings: [{ kind: "horizontal", points: [{ date: "2025-08-12", price: "high" }] }],
    markers: [{ date: "2025-08-13", text: "Gap de exaustão", position: "aboveBar" }],
  },
  "divergencia-de-volume": {
    symbol: "AMD",
    range: "5y",
    description: "Topo mais alto em jan/2026 sem novo topo do OBV, seguido de queda de cerca de 20%.",
    markers: [
      { date: "2025-12-22", text: "Topo 1", position: "aboveBar" },
      { date: "2026-01-05", text: "Topo 2 sem OBV", position: "aboveBar" },
    ],
  },
  bandeira: {
    symbol: "JPM",
    range: "5y",
    view: { from: "2025-03-24", to: "2025-06-27" },
    description: "Mastro de alta de cerca de 19% em apenas 5 pregões em abr/2025, bandeira descendente com volume menor e rompimento em 23/04/2025; o alvo (tamanho do mastro) foi atingido em jun/2025.",
    drawings: [
      { kind: "trendline", options: { extend: false }, points: [{ date: "2025-04-07", price: "low" }, { date: "2025-04-14", price: "high" }] },
      { kind: "trendline", options: { extend: false }, points: [{ date: "2025-04-14", price: "high" }, { date: "2025-04-23", price: 235.23 }] },
      { kind: "trendline", options: { extend: false }, points: [{ date: "2025-04-16", price: "low" }, { date: "2025-04-23", price: 224.75 }] },
      { kind: "trendline", options: { extend: false }, points: [{ date: "2025-04-23", price: 272.85 }, { date: "2025-06-18", price: 272.85 }] },
    ],
    markers: [
      { date: "2025-04-07", text: "Mastro", position: "belowBar" },
      { date: "2025-04-23", text: "Rompimento", position: "belowBar" },
      { date: "2025-06-18", text: "Alvo atingido", position: "aboveBar" },
    ],
  },
  flamula: {
    symbol: "NVDA",
    range: "5y",
    view: { from: "2024-04-08", to: "2024-06-07" },
    description: "Mastro de alta de cerca de 22% entre abr e mai/2024, flâmula de 6 pregões com topos caindo e fundos subindo, rompimento em 15/05/2024; o alvo (tamanho do mastro) foi atingido em 28/05/2024.",
    drawings: [
      { kind: "trendline", options: { extend: false }, points: [{ date: "2024-04-19", price: "low" }, { date: "2024-05-06", price: "high" }] },
      { kind: "trendline", options: { extend: false }, points: [{ date: "2024-05-06", price: "high" }, { date: "2024-05-15", price: 91.56 }] },
      { kind: "trendline", options: { extend: false }, points: [{ date: "2024-05-09", price: "low" }, { date: "2024-05-15", price: 88.83 }] },
      { kind: "trendline", options: { extend: false }, points: [{ date: "2024-05-15", price: 108.17 }, { date: "2024-05-28", price: 108.17 }] },
    ],
    markers: [
      { date: "2024-04-19", text: "Mastro", position: "belowBar" },
      { date: "2024-05-15", text: "Rompimento", position: "belowBar" },
      { date: "2024-05-28", text: "Alvo atingido", position: "aboveBar" },
    ],
  },
  "cunha-descendente": {
    symbol: "AMD",
    range: "5y",
    view: { from: "2024-02-26", to: "2024-07-24" },
    description: "Depois de alta de cerca de 35%, cunha descendente em abr/2024, rompida para cima em 14/05/2024; o preço voltou ao início da cunha em jul/2024.",
    drawings: [
      { kind: "trendline", options: { extend: false }, points: [{ date: "2024-04-01", price: 187.24 }, { date: "2024-05-14", price: 150.41 }] },
      { kind: "trendline", options: { extend: false }, points: [{ date: "2024-04-01", price: 151.71 }, { date: "2024-05-14", price: 137.49 }] },
      { kind: "trendline", options: { extend: false }, points: [{ date: "2024-05-14", price: 187.24 }, { date: "2024-07-10", price: 187.24 }] },
    ],
    markers: [
      { date: "2024-05-14", text: "Rompimento", position: "belowBar" },
      { date: "2024-07-10", text: "Alvo atingido", position: "aboveBar" },
    ],
  },
  "cunha-ascendente": {
    symbol: "VALE3.SA",
    range: "5y",
    view: { from: "2024-02-26", to: "2024-08-16" },
    description: "Em plena tendência de baixa, cunha ascendente entre abr e mai/2024, rompida para baixo em 28/05/2024; o preço voltou ao início da cunha em ago/2024.",
    drawings: [
      { kind: "trendline", options: { extend: false }, points: [{ date: "2024-04-05", price: 63.73 }, { date: "2024-05-28", price: 66.21 }] },
      { kind: "trendline", options: { extend: false }, points: [{ date: "2024-04-05", price: 59.61 }, { date: "2024-05-28", price: 65.22 }] },
      { kind: "trendline", options: { extend: false }, points: [{ date: "2024-05-28", price: 59.61 }, { date: "2024-08-02", price: 59.61 }] },
    ],
    markers: [
      { date: "2024-05-28", text: "Rompimento", position: "aboveBar" },
      { date: "2024-08-02", text: "Alvo atingido", position: "belowBar" },
    ],
  },
};
