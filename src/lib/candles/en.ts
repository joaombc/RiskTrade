/**
 * Versão em inglês dos padrões de candles, por slug. O nome em inglês já está no padrão
 * (englishName); aqui ficam os textos e os nomes das versões, na mesma ordem das variantes.
 */
export interface PatternTranslation {
  summary: string;
  recognition: string[];
  psychology: string;
  confirmation: string;
  variants: string[];
}

const CH12 = "Murphy, Technical Analysis of the Financial Markets, ch. 12 (Morris)";

/** Fontes, a partir do texto em português. */
export const SOURCES_EN: Record<string, string> = {
  detailed: `${CH12}: pattern covered in detail in the chapter`,
  classic: `${CH12}: pattern from the chapter's list; description based on Nison and Morris`,
};

export const PATTERNS_EN: Record<string, PatternTranslation> = {
  // Basic candles
  "dia-longo": {
    summary: "Large body: a big difference between open and close. It shows one side clearly in control.",
    recognition: [
      "The body is much larger than those of recent candles; the size of the shadows is not part of the definition.",
      "White (bullish) when it closes well above the open; black (bearish) when it closes well below.",
    ],
    psychology:
      "One side controlled the session from start to finish. In an up day, buyers pushed price higher without meaningful resistance; in a down day, sellers did the same.",
    confirmation: "On its own, it only confirms the strength of the trend. It gains meaning as part of patterns (engulfing, morning star…).",
    variants: ["Long white day", "Long black day"],
  },
  "dia-curto": {
    summary: "Small body: open and close are near each other. It shows little conviction.",
    recognition: ["The body is small relative to recent candles.", "The color of the body matters little."],
    psychology: "Neither side managed to set a direction. After a long trend, it can signal fatigue.",
    confirmation: "It is a building block of several patterns (harami, stars). On its own, watch the next candle.",
    variants: ["Short white day", "Short black day"],
  },
  piao: {
    summary: "Small body with upper and lower shadows longer than the body. It is indecision.",
    recognition: ["Small body.", "Upper and lower shadows longer than the body.", "The color of the body is not very relevant."],
    psychology: "Buyers and sellers pushed price far in both directions, but no one sustained the move: the session ended near where it began.",
    confirmation: "Indecision after a strong trend is a warning. Wait for the next candle to see who won.",
    variants: ["White spinning top", "Black spinning top"],
  },
  marubozu: {
    summary: "A long candle with no shadows (or almost none): it opens at the low and closes at the high, or the reverse.",
    recognition: ["White: opens at the low and closes at the high.", "Black: opens at the high and closes at the low.", "Long body, with no relevant shadows."],
    psychology: "Total control by one side: price never went back past the open and finished at the session's extreme.",
    confirmation: "It shows strength in the direction of the candle. It is the basis of the kicking and belt hold patterns.",
    variants: ["White marubozu", "Black marubozu"],
  },
  doji: {
    summary: "Open and close are equal (or almost): the body becomes a line. It is the picture of indecision.",
    recognition: ["Open and close equal or very close.", "The shadows can be of any length; they define the type of doji."],
    psychology: "After the whole session, buyers and sellers ended up tied. After a trend, the tie signals that the dominant side has lost strength.",
    confirmation:
      "On a chart with a wide price range, candles that look like a doji on screen may not be one: check the numbers. The next candle confirms the direction.",
    variants: ["Doji"],
  },
  "doji-pernas-longas": {
    summary: "A doji with long shadows on both sides: a lot of indecision.",
    recognition: ["Open and close practically equal.", "Long upper and lower shadows."],
    psychology: "The market was strong up and down during the session, but ended exactly where it started: the contest is open.",
    confirmation: "At tops and bottoms, it is a warning of a turn; the next candle sets the side.",
    variants: ["Long-legged doji"],
  },
  "doji-lapide": {
    summary: "A doji with only a long upper shadow. The longer the shadow, the more bearish.",
    recognition: ["Open, close and low at the same level (or almost).", "Long upper shadow, no lower shadow."],
    psychology: "Buyers pushed price well higher, but sellers gave it all back to the open: the rally was rejected.",
    confirmation: "Most relevant after a rally. Confirm with a bearish candle in the next session.",
    variants: ["Gravestone doji"],
  },
  "doji-libelula": {
    summary: "A doji with only a long lower shadow. It is usually bullish.",
    recognition: ["Open, close and high at the same level (or almost).", "Long lower shadow, no upper shadow."],
    psychology: "Sellers knocked price down, but buyers recovered it all to the open: the decline was rejected.",
    confirmation: "Most relevant after a decline. Confirm with a bullish candle in the next session.",
    variants: ["Dragonfly doji"],
  },

  // 1-candle reversals
  "corpo-longo": {
    summary: "A long day against the prior trend: the first sign that the other side has shown up.",
    recognition: ["After a decline, a long white candle (or, after a rally, a long black one).", "The body is much larger than those of the previous candles."],
    psychology: "After several days in one direction, a whole session dominated by the opposite side shows a shift in pressure.",
    confirmation: "It is one of the weakest reversal signals on the list; use it as a warning and wait for confirmation.",
    variants: ["Long white body", "Long black body"],
  },
  "martelo-enforcado": {
    summary: "Small body at the top of the candle and a long lower shadow. A hammer in a decline (bullish); a hanging man in a rally (bearish).",
    recognition: [
      "Small body near the high; the color matters little.",
      "Lower shadow at least twice the size of the body.",
      "Little or no upper shadow.",
      "It is the same candle: the name depends on the prior trend.",
    ],
    psychology:
      "Hammer: in a decline, sellers knock price down, but buyers react and close near the high, rejecting the decline. Hanging man: in a rally, the same shadow shows there was heavy selling during the session, a first sign that supply has appeared.",
    confirmation: "The hanging man needs confirmation: an open or close below the body in the next session. The hammer is more reliable when the next candle closes above it.",
    variants: ["Hammer", "Hanging man"],
  },
  "martelo-invertido-estrela-cadente": {
    summary: "Small body at the bottom of the candle and a long upper shadow. An inverted hammer in a decline; a shooting star in a rally.",
    recognition: [
      "Small body near the low.",
      "Upper shadow at least twice the size of the body.",
      "Little or no lower shadow.",
      "The shooting star usually opens with a gap above the prior body.",
    ],
    psychology:
      "Shooting star: in a rally, buyers try to push higher, but sellers give back almost everything; the rally was rejected. Inverted hammer: in a decline, buyers attempt a strong rally; even though it is given back, it shows that demand has started to appear.",
    confirmation: "The inverted hammer relies heavily on confirmation (an open above the body the next day). The shooting star gains strength with a bearish candle afterward.",
    variants: ["Inverted hammer", "Shooting star"],
  },
  "belt-hold": {
    summary: "A long candle that opens at the session's extreme, against the prior trend.",
    recognition: [
      "Bullish: in a decline, a long white candle that opens at the low (no lower shadow), often with a downside gap.",
      "Bearish: in a rally, a long black candle that opens at the high (no upper shadow).",
    ],
    psychology: "The market opens following the trend, but from the first minute the opposite side takes over and never gives control back.",
    confirmation: "The longer the candle, the more significant. A close beyond the candle's body in the next session invalidates it.",
    variants: ["Bullish belt hold", "Bearish belt hold"],
  },

  // 2-candle reversals
  engolfo: {
    summary: "The second candle's body completely engulfs the first one's body, of the opposite color.",
    recognition: [
      "Bullish: in a decline, a small black candle followed by a white one whose body wraps around the whole black body.",
      "Bearish: in a rally, a small white candle followed by a black one that wraps around the whole white body.",
      "The shadows don't need to be engulfed, only the body.",
    ],
    psychology:
      "The second candle opens still in the direction of the trend, but the opposite side dominates the whole session and closes beyond the entire prior session. Those riding the trend are left with losses.",
    confirmation: "Stronger when the first candle is small, the second is large and volume rises on the second.",
    variants: ["Bullish engulfing", "Bearish engulfing"],
  },
  harami: {
    summary: "A long candle followed by a small one whose body sits inside the first one's body. It is the reverse of the engulfing pattern.",
    recognition: ["First candle long, in the direction of the trend.", "Second candle small, with its whole body inside the first one's body; usually of the opposite color."],
    psychology: "After a strong session, the market contracts: the trend loses momentum and doubt appears.",
    confirmation: "A weaker signal than the engulfing pattern; ask for confirmation. Three inside up/down is the harami already confirmed.",
    variants: ["Bullish harami", "Bearish harami"],
  },
  "harami-cross": {
    summary: "A harami in which the second candle is a doji. Stronger than the ordinary harami.",
    recognition: ["First candle long, in the direction of the trend.", "Second candle is a doji inside the first one's body."],
    psychology: "After a session of dominance, a complete tie: the trend's strength vanished overnight.",
    confirmation: "Even so, ask for confirmation from the next candle.",
    variants: ["Bullish harami cross", "Bearish harami cross"],
  },
  "linha-de-perfuracao-nuvem-negra": {
    summary: "The second candle opens beyond the first and closes beyond the middle of its body, in the opposite direction.",
    recognition: [
      "Piercing line (bullish): in a decline, a long black candle; the next one opens below the prior low and closes above the middle of the black body.",
      "Dark cloud cover (bearish): in a rally, a long white candle; the next one opens above the prior high and closes below the middle of the white body.",
      "If the second candle closes beyond the entire body, it becomes an engulfing pattern.",
    ],
    psychology:
      "Dark cloud cover: the open above the prior high cheers the longs, but price falls all day and closes below the middle of the prior session, a heavy blow to confidence that leads many to get out. The piercing line is the mirror image at a bottom.",
    confirmation: "The deeper the second candle penetrates the first one's body, the stronger the signal.",
    variants: ["Piercing line", "Dark cloud cover"],
  },
  "estrela-doji": {
    summary: "A long candle followed by a doji that gaps in the direction of the trend.",
    recognition: ["First candle long, in the direction of the trend.", "Second candle is a doji separated from the first one's body by a gap."],
    psychology: "The trend still pushes price to a new extreme, but there the market ties: the move has stalled.",
    confirmation: "It needs the third candle: if it comes in the opposite direction, it forms the morning or evening doji star.",
    variants: ["Bullish doji star", "Bearish doji star"],
  },
  "linhas-de-encontro": {
    summary: "Two long candles of opposite colors that close at the same price.",
    recognition: [
      "Bullish: in a decline, a long black candle; the next one opens well below and rallies to close at the same level as the prior close.",
      "Bearish: the mirror image, in a rally.",
    ],
    psychology: "The second candle opens with a gap in favor of the trend, but the opposite side reacts strongly and erases the whole advantage.",
    confirmation: "Weaker than the piercing line, because the second candle doesn't enter the first one's body. Ask for confirmation.",
    variants: ["Bullish meeting lines", "Bearish meeting lines"],
  },
  kicking: {
    summary: "A marubozu followed by another marubozu of the opposite color, separated by a gap.",
    recognition: [
      "Bullish: a black marubozu followed by a white marubozu that gaps above the prior one.",
      "Bearish: a white marubozu followed by a black marubozu that gaps below.",
      "The direction comes from the second candle; the prior trend matters less than in other patterns.",
    ],
    psychology: "An abrupt turn: the market changes sides from one session to the next, with total dominance in both.",
    confirmation: "It is one of the strongest signals; the gap between the candles should stay open.",
    variants: ["Bullish kicking", "Bearish kicking"],
  },
  "fundo-topo-igual": {
    summary: "Two candles of the same color, in the direction of the trend, that close at exactly the same price.",
    recognition: ["Matching low (bullish): in a decline, two black candles with the same close.", "Matching high (bearish): in a rally, two white candles with the same close."],
    psychology: "The market closes at the same level again: there is a support (or resistance) there that held twice.",
    confirmation: "It works as very short-term support or resistance; confirm with the next candle.",
    variants: ["Matching low", "Matching high"],
  },
  "pombo-correio": {
    summary: "In a decline, two black candles where the second sits inside the first one's body. A harami of the same color.",
    recognition: ["First candle long and black.", "Second candle smaller and black, with its body inside the first one's body."],
    psychology: "The decline continues, but with a much smaller range: sellers are losing strength.",
    confirmation: "A weak signal; wait for a bullish candle afterward.",
    variants: ["Homing pigeon"],
  },

  // 3-candle reversals
  "tres-soldados-tres-corvos": {
    summary: "Three consecutive long candles of the same color, each opening within the prior one and closing at a new extreme.",
    recognition: [
      "Three white soldiers (bullish): in a decline, three long white candles, each opening within the prior body and closing near the high.",
      "Three black crows (bearish): in a rally, three long black candles, each opening within the prior body and closing near the low.",
    ],
    psychology: "Three sessions in a row dominated by the same side, each advancing further: the reversal is clear and consistent.",
    confirmation: "If the candles shrink or grow long shadows, the strength is running out (see advance block and deliberation).",
    variants: ["Three white soldiers", "Three black crows"],
  },
  "estrela-da-manha-tarde": {
    summary: "A long candle, a star (small body with a gap) and a long candle in the opposite direction. Two of the most reliable patterns.",
    recognition: [
      "Evening star (bearish): in a rally, a long white candle; a second small candle (the star) gaps above the prior body; a third, black candle opens below the star and closes below the middle of the first one's body.",
      "Morning star (bullish): the mirror image, at a bottom.",
      "In practice, variations are accepted: the third candle may have no gap or close slightly above the middle of the first.",
    ],
    psychology:
      "Evening star: the long candle reinforces the rally and the gap open cheers even more, but the star shows the advance has stalled. The third candle's decline, to below the middle of the first, confirms that sellers have taken over.",
    confirmation: "Stronger when there are gaps on both sides of the star and the third candle penetrates deep into the first.",
    variants: ["Morning star", "Evening star"],
  },
  "estrela-doji-manha-tarde": {
    summary: "A morning or evening star in which the star is a doji. Even more significant.",
    recognition: ["Same rules as the morning or evening star.", "The middle candle is a doji, with a gap from the first."],
    psychology: "The doji's tie, right after a session of dominance, marks precisely the point where the trend stopped.",
    confirmation: "The third candle confirms; without it, it is just a doji star.",
    variants: ["Morning doji star", "Evening doji star"],
  },
  "bebe-abandonado": {
    summary: "A doji star isolated by gaps on both sides, shadows included. It is an island reversal in candles.",
    recognition: ["A long candle in the direction of the trend.", "A doji with gaps: not even the shadows touch the neighboring candles.", "A third candle in the opposite direction, also with a gap."],
    psychology: "Those who traded on the doji day are trapped: the market abandoned that level in both directions.",
    confirmation: "Rare and strong. The gaps should stay open.",
    variants: ["Bullish abandoned baby", "Bearish abandoned baby"],
  },
  "tri-star": {
    summary: "Three dojis in a row, with the middle one separated by a gap. Rare.",
    recognition: ["Bullish: in a decline, three dojis; the middle one sits below the other two.", "Bearish: in a rally, three dojis; the middle one sits above the other two."],
    psychology: "Three sessions of ties after a trend show that the move has run out.",
    confirmation: "Very rare; when it appears, it deserves attention, but confirm with the next candle.",
    variants: ["Bullish tri-star", "Bearish tri-star"],
  },
  "tres-de-dentro": {
    summary: "A confirmed harami: the third candle closes beyond the first one's open.",
    recognition: [
      "Bullish: a bullish harami (long black candle and a small white one inside it) followed by a white candle that closes above the first one's body.",
      "Bearish: the mirror image.",
    ],
    psychology: "The harami showed doubt; the third candle shows that the opposite side won.",
    confirmation: "It is already the harami with confirmation, so it is more reliable than the harami.",
    variants: ["Three inside up", "Three inside down"],
  },
  "tres-de-fora": {
    summary: "A confirmed engulfing pattern: the third candle continues in the engulfing direction and closes at a new extreme.",
    recognition: ["Bullish: a bullish engulfing followed by a white candle that closes above the engulfing.", "Bearish: the mirror image."],
    psychology: "The engulfing flipped control; the third candle shows the new side remains in charge.",
    confirmation: "It is the engulfing pattern already confirmed.",
    variants: ["Three outside up", "Three outside down"],
  },
  "fundo-unico-tres-rios": {
    summary: "A long black candle, a smaller black one with a new low and a long lower shadow, and a small white candle below it.",
    recognition: [
      "First candle long and black.",
      "Second candle black, with its body inside the first one's, but with a new low (long lower shadow).",
      "Third candle small and white, below the second one's close.",
    ],
    psychology: "The second candle attempts a new decline and is rejected; the third, small and white, shows that selling has dried up.",
    confirmation: "A rare pattern; confirm with a rally above the second candle.",
    variants: ["Unique three river bottom"],
  },
  "tres-estrelas-no-sul": {
    summary: "Three ever-smaller black candles with higher lows: the decline is losing strength.",
    recognition: [
      "First candle long and black, with a long lower shadow.",
      "Second candle smaller and black, with a low above the first one's low.",
      "Third candle small and black, with no shadows, within the second one's range.",
    ],
    psychology: "The decline continues, but each session goes less far: sellers are running out.",
    confirmation: "Rare; wait for a bullish candle to confirm.",
    variants: ["Three stars in the south"],
  },
  sanduiche: {
    summary: "Two black candles with the same close, with a white one between them.",
    recognition: ["First candle black, in a decline.", "Second candle white, closing above the first one's close.", "Third candle black, closing at the same level as the first."],
    psychology: "The same closing price twice shows a support: sellers can't close below it.",
    confirmation: "It works as support; a break of the common close invalidates the pattern.",
    variants: ["Stick sandwich"],
  },
  "dois-corvos-gap-alta": {
    summary: "In a rally, a long white candle and two black ones above it; the second black engulfs the first, but the gap stays open.",
    recognition: [
      "First candle long and white.",
      "Second candle small and black, with a gap above the white body.",
      "Third candle black, opening above the second and closing below it, but still above the white candle's close.",
    ],
    psychology: "Buyers try to continue twice, and both times sellers push price down. The gap that is still open is the rally's last line of defense.",
    confirmation: "Filling the gap, in the next session, confirms the reversal.",
    variants: ["Upside gap two crows"],
  },
  "tres-corvos-identicos": {
    summary: "Three black crows in which each candle opens exactly at the prior close.",
    recognition: ["In a rally, three long black candles.", "Each one opens at the prior close and closes at a new lower level."],
    psychology: "Selling gives no respite even at the open: each session starts where the previous one ended and falls further.",
    confirmation: "A stronger version of three black crows.",
    variants: ["Identical three crows"],
  },
  deliberacao: {
    summary: "Two long white candles followed by a small white one: the rally is stalling.",
    recognition: ["In a rally, two long white candles.", "A third, small white candle opening near the prior close (sometimes with a gap), like a star."],
    psychology: "After two strong sessions, the market deliberates: it still rises, but without strength. Longs should protect their positions.",
    confirmation: "It is a warning of wear, not an immediate sell signal.",
    variants: ["Deliberation"],
  },
  "bloco-de-avanco": {
    summary: "Three white candles with ever-smaller bodies and ever-longer upper shadows.",
    recognition: ["In a rally, three white candles, each opening within the prior body.", "The bodies shrink and the upper shadows grow."],
    psychology: "It looks like three white soldiers, but each advance is weaker and more rejected: the rally is running out of steam.",
    confirmation: "A warning signal; protect long positions.",
    variants: ["Advance block"],
  },
  "dois-corvos": {
    summary: "A long white candle, a black one gapping above it and another black one that closes inside the white body.",
    recognition: [
      "First candle long and white.",
      "Second candle black, with a gap above the white body.",
      "Third candle black, opening inside the second one's body and closing inside the white body.",
    ],
    psychology: "Unlike upside gap two crows, here the gap is filled: sellers have already given back part of the up session.",
    confirmation: "Stronger than upside gap two crows, because the gap has already been filled.",
    variants: ["Two crows"],
  },

  // 4- and 5-candle reversals
  "andorinha-escondida": {
    summary: "Four black candles in a decline; the last one engulfs the third entirely, shadow included.",
    recognition: [
      "First two candles: black marubozus.",
      "Third candle black, gapping down, with a long upper shadow that reaches into the second one's body.",
      "Fourth candle black, completely engulfing the third, shadow included.",
    ],
    psychology: "The decline continues, but the shadows show buyers testing the market. The last candle, though black, is usually the sellers' capitulation.",
    confirmation: "Rare; wait for bullish confirmation.",
    variants: ["Concealing baby swallow"],
  },
  breakaway: {
    summary: "Five candles: a trend that accelerates with a gap and loses strength, and a long opposite candle that closes inside the gap.",
    recognition: [
      "Bullish: a long black candle; a second black candle gapping down; a third and fourth continuing lower, smaller; a fifth, long white candle that closes inside the gap between the first and second.",
      "Bearish: the mirror image.",
    ],
    psychology: "The gap seems to confirm the trend, but the following sessions make little progress. The fifth candle gives everything back to the gap: the accelerated move was exhaustion.",
    confirmation: "Filling the gap completely, in the following sessions, reinforces the reversal.",
    variants: ["Bullish breakaway", "Bearish breakaway"],
  },
  "fundo-topo-em-escada": {
    summary: "Three long candles stepping down like a ladder, a fourth with an opposite shadow and a fifth that gaps in the opposite direction.",
    recognition: [
      "Ladder bottom (bullish): three long black candles, each opening and closing lower; a fourth black candle with an upper shadow; a fifth, white candle that opens above the fourth one's body.",
      "Ladder top (bearish): the mirror image.",
    ],
    psychology: "The stepped decline loses strength on the fourth candle, whose shadow shows buyers. The fifth candle's gap confirms that pressure has changed sides.",
    confirmation: "The fifth candle is the confirmation; watch whether it holds the gap.",
    variants: ["Ladder bottom", "Ladder top"],
  },

  // Continuation
  "linhas-de-separacao": {
    summary: "A candle against the trend followed by another that opens at the same price and follows the trend.",
    recognition: [
      "Bullish: in a rally, a black candle; the next is white, opens at the black candle's open and rises (like a belt hold).",
      "Bearish: in a decline, a white candle; the next is black, opens at the same open and falls.",
    ],
    psychology: "The opposite candle looked like a correction, but the next session erases the doubt from the open.",
    confirmation: "A continuation signal; the trend goes on as long as the common open isn't broken.",
    variants: ["Bullish separating lines", "Bearish separating lines"],
  },
  "tres-metodos": {
    summary: "A long candle, three small correction candles inside it and a new long candle that breaks out to a new extreme.",
    recognition: [
      "Bullish: in a rally, a long white candle; three small candles that fall as a group without leaving the first one's body, at least two of them black; a fifth, long white candle that closes at a new high.",
      "Bearish: the mirror image, in a decline.",
      "In practice, variations are accepted: the small candles may stay within the first one's range (with shadows), not just its body, and there may be more than three.",
    ],
    psychology:
      "The Japanese call the small candles a \"rest period\": the market seems to go nowhere, but it doesn't give back the long candle. The fifth candle breaks out of the range and the trend goes on.",
    confirmation: "It helps decide whether to hold the position: as long as the rest stays within the first candle, the trend is intact.",
    variants: ["Rising three methods", "Falling three methods"],
  },
  "tasuki-gap": {
    summary: "Two candles in the direction of the trend separated by a gap, and a third, opposite one that fails to fill the gap.",
    recognition: [
      "Bullish: in a rally, a white candle; a second white candle gapping up; a third, black candle that opens inside the second one's body and closes inside the gap, without filling it.",
      "Bearish: the mirror image.",
    ],
    psychology: "The third candle's correction tries to fill the gap and fails: the gap keeps working as support.",
    confirmation: "If the gap is filled, the pattern loses validity.",
    variants: ["Upside tasuki gap", "Downside tasuki gap"],
  },
  "linhas-brancas-lado-a-lado": {
    summary: "After a gap in the direction of the trend, two similar white candles opening at the same level.",
    recognition: [
      "Bullish: in a rally, a white candle; an upside gap; two white candles of similar size and open.",
      "Bearish: in a decline, a black candle; a downside gap; two white candles side by side, below the gap. Even though they are white, the downtrend continues.",
    ],
    psychology: "In a rally, the market holds above the gap. In a decline, the white candles are just short covering: they can't fill the gap.",
    confirmation: "The gap should stay open.",
    variants: ["Bullish side-by-side white lines", "Bearish side-by-side white lines"],
  },
  "ataque-de-tres-linhas": {
    summary: "Three consecutive candles in the direction of the trend and a fourth, long and opposite, that wipes out all three.",
    recognition: [
      "Bullish: three white soldiers; a fourth, long black candle that opens above the third close and closes below the first one's open.",
      "Bearish: the mirror image, with three crows and a long white candle.",
    ],
    psychology: "The fourth candle is intense profit-taking that erases the three prior sessions. In Morris's reading, it is a pause: the prior trend usually resumes.",
    confirmation: "Its interpretation is controversial; watch the next session before acting.",
    variants: ["Bullish three line strike", "Bearish three line strike"],
  },
  "tres-metodos-com-gap": {
    summary: "Two candles in the direction of the trend separated by a gap and a third, opposite one that fills the gap.",
    recognition: [
      "Bullish: in a rally, two long white candles with a gap between them; a third, black candle that opens inside the second one's body and closes inside the first one's body, filling the gap.",
      "Bearish: the mirror image.",
    ],
    psychology: "Unlike the tasuki, the correction fills the gap, but stays inside the first candle: it is normal profit-taking within the trend.",
    confirmation: "The trend goes on as long as price doesn't lose the first candle's body.",
    variants: ["Upside gap three methods", "Downside gap three methods"],
  },
  "on-neck": {
    summary: "A long candle in the direction of the trend and an opposite one that opens beyond it and closes exactly at its extreme.",
    recognition: [
      "Bearish (classic form): in a decline, a long black candle; a white candle that opens below the low and closes at the black candle's low.",
      "Bullish: the mirror image, in a rally. Morris includes this less common version.",
    ],
    psychology: "The opposite reaction barely reaches the prior session's extreme: it is too weak to change the trend.",
    confirmation: "A weak piercing line that didn't work out; the trend should continue.",
    variants: ["Bearish on neck", "Bullish on neck"],
  },
  "in-neck": {
    summary: "Like the on neck, but the opposite candle closes slightly inside the long candle's body.",
    recognition: [
      "Bearish (classic form): in a decline, a long black candle; a white candle that opens below the low and closes slightly above the black candle's close.",
      "Bullish: the mirror image. Morris includes this less common version.",
    ],
    psychology: "The opposite reaction enters only a little into the prior body, far from its middle: it is not a piercing line.",
    confirmation: "The trend should continue; if the next candle confirms the reaction, reassess.",
    variants: ["Bearish in neck", "Bullish in neck"],
  },
};
