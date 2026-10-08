/**
 * Versão em inglês das aulas, por slug. As seções seguem a mesma ordem (e o mesmo número de
 * parágrafos e itens) das aulas em português; diagramas e números vêm do original.
 */
export interface SectionTranslation {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  caption?: string;
}

export interface LessonTranslation {
  title: string;
  subtitle: string;
  summary: string;
  source: string;
  sections: SectionTranslation[];
  takeaways: string[];
}

const MURPHY = "Murphy, Technical Analysis of the Financial Markets";

/**
 * Rótulos dos diagramas das aulas. Valem por cima dos do glossário: nas aulas, "C" é um ponto
 * (Dow, Elliott), não a cabeça do OCO.
 */
export const LESSON_LABELS_EN: Record<string, string> = {
  C: "C",
  // Dow
  secundária: "secondary",
  menor: "minor",
  "primária (a maré)": "primary (the tide)",
  "correções secundárias: 3 semanas a 3 meses": "secondary corrections: 3 weeks to 3 months",
  Acumulação: "Accumulation",
  "Participação pública": "Public participation",
  Distribuição: "Distribution",
  "novo topo": "new high",
  confirma: "confirms",
  Industriais: "Industrials",
  Transportes: "Transports",
  "C não supera A: sinal mais forte": "C fails to exceed A: stronger signal",
  // Elliott
  "impulso: 5 ondas": "impulse: 5 waves",
  "correção: 3 ondas": "correction: 3 waves",
  "onda 3 começa…": "wave 3 begins…",
  "B não volta ao início de A": "B doesn't return to the start of A",
  "consolidação: sinal de força": "consolidation: a sign of strength",
  "triângulo na onda 4": "triangle in wave 4",
  "paralela pelo topo da 3": "parallel through the top of 3",
  "base: fundos de 2 e 4": "base: lows of 2 and 4",
  // Regra das 4 semanas
  saída: "exit",
  "máx. 4 sem.": "4-wk high",
  "mín. 4 sem.": "4-wk low",
  "mín. 2 sem.": "2-wk low",
  "máx. 8 sem.": "8-wk high",
  "mín. 8 sem.": "8-wk low",
  "pontos: sinais falsos da regra de 4 semanas": "dots: false signals of the 4-week rule",
  // IFR
  "70 sobrecompra": "70 overbought",
  "30 sobrevenda": "30 oversold",
  preço: "price",
  "fundo B": "low B",
  "C não supera A": "C fails to exceed A",
  "IFR 14": "RSI 14",
  "IFR mais baixo": "lower RSI",
  // Estocástico
  "80 sobrecompra": "80 overbought",
  "20 sobrevenda": "20 oversold",
  "%K rápido": "fast %K",
  "%K lento": "slow %K",
  "%D mais baixo": "lower %D",
};

export const LESSONS_EN: Record<string, LessonTranslation> = {
  "teoria-de-dow": {
    title: "Dow Theory",
    subtitle: "The foundation of all modern technical analysis",
    summary:
      "Charles Dow's six tenets: the averages discount everything, the three trends and three phases of the market, confirmation between averages, the role of volume and the reversal signal.",
    source: `${MURPHY}, ch. 2 (Dow Theory)`,
    sections: [
      {
        heading: "Origins",
        paragraphs: [
          "Charles Dow founded Dow Jones & Company with Edward Jones in 1882 and published his ideas in a series of editorials in the Wall Street Journal. He never wrote a book on the theory: his tenets were organized by William Hamilton, his successor at the paper, in 1922, and by Robert Rhea, in 1932.",
          "Dow created the first stock averages to gauge the health of the economy, separating industrial companies from the railroads (today, transportation). Almost everything used in technical analysis descends from his ideas: the definition of a trend, the classification into three degrees, confirmation and divergence, the role of volume and percentage retracements.",
        ],
      },
      {
        heading: "1. The averages discount everything",
        paragraphs: [
          "Everything that can affect supply and demand is already reflected in price: news, expectations, economic data. Even unpredictable events, such as a natural disaster, are absorbed by price almost immediately.",
          "This is the premise that lets the technical analyst study price alone: it is the summary of all the market's knowledge.",
        ],
      },
      {
        heading: "2. The market has three trends",
        paragraphs: [
          "For Dow, an uptrend is a series of successively higher peaks and troughs; a downtrend, of successively lower peaks and troughs. The definition is still the basis of trend analysis today.",
          "He compared the market to the sea. The primary trend is the tide: it lasts more than a year, sometimes several. The secondary trend is the waves, which correct the primary trend and last from three weeks to three months, retracing one-third to two-thirds of the prior move, most often about half. The minor trend is the ripples, lasting less than three weeks.",
        ],
        caption: "The primary trend (tide) contains secondary corrections (waves), which in turn contain minor swings (ripples).",
      },
      {
        heading: "3. Major trends have three phases",
        paragraphs: [
          "Accumulation: the best-informed investors buy while the news is still bad, because they sense the market has already absorbed the worst.",
          "Public participation: prices rise quickly, the news improves and trend followers come in. It is the longest phase and the one technical signals usually capture.",
          "Distribution: the news is more upbeat than ever, speculative volume and public participation grow, and the same investors who accumulated at the bottom start selling to the latecomers.",
        ],
        caption: "The three phases of a bull market, with volume growing into distribution.",
      },
      {
        heading: "4. The averages must confirm each other",
        paragraphs: [
          "No important bull or bear signal is valid if only one average gives it. For Dow, the Industrials and the Rails both had to exceed a prior secondary peak to confirm the start or continuation of a bull market. The signals don't have to be simultaneous, but the closer they are, the stronger the confirmation. When the averages diverge, the prior trend is assumed to remain in effect.",
          "The logic is economic: if factories produce more, the carriers have to move more goods. Today the same idea appears when a stock is compared with its sector index or with the broad market.",
        ],
        caption: "The Industrials' new high is only confirmed when the Transports also exceed their prior high.",
      },
      {
        heading: "5. Volume must confirm the trend",
        paragraphs: [
          "Volume should expand in the direction of the major trend: in an uptrend, rise when price rises and fall on declines; in a downtrend, the reverse. Dow considered volume a secondary indicator. His buy and sell signals came from closing prices only, and volume served to confirm them.",
        ],
        bullets: [
          "Rally on rising volume: a healthy trend.",
          "Rally on falling volume, or volume rising on declines: a warning of wear.",
          "Volume usually changes before price: a loss of pressure shows up first in volume.",
        ],
      },
      {
        heading: "6. A trend is assumed to be in effect until it gives definite signals that it has reversed",
        paragraphs: [
          "This is the basis of all trend following: a market in motion tends to stay in motion until something makes it change. The hard part is telling a normal secondary correction from the first leg of a new trend, and Dow's own followers disagree about when the signal occurs.",
          "In the failure swing, rally C fails to exceed peak A, and the break of trough B produces the sell signal at S: there are already lower peaks and lower troughs. In the nonfailure swing, C exceeds A before price breaks B. Some sell right away at S1; others wait for a lower rally (E) and the break of D, at S2, to have two lower peaks and two lower troughs. The failure swing is the stronger signal.",
        ],
        caption: "Failure swing: C fails to exceed A, and the break of B produces the sell signal at S.",
      },
      {
        heading: "",
        paragraphs: [],
        caption:
          "Nonfailure swing: C exceeds A. The signal comes at S1 (break of B) or, for the more conservative, at S2 (break of D after the lower peak E).",
      },
      {
        heading: "Closing prices and \"lines\"",
        paragraphs: [
          "Dow used only closing prices: an average had to close above a peak or below a trough for the move to be meaningful. Intraday penetrations didn't count. It is the origin of the breakout filters still used today.",
          "\"Lines\" were sideways ranges in which price swings between two levels, usually as a consolidation within the trend. Today we call them rectangles.",
        ],
      },
      {
        heading: "Criticism and how to use it today",
        paragraphs: [
          "The most common criticism is that the signal comes late: on average, Dow Theory misses 20% to 25% of the move before confirming the new trend. But Dow never tried to anticipate tops and bottoms. He wanted to recognize the major bull and bear markets and capture the middle of the move. Between 1920 and 1975, his signals captured about two-thirds of the averages' moves.",
          "In practice, use the primary trend to decide the direction and the secondary trend to time the entry: buy the dips in an uptrend and sell the rallies in a downtrend. For those trading shorter time frames, as in futures, the minor trend gains importance for timing.",
        ],
      },
    ],
    takeaways: [
      "Uptrend = rising peaks and troughs; downtrend = declining peaks and troughs.",
      "Three degrees of trend: primary (more than 1 year), secondary (3 weeks to 3 months, retracing 1/3 to 2/3) and minor (less than 3 weeks).",
      "Three phases: accumulation, public participation and distribution.",
      "Important signals need confirmation between averages and from volume.",
      "Use closes, not shadows, and assume the trend continues until a clear reversal signal.",
    ],
  },
  "medias-moveis": {
    title: "Moving Averages",
    subtitle: "The types, the signals and when not to trust them",
    summary:
      "Simple, weighted and exponential averages; signals with one, two and three averages; envelopes and Bollinger Bands; the most used periods and why averages only work when there is a trend.",
    source: `${MURPHY}, ch. 9 (Moving Averages)`,
    sections: [
      {
        heading: "What a moving average is",
        paragraphs: [
          "A 10-day moving average adds the last 10 closes and divides by 10. The next day, the new close comes in and the oldest drops out: the data window moves along with the chart, hence the name.",
          "It is one of the most versatile and widely used indicators, and the basis of many automated trend-following systems. Its advantage over pattern reading is objectivity: two analysts may disagree on whether a shape is a triangle or a wedge, but not on whether price closed above or below the average.",
        ],
      },
      {
        heading: "A follower, not a leader",
        paragraphs: [
          "The average smooths price and makes the trend easier to see. But since it is made of past prices, it always lags: it anticipates nothing, it only confirms that a trend has begun or ended after the fact. Think of it as a curving trendline.",
          "The shorter it is, the closer it hugs price and the smaller the lag; the longer, the smoother and the more lagging. A 20-day average tracks price closely; a 200-day shows only the underlying direction. The lag shrinks in short averages, but never disappears.",
        ],
      },
      {
        heading: "Which price to use",
        paragraphs: [
          "The close is the most used price, and the one Murphy considers the most important of the day. There are variations: the day's midpoint, (high + low) ÷ 2; the typical price, (high + low + close) ÷ 3; and two separate averages, one of the highs and one of the lows, which form a neutral band around price.",
        ],
      },
      {
        heading: "The three types of average",
        paragraphs: ["The averages differ in how much weight they give to each price in the window."],
        bullets: [
          "Simple (SMA): the arithmetic mean, in which each day weighs the same (in a 10-day average, 10% each). It is the most used. It draws two criticisms: it only considers the days in the window and gives the oldest day the same weight as the most recent.",
          "Linearly weighted: multiplies the most recent day by the length of the window (10), the previous one by 9, and so on, and divides by the sum of the weights (55 in a 10-day average). It fixes the weighting, but still ignores what fell out of the window.",
          "Exponential (EMA): adds a percentage of today's price to a percentage of the average's own previous value, and the two add up to 100%. It gives more weight to recent data and, indirectly, includes all of history, with ever-smaller weight. Giving 10% to the last day is equivalent to an average of about 20 days; 5%, to one of about 40. In practice, you choose the period and the software computes the weight: 2 ÷ (period + 1).",
        ],
        caption: "The same series with an SMA 20 and an EMA 20: at the turn, the exponential reacts sooner and stays closer to price.",
      },
      {
        heading: "Signals with one average",
        paragraphs: [
          "The simplest signal: buy when price closes above the average, sell when it closes below. For more confirmation, wait for the average itself to turn in the direction of the crossing.",
          "Here lies the main trade-off of moving average analysis. A short average (5 or 10 days) gives earlier signals, but also many false ones, the whipsaws, because day-to-day noise crosses it all the time. A long one makes fewer mistakes while the trend lasts, but gives back much more profit when it turns, because it follows price from far behind. Murphy sums it up: longer averages work better while the trend remains in force; shorter ones, when it is turning.",
        ],
        caption: "With an SMA 10: buy when price moves above the average and sell when it falls back below it.",
      },
      {
        heading: "Two averages: the double crossover",
        paragraphs: [
          "That is why it is more common to use two averages. The buy signal comes when the shorter one crosses above the longer one; the sell signal, when it crosses below. The most popular combinations are 5 and 20 days, widely used in futures, and 10 and 50 days, in stocks. The method lags a little more than the single average, but produces fewer whipsaws.",
          "In stocks, a closely watched crossover is the 50-day SMA with the 200-day SMA, with the same logic: upward, it is often called a golden cross; downward, a death cross.",
        ],
        caption: "Double crossover with SMA 5 and SMA 20: the signals come a little after those of a single average, but with less noise.",
      },
      {
        heading: "Three averages: the 4-9-18 system",
        paragraphs: [
          "The best-known triple crossover uses 4-, 9- and 18-day averages, popularized by R. C. Allen in the 1970s, a variation of the classic 5, 10 and 20. In an uptrend, the proper order is the 4 above the 9, above the 18; in a downtrend, the reverse.",
          "At the end of a decline, the 4-day crossing above the other two is only a buy alert; confirmation comes when the 9-day also crosses above the 18. On a downturn, the reverse applies. During corrections, the averages may intertwine without the trend ending: some take profits at that moment and others use it to buy.",
        ],
      },
      {
        heading: "Envelopes",
        paragraphs: [
          "Envelopes are lines a fixed percentage above and below the average. They show when price has strayed too far from it, that is, when the move is stretched. In the short term, 3% around a 21-day SMA is common; in the long term, 5% around a 10-week average, or 10% around a 40-week one.",
        ],
        caption: "3% envelopes around an SMA 21: price touching the upper line signals a short-term stretched rally.",
      },
      {
        heading: "Envelopes in a sideways market: mean reversion",
        paragraphs: [
          "Murphy uses envelopes to measure when price is stretched. In practice, short-term traders turn this into two tactics, and the choice depends on the context. The first applies when the market is moving sideways, in a consolidation without a defined trend: price tends to return to the average after moving away from it.",
        ],
        bullets: [
          "Short sale: price rises to the upper band (for example, +3%) or pierces it, a sign of overbought. The first target is price returning to the central average.",
          "Short-term buy: price falls to the lower band (−3%) or pierces it, a sign of oversold. The target is price returning to the central average.",
          "The stop goes beyond the band that was touched: if price keeps moving away, the range may be turning into a trend, and then the right tactic is the next one.",
        ],
      },
      {
        heading: "Envelopes in a trend: trade with it",
        paragraphs: [
          "With a well-established uptrend or downtrend, the reading changes: touching the band is no longer excess but a sign of strength. Price can walk along the band, dragging it along, and those trading against it miss the whole trend.",
        ],
        bullets: [
          "In an uptrend: don't sell at the upper band. Dips to the central average or to the lower band are the buying points with the trend, and the upper band becomes the profit target.",
          "In a downtrend: the reverse. Rallies to the central average or to the upper band are used to open short positions with the major trend, with the lower band as the target.",
          "To know which case you're in, look at the slope of the average and the sequence of peaks and troughs: a flat average with price swinging between the bands points to a range; a sloping average with rising (or falling) peaks and troughs points to a trend.",
        ],
      },
      {
        heading: "Bollinger Bands",
        paragraphs: [
          "Created by John Bollinger, they sit two standard deviations above and below a 20-period average. At two deviations, about 95% of prices stay inside the bands. Touching the upper one signals overbought; the lower one, oversold.",
          "They also serve as targets: if price leaves the lower band and crosses the 20-period average, the upper band becomes the target; if it crosses below the average, the target becomes the lower band. In a strong uptrend, price usually swings between the upper band and the average, and losing the average warns that the trend may turn.",
          "The difference from envelopes is that the distance between the bands changes with volatility. Very wide bands usually appear at the end of a trend; very tight bands, before the start of a new one. They work best together with overbought and oversold oscillators.",
        ],
        caption: "Bollinger Bands (SMA 20 ± 2 standard deviations): tight in the calm phase and widening when price breaks out.",
      },
      {
        heading: "Why 5, 10, 20, 40 and 21",
        paragraphs: [
          "The monthly cycle, of about 20 sessions, is one of the strongest in the markets, and neighboring cycles are usually double or half of each other. That explains the popularity of the 5-, 10-, 20- and 40-day averages, and of the 4, 9 and 18 variations.",
          "Fibonacci numbers (13, 21, 34, 55) also work well as periods: the 21-day average is an example on the daily chart, and the 13-week one, on the weekly.",
          "Statistically, the right thing would be to center the average, plotting the 10-day one five days back. Since that delays the signals even more, only cycle analysts do it; on an ordinary chart, the average sits on the last day of the window.",
        ],
      },
      {
        heading: "Averages in the long term",
        paragraphs: [
          "On weekly charts, the 10- or 13-week averages, together with the 30- or 40-week ones, track the primary trend. The 200-day SMA is roughly equivalent to the 40-week one, and the 100-day SMA to the 20-week one. In bull market corrections, the 40-week average often acts as support.",
          "The average can also be applied to data other than price: volume, open interest, OBV and even oscillators.",
        ],
      },
      {
        heading: "When averages don't work",
        paragraphs: [
          "Because they follow the trend, averages enforce old market rules: trade with the trend, let profits run and cut losses early.",
          "The price of this is that they do poorly in sideways markets, which can take up one-third to one-half of the time. In those phases, every crossing is a false signal. That is why you can't rely on them alone: in a range, oscillators work better, and ADX helps tell whether there is a trend or not. The difference between two averages also becomes an oscillator: MACD compares two exponentials.",
        ],
        caption: "In a sideways market, price crosses the SMA 10 all the time: each dot marks a signal that came to nothing.",
      },
      {
        heading: "Alternatives and adjustments",
        paragraphs: [
          "Richard Donchian's 4-week rule (with its own lesson in this section): buy when price exceeds the high of the previous four weeks and sell when it falls below their low. In tests of futures systems, it ranked among the best, alongside the moving average crossover. To exit sooner, use a 1- or 2-week rule; to filter out ranges, extend it to 8.",
          "To optimize or not: you can ask the computer for the best average period for each market, but the result only counts if it is tested on data not used in the choice. Murphy suggests that those who follow few markets optimize, and that those who follow many, such as thousands of stocks, use the same parameters for all.",
          "Perry Kaufman's adaptive average: it adjusts its own speed by comparing direction with volatility. It slows down when the market moves sideways and speeds up when it trends.",
        ],
      },
      {
        heading: "In practice, according to Murphy",
        paragraphs: [
          "Most analysts use two simple averages. Exponentials became popular, but there is no real proof that they work better. The most used combinations:",
        ],
        bullets: [
          "Futures, on the daily chart: 4 and 9, 9 and 18, 5 and 20, 10 and 40.",
          "Stocks: the 50-day SMA (or 10 weeks) for the medium term; 30 and 40 weeks, or the 200-day SMA, for the long term.",
          "Bollinger Bands: a 20-day or 20-week average (the latter corresponds to a 100-day SMA on the daily chart).",
        ],
      },
      {
        heading: "In RiskTrade",
        paragraphs: [
          "The Moving averages bar, above the chart's drawing tools, has shortcuts for the 5-, 10-, 20-, 21-, 50- and 200-period simple averages, which make up the combinations Murphy recommends, and for the 9 and 21 exponentials, popular in the Brazilian market. The + Custom button creates any simple or exponential average from 2 to 400 candles. Up to four fit at once. The Combinations row applies the crossover setups in one go, replacing the averages on the chart; clicking the active combination again removes it. With two or three averages visible, the chart marks the crossings with this chapter's rules: buy and sell on the double crossover; alert and confirmation on the triple. The Crossover signals panel warns when there is a signal in the last five candles. Each visible simple average gets 3%, 5% and 10% envelope boxes; the SMA 21 with 3% is the book's short-term combination. With an envelope checked, the chart shows the signals of the tactics above (buy, sell and take profit), according to the context measured by the slope of the average, and the Envelope signals panel warns of signals in the last five candles. The Bollinger Bands box draws the bands (SMA 20 ± 2 deviations) and a panel applies the rules from the section on them. There is no weighted average on the chart yet.",
        ],
        bullets: [
          "Futures double crossover: the 5-20 combination (SMA 5 and SMA 20).",
          "Stock double crossover: the 10-50 combination (SMA 10 and SMA 50).",
          "Long-term trend: the SMA 50 and SMA 200 shortcuts, on the 1Y range or longer.",
          "4-9-18 system: the 4-9-18 combination adds all three averages at once, with the 4 in the first color.",
          "The period counts chart candles: on 1D, an EMA 21 covers 21 five-minute candles, not 21 days.",
        ],
      },
    ],
    takeaways: [
      "The moving average follows the trend: it confirms, never anticipates.",
      "A short average gives earlier signals and more whipsaws; a long one makes fewer mistakes but lags at the turn.",
      "The exponential reacts sooner than the simple one, but there is no proof it is better.",
      "Two averages (double crossover) make fewer mistakes than one.",
      "Envelopes and Bollinger Bands show when price is stretched; tight bands precede strong moves.",
      "In a sideways market, averages fail: that is where oscillators come in.",
    ],
  },
  "regra-das-4-semanas": {
    title: "The 4-Week Rule",
    subtitle: "Donchian's breakout system: simple and tested",
    summary:
      "Buy when price exceeds the high of the previous four weeks and sell when it falls below the low. How to use the rule, the version that exits sooner, the sensitivity adjustments and why 1, 2, 4 and 8 weeks have to do with cycles.",
    source: `${MURPHY}, ch. 9 (The Weekly Rule, pp. 215–219)`,
    sections: [
      {
        heading: "Origins",
        paragraphs: [
          "The 4-week rule was created by Richard Donchian, one of the pioneers of mechanical trend-following systems in futures. In 1970, Dunn & Hargitt's Trader's Notebook ran computer tests of the best-known systems of the time and concluded that the most profitable of all was precisely this rule.",
          "Later studies by Louis Lukac confirmed the result. Of 12 systems tested from 1975 to 1984, only 4 made significant profits, and 2 of them were channel breakout systems (the third, a double moving average crossover). In a larger study, of 23 systems from 1976 to 1986, channel breakouts and moving averages again came out on top, and Lukac began using the channel breakout as the starting point for developing any system.",
        ],
      },
      {
        heading: "The rule",
        paragraphs: ["The original version, designed for futures, has just two lines:"],
        bullets: [
          "Cover shorts and buy when price exceeds the high of the four preceding full weeks.",
          "Liquidate longs and sell short when price falls below the low of the four preceding full weeks.",
        ],
        caption:
          "The 4-week channel (about 20 sessions) tracks the recent high and low; the buy comes when price leaves the range and exceeds the high.",
      },
      {
        heading: "Continuous or noncontinuous",
        paragraphs: [
          "As originally stated, the rule is continuous: the system is always in the market, long or short, because each signal closes the prior position and opens the opposite one. The weak point of every continuous system is staying in the market during trendless phases, taking whipsaws, and trend-following systems do poorly precisely in those phases.",
          "The fix is to make it noncontinuous: a 4-week breakout opens the position, but a shorter opposite signal, of 1 or 2 weeks, closes it. After that, the trader stays out until a new 4-week breakout appears.",
        ],
        caption:
          "Noncontinuous version: the buy comes on the 4-week breakout and exits when price falls below the 2-week low, well before the 4-week low.",
      },
      {
        heading: "Why it works",
        paragraphs: [
          "The rule follows sound technical principles and gives clear, mechanical signals. Because it follows the trend, it guarantees participation on the right side of every important trend and honors the old maxim of letting profits run and cutting losses early. It also trades little, which cuts costs, and can be applied with or without a computer.",
          "The criticism is the same as for any trend-following system: it doesn't catch tops or bottoms. But no system of this kind does, and Murphy notes that the 4-week rule does at least as well as most of them, with the advantage of simplicity.",
        ],
      },
      {
        heading: "Adjustments",
        paragraphs: [
          "The rule doesn't have to be used as a complete system. The weekly signals also work as an indicator to identify breakouts and turns, or as a filter for other techniques. For example, a moving average crossover is only traded if a 2-week breakout in the same direction confirms it.",
          "The period can also be shortened or lengthened, depending on the desired risk and sensitivity:",
        ],
        bullets: [
          "Shorter, to be more sensitive: in a market that has rallied sharply, someone who bought the 4-week breakout with a stop below the 2-week low can switch to the 1-week low, protecting more of the profit.",
          "Longer, to filter out ranges: in a sideways market, extending to 8 weeks avoids short, premature signals while waiting for an important breakout.",
          "For more sensitive entries, 2 weeks can also be used on the entry.",
        ],
        caption: "In a sideways market, the 4-week rule gives several false signals (dots), while the 8-week channel isn't broken once.",
      },
      {
        heading: "Cycles: why 1, 2, 4 and 8 weeks",
        paragraphs: [
          "The monthly cycle, of 4 weeks or about 20 sessions, is one of the strongest in the markets, which helps explain the success of the 4 weeks. Under the principle of harmonicity, each cycle relates to its neighbors by a factor of 2: the next longer one is twice as long, and the shorter one, half.",
          "It is the same logic as the 5-, 10-, 20- and 40-day averages, which in weeks become 1, 2, 4 and 8. That is why the adjustments work best by dividing or multiplying by 2: to shorten, from 4 to 2 weeks, and from there to 1; to lengthen, from 4 to 8.",
        ],
      },
      {
        heading: "Price channels on charts",
        paragraphs: [
          "Charting software shows the rule as a price channel: one line at the high and another at the low of the last 20 sessions, following price. The buy signal comes when price closes above the upper channel, and only a close below the lower channel reverses the signal. The channel works on daily, weekly and monthly charts.",
        ],
      },
      {
        heading: "In RiskTrade",
        paragraphs: [
          "Check 4-week rule in the chart's averages bar, on a range with daily candles (3M or longer, or 23 days or more in the Days field):",
        ],
        bullets: [
          "The entry channel appears as steps: the high (red) and the low (green) of the previous weeks. Choose 4 weeks (original), 2 (more sensitive) or 8 (filters ranges).",
          "For the exit, choose the continuous version, which reverses the position on the channel itself, or the noncontinuous one, which exits at the 2- or 1-week low (or high), drawn dotted.",
          "The markers show each Buy, Sell and Exit, and the panel shows the system's position, the levels the close needs to break and the recent signals.",
          "Combine it with the moving average crossover panel to use the 2-week breakout as a filter, as Murphy suggests.",
        ],
      },
    ],
    takeaways: [
      "Buy when price exceeds the high of the previous 4 weeks; sell when it falls below the low.",
      "The rule was the most profitable system in the 1970 tests, and channel breakouts stayed on top in later studies.",
      "The continuous version suffers in ranges; exiting on a 1- or 2-week signal makes it noncontinuous.",
      "Shorten (2 or 1 week) for more sensitivity and lengthen (8 weeks) to filter out ranges.",
      "Adjustments work best by multiplying or dividing by 2, following the cycles: 1, 2, 4 and 8 weeks.",
      "Like every trend-following system, it doesn't catch tops or bottoms, and it doesn't need to.",
    ],
  },
  "ifr-de-wilder": {
    title: "Wilder's RSI",
    subtitle: "The Relative Strength Index: zones, failure swings and divergences",
    summary:
      "The most widely used oscillator in technical analysis: how it is calculated, how to read the 70 and 30 zones, why the signal comes when it moves back inside the band, the failure swing, divergences and how to adjust the period and levels to the trend.",
    source:
      "Murphy, Technical Analysis of the Financial Markets, ch. 10 (Oscillators and Contrary Opinion); J. Welles Wilder, New Concepts in Technical Trading Systems (1978)",
    sections: [
      {
        heading: "Origins",
        paragraphs: [
          "J. Welles Wilder introduced the Relative Strength Index (RSI) in 1978, in the book New Concepts in Technical Trading Systems. He wanted to fix two flaws of the simple momentum line: the sharp jumps that appear when a very high or very low price drops out of the calculation window, and the lack of a fixed scale to compare different assets and moments.",
          "The result is an oscillator that always ranges from 0 to 100, with smoother movement. Murphy describes it as one of the most popular oscillators among technical analysts.",
        ],
      },
      {
        heading: "How it is calculated",
        paragraphs: [
          "The RSI compares the average size of up moves with the average size of down moves over the last 14 periods. First, relative strength is calculated: RS = average gain ÷ average loss. Then, RSI = 100 − 100 ÷ (1 + RS).",
          "The averages use Wilder's smoothing: the first is the simple average of the first 14 changes; from then on, each new average is (previous average × 13 + today's change) ÷ 14. That way, an old day never drops out of the calculation all at once, and the line doesn't jump.",
        ],
        bullets: [
          "Example: if the average gain is 1.20 and the average loss is 0.60, RS = 2 and RSI = 100 − 100 ÷ 3 ≈ 66.7.",
          "Only gains in the window: the RSI reaches 100. Only losses: it reaches 0.",
          "Gains and losses of the same size: the RSI sits at 50.",
        ],
      },
      {
        heading: "Overbought and oversold: 70 and 30",
        paragraphs: [
          "Above 70, the market is overbought; below 30, oversold. These are warning zones, not signals: a strong move can keep the RSI in an extreme zone for a long time, and the first move into it is usually just a warning that the move is stretched.",
          "That is why Murphy recommends waiting for the move back: the sell signal comes when the RSI, after going above 70, moves back below it; the buy signal, when it moves back above 30.",
        ],
        caption: "A 14-period RSI on an oscillating price: the sell comes when it moves back below 70, and the buy when it moves back above 30.",
      },
      {
        heading: "The levels adjust to the trend",
        paragraphs: [
          "In a strong bull market, the RSI tends to swing between 40 and 80 and rarely reaches 30: 70 stops being a good sell level, and many analysts switch to 80 as overbought. In a bear market, the mirror image: the RSI moves between 20 and 60, and 20 becomes the oversold level.",
          "The 50 line also helps: above it, recent gains outweigh losses; below it, the reverse. Pullbacks that stop near 40 to 50 in an uptrend, without reaching 30, show the trend is still strong.",
        ],
      },
      {
        heading: "Failure swing",
        paragraphs: [
          "Wilder considered the failure swing the RSI's strongest signal. In a top failure swing, the RSI goes above 70 (A), pulls back (B), rallies without exceeding peak A (C) and then breaks below low B: that is the sell signal. The pattern shows that buying power couldn't repeat the peak, even with price still high.",
          "The bottom failure swing is the mirror image: the RSI falls below 30, bounces, pulls back without breaking the low and then exceeds the intervening high, a buy signal. In both cases, the signal depends only on the RSI, without looking at the price chart.",
        ],
        caption: "Top failure swing: C fails to exceed A, and the sell comes when the RSI breaks low B.",
      },
      {
        heading: "Divergences",
        paragraphs: [
          "When price makes a new high and the RSI makes a lower high, there is a bearish divergence: the move continues, but with less strength. The mirror image, price at a lower low and the RSI at a higher low, is a bullish divergence.",
          "For Murphy, divergence is the most important signal of oscillators, especially when the RSI's first peak is above 70 (or the first trough below 30). It is a warning: confirmation comes from price, such as the break of a trendline, or from the RSI itself, in a failure swing.",
        ],
        caption: "Price makes a higher high, but the 14-period RSI makes a lower high: the rally has lost strength.",
      },
      {
        heading: "Trendlines and patterns on the RSI itself",
        paragraphs: [
          "The RSI forms the same shapes as price: trendlines, support, resistance and even patterns such as triangles or head and shoulders. They often show up more clearly on the RSI, and the break of an RSI trendline can come before the corresponding break in price.",
        ],
      },
      {
        heading: "Which period to use",
        paragraphs: [
          "Wilder used 14 periods, and that remains the standard. The shorter the period, the more sensitive the RSI and the wider its amplitude: the 9-period RSI reaches the extreme zones more often and gives more signals, false ones included. The longer the period, the smoother the line: the 25-period RSI rarely leaves the 30 to 70 band.",
          "Murphy notes that those who shorten the period tend to widen the levels (80 and 20), and those who lengthen it tend to narrow them, so that signals keep appearing.",
        ],
      },
      {
        heading: "In a trend and in a sideways market",
        paragraphs: [
          "Oscillators work best in sideways markets, where price goes back and forth between support and resistance. In a strong trend, overbought and oversold conditions can last a long time, and trading against the trend at every touch of 70 or 30 is costly.",
          "Murphy's rule is to use the oscillator in the direction of the major trend: in an uptrend, buy when the RSI leaves oversold (or pulls back to 40 to 50) and only take profits when it is overbought; in a downtrend, sell when it leaves overbought.",
        ],
      },
      {
        heading: "Weekly and monthly",
        paragraphs: [
          "The RSI also works on weekly and monthly charts, with 14 weeks or 14 months. On those time frames, the extreme zones are rare and usually mark important market turns, and divergences carry even more weight.",
        ],
      },
      {
        heading: "In RiskTrade",
        paragraphs: ["Use the Wilder's RSI buttons in the chart's averages bar:"],
        bullets: [
          "Choose 14 (Wilder), 9 (more sensitive) or 25 (smoother). Clicking the active button again turns the RSI off.",
          "The RSI pane has a fixed 0 to 100 scale, with dashed 70 and 30 lines and a dotted 50 line.",
          "Arrows mark moves back inside the band (buy above 30, sell below 70), and circles mark failure swings.",
          "The reading panel shows the current zone, the last zone exit and the last failure swing.",
          "Drag the pane by its ⋮⋮ handle to put it right below price and compare divergences.",
        ],
      },
    ],
    takeaways: [
      "RSI = 100 − 100 ÷ (1 + average gain ÷ average loss), with Wilder's smoothing; it ranges from 0 to 100.",
      "70 and 30 mark overbought and oversold; the signal comes on the move back inside the band, not on the touch.",
      "In a strong trend, the levels shift: use 80 in an uptrend and 20 in a downtrend.",
      "The failure swing, when the RSI fails to repeat the extreme and breaks the intervening point, is Wilder's strongest signal.",
      "Divergences between the RSI and price, with the RSI in an extreme zone, are the most important warning.",
      "Trade the RSI in the direction of the major trend; it works best in a sideways market.",
    ],
  },
  estocastico: {
    title: "Stochastic %K %D",
    subtitle: "George Lane's oscillator: where the close falls within the recent range",
    summary:
      "How the stochastic measures the close's position between the recent high and low, the difference between the fast and slow versions, the 80 and 20 zones, %K crossing %D, divergences and how to combine it with the trend.",
    source: "Murphy, Technical Analysis of the Financial Markets, ch. 10 (Oscillators and Contrary Opinion)",
    sections: [
      {
        heading: "Origins",
        paragraphs: [
          "The stochastic oscillator was popularized by George Lane, president of Investment Educators, in the 1950s and 1960s. Along with Wilder's RSI, it is one of the oscillators most used by technical analysts.",
        ],
      },
      {
        heading: "The idea: where the close falls within the range",
        paragraphs: [
          "Lane started from a simple observation: in an uptrend, closes tend to be near the period's highs; in a downtrend, near the lows. When, in an uptrend, closes start moving away from the highs, buying power is fading, even if price is still rising.",
          "The stochastic measures exactly that: where today's close sits within the range between the high and the low of the last periods. Near 100, the close is at the top of the range; near 0, at the bottom.",
        ],
      },
      {
        heading: "How it is calculated",
        paragraphs: [
          "There are two lines. The main one, %K, is 100 × (close − lowest low of N) ÷ (highest high of N − lowest low of N), with N usually equal to 14. The second, %D, is a 3-period average of %K and works as a signal line.",
        ],
        bullets: [
          "Example: over the last 14 days, the high was 120 and the low 100. Closing today at 115, %K is 100 × (115 − 100) ÷ (120 − 100) = 75.",
          "Closing at the top of the range, %K is 100; at the bottom, it is 0.",
          "Because it uses highs and lows, not just closes, the stochastic reacts to intraday moves that the RSI doesn't see.",
        ],
      },
      {
        heading: "Fast and slow",
        paragraphs: [
          "The %K calculated directly (the fast stochastic) is very sensitive and swings too much. That is why most analysts use the slow stochastic: the fast %D becomes the new %K, and the new %D is a 3-period average of it. That is the (14, 3, 3) version, smoother and more reliable.",
        ],
        caption: "The fast %K (gray) and the slow %K (blue) on the same price: the slow one removes much of the noise.",
      },
      {
        heading: "The 80 and 20 zones",
        paragraphs: [
          "Above 80, the market is overbought; below 20, oversold. Some people use 70 and 30, as with the RSI. As with other oscillators, being in an extreme zone is a warning, not a signal: in a strong trend, the stochastic can spend a long time near 100 or 0.",
        ],
      },
      {
        heading: "%K crossing %D",
        paragraphs: [
          "The moment to act comes from the crossing of the two lines. A buy happens when %K crosses above %D with both lines below 20; a sell, when %K crosses below %D with both lines above 80. Crossings in the middle of the range carry little weight.",
          "Murphy notes that the right-hand crossover, when %K crosses %D after %D has already turned, is usually more reliable than the left-hand crossover, when %K crosses %D while %D is still moving in the prior direction.",
        ],
        caption: "Slow stochastic (14, 3, 3): the sell comes when %K crosses below %D above 80, and the buy when it crosses above below 20.",
      },
      {
        heading: "Divergences",
        paragraphs: [
          "For Murphy, the stochastic's most important signal is divergence between %D and price with %D in an extreme zone. In a bearish divergence, price makes a higher high and %D, above 80, makes a lower high: closes are moving away from the highs. The bullish divergence is the mirror image, below 20.",
          "As with every oscillator, divergence is a warning. The %K crossing %D, or the break of a trendline in price, gives the confirmation.",
        ],
        caption: "Price makes a higher high, but %D, above 80, makes a lower high: the rally has lost strength.",
      },
      {
        heading: "Stochastic and the trend",
        paragraphs: [
          "The stochastic works best in sideways markets. In a strong trend, it can stay in the extreme zone for days and generate countertrend signals that come to nothing.",
          "Murphy's rule is to use the oscillator in the direction of the major trend: in an uptrend, use dips of the stochastic below 20 to buy and use overbought only to take profits; in a downtrend, the reverse. One way to define the trend is the weekly stochastic: the weekly signal gives the direction, and the daily one the moment to enter.",
        ],
      },
      {
        heading: "Which period to use",
        paragraphs: [
          "Lane used 14 periods, and that is the standard. Short periods, such as 5 or 9, make the stochastic jumpier, with more signals and more false ones; they suit very short-term traders. Long periods, such as 21, bring the indicator closer to the monthly cycle and reduce noise.",
        ],
      },
      {
        heading: "Weekly and monthly",
        paragraphs: [
          "The stochastic can be applied to weekly and monthly charts. On those time frames, signals are rare and more important, and they serve as a filter for daily signals.",
        ],
      },
      {
        heading: "Stochastic and RSI",
        paragraphs: [
          "Both measure overbought and oversold, but in different ways. The RSI compares the size of up moves with that of down moves, using closes only. The stochastic compares the close with the range between high and low, which is why it reacts faster. Many analysts use both: a signal confirmed by both is stronger.",
        ],
      },
      {
        heading: "In RiskTrade",
        paragraphs: ["Use the Stochastic buttons in the chart's averages bar:"],
        bullets: [
          "Choose 14 (standard), 5 (short term) or 21 (monthly cycle), always in the slow version (N, 3, 3). Clicking the active button again turns the stochastic off.",
          "The pane shows %K (solid line) and %D (another color), with dashed 80 and 20 lines and a dotted 50 line.",
          "Arrows mark crossovers in the zones: buy when %K crosses above %D below 20, sell when it crosses below above 80.",
          "The reading panel shows %K, %D, the zone, the last crossover and the last zone signal.",
          "Drag the pane by its ⋮⋮ handle close to price and compare divergences; combine it with the RSI to confirm signals.",
        ],
      },
    ],
    takeaways: [
      "%K = 100 × (close − lowest low of N) ÷ (highest high of N − lowest low of N); %D is the 3-period average of %K.",
      "Use the slow version (14, 3, 3): the fast stochastic swings too much.",
      "80 and 20 mark overbought and oversold; being in the zone is a warning, not a signal.",
      "The signal comes from %K crossing %D in the extreme zones; the right-hand crossover is more reliable.",
      "Divergence between %D and price, with %D above 80 or below 20, is the most important signal.",
      "Trade in the direction of the major trend; the weekly stochastic helps define it.",
    ],
  },
  "ondas-de-elliott": {
    title: "Elliott Wave Theory",
    subtitle: "Pattern, ratio and time: the rhythm of 5 + 3 waves",
    summary:
      "The cycle of five waves with the trend and three against it, the degrees of trend, the rules of the impulse, the types of correction, alternation, channels and Fibonacci ratios.",
    source: `${MURPHY}, ch. 13 (Elliott Wave Theory)`,
    sections: [
      {
        heading: "Origins",
        paragraphs: [
          "Ralph Nelson Elliott presented the Wave Principle in the 1930s, strongly influenced by Dow Theory: he subscribed to Robert Rhea's service and saw his work as a complement to Dow. His definitive work, Nature's Law, came out in 1946. The theory was kept alive by Hamilton Bolton and popularized by A. J. Frost and Robert Prechter in the 1978 book Elliott Wave Principle.",
          "The theory has three aspects, in this order of importance: pattern (the shape of the waves), ratio (the proportions between waves, used for retracements and targets) and time (the duration relationships, considered the least reliable).",
        ],
      },
      {
        heading: "The basic cycle: 5 + 3",
        paragraphs: [
          "In its simplest form, the market follows a repetitive rhythm: five waves with the trend, followed by three waves against it. A complete cycle has eight waves.",
          "In an advance, waves 1, 3 and 5 are impulse waves: they go up. Waves 2 and 4 are corrective: they correct 1 and 3. Once the five-wave impulse is complete, a three-wave correction follows, labeled with the letters a, b and c.",
        ],
        caption: "A complete cycle: a five-wave impulse (1 to 5) and a three-wave correction (a, b, c).",
      },
      {
        heading: "Degrees and subdivisions",
        paragraphs: [
          "Elliott classified nine degrees of trend, from the Grand Supercycle, of about two hundred years, to the Subminuette, of a few hours. The basic eight-wave cycle is the same at any degree: each wave subdivides into waves of the next lower degree and is part of a wave of the next higher degree.",
          "What decides whether a wave subdivides into five or three is the direction of the larger wave it belongs to. Waves in the direction of the larger wave subdivide into five; waves against it, into three. That is why waves 1 and 2 together subdivide into 8 smaller waves, then into 34, then into 144: all numbers of the Fibonacci sequence.",
        ],
        caption: "Wave 1 subdivides into five smaller waves, because it moves with the trend; wave 2, into three (a-b-c), because it moves against it.",
      },
      {
        heading: "Fives and threes: what to expect next",
        paragraphs: [
          "Being able to tell a five-wave move from a three-wave one is what makes the theory useful, because it tells what comes next. A fundamental rule: a correction never happens in five waves (triangles are the exception).",
        ],
        bullets: [
          "In a bull market, a five-wave decline is probably just the first leg (a) of an a-b-c correction: there is more decline ahead.",
          "In a bear market, a three-wave rally should be followed by a resumption of the decline.",
          "A five-wave rally in a bear market is a warning of a stronger advance, and may be the first wave of a new bull market.",
          "A complete five-wave sequence is usually just part of a larger wave: there is more to come, unless it is the fifth wave of a fifth wave.",
        ],
      },
      {
        heading: "The rules of the impulse",
        paragraphs: [
          "Three classic rules, from Frost and Prechter, define a valid impulse count. If any is violated, the count is wrong and must be redone.",
        ],
        bullets: [
          "Wave 2 never retraces beyond the start of wave 1.",
          "Wave 3 is never the shortest of the three impulse waves (1, 3 and 5).",
          "Wave 4 doesn't enter wave 1's territory: its low can't fall below the top of wave 1. In stocks this rule is strict; in futures, intraday penetrations are tolerated.",
        ],
      },
      {
        heading: "Extensions",
        paragraphs: [
          "One of the three impulse waves usually extends, becoming much longer than the others. When that happens, the other two tend toward equality in size and duration: if 3 extends, 1 and 5 tend toward equality; if 5 extends, 1 and 3. In stocks, the wave that most often extends is 3; in commodities, 5.",
        ],
      },
      {
        heading: "Corrections",
        paragraphs: [
          "Corrective waves are less clear-cut and harder to forecast than impulse waves. Murphy divides them into three types.",
          "Zigzag (5-3-5): wave A falls in five, B rallies in three without returning to the start of A, and C falls in five, going well beyond the end of A. There is also the double zigzag: two zigzags joined by an a-b-c.",
        ],
        caption: "Zigzag (5-3-5) in a bull market correction.",
      },
      {
        heading: "",
        paragraphs: [
          "Flat (3-3-5): wave A has only three waves, B returns to the top of A and C ends near the bottom of A. It is more a consolidation than a correction, and in a bull market it is a sign of strength. There are irregular variations: in the first, B exceeds the top of A and C goes beyond the bottom of A; in the second, B reaches the top of A, but C doesn't reach the bottom of A, an even greater sign of strength.",
        ],
        caption: "Flat correction (3-3-5): B returns to the top of A and C ends near the bottom of A.",
      },
      {
        heading: "",
        paragraphs: [
          "Triangles: they normally appear in wave 4 (sometimes in wave B) and precede the final wave in the direction of the major trend. That is why they are both bullish and bearish: they signal that the advance will continue, but also that, after one more wave, the top will probably be near. The Elliott triangle has five waves (a, b, c, d, e), each with three smaller waves, and can be ascending, descending, symmetrical or expanding.",
          "The fifth wave after the triangle usually travels the width of the triangle, the same measurement as the classic target. According to Prechter, the triangle's apex often marks the moment the fifth wave ends. Wave e sometimes breaks the triangle's line in a false signal before the final thrust.",
        ],
        caption: "Triangle in wave 4, followed by the final thrust (wave 5).",
      },
      {
        heading: "The rule of alternation",
        paragraphs: [
          "The market rarely does the same thing twice in a row. Applied to corrections: if wave 2 was simple, like an a-b-c, wave 4 will probably be complex, like a triangle, and vice versa. The rule doesn't say exactly what will happen, but it says what probably won't.",
        ],
      },
      {
        heading: "Channels",
        paragraphs: [
          "Elliott used channels to project targets and confirm counts. After waves 1 and 2, draw a line through the lows of 1 and 2 and a parallel through the top of 1. If wave 3 accelerates and breaks the channel, redraw it: the line goes through the top of 1 and the low of 2.",
          "The final channel is drawn through the lows of waves 2 and 4, with the parallel through the top of wave 3. Wave 5 usually ends near the upper line. In long trends, Murphy recommends using a logarithmic scale alongside the arithmetic one.",
        ],
        caption: "Final channel: base on the lows of waves 2 and 4 and a parallel through the top of 3. Wave 5 ends near the upper line.",
      },
      {
        heading: "Wave 4 as support",
        paragraphs: [
          "Once five waves up are complete, the bear market that follows usually doesn't fall below the low of the previous fourth wave of lesser degree. There are exceptions, but this reference is useful for estimating how far a decline may go.",
        ],
      },
      {
        heading: "Fibonacci: the mathematical basis",
        paragraphs: [
          "Elliott pointed to the Fibonacci sequence (1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144…) as the basis of the theory. Each number is the sum of the two before it. The ratio of a number to the next approaches 0.618; to the previous one, 1.618; and between alternate numbers, 0.382 and 2.618. The first ratios, 1/1, 1/2 and 2/3, give the classic retracements of 100%, 50% and 66%.",
          "These ratios are used to estimate targets and retracements.",
        ],
        bullets: [
          "Minimum target for wave 3: the length of wave 1 × 1.618, added to the bottom of wave 2.",
          "Target for wave 5: the length of wave 1 × 3.236, added to the top or the bottom of wave 1 (maximum and minimum targets).",
          "If waves 1 and 3 are about equal and 5 extends: the distance from the bottom of 1 to the top of 3, × 1.618, added to the bottom of 4.",
          "Zigzag: wave c is often the same length as a; or it measures 0.618 × a, from the end of a.",
          "Flat correction in which b reaches the top of a: wave c often measures 1.618 × a.",
          "Most common retracements: 38%, 50% and 62%. In a strong trend, the minimum retracement is usually near 38%; in a weak one, the maximum near 62%.",
          "Time: peaks and troughs may fall on Fibonacci days, weeks or months (13, 21, 34, 55, 89) counted from an important turning point. It is the least reliable aspect, because there are too many relationships to choose from after the fact.",
        ],
      },
      {
        heading: "Elliott and Dow",
        paragraphs: [
          "Dow's three bull market phases correspond to Elliott's three impulse waves (1, 3 and 5), with waves 2 and 4 between them. Both also drew inspiration from the sea: Dow spoke of tides, waves and ripples; Elliott called his theory the wave principle.",
        ],
      },
      {
        heading: "In practice",
        paragraphs: [
          "There are times when the Elliott count is clear and others when it isn't. Forcing the market into an Elliott shape while ignoring the other tools is a misuse of the theory. Use it as one part of the answer, together with trends, patterns, volume and indicators.",
          "The theory was created for stock averages and works best where participation is broad, because it rests on mass psychology. In individual stocks and thinly traded markets, it works less well.",
          "In RiskTrade, use the Fibonacci tool to measure the retracements of waves 2 and 4, the Channel tool to draw the channel of waves 2 and 4, and the risk calculator to place the stop below the start of wave 1 on a wave 2 entry (the rule that invalidates the count).",
        ],
      },
    ],
    takeaways: [
      "A cycle has 8 waves: 5 with the trend (1–5) and 3 against it (a-b-c).",
      "Waves with the larger wave subdivide into 5; waves against it, into 3. Corrections never have 5 waves, except triangles.",
      "Impulse rules: wave 2 doesn't go past the start of 1, 3 is not the shortest and 4 doesn't enter 1's territory.",
      "Corrections: zigzag (5-3-5), flat (3-3-5) and triangle (normally in wave 4). By alternation, if 2 was simple, 4 tends to be complex.",
      "Fibonacci gives targets and retracements (38%, 50% and 62%). The order of importance is pattern, then ratio, then time.",
      "Use Elliott together with the other tools and don't force counts.",
    ],
  },
};
