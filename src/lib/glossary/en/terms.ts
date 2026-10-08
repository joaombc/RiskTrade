import type { TermDetails } from "../types";

/**
 * Versão em inglês dos termos do glossário, por slug. Os nomes técnicos seguem os originais de
 * John J. Murphy, "Technical Analysis of the Financial Markets" (NYIF, 1999).
 */
export interface TermTranslation {
  name: string;
  /** Somados aos apelidos em português na busca. */
  aliases: string[];
  definition: string;
  validation: string;
  details?: TermDetails;
  /** Descrição do exemplo "Ver no gráfico real". */
  example?: string;
}

const MURPHY = "Murphy, Technical Analysis of the Financial Markets";
const CH4 = `${MURPHY}, ch. 4 (Basic Concepts of Trend)`;
const CH5 = `${MURPHY}, ch. 5 (Major Reversal Patterns)`;
const CH6 = `${MURPHY}, ch. 6 (Continuation Patterns)`;
const CH7 = `${MURPHY}, ch. 7 (Volume and Open Interest)`;
const CH9 = `${MURPHY}, ch. 9 (Moving Averages)`;
const CH10 = `${MURPHY}, ch. 10 (Oscillators and Contrary Opinion)`;

export const TERMS_EN: Record<string, TermTranslation> = {
  // Lines
  "linha-de-tendencia": {
    name: "Trendline",
    aliases: ["trend line", "up trendline", "down trendline", "trend"],
    definition:
      "A straight line connecting rising lows (up trendline, in an uptrend) or declining highs (down trendline, in a downtrend). It shows the slope of the trend and where price tends to find support or resistance.",
    validation:
      "Two points draw the line; the third touch validates it. The more touches and the longer it holds, the more important it is. A break only counts with a close beyond the line (1% to 3% filter) or two consecutive closes on the other side.",
    details: {
      market:
        "In an uptrend, each pullback finds buyers at a slightly higher price than the one before: those left out are willing to pay more to get in. The line connects these points of rising demand. When it breaks, buyers have stopped defending the lows at the same pace.",
      volume:
        "In a healthy up trendline, volume expands on the up legs and contracts on the pullbacks to the line. Pullbacks on rising volume, or rallies on falling volume, are the first signs of wear. A break is more reliable with rising volume, and that is essential when a down trendline is broken to the upside.",
      trading:
        "Buy near the line in an uptrend, with a stop just below it; a confirmed break is the exit signal. The longer the line lasts and the more touches it gets, the more important it is. Very steep lines tend to break early and give way to a flatter line (see the Fan Principle). After the break, the distance price moved away from the line is often covered on the other side.",
      pitfalls:
        "Redrawing the line after every violation to \"save\" the trend. Treating an intraday shadow as a break. Trusting a line with only two points as if it were already validated.",
      source: CH4,
    },
    example: "Up trendline connecting the June and August 2024 lows, respected until the break in November 2024.",
  },
  "suporte-e-resistencia": {
    name: "Support and Resistance",
    aliases: ["support", "resistance", "role reversal", "price memory", "S/R"],
    definition:
      "Support is the area where demand usually halts declines; resistance, where supply usually halts advances. They are price memories: levels where many traded before.",
    validation:
      "It gains strength with the number of touches, the volume traded in the area and the time since it formed. Broken by a clear margin (a close 1% to 3% beyond), the level tends to reverse roles: resistance becomes support and vice versa.",
    details: {
      market:
        "Think of three groups: the longs, the shorts and those on the sidelines. When price rises from a support area, longs want to buy more on a dip, shorts want to get out at breakeven and those on the sidelines want a second chance. Everyone waits for the dip to buy, and that is what creates support. If the area breaks to the downside, the same groups now want to sell when price returns there: support becomes resistance.",
      volume:
        "A level's strength depends on how much trading took place there, measured three ways: the time price spent there (weeks count more than days), the volume traded (a level formed on heavy volume is more important) and how recent it is. The break of an important level should come with rising volume.",
      trading:
        "Buy near support with a stop a little below; take profits near resistance. Round numbers (10, 20, 50, 100) work as psychological levels: place buy orders a little above round-number support and sell orders a little below round-number resistance. The deeper the penetration of the level, the greater the chance it reverses roles.",
      pitfalls:
        "Treating the level as an exact line, when it is a zone. Placing the stop exactly at the round number, where many others place theirs. Giving an old, lightly traded level the same weight as a recent one traded on heavy volume.",
      source: CH4,
    },
    example: "The January 2024 high held price for months; broken in June 2024, it became support on the August 2024 retest.",
  },
  pullback: {
    name: "Pullback",
    aliases: ["throwback", "retest", "return move"],
    definition:
      "A return of price to the level it has just broken (support, resistance, trendline or neckline) before resuming in the direction of the break. It usually offers a second entry point, with a tighter stop.",
    validation:
      "The pullback should stop at or near the broken level, ideally on lighter volume than the breakout. If price closes back on the other side of the level, the breakout has failed.",
    details: {
      market:
        "After a breakout, those caught on the wrong side use the return to the level to get out near their entry price, and those who missed the breakout use it to get in. If the broken level holds, the role reversal is confirmed.",
      volume:
        "The return should come on light volume, and the resumption on heavier volume. A breakout on very heavy volume makes a pullback less likely, because it shows strong pressure; a breakout on weak volume makes it more likely. Pullbacks are more common after upside breakouts from bottoms than after tops.",
      trading:
        "Entering on the pullback, with a stop on the other side of the broken level, carries less risk than entering on the breakout. In patterns such as head and shoulders, waiting for the return move to the neckline is a classic tactic. An alternative is to enter part of the position on the breakout and add on the pullback.",
      pitfalls:
        "Always waiting for the pullback: it doesn't always happen and is sometimes minimal. Mistaking a pullback for a failure: if price closes back on the other side of the level, on volume, the breakout has failed.",
      source: CH5,
    },
    example: "Break of the September 2025 high on 11/04/2025 and pullback to the level three sessions later.",
  },
  rompimento: {
    name: "Breakout and Filters",
    aliases: ["breakout", "false breakout", "3% filter", "price filter", "time filter", "penetration"],
    definition:
      "When price crosses a trendline, support or resistance. Since quick violations are common, a filter is used to separate a real breakout from noise.",
    validation:
      "Use the close, not the shadow. Price filter: a close 1% to 3% beyond the line (RiskTrade uses 1%). Time filter: two consecutive closes on the other side. Upside breakouts need rising volume.",
    details: {
      market:
        "A true breakout shows that one side has taken control. False ones happen when stop orders are triggered without new interest to sustain the move, and price returns inside the pattern.",
      volume:
        "Volume should rise on the breakout, especially to the upside: a market can fall just from a lack of buyers, but it only rises if demand exceeds supply. An upside breakout on light volume followed by a decline on heavy volume is a negative combination: the \"bull trap\".",
      trading:
        "Use filters: price (a close 1% to 3% beyond the line; RiskTrade uses 1%), time (two consecutive closes on the other side) and the close itself, never the shadow. Enter on the confirmed close or on the pullback. Filters reduce false signals but delay the entry: it is always a trade-off.",
      pitfalls:
        "Acting on an intraday breakout. Using a filter that is too large on a low-volatility asset (late entry) or too small on a very volatile one (entering on noise).",
      source: CH4,
    },
  },
  canal: {
    name: "Trend Channel",
    aliases: ["channel", "parallel channel", "channel line", "return line"],
    definition:
      "A line parallel to the trendline, drawn through the peaks (in an uptrend) or the troughs (in a downtrend). Price oscillates between the two, which helps plan profit-taking at the channel line.",
    validation:
      "It needs at least two touches on each line. When price no longer reaches the channel line, the trend is losing strength; a break of the channel line in the direction of the trend signals acceleration.",
    details: {
      market:
        "Price swings at a regular pace between demand, at the trendline, and profit-taking, at the channel line. As long as that rhythm holds, the trend is healthy.",
      volume:
        "Volume should be heavier on the legs in the direction of the trend and lighter on the pullbacks. When a leg no longer reaches the channel line, especially on falling volume, the trend is losing strength.",
      trading:
        "Take partial profits near the channel line and buy near the trendline. If price fails to reach one side of the channel, the chance of breaking the other side rises. A break of the channel line in the direction of the trend signals acceleration. Once broken, a channel often projects its own width.",
      pitfalls:
        "Trading against the trend from the channel line (selling the top of the channel in an uptrend): it is risky and usually costly. The trendline is more important and reliable than the channel line.",
      source: CH4,
    },
  },
  leque: {
    name: "Fan Principle",
    aliases: ["fan", "fan lines", "three lines", "critical point"],
    definition:
      "After a trendline is broken, a new line is drawn from the same origin through the next peak (or trough); it is flatter. The process repeats up to three lines.",
    validation:
      "The break of the 3rd line is the critical point: it signals a trend reversal. Lines already broken usually reverse roles (resistance becomes support).",
    details: {
      market:
        "Each broken line shows the trend has lost slope: the market still tries to go on, but with less strength. After three failed attempts, the opposite side has taken control. It is the same idea of the \"number three\" that appears throughout technical analysis.",
      volume:
        "As in any reversal, the break of the 3rd line gains strength with rising volume. When the reversal is to the upside, that increase is essential; in top reversals it is desirable but less decisive.",
      trading:
        "Don't anticipate the reversal before the 3rd line is broken. Lines already broken usually reverse roles and act as support or resistance on the pullback, which helps place the stop.",
      pitfalls:
        "Counting a simple adjustment as a new line, without a real break of the previous one. Applying the principle to short, noisy moves: it was designed for mature trends.",
      source: CH4,
    },
    example: "Fan from the June 2025 low: lines 2 and 3 are drawn after each break.",
  },
  retracoes: {
    name: "Percentage Retracements (Fibonacci and Thirds)",
    aliases: ["fibonacci", "fibo", "retracement", "correction", "thirds", "gann", "50%", "38.2%", "61.8%"],
    definition:
      "Corrections tend to retrace a predictable fraction of the previous move. The most watched levels are 50%, the thirds (33% and 66%) and the Fibonacci ratios (38.2% and 61.8%).",
    validation:
      "The band between 33% and 66% is the normal correction zone; 50% is the most common level. Corrections beyond 66% threaten the trend. Look for price confirmation (a reversal candle, volume) at the level before acting.",
    details: {
      market:
        "Trends advance in waves: profit-taking and late entries make price give back part of the move before going on. Dow had already noted that intermediate corrections retrace 1/3 to 2/3 of the move, most often about 50%.",
      volume:
        "A healthy correction happens on lighter volume than the previous leg. If volume rises during the correction, it may be the start of a reversal.",
      trading:
        "In an uptrend, the buying zone lies between 38% and 62%. A shallow correction, near 38%, points to a strong trend; beyond 62% to 66%, the trend is in doubt. Look for confluence with prior support, a trendline or a reversal candle, and place the stop below the next zone.",
      pitfalls:
        "Buying at the level without any confirmation: price may slice through it. Measuring from arbitrary points: use relevant peaks and troughs.",
      source: CH4,
    },
    example: "Rally from January to February 2025 corrected to near 50% in March 2025, before a new high in May 2025.",
  },
  "linhas-de-velocidade": {
    name: "Speed Resistance Lines",
    aliases: ["speed lines", "speedlines", "1/3", "2/3"],
    definition:
      "They divide the height of a move into thirds and connect the start of the move to those points. They measure the pace of the trend by combining price and time.",
    validation:
      "In an uptrend, the correction tends to stop at the 2/3 line. If it breaks, price tends to head for the 1/3 line; if the 1/3 line breaks too, the trend has probably reversed. Broken lines become resistance.",
    details: {
      market:
        "The lines measure the pace of the trend, combining price and time. While price respects the 2/3 line, the original pace is intact; below it, the trend has slowed down.",
      volume: "Pullbacks to the 2/3 line on weak volume are healthy. A break on strong volume suggests the pace has been lost.",
      trading:
        "If the correction stops at the 2/3 line, it is a buying point. If it breaks, the target becomes the 1/3 line; if the 1/3 line breaks too, a reversal is likely. Broken lines become resistance on the bounce. Redraw the lines whenever price makes a new extreme.",
      pitfalls: "Forgetting to redraw after a new high. Using the tool on short, noisy moves.",
      source: CH4,
    },
  },

  // Reversal patterns
  oco: {
    name: "Head and Shoulders",
    aliases: ["head and shoulders", "H&S", "neckline", "top"],
    definition:
      "A top pattern with three peaks: the middle one (the head) higher than the two on the sides (the shoulders). The neckline connects the two troughs between them. It marks the change from an uptrend to a downtrend.",
    validation:
      "It is only complete with a close below the neckline (with a filter). Volume is usually lighter on the head and the right shoulder and expands on the breakout. Minimum target: the distance from the head to the neckline, projected from the breakout. A return move to the neckline is common.",
    details: {
      market:
        "On the left shoulder the rally is still strong. On the head price makes a new high, but on lighter volume: buyers are weaker. On the right shoulder price doesn't even reach the head, which already forms a lower high. The break of the neckline completes the other half: a lower low. The new downtrend is in place.",
      volume:
        "The head usually has lighter volume than the left shoulder, and the right shoulder clearly lighter volume than both. That is the pattern's most important volume clue. Volume rises on the neckline break, falls on the return move and rises again when the decline resumes. In tops, volume on the breakout is desirable but less critical than in bottoms.",
      trading:
        "Sell on a close below the neckline or on the return move to it, with a stop above the right shoulder. The minimum target is the distance from the head to the neckline, projected from the breakout; another way is to double the first down leg. If there is relevant support just before the target, adjust the target to it.",
      pitfalls:
        "Anticipating the pattern before the neckline breaks. Accepting a right shoulder on heavy volume. A close back above the neckline after the break invalidates the pattern and is a sign of strength.",
      source: CH5,
    },
    example: "Head and shoulders between October 2024 and February 2025; the neckline broke in March 2025 and the target was reached in April 2025.",
  },
  "oco-invertido": {
    name: "Inverse Head and Shoulders",
    aliases: ["inverse head and shoulders", "head and shoulders bottom", "inverse H&S", "bottom"],
    definition: "The mirror of head and shoulders at a bottom: three troughs, with the middle one the deepest. It marks the change from a downtrend to an uptrend.",
    validation:
      "It requires a clear increase in volume on the neckline break: bottoms need buying power to be confirmed, unlike tops. Target: the distance from the head to the neckline, projected upward from the breakout.",
    details: {
      market:
        "It mirrors head and shoulders, but with a different dynamic: a market can fall just from a lack of buyers, but it only rises if demand exceeds supply. That is why a bottom demands more proof of strength than a top.",
      volume:
        "In the first half the volume pattern resembles the top's: the head has slightly lighter volume than the left shoulder. The rally from the head already shows rising volume, often heavier than on the left shoulder's rally. The dip to the right shoulder comes on light volume, and the neckline break needs a burst of volume: without it, be suspicious. The return move, more common in bottoms, should come on light volume.",
      trading:
        "Buy on the neckline break or on the return move to it, with a stop below the right shoulder. More aggressive traders start buying on the right shoulder (on a 50% to 66% pullback of the rally from the head, or at the level of the left shoulder) and complete the position on the breakout. The target is the height of the pattern, projected upward.",
      pitfalls: "Buying a breakout without an increase in volume. Entering early on the right shoulder without a defined stop.",
      source: CH5,
    },
    example: "Inverse head and shoulders between September and December 2023; breakout on 12/21/2023 and target reached in April 2024.",
  },
  "topo-duplo": {
    name: "Double Top",
    aliases: ["double top", "M"],
    definition:
      "Two peaks at a similar level separated by an intervening trough, forming an M. The market tries and fails twice to get past the same resistance.",
    validation:
      "It is only confirmed by a close below the intervening trough. Volume is usually lighter on the second peak. Target: the height from the peaks to the trough, projected downward from the breakout.",
    details: {
      market:
        "The market tries to exceed the high and fails; the second attempt fails at the same level, showing that supply holds there. The break of the intervening trough completes lower highs and lower lows.",
      volume: "Volume is usually heavier on the first peak and lighter on the second, and rises on the break of the intervening trough.",
      trading:
        "Sell on a close below the intervening trough. A return move to it is common. The target is the height of the pattern, projected from the breakout. The peaks don't need to be exactly equal.",
      pitfalls:
        "Calling any pullback after a test of the high a double top. Most of the time that pullback is just a correction and the trend goes on. The pattern is only confirmed by the break of the intervening trough.",
      source: CH5,
    },
    example: "Peaks in December 2024 and January 2025; the intervening trough broke in February 2025 and the target was reached in April 2025.",
  },
  "fundo-duplo": {
    name: "Double Bottom",
    aliases: ["double bottom", "W"],
    definition: "The mirror of the double top: two troughs at a similar level separated by an intervening peak, forming a W.",
    validation:
      "It is confirmed by a close above the intervening peak, ideally on rising volume. Target: the height from the troughs to the peak, projected upward.",
    details: {
      market: "The market tests the same low twice and demand holds both times. The break of the intervening peak completes higher highs and higher lows.",
      volume:
        "Volume is usually lighter on the second trough. On the break of the intervening peak, rising volume matters more than in a double top, because it is an upside reversal.",
      trading:
        "Buy on a close above the intervening peak or on the return move to it, which is more common in bottoms. The target is the height of the pattern, projected upward.",
      pitfalls: "Buying the second trough before confirmation: the decline may continue. Accepting a breakout without volume.",
      source: CH5,
    },
    example: "Troughs in September and October 2023; the intervening peak broke in November 2023 and the target was reached in December 2023.",
  },

  // Continuation patterns
  "triangulo-simetrico": {
    name: "Symmetrical Triangle",
    aliases: ["triangle", "coil", "symmetrical"],
    definition: "Lower highs and higher lows converging. It is a pause in the trend and usually breaks in its direction.",
    validation:
      "It needs at least four points (two on each line). The ideal breakout comes between halfway and three-quarters of the way to the apex; near the apex the pattern loses strength. Volume declines during the formation and should rise on the breakout. Target: the height of the base projected from the breakout.",
    details: {
      market:
        "It is indecision: buyers and sellers narrow the range of the swings until one side wins. It is usually a pause that resumes the prior trend.",
      volume:
        "Volume shrinks as the swings narrow, as in every consolidation pattern, and clearly expands on the breakout. There is a clue during the formation: in an uptrend, volume tends to be a bit heavier on the bounces than on the dips. An upside breakout requires volume.",
      trading:
        "The ideal breakout comes between half and three-quarters of the triangle's width, and the apex gives a time window: if the lines meet in 20 weeks, the breakout should come between the 13th and 15th week. The target is the base projected from the breakout. A return move to the broken line is common and should come on light volume.",
      pitfalls: "Trusting a breakout very close to the apex: there the pattern loses strength. Betting on the direction before the breakout.",
      source: CH6,
    },
    example: "Symmetrical triangle between June and July 2025, broken upward in August 2025; target reached in September 2025.",
  },
  "triangulo-ascendente": {
    name: "Ascending Triangle",
    aliases: ["triangle", "ascending"],
    definition:
      "Flat resistance with rising lows: buyers are willing to pay more and more while supply holds a fixed level. It has a bullish bias.",
    validation: "It is confirmed by a close above the flat resistance on rising volume. Target: the height of the base projected upward from the breakout.",
    details: {
      market:
        "Buyers are more aggressive than sellers: they pay more and more (rising lows), while supply holds a fixed price. When that supply runs out, price breaks to the upside.",
      volume:
        "Volume shrinks during the formation, but tends to be heavier on the bounces than on the dips. The upside breakout should come with a clear increase in volume, and the return move to the broken resistance, on light volume.",
      trading: "Buy on a close above the flat resistance or on the return move to it. The target is the height of the base, projected from the breakout.",
      pitfalls: "The bias is bullish, but it is not a guarantee: a close below the lower line invalidates the pattern.",
      source: CH6,
    },
    example: "Flat resistance with rising lows between August and October 2024; breakout on 10/21/2024.",
  },
  "triangulo-descendente": {
    name: "Descending Triangle",
    aliases: ["triangle", "descending"],
    definition:
      "Flat support with declining highs: sellers are willing to accept less and less while demand holds a fixed level. It has a bearish bias.",
    validation: "It is confirmed by a close below the flat support; here volume is less decisive than in upside breakouts. Target: the height of the base projected downward.",
    details: {
      market:
        "Sellers are more aggressive than buyers: they accept less and less (declining highs), while demand holds a fixed price. When that demand runs out, price breaks to the downside.",
      volume:
        "Volume shrinks during the formation, but tends to be heavier on the dips than on the bounces. The breakout usually comes with rising volume, although in declines volume is less decisive than in rallies.",
      trading: "Sell on a close below the flat support or on the return move to it, which should meet resistance. The target is the height of the base, projected downward.",
      pitfalls: "A close above the upper line invalidates the pattern and may turn into a bullish signal.",
      source: CH6,
    },
    example: "Declining highs over flat support between March and May 2026; downside breakout on 05/25/2026.",
  },
  bandeira: {
    name: "Flag",
    aliases: ["flag", "bull flag", "bear flag", "flagpole", "half-mast"],
    definition:
      "A brief pause after a sharp, nearly vertical move (the flagpole). Prices consolidate in a narrow channel that slopes against the trend before resuming it.",
    validation:
      "The flagpole comes on heavy volume, and volume dries up during the flag. The consolidation is brief: one to three weeks on the daily chart. It is confirmed by a breakout in the direction of the trend, on volume. Target: the length of the flagpole, projected from the breakout. Since it usually appears halfway through the move, the flag is said to fly at half-mast.",
    details: {
      market:
        "The flagpole is a nearly vertical thrust. The flag is a short rest in which some of those who bought take profits without real selling pressure appearing. That is why the consolidation is narrow and slopes against the trend.",
      volume:
        "The flagpole comes on heavy volume, volume \"dries up\" during the flag and picks up again on the breakout. That drying up of volume is a requirement of the pattern. In downtrends, flags last even less, one to two weeks.",
      trading:
        "Enter on the break of the upper line (in an uptrend) with a stop below the flag. For the target, measure the flagpole from the original breakout point and project that distance from the flag's breakout. Since the flag usually appears halfway through the move, it is said to fly at half-mast.",
      pitfalls:
        "If the consolidation goes beyond about three weeks, or if volume doesn't shrink, it is probably not a flag. A flag that slopes with the trend is suspect.",
      source: CH6,
    },
    example:
      "Flagpole of about 19% in just 5 sessions in April 2025, a downward-sloping flag on lighter volume and a breakout on 04/23/2025; the target (flagpole length) was reached in June 2025.",
  },
  flamula: {
    name: "Pennant",
    aliases: ["pennant", "flagpole"],
    definition:
      "A relative of the flag: it also follows a flagpole, but the consolidation forms a small, almost horizontal symmetrical triangle instead of a sloping channel.",
    validation:
      "Same rules as the flag: flagpole on heavy volume, light volume during the consolidation, one to three weeks long and a breakout in the direction of the trend on volume. Target: the length of the flagpole projected from the breakout. If it lasts much longer, treat it as an ordinary triangle.",
    details: {
      market:
        "It is the same rest after a flagpole, but the consolidation forms a small symmetrical triangle instead of a channel: buyers and sellers narrow the range for a few days.",
      volume: "Flagpole on heavy volume, light volume during the pennant and an increase on the breakout. In an uptrend, rising volume on the breakout matters even more.",
      trading:
        "Enter on the breakout with a stop on the other side of the pennant. The target is the length of the flagpole, projected from the breakout. A pennant usually lasts one to three weeks.",
      pitfalls: "A pennant that drags on too long becomes an ordinary triangle, with other target and time rules.",
      source: CH6,
    },
    example:
      "Flagpole of about 22% between April and May 2024, a 6-session pennant with falling highs and rising lows, breakout on 05/15/2024; the target (flagpole length) was reached on 05/28/2024.",
  },
  "cunha-descendente": {
    name: "Falling Wedge",
    aliases: ["wedge", "falling wedge"],
    definition:
      "Two downward-sloping, converging lines: the highs fall faster than the lows. It has a bullish bias. In an uptrend, it is a correction that tends to resume upward; at the end of a decline, it can mark the reversal.",
    validation:
      "It takes longer than flags and pennants (usually more than three weeks). Volume declines during the formation. It is confirmed by a close above the upper line, ideally between 2/3 and 3/4 of the way to the apex. Target: at least a return to the start of the wedge.",
    details: {
      market:
        "Price keeps making lower highs and lower lows, but in an ever-narrower range: the downward move is losing strength. Since the wedge slopes against the uptrend, it is usually a correction that ends with the trend resuming. The rule holds wherever it appears: a falling wedge is bullish.",
      volume: "Volume shrinks during the formation and must rise on the upside breakout.",
      trading:
        "Buy on a close above the upper line, with a stop below the wedge's last low. A wedge takes longer than a flag, usually one to three months. A common minimum target is a return to the start of the wedge.",
      pitfalls:
        "Confusing the wedge with a channel (parallel lines) or a triangle (lines in opposite directions). At the end of a long decline, the same shape can mark a reversal, not a continuation.",
      source: CH6,
    },
    example:
      "After a rally of about 35%, a falling wedge in April 2024, broken upward on 05/14/2024; price returned to the start of the wedge in July 2024.",
  },
  "cunha-ascendente": {
    name: "Rising Wedge",
    aliases: ["wedge", "rising wedge"],
    definition:
      "Two upward-sloping, converging lines: the lows rise faster than the highs. It has a bearish bias. In a downtrend, it is a bounce that tends to resume downward; at the top of a rally, it can mark the reversal.",
    validation:
      "It takes longer than flags and pennants (usually more than three weeks). Volume declines during the formation. It is confirmed by a close below the lower line, ideally between 2/3 and 3/4 of the way to the apex. Target: at least a return to the start of the wedge.",
    details: {
      market:
        "Price keeps making higher highs and higher lows, but in an ever-narrower range: the bounce is losing strength. In a downtrend, the wedge is a countertrend bounce that usually ends with the decline resuming. Wherever it appears, a rising wedge is bearish.",
      volume: "Volume shrinks during the formation. The downside breakout usually comes with rising volume, although in declines volume is less decisive.",
      trading: "Sell on a close below the lower line, with a stop above the wedge's last high. A common minimum target is a return to the start of the wedge.",
      pitfalls:
        "At the top of a long rally, a rising wedge can mark the trend's reversal. Don't confuse it with a healthy rising channel, which has parallel lines.",
      source: CH6,
    },
    example:
      "In the middle of a downtrend, a rising wedge between April and May 2024, broken downward on 05/28/2024; price returned to the start of the wedge in August 2024.",
  },

  // Gaps
  "gap-comum": {
    name: "Common Gap",
    aliases: ["gap", "area gap", "window"],
    definition: "A price range with no trading between one candle and the next, inside a sideways range. It is the least important type of gap.",
    validation: "It appears on light volume, in a sideways or thinly traded market, and is usually filled within a few days. It has no forecasting value.",
    details: {
      market:
        "It is a range with no trades inside a sideways range, usually due to low liquidity or unimportant news. It doesn't change the balance between buyers and sellers.",
      volume: "It appears on light volume and is usually filled within a few days.",
      trading: "It has no forecasting value: don't trade just because of it.",
      pitfalls: "Mistaking a common gap for a breakaway gap. A breakaway gap comes out of a formation, on heavy volume.",
      source: CH4,
    },
  },
  "gap-de-rompimento": {
    name: "Breakaway Gap",
    aliases: ["breakaway gap", "breakaway"],
    definition: "A gap that breaks out of a formation or an important level and starts a new move.",
    validation:
      "It comes on heavy volume. It usually isn't filled soon; the edge of the gap becomes support (or resistance, in a decline). The bigger the gap and the volume, the stronger the signal.",
    details: {
      market:
        "Price leaves a formation or breaks an important level with a jump: the new demand (or supply) is so strong that there were no trades in between.",
      volume: "It comes on heavy volume. The heavier the volume after the gap, the less likely it is to be filled.",
      trading: "The edge of the gap becomes support (in a rally). Enter on the breakout or on a dip to the gap, with a stop below it.",
      pitfalls: "A breakaway gap that is filled soon, especially on volume, weakens the signal. Sometimes price tests the edge of the gap before moving on.",
      source: CH4,
    },
    example: "Upside gap on 05/03/2024 above the previous highs, on volume 2.7 times the average; it was not filled.",
  },
  "gap-de-continuacao": {
    name: "Runaway Gap",
    aliases: ["runaway gap", "measuring gap", "continuation gap"],
    definition: "A gap that appears in the middle of a strong move without interrupting it. Also called a measuring gap.",
    validation:
      "It occurs on moderate volume and usually marks the halfway point of the move: the remaining stretch tends to be about as long as the distance already covered since the trend began.",
    details: {
      market:
        "The market is moving effortlessly, in the middle of a strong move, and jumps again. It is also called a measuring gap because it usually appears near the halfway point of the move.",
      volume: "It usually appears on moderate volume, without the excess of breakaway or exhaustion gaps.",
      trading:
        "Measure the distance covered from the original breakout to the gap and project the same amount from it. In other words, double what has already been covered. The gap acts as support during the rally.",
      pitfalls: "If it is filled, it probably wasn't a runaway gap, but an exhaustion gap.",
      source: CH4,
    },
  },
  "gap-de-exaustao": {
    name: "Exhaustion Gap",
    aliases: ["exhaustion gap", "exhaustion"],
    definition: "A gap at the end of an extended move: a last spurt before the trend loses strength.",
    validation:
      "It appears after an extended rally (or decline), often on very heavy volume. If it is filled within a few days, it confirms exhaustion. Filling the gap is what distinguishes exhaustion from continuation.",
    details: {
      market:
        "After a long rally, the last group of buyers comes in, often out of euphoria, and price jumps. No one is left to buy higher, and the move runs out of steam.",
      volume: "It usually comes on very heavy volume, a buying climax.",
      trading:
        "A close below the gap within a few days is a sign of weakness and confirms exhaustion. Sometimes price moves sideways for a few days or weeks and then gaps down, forming an island reversal.",
      pitfalls: "Exhaustion can only be told apart from continuation afterward, when the gap is filled. Don't sell short just because a gap appeared in a long trend.",
      source: CH4,
    },
    example: "After a rally of almost 30% in 30 sessions, a gap on 08/13/2025 filled within a few days. It was the top: a decline of about 20% followed.",
  },
  "ilha-de-reversao": {
    name: "Island Reversal",
    aliases: ["island reversal", "island"],
    definition: "An exhaustion gap followed, days later, by a gap in the opposite direction. The candles between the two are isolated, like an island.",
    validation: "Both gaps should occur at similar levels. It signals a short-term reversal; it gains strength with heavy volume on the second gap.",
    details: {
      market:
        "An exhaustion gap takes price to a level where buyers run out. When the market gaps in the opposite direction, those who bought during the island are trapped with losses.",
      volume: "The signal gains strength with heavy volume on the second gap.",
      trading: "Sell (at a top) on the second gap, with a stop above the island. It is a short-term reversal signal, stronger after a long trend.",
      pitfalls: "Both gaps need to occur at similar levels. A small island in the middle of a sideways range means little.",
      source: CH4,
    },
  },

  // Volume
  volume: {
    name: "Volume",
    aliases: ["volume", "confirmation", "institutional participation"],
    definition: "The amount traded in the period. It measures the intensity behind the move: price shows direction, volume shows conviction.",
    validation:
      "In a healthy trend, volume rises in the direction of the trend and falls on corrections. Upside breakouts need volume; declines can happen without it. Disproportionate volume at the end of a move may signal a climax.",
    details: {
      market:
        "Volume measures the intensity, or urgency, behind the price move. Price and volume measure the same thing, buying or selling pressure, in two different ways. That is why volume is said to precede price: a loss of pressure usually shows up in volume before it shows up in price.",
      volume:
        "General rule: volume expands in the direction of the trend. Rising price with rising volume points to a strong market; rising price with falling volume, a weak one. Falling price with rising volume is weak; falling price with falling volume suggests selling pressure is running out. Climaxes appear at the extremes: a final surge on huge volume at a top, or a plunge on huge volume followed by a bounce at a bottom.",
      trading:
        "Use volume to confirm, not to generate the signal. Price comes first. RiskTrade's summary compares the day's volume with the 20-session average, and the volume panel below the chart colors each bar by its candle.",
      pitfalls: "Reading volume in isolation. Forgetting that on holidays, the eve of holidays or half sessions, volume is naturally light.",
      source: CH7,
    },
  },
  obv: {
    name: "On Balance Volume (OBV)",
    aliases: ["OBV", "on balance volume", "flow", "Granville"],
    definition:
      "A line that adds the volume of up days and subtracts that of down days. It sums up, in a single line, whether volume is flowing into or out of the asset.",
    validation:
      "Direction matters, not the value. OBV rising with price confirms the rally. OBV breaking highs before price may anticipate the move; OBV falling while price rises is a divergence.",
    details: {
      market:
        "OBV (Joseph Granville, 1963) adds the volume of up days and subtracts that of down days. It shows in a single line whether volume is flowing into or out of the asset.",
      volume:
        "The direction of the line matters, not its value, which changes with the period analyzed. OBV should track price: higher highs and higher lows in an uptrend. When it breaks out before price, it may anticipate the move.",
      trading:
        "Confirm price breakouts with OBV breakouts in the same direction, and be suspicious when price rises and OBV doesn't. RiskTrade's OBV panel already marks the divergences.",
      pitfalls:
        "OBV assigns the whole day's volume to the sign of the close: a day that closes one cent higher counts all its volume as buying. That is why there are variations that weight volume by the price change.",
      source: CH7,
    },
  },
  "divergencia-de-volume": {
    name: "Volume Divergence",
    aliases: ["divergence", "OBV", "non-confirmation", "bearish divergence", "bullish divergence"],
    definition:
      "When price makes a new high (or low) and volume, measured by OBV, doesn't follow. It shows the move is happening with less and less participation.",
    validation:
      "It is a warning of weakness, not an entry signal: wait for price confirmation, such as the break of a trendline. RiskTrade compares confirmed highs and lows (5 candles on each side) and allows ±2 candles of lag in OBV.",
    details: {
      market: "Price makes a new high, but with fewer and fewer people buying. The move continues out of inertia, but buying pressure is fading.",
      volume:
        "There is a divergence when a prior high is exceeded on lighter volume (or OBV). If, on top of that, volume starts rising on the pullbacks, the rally is in danger. The same applies, inverted, to declines.",
      trading:
        "Treat the divergence as a warning to protect profits or tighten the stop, not as a sell signal. Wait for price confirmation: the break of a trendline or of a prior low.",
      pitfalls: "Selling on divergence alone: strong trends can show several divergences in a row before turning. Comparing highs that aren't equivalent.",
      source: CH7,
    },
    example: "Higher high in January 2026 without a new OBV high, followed by a decline of about 20%.",
  },
  "interesse-aberto": {
    name: "Open Interest",
    aliases: ["open interest", "OI", "open contracts", "open positions", "COT", "CFTC", "futures"],
    definition:
      "The number of futures (or options) contracts still outstanding: open positions that have not been closed out or delivered. Each contract has a long and a short. It only exists in derivatives: stocks have no open interest, only volume.",
    validation:
      "Use the total across all delivery months. A rally with rising open interest is healthy; a rally with it falling is weak (short covering). A decline with rising open interest is strong; a decline with it falling tends to lose strength. In RiskTrade, the panel appears on futures (ES=F, CL=F, GC=F…), with weekly CFTC data.",
    details: {
      market:
        "A contract is only created when a new buyer meets a new seller: open interest goes up by one. When both close out positions, it goes down by one. If one leaves and another takes their place, it doesn't change. That is why it measures how much money is committed to the market: rising, new money is coming in; falling, positions are being closed.",
      volume:
        "Volume and open interest are read together: volume is how many contracts changed hands during the day, open interest is how many remain open. Rising together with price, both confirm the trend. A rally on heavy volume with falling open interest is short covering, not new demand; at the end of big rallies (blowoffs), that decline is often the warning.",
      trading:
        "Confirm the trend: in a rally, favor entries with rising open interest. Open interest that builds during a consolidation adds to the breakout's strength, because many end up on the wrong side and need to get out. Very high open interest at a top is dangerous: if price drops suddenly, recent longs liquidate and accelerate the decline.",
      pitfalls:
        "Look at the trend over weeks, not one day's change: right after a breakout, open interest often dips a little, because those who were wrong are getting out. There are also seasonal declines near contract expiration. The CFTC report is weekly, with Tuesday's position released on Friday, so the data always arrives a few days late.",
      source: `${CH7}; Commitments of Traders report (CFTC)`,
    },
  },

  // Indicators
  "bandas-de-bollinger": {
    name: "Bollinger Bands",
    aliases: ["Bollinger", "BB", "bands", "standard deviation", "volatility", "squeeze", "%B", "overbought", "oversold"],
    definition:
      "Two bands two standard deviations above and below a 20-period moving average, created by John Bollinger. About 95% of prices stay between them, and the distance between the bands widens and narrows with volatility.",
    validation:
      "Touching the upper band signals overbought; the lower band, oversold: price usually finds resistance and support at them. If it bounces off the lower band and crosses above the 20-period average, the target is the upper band (and vice versa). Confirm with an oscillator.",
    details: {
      market:
        "The bands measure how far price usually strays from the average over the last 20 sessions. At two standard deviations, about 95% of closes stay inside them, so touching a band is an unusual departure: the move is stretched. Unlike envelopes, which stay a fixed distance away, the bands widen when volatility rises and narrow when it falls, adapting to the market's mood.",
      volume:
        "The bands don't use volume, which comes in as confirmation. A touch of the upper band on weak volume reinforces the overbought reading. A break of the bands after a squeeze is more reliable on rising volume, like any breakout.",
      trading:
        "Murphy proposes three uses. Overbought and oversold: a touch of the upper band is overbought, the lower band is oversold, ideally confirmed by an oscillator. Targets: if price bounces off the lower band and crosses above the 20-period average, the upper band becomes the target; crossing below the average, the target is the lower band. In a strong uptrend, price swings between the upper band and the average, and losing the average warns of a turn. Width: very tight bands usually precede a new move; very wide ones, the end of the trend. On weekly charts, use 20 weeks (about a 100-day SMA on the daily). In RiskTrade, check Bollinger Bands in the chart's averages bar: the panel applies these rules to the current moment.",
      pitfalls:
        "In a strong trend, price walks along the band: selling every touch of the upper band is fighting the trend. A squeeze warns that a move is coming, but not in which direction; wait for the breakout. And in a sideways market, the bands alone generate many signals: Murphy recommends combining them with oscillators.",
      source: CH9,
    },
  },
  "linha-de-momentum": {
    name: "Momentum Line",
    aliases: ["momentum", "oscillator", "zero line", "velocity", "ROC", "rate of change"],
    definition:
      "The simplest oscillator of all: today's close minus the close N periods ago (10 is the most common). It oscillates around a zero line and measures the speed of the move, not its direction. That is why it usually turns before price.",
    validation:
      "Above zero, price is higher than N periods ago; below, lower. Crossing above the zero line is a buy signal and crossing below a sell signal, but they only count in the direction of the major trend. A rising line means an accelerating rally; a line that flattens or falls while price is still rising means the rally is losing strength.",
    details: {
      market:
        "The line compares today's price with the price N periods ago, so it measures how fast price is rising or falling. In a healthy rally, price rises faster and faster and the line rises with it. When the rally continues but more slowly, the line starts to fall, still above zero. Price is still making highs, but the move has lost strength. That is why momentum usually turns before price: it warns that the trend is slowing down before it reverses.",
      volume:
        "Momentum doesn't use volume. Use volume (or OBV) to confirm: a rally with falling momentum and falling volume is doubly weak. A crossing above the zero line on rising volume is more reliable.",
      trading:
        "Murphy gives three uses. Zero line: crossing above is a buy and below is a sell, but trade only in the direction of the major trend. In an uptrend, use upward crossings as entries and ignore downward ones, or use them only to take profits. Extremes: very high values signal overbought, and very low ones oversold. Since momentum has no fixed bounds, compare it with its own past extremes. Divergence: price making a new high with momentum lower than at the prior high warns that the rally is losing strength. The period sets the sensitivity: 10 is the most used; short periods (5) give more signals and more noise, and long ones (20, 40) give a smoother, slower line. In RiskTrade, the 10, 20 and 40 buttons in the averages bar draw the line in a pane below OBV, with arrows at the zero-line crossings. A reading panel tells whether momentum is accelerating, whether it is at an extreme and when it last crossed the zero line.",
      pitfalls:
        "Selling just because momentum fell: in a strong rally, it can pull back many times without the trend turning. The signal only counts with confirmation from price, such as the break of a trendline. Trading every zero-line crossing in a sideways market, where they repeat and produce whipsaws. And forgetting that the value depends on the asset's price: compare assets by the % change, not the absolute value.",
      source: CH10,
    },
  },
};
