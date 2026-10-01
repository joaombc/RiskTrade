import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadDrawings, saveDrawings } from "./storage";
import type { Drawing } from "./types";

const valid: Drawing = { id: "a", kind: "trendline", points: [{ time: 1, price: 2 }, { time: 3, price: 4 }], options: { extend: true } };

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("storage de desenhos", () => {
  it("salva e recarrega por ativo", () => {
    saveDrawings("PETR4.SA", [valid]);
    expect(loadDrawings("PETR4.SA")).toEqual([valid]);
    expect(loadDrawings("AAPL")).toEqual([]);
  });

  it("descarta entradas inválidas e JSON corrompido", () => {
    localStorage.setItem("risktrade:drawings:v1:X", JSON.stringify([valid, { id: "b", kind: "nope", points: [] }]));
    expect(loadDrawings("X")).toEqual([valid]);
    localStorage.setItem("risktrade:drawings:v1:Y", "{not json");
    expect(loadDrawings("Y")).toEqual([]);
  });

  it("não quebra se o storage estiver indisponível", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(loadDrawings("X")).toEqual([]);
    expect(() => saveDrawings("X", [valid])).not.toThrow();
  });
});
