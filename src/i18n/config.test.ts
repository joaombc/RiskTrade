import { describe, expect, it } from "vitest";
import { localePath, preferredLocale, switchLocalePath } from "./config";
import { fmt } from "./format";

describe("preferredLocale", () => {
  it("usa a escolha salva no cookie", () => {
    expect(preferredLocale("en-US", "pt-BR,pt;q=0.9")).toBe("en-US");
  });

  it("sem cookie, segue a ordem de preferência do navegador", () => {
    expect(preferredLocale(undefined, "en-GB,en;q=0.9,pt;q=0.8")).toBe("en-US");
    expect(preferredLocale(undefined, "fr-FR,pt-PT;q=0.9,en;q=0.8")).toBe("pt-BR");
    expect(preferredLocale(undefined, "en;q=0.5,pt-BR;q=0.9")).toBe("pt-BR");
  });

  it("cai no português sem nada reconhecível", () => {
    expect(preferredLocale("xx", "fr,de")).toBe("pt-BR");
    expect(preferredLocale(null, null)).toBe("pt-BR");
  });
});

describe("caminhos por idioma", () => {
  it("prefixa o idioma, inclusive em consulta e âncora na raiz", () => {
    expect(localePath("en-US", "/")).toBe("/en-US");
    expect(localePath("en-US", "/glossario#oco")).toBe("/en-US/glossario#oco");
    expect(localePath("pt-BR", "/?ativo=AAPL&periodo=1y")).toBe("/pt-BR?ativo=AAPL&periodo=1y");
    expect(localePath("pt-BR", "https://exemplo.com")).toBe("https://exemplo.com");
  });

  it("troca o idioma mantendo a página", () => {
    expect(switchLocalePath("/pt-BR/glossario/teorias/medias-moveis", "en-US")).toBe("/en-US/glossario/teorias/medias-moveis");
    expect(switchLocalePath("/en-US", "pt-BR")).toBe("/pt-BR");
    expect(switchLocalePath("/candles", "en-US")).toBe("/en-US/candles");
  });
});

describe("fmt", () => {
  it("preenche as variáveis e mantém as desconhecidas", () => {
    expect(fmt("Venda em {date}: {what}", { date: "05/10", what: "cruzou" })).toBe("Venda em 05/10: cruzou");
    expect(fmt("{a} e {b}", { a: 1 })).toBe("1 e {b}");
  });
});
