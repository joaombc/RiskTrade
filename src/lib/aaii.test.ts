import { describe, expect, it } from "vitest";
import { aaiiMood, parseAaiiSentiment, readAaii } from "./aaii";

const row = (date: string, bull: string, neutral: string, bear: string) => `
  <tr align="center" bgcolor="ffffff">
    <td align="left" class="tableTxt">${date}</td>
    <td align="right" class="tableTxt">${bull}% </td>
    <td align="right" class="tableTxt">${neutral}%</td>
    <td align="right" class="tableTxt">${bear}% </td>
  </tr>`;

const table = (rows: string[]) => `
  <table><tr><td class="tableSubHd2">Reported Date</td><td>Bullish</td><td>Neutral</td><td>Bearish</td></tr>
  ${rows.join("")}</table>`;

describe("tabela da AAII", () => {
  it("lê as semanas da mais nova para a mais antiga, com o ano deduzido", () => {
    const html = table([row("Oct 7", "40.3", "20.8", "39.0"), row("Sep 30", "34.6", "18.9", "46.5")]);
    expect(parseAaiiSentiment(html, new Date("2026-10-08T15:00:00Z"))).toEqual([
      { date: "2026-10-07", bullish: 40.3, neutral: 20.8, bearish: 39 },
      { date: "2026-09-30", bullish: 34.6, neutral: 18.9, bearish: 46.5 },
    ]);
  });

  it("volta um ano na virada de dezembro para janeiro", () => {
    const html = table([row("Jan 8", "40", "30", "30"), row("Dec 31", "35", "30", "35"), row("Dec 24", "33", "30", "37")]);
    expect(parseAaiiSentiment(html, new Date("2027-01-09T12:00:00Z")).map((w) => w.date)).toEqual([
      "2027-01-08",
      "2026-12-31",
      "2026-12-24",
    ]);
  });

  it("uma semana que, no ano de hoje, cairia no futuro é do ano passado", () => {
    const html = table([row("Dec 31", "35", "30", "35")]);
    expect(parseAaiiSentiment(html, new Date("2027-01-03T12:00:00Z"))[0].date).toBe("2026-12-31");
  });

  it("ignora o cabeçalho e páginas sem a tabela", () => {
    expect(parseAaiiSentiment("<html><body>Access denied</body></html>", new Date())).toEqual([]);
  });
});

describe("leitura", () => {
  const weeks = [
    { date: "2026-10-07", bullish: 40.3, neutral: 20.8, bearish: 39 },
    { date: "2026-09-30", bullish: 34.6, neutral: 18.9, bearish: 46.5 },
    { date: "2026-09-23", bullish: 32.7, neutral: 19.2, bearish: 48.1 },
  ];

  it("spread, variação semanal e histórico da mais antiga para a mais nova", () => {
    const r = readAaii(weeks, 2)!;
    expect(r.date).toBe("2026-10-07");
    expect(r.spread).toBe(1.3);
    expect(r.change).toEqual({ bullish: 5.7, neutral: 1.9, bearish: -7.5 });
    expect(r.mood).toBe("normal");
    expect(r.history.map((w) => w.date)).toEqual(["2026-09-30", "2026-10-07"]);
  });

  it("uma semana só: sem variação", () => {
    expect(readAaii(weeks.slice(0, 1))!.change).toBeNull();
  });

  it("sem semanas, não há leitura", () => {
    expect(readAaii([])).toBeNull();
  });

  it("faixas do spread: ≤ −10 pessimismo acentuado, ≥ +30 otimismo excessivo", () => {
    expect(aaiiMood(-10)).toBe("pessimistic");
    expect(aaiiMood(-9.9)).toBe("normal");
    expect(aaiiMood(29.9)).toBe("normal");
    expect(aaiiMood(30)).toBe("optimistic");
  });
});
