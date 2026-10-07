/** Preços de uma vela num diagrama, numa escala livre (o desenho se ajusta). */
export interface Ohlc {
  o: number;
  h: number;
  l: number;
  c: number;
}

export type CandleKind = "basic" | "reversal" | "continuation";
export type Bias = "bullish" | "bearish" | "neutral";

/** Uma versão do padrão (ex.: engolfo de alta), com as velas que o formam. */
export interface CandleVariant {
  bias: Bias;
  name: string;
  candles: Ohlc[];
  /** Tendência desenhada antes do padrão; os padrões só valem nesse contexto. */
  context: "up" | "down" | "none";
}

export interface CandlePattern {
  slug: string;
  /** Nome no idioma da página (em português, com os dois nomes quando a versão de baixa tem outro nome). */
  name: string;
  /** Nome original em inglês, como na lista do livro. */
  englishName: string;
  aliases: string[];
  kind: CandleKind;
  /** Quantidade de velas que formam o padrão. */
  candleCount: number;
  summary: string;
  recognition: string[];
  psychology: string;
  confirmation: string;
  variants: CandleVariant[];
  source: string;
}
