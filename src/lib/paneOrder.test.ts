import { describe, expect, it } from "vitest";
import { DEFAULT_PANE_ORDER, isDefaultPaneOrder, movePane, normalizePaneOrder, visiblePanes, type PaneId } from "./paneOrder";

const BASE: PaneId[] = ["price", "volume", "obv"];

describe("ordem dos painéis", () => {
  it("completa a ordem salva e descarta lixo", () => {
    expect(normalizePaneOrder(null)).toEqual(DEFAULT_PANE_ORDER);
    expect(normalizePaneOrder(["momentum", "price", "price", "xyz", 3])).toEqual(["momentum", "price", "volume", "obv", "openInterest"]);
  });

  it("mostra só os painéis abertos, na ordem escolhida", () => {
    const order: PaneId[] = ["price", "momentum", "volume", "obv", "openInterest"];
    expect(visiblePanes(order, [...BASE, "momentum"])).toEqual(["price", "momentum", "volume", "obv"]);
    expect(visiblePanes(order, BASE)).toEqual(["price", "volume", "obv"]);
  });

  it("move o momentum para logo abaixo do preço", () => {
    const present: PaneId[] = [...BASE, "momentum"];
    const order = movePane(DEFAULT_PANE_ORDER, present, "momentum", 1);
    expect(visiblePanes(order, present)).toEqual(["price", "momentum", "volume", "obv"]);
    expect(order).toEqual(["price", "momentum", "volume", "obv", "openInterest"]);
  });

  it("move o preço para baixo", () => {
    const order = movePane(DEFAULT_PANE_ORDER, BASE, "price", 2);
    expect(visiblePanes(order, BASE)).toEqual(["volume", "obv", "price"]);
  });

  it("painéis fechados mantêm o lugar relativo", () => {
    // Interesse aberto fechado, logo depois do OBV; o OBV sobe para o topo e o interesse aberto vai junto.
    const order = movePane(DEFAULT_PANE_ORDER, [...BASE, "momentum"], "obv", 0);
    expect(order).toEqual(["obv", "openInterest", "price", "volume", "momentum"]);
  });

  it("limita a posição de destino", () => {
    expect(visiblePanes(movePane(DEFAULT_PANE_ORDER, BASE, "volume", 99), BASE)).toEqual(["price", "obv", "volume"]);
    expect(visiblePanes(movePane(DEFAULT_PANE_ORDER, BASE, "obv", -3), BASE)).toEqual(["obv", "price", "volume"]);
  });

  it("reconhece a ordem padrão", () => {
    expect(isDefaultPaneOrder(DEFAULT_PANE_ORDER)).toBe(true);
    expect(isDefaultPaneOrder(movePane(DEFAULT_PANE_ORDER, BASE, "price", 1))).toBe(false);
  });
});
