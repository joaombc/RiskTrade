/**
 * Versão em inglês dos padrões de ponto e figura, por slug. O nome em inglês já está no padrão
 * (englishName); aqui ficam os textos e os nomes das versões (fundo e topo, nessa ordem).
 */
export interface PnfTranslation {
  summary: string;
  recognition: string[];
  psychology: string;
  confirmation: string;
  variants: [bottom: string, top: string];
}

export const PNF_SOURCE_EN = "Murphy, Technical Analysis of the Financial Markets, ch. 11 (Wheelan's patterns); original description";
export const PNF_SIGNAL_SOURCE_EN = "Murphy, Technical Analysis of the Financial Markets, ch. 11 (3-box chart signals); original description";

export const PNF_PATTERNS_EN: Record<string, PnfTranslation> = {
  fulcro: {
    summary:
      "The most common point and figure reversal pattern: after a sharp decline, price builds a congestion area at the bottom, tests the lows and breaks out above the top of the congestion.",
    recognition: [
      "It follows a long decline; the first O column of the base is usually the longest (the final drop, sometimes a selling climax).",
      "A rally in the middle of the base follows, then a new test of the lows that holds above the previous low or at it.",
      "The pattern is complete when an X column rises above the top of the middle rally: the same buy signal as on the chart (X above the previous X).",
      "At a top (inverse fulcrum) it is the mirror image: congestion after a strong advance, a down swing in the middle and a breakdown below the bottom of the congestion.",
    ],
    psychology:
      "The final drop scares out the last sellers. In the congestion, patient buyers absorb the supply (accumulation): each new dip meets demand at a similar level. When supply runs out, price rises without resistance and clears the top of the base.",
    confirmation:
      "It only counts once the top of the congestion is broken. Pullbacks after the breakout that hold above the broken level are a second chance to enter. The width of the base (number of columns) gives the target through the horizontal count: the wider it is, the larger the expected move.",
    variants: ["Fulcrum (bottom)", "Inverse fulcrum (top)"],
  },
  "fulcro-composto": {
    summary:
      "Two fulcrums side by side at the same level: the base is wider, with two complete tests of the lows before the upside breakout.",
    recognition: [
      "After the decline, a first fulcrum forms (low, rally and test), but the breakout does not come: price returns to the lows.",
      "A second fulcrum forms next to it, with its low at the same level as the first.",
      "It is complete when an X column rises above the top of the whole congestion.",
      "At a top (inverse compound fulcrum): two inverse fulcrums side by side and a breakdown below the bottom of the congestion.",
    ],
    psychology:
      "Accumulation takes longer: supply still shows up on the first breakout attempt and sends price back to the lows. But the lows hold again, a sign that demand is still there. The longer base usually comes before a larger advance.",
    confirmation:
      "A breakout above the top of the whole congestion, not just the second fulcrum. Being wider, it gives a larger horizontal count than the simple fulcrum and tends to be more reliable.",
    variants: ["Compound fulcrum (bottom)", "Inverse compound fulcrum (top)"],
  },
  "final-retardado": {
    summary:
      "A compound fulcrum whose second low is below the first: the decline seems to be over, but it makes one last low before turning.",
    recognition: [
      "After the decline, a base forms that looks like a fulcrum.",
      "Instead of breaking out upward, price falls to a new low, slightly below the first one (the decline ends late).",
      "A second fulcrum forms from the new low; the pattern is complete when an X column rises above the top of the congestion.",
      "At a top: after a distribution base, one last high slightly above the previous one, then the breakdown.",
    ],
    psychology:
      "The last low shakes out traders with stops just below the first low and fools late sellers, who sell at the worst moment. With no new supply below that level, the reversal comes with force.",
    confirmation:
      "The new low on its own is a sell signal on the chart (O below the previous O): the pattern is only confirmed when price comes back and clears the top of the congestion. Murphy considers compound fulcrums stronger than the simple one once confirmed.",
    variants: ["Delayed ending (bottom)", "Delayed ending (top)"],
  },
  oco: {
    summary:
      "The same pattern as on the bar chart: three lows, the middle one (the head) lowest, and a neckline whose break confirms the reversal.",
    recognition: [
      "At a bottom (inverse head and shoulders): a first low (left shoulder), a rally to the neckline, a lower low (head) and another rally to the neckline.",
      "The third low (right shoulder) is above the head, roughly at the height of the left shoulder.",
      "It is complete when an X column rises above the neckline (the top of the rallies).",
      "At a top (head and shoulders): three peaks with the middle one highest and a breakdown below the neckline.",
    ],
    psychology:
      "The head is the sellers' last attempt. On the right shoulder they can no longer push price to the previous low: supply has weakened, and the neckline break shows that buyers have taken over.",
    confirmation:
      "The neckline break is the signal. A pullback to the neckline before the advance resumes is common. On the bar chart the target is the distance from the head to the neckline; on point and figure, the horizontal count of the base.",
    variants: ["Inverse head & shoulders (bottom)", "Head & shoulders (top)"],
  },
  v: {
    summary: "An abrupt reversal with no congestion: price falls hard and then rises hard, almost in the very next column.",
    recognition: [
      "A long O column (a steep drop) followed immediately by a long X column.",
      "There is no sideways area at the bottom: almost no accumulation.",
      "The X column rises above the top of the last X column before the drop, giving the buy signal.",
      "At a top (inverted V): a strong advance followed by a strong drop, with no distribution.",
    ],
    psychology:
      "It usually comes from news or a climax: sellers are exhausted all at once and buyers rush in. The market changes sides with no time to build a base.",
    confirmation:
      "It is the hardest reversal to trade: with no congestion there is no base to measure a target from and no clear level for a stop, and the signal comes late, after much of the advance. Murphy notes that it is hard to identify while it is forming.",
    variants: ["V base (bottom)", "Inverted V (top)"],
  },
  "v-estendido": {
    summary: "A V formation that, after the reversal, pauses sideways (a small congestion) before the new trend continues.",
    recognition: [
      "A steep drop and a quick turn upward, as in the V.",
      "On the way up, price pauses and forms a narrow congestion (the extension), without returning to the low.",
      "It is complete when an X column rises above the top of that congestion.",
      "At a top: an inverted V followed by a congestion on the way down and a breakdown below its bottom.",
    ],
    psychology:
      "The first surge attracts profit-taking and sellers who still believe in the decline. The pause absorbs that supply without giving back the gain; when it ends, the advance continues.",
    confirmation:
      "Easier to trade than the V: the congestion gives a breakout level, a stop (below the congestion) and a horizontal count for the target.",
    variants: ["V extended (bottom)", "Inverted V extended (top)"],
  },
  "duplex-horizontal": {
    summary:
      "Two horizontal congestion areas at the same level, separated by a rally that fails; the reversal is confirmed when price clears the top of that rally.",
    recognition: [
      "After the decline, a first narrow sideways range forms at the bottom.",
      "A rally leaves the range but does not hold: price returns to the same low level.",
      "A second sideways range forms next to the first, at the same height.",
      "It is complete when an X column rises above the top of the rally between the two ranges. At a top it is the mirror image: two distribution ranges and a breakdown.",
    ],
    psychology:
      "The two ranges show the same demand at the same price at two different times: buyers defend that level. The failed rally shakes out the impatient; when supply runs out, the breakout comes.",
    confirmation:
      "A breakout above the top of the rally between the ranges. Since the base is wide, the horizontal count tends to be large. A natural stop sits below the common low of the two ranges.",
    variants: ["Duplex horizontal (bottom)", "Duplex horizontal (top)"],
  },
  pires: {
    summary:
      "A gradual reversal: the lows fall less and less, level off and slowly start to rise, drawing a curve like a saucer.",
    recognition: [
      "The columns get shorter and the lows move closer to each other.",
      "In the middle the lows stop falling; then they slowly start to rise, and so do the highs.",
      "It is complete when an X column rises above the left rim of the saucer (the top of the first X column of the base).",
      "At a top (inverse saucer): the highs rise less and less, turn and slowly start to fall.",
    ],
    psychology:
      "It shows a slow change of control: selling pressure fades without a climax and demand builds little by little. It takes time, but it reflects a broad change of opinion.",
    confirmation:
      "The break of the saucer's rim confirms it. Being slow, it gives time to prepare; the hard part is knowing when the bottom is over. The width of the saucer goes into the horizontal count.",
    variants: ["Saucer (bottom)", "Inverse saucer (top)"],
  },

  // Sinais de compra e venda
  "sinal-simples": {
    summary:
      "The basic point and figure signal: buy when an X column rises above the top of the previous X column; sell when an O column falls below the bottom of the previous O column.",
    recognition: [
      "Buy: the current X column rises one box above the top of the previous X column (a double top breakout).",
      "In this simple version, the low between the two X columns may be lower than the previous low: the signal still counts.",
      "Sell: the current O column falls one box below the bottom of the previous O column (a double bottom breakdown).",
    ],
    psychology:
      "Price returned to a high where it had met sellers before and, this time, got through. Supply at that level is gone, and demand is in control in the short term.",
    confirmation:
      "It is the most frequent and the weakest signal: on its own it gives many false signals in sideways markets. It gets stronger when the lows rise too (next signal), when the breakout clears more than one top and when it goes with the larger trend. The natural stop sits below the bottom of the last O column.",
    variants: ["Simple bullish buy signal", "Simple sell signal"],
  },
  "sinal-simples-fundo-ascendente": {
    summary:
      "The simple signal with one more condition: for a buy, the low between the X columns is higher than the previous one; for a sell, the high between the O columns is lower.",
    recognition: [
      "Buy: the middle O column stops above the bottom of the previous O column (a rising bottom).",
      "Then the X column rises above the top of the previous X column: the buy signal.",
      "Sell: the middle X column stops below the previous top (a declining top), then the O column falls below the bottom of the previous O column.",
    ],
    psychology:
      "Highs and lows rising together is the definition of an uptrend: buyers defend price at higher and higher levels and then beat the resistance. It is the same idea as the trend by peaks and troughs (Murphy, ch. 4).",
    confirmation:
      "More reliable than the simple signal, because it already shows the trend forming. The stop sits below the rising bottom: if it is lost, the bullish pattern no longer exists.",
    variants: ["Simple buy signal with a rising bottom", "Simple sell signal with a declining top"],
  },
  "topo-triplo": {
    summary:
      "Three X columns stop at the same top; the third one clears it: buy. For a sell, three O columns stop at the same low and the third one breaks it.",
    recognition: [
      "Buy: two X columns end at the same level (resistance tested twice).",
      "A third X column rises one box above that level: that is the signal.",
      "Sell: two O columns end at the same low, and the third falls one box below it.",
    ],
    psychology:
      "The resistance held twice; when it gives way on the third try, the sellers there are exhausted. The more times a level is tested, the more important its breakout.",
    confirmation:
      "Stronger than the simple signal, because it breaks a resistance (or support) tested more times. The width of the congestion goes into the horizontal count. Pullbacks to the broken level tend to hold: resistance becomes support.",
    variants: ["Breakout of a triple top", "Breakout of a triple bottom"],
  },
  "topo-triplo-ascendente": {
    summary:
      "Three tops, each higher than the last, with rising lows too: the third X column clears the second top and confirms the stair-step advance.",
    recognition: [
      "Buy: the second X column already clears the first (a simple signal).",
      "The lows rise, and the third X column clears the top of the second: that is the signal.",
      "Sell: three lows, each lower, with falling highs too; the third O column breaks the low of the second.",
    ],
    psychology:
      "The advance moves in steps: each pullback stops higher and each rally goes further. It shows persistent demand, but also a market that has already risen a lot.",
    confirmation:
      "It is a series of simple signals in the same direction; it confirms a trend already under way. Since price has already moved, the risk to the stop (below the last low) tends to be larger.",
    variants: ["Ascending triple top", "Descending triple bottom"],
  },
  "topo-triplo-espalhado": {
    summary:
      "A triple top whose three tops are not in consecutive columns: lower X columns sit between them. The congestion is wider and the breakout stronger.",
    recognition: [
      "Buy: three X columns stop at the same top, but separated by at least one lower X column.",
      "An X column clears that common top: that is the signal.",
      "Sell: three O columns stop at the same low, separated by shallower O columns, and one of them breaks the common low.",
    ],
    psychology:
      "The resistance level held for longer, with price going back and forth several times. The longer the fight, the more supply was absorbed before the breakout.",
    confirmation: "Since the base is wide, it gives a larger horizontal count than the regular triple top. The stop sits below the bottom of the last O column.",
    variants: ["Spread triple top", "Spread triple bottom"],
  },
  triangulo: {
    summary:
      "Falling highs and rising lows form a triangle; when price leaves it upward (after an advance), it is a buy; downward (after a decline), a sell.",
    recognition: [
      "Bullish triangle: after an advance, at least five columns with lower and lower highs and higher and higher lows.",
      "The lines through the highs and the lows converge.",
      "Buy when an X column rises above the top of the previous X column, leaving the triangle through the upper line.",
      "Bearish triangle: the same drawing after a decline, with the O column breaking the previous low through the lower line.",
    ],
    psychology:
      "The swings shrink: buyers and sellers become undecided and price gets compressed. The breakout shows who won; usually the side of the prior trend (a continuation triangle).",
    confirmation:
      "The signal is the break of the previous top (or low), not just of the line. Breakouts against the prior trend are less reliable. The width of the triangle goes into the horizontal count.",
    variants: ["Upside breakout above a bullish triangle", "Downside breakout of a bearish triangle"],
  },
  "linha-resistencia-alta": {
    summary:
      "In an uptrend, the bullish resistance line runs across the tops, parallel to the 45° support line. When an X column rises above it, the advance is accelerating.",
    recognition: [
      "Uptrend channel: the bullish support line (45°) runs across the lows, and a parallel line runs across the tops: the bullish resistance line.",
      "Buy when an X column rises above that resistance line.",
      "Sell (in a down channel): the bearish support line runs across the lows, parallel to the bearish resistance line; the signal is an O column falling below it.",
    ],
    psychology:
      "Price breaks out of the channel's pace in the direction of the trend: demand (or supply, in a decline) has become stronger than before. It is an acceleration, not a reversal.",
    confirmation:
      "It is a sign of strength in the direction of the trend, good for adding to a position. Accelerated moves can exhaust quickly: watch for sharp pullbacks back inside the channel.",
    variants: ["Upside breakout above a bullish resistance line", "Downside breakout below a bearish support line"],
  },
  "linha-resistencia-baixa": {
    summary:
      "The 45° line that defines the trend is broken: in a decline, an X column rises above the bearish resistance line (buy); in an advance, an O column falls below the bullish support line (sell).",
    recognition: [
      "Bearish resistance line: it starts one box above the top of the highest X column and falls at 45° (one box per column).",
      "While the columns stay below it, the trend is down. Buy when an X column rises above the line.",
      "Bullish support line: it starts one box below the lowest low and rises at 45°; sell when an O column falls below it.",
    ],
    psychology: "The 45° line shows the pace of the trend. When price crosses it, the trend has lost enough strength to change sides.",
    confirmation:
      "The rule of Cohen's method, cited by Murphy, is to trade with the trend given by these lines: buys above the bullish support line and sells below the bearish resistance line. The break of the line is the warning of a change; ideally it comes together with a simple signal in the same direction.",
    variants: ["Upside breakout above a bearish resistance line", "Downside breakout below a bullish support line"],
  },
};
