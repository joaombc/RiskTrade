/**
 * Rótulos dos diagramas e marcadores dos exemplos, do português para o inglês. Os rótulos se
 * repetem entre termos, então a tradução é por texto, não por termo. Rótulos sem palavras
 * (números, "OBV", "+2σ") ficam como estão.
 */
export const LABELS_EN: Record<string, string> = {
  // Linhas e níveis
  LTA: "Up trendline",
  Tendência: "Trendline",
  Canal: "Channel",
  Suporte: "Support",
  Resistência: "Resistance",
  "vira suporte": "becomes support",
  "vira resistência": "becomes resistance",
  "resistência plana": "flat resistance",
  "suporte plano": "flat support",
  "3 valida": "3 confirms",
  "Ponto crítico": "Critical point",
  "38,2%": "38.2%",
  "61,8%": "61.8%",
  "Correção até 50%": "50% retracement",
  "filtro 1–3%": "1–3% filter",
  Violação: "Penetration",

  // Rompimentos e alvos
  Rompimento: "Breakout",
  Pullback: "Pullback",
  Reteste: "Retest",
  Retomada: "Resumption",
  Alvo: "Target",
  "Alvo atingido": "Target reached",
  "Alvo: início da cunha": "Target: start of the wedge",
  altura: "height",
  mastro: "flagpole",
  Mastro: "Flagpole",

  // Padrões de reversão
  pescoço: "neckline",
  OE: "LS",
  C: "H",
  OD: "RS",
  "Topo 1": "Peak 1",
  "Topo 2": "Peak 2",
  "Fundo 1": "Trough 1",
  "Fundo 2": "Trough 2",
  "Fundo intermediário": "Intervening trough",
  "Topo intermediário": "Intervening peak",

  // Gaps
  "Gap comum": "Common gap",
  "Gap de rompimento": "Breakaway gap",
  "Gap de continuação": "Runaway gap",
  "Gap de exaustão": "Exhaustion gap",
  fechado: "filled",
  "gap vira suporte": "gap becomes support",
  "1ª metade": "1st half",
  "≈ igual": "≈ equal",
  Ilha: "Island",
  "gap ↑": "gap ↑",
  "gap ↓": "gap ↓",

  // Volume
  "correção com volume baixo": "correction on light volume",
  Divergência: "Divergence",
  "topo mais alto": "higher high",
  "OBV mais baixo": "lower OBV",
  "Topo 2 sem OBV": "Peak 2 without OBV",
  Alerta: "Warning",
  "Int. aberto": "Open int.",
  "cai na alta final": "falls in the final rally",

  // Médias móveis e bandas
  "MMS 5": "SMA 5",
  "MMS 10": "SMA 10",
  "MMS 20": "SMA 20",
  "MMS 21": "SMA 21",
  "MME 20": "EMA 20",
  compra: "buy",
  venda: "sell",
  esticado: "stretched",
  "a MME vira antes e fica mais perto do preço": "the EMA turns sooner and stays closer to price",
  "cada cruzamento é um sinal falso (violinada)": "each crossing is a false signal (whipsaw)",
  "aperto: volatilidade baixa": "squeeze: low volatility",
  "expansão no rompimento": "expansion on the breakout",
};
