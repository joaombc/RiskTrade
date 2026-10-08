/**
 * Ordem dos painéis do gráfico, escolhida pelo usuário arrastando as alças. A ordem guarda todos
 * os painéis, inclusive os que estão fechados (momentum, interesse aberto), para que eles voltem
 * na mesma posição quando aparecerem.
 */

export const PANE_IDS = ["price", "volume", "obv", "openInterest", "momentum", "maOscillator"] as const;
export type PaneId = (typeof PANE_IDS)[number];

export const DEFAULT_PANE_ORDER: PaneId[] = [...PANE_IDS];

const isPaneId = (value: unknown): value is PaneId => (PANE_IDS as readonly unknown[]).includes(value);

/** Completa uma ordem salva: ignora ids desconhecidos ou repetidos e encaixa os que faltam. */
export function normalizePaneOrder(saved: unknown): PaneId[] {
  const order = Array.isArray(saved) ? [...new Set(saved.filter(isPaneId))] : [];
  return withMissing(order, DEFAULT_PANE_ORDER);
}

/** Painéis abertos, na ordem escolhida. */
export function visiblePanes(order: PaneId[], present: PaneId[]): PaneId[] {
  return order.filter((id) => present.includes(id));
}

/**
 * Move `id` para a posição `to` entre os painéis abertos. Os fechados mantêm o lugar relativo:
 * cada um volta logo depois do painel que o precedia.
 */
export function movePane(order: PaneId[], present: PaneId[], id: PaneId, to: number): PaneId[] {
  const visible = visiblePanes(order, present).filter((p) => p !== id);
  visible.splice(Math.max(0, Math.min(to, visible.length)), 0, id);
  return withMissing(visible, order);
}

/** Encaixa em `order` os ids de `reference` que faltam, logo depois do vizinho anterior em `reference`. */
function withMissing(order: PaneId[], reference: PaneId[]): PaneId[] {
  const result = [...order];
  reference.forEach((id, i) => {
    if (result.includes(id)) return;
    const before = reference.slice(0, i).reverse().find((p) => result.includes(p));
    result.splice(before ? result.indexOf(before) + 1 : 0, 0, id);
  });
  return result;
}

export const isDefaultPaneOrder = (order: PaneId[]) => order.every((id, i) => id === DEFAULT_PANE_ORDER[i]);

const STORAGE_KEY = "risktrade:pane-order:v1";

/** Ordem salva (vale para todos os ativos). Storage bloqueado ou vazio: a ordem padrão. */
export function loadPaneOrder(): PaneId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizePaneOrder(raw ? JSON.parse(raw) : null);
  } catch {
    return DEFAULT_PANE_ORDER;
  }
}

export function savePaneOrder(order: PaneId[]): void {
  try {
    if (isDefaultPaneOrder(order)) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    // Storage bloqueado: a ordem vale só nesta sessão.
  }
}
