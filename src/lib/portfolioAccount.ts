import { parseDecimal } from "./risk";

/**
 * Conta da carteira com as regras gerais de gestão do dinheiro de Murphy (cap. 16): quanto do
 * capital fica investido, quanto vai para cada ativo e cada grupo, quanto se arrisca por operação
 * e a relação ganho/risco mínima. Cálculos puros e o salvamento no navegador.
 */

export type Profile = "conservative" | "standard" | "murphy" | "aggressive";
export const PROFILES: Profile[] = ["conservative", "standard", "murphy", "aggressive"];

export interface AccountLimits {
  /** % do capital investido no total (o resto fica em caixa). */
  maxInvested: number;
  /** % do capital num único ativo. */
  maxPerAsset: number;
  /** % do capital que se aceita perder numa operação. */
  riskPerTrade: number;
  /** % do capital num grupo ou setor. */
  maxPerGroup: number;
  /** Ganho mínimo, em múltiplos do risco. */
  minRewardRisk: number;
}

export type LimitKey = keyof AccountLimits;
export const LIMIT_KEYS: LimitKey[] = ["maxInvested", "maxPerAsset", "riskPerTrade", "maxPerGroup", "minRewardRisk"];

/**
 * Perfis prontos. "murphy" são os números do livro (futuros: 50%, 10–15%, 5%, 20–25%, 3:1); o
 * "standard" troca o risco de 5% pelos 2% mais usados em ações.
 */
export const PROFILE_LIMITS: Record<Profile, AccountLimits> = {
  conservative: { maxInvested: 40, maxPerAsset: 10, riskPerTrade: 1, maxPerGroup: 20, minRewardRisk: 3 },
  standard: { maxInvested: 50, maxPerAsset: 15, riskPerTrade: 2, maxPerGroup: 25, minRewardRisk: 3 },
  murphy: { maxInvested: 50, maxPerAsset: 15, riskPerTrade: 5, maxPerGroup: 25, minRewardRisk: 3 },
  aggressive: { maxInvested: 75, maxPerAsset: 25, riskPerTrade: 3, maxPerGroup: 40, minRewardRisk: 2 },
};

/** Os limites de Murphy: acima deles (abaixo, no ganho/risco), o app avisa. */
export const MURPHY_LIMITS = PROFILE_LIMITS.murphy;

/** Faixa aceita em cada campo. */
export const LIMIT_RANGES: Record<LimitKey, [number, number]> = {
  maxInvested: [5, 100],
  maxPerAsset: [1, 100],
  riskPerTrade: [0.1, 10],
  maxPerGroup: [1, 100],
  minRewardRisk: [1, 10],
};

export type Currency = "BRL" | "USD";
export const CURRENCIES: Currency[] = ["BRL", "USD"];

export interface Account {
  capital: number | null;
  currency: Currency;
  /** null: limites personalizados (não batem com nenhum perfil). */
  profile: Profile | null;
  limits: AccountLimits;
}

export const DEFAULT_ACCOUNT: Account = { capital: null, currency: "BRL", profile: "standard", limits: PROFILE_LIMITS.standard };

/** O perfil cujos limites são exatamente estes; null se nenhum. */
export function profileOf(limits: AccountLimits): Profile | null {
  return PROFILES.find((p) => LIMIT_KEYS.every((k) => PROFILE_LIMITS[p][k] === limits[k])) ?? null;
}

export type LimitIssue =
  | { key: LimitKey; kind: "range"; min: number; max: number }
  | { key: "maxPerAsset"; kind: "assetAboveInvested" }
  | { key: "maxPerGroup"; kind: "groupBelowAsset" }
  | { key: "maxPerGroup"; kind: "groupAboveInvested" };

/** Erros que impedem salvar: fora da faixa ou incoerentes entre si. */
export function limitErrors(limits: AccountLimits): LimitIssue[] {
  const errors: LimitIssue[] = [];
  for (const key of LIMIT_KEYS) {
    const [min, max] = LIMIT_RANGES[key];
    const value = limits[key];
    if (!Number.isFinite(value) || value < min || value > max) errors.push({ key, kind: "range", min, max });
  }
  if (errors.length) return errors;
  if (limits.maxPerAsset > limits.maxInvested) errors.push({ key: "maxPerAsset", kind: "assetAboveInvested" });
  if (limits.maxPerGroup < limits.maxPerAsset) errors.push({ key: "maxPerGroup", kind: "groupBelowAsset" });
  if (limits.maxPerGroup > limits.maxInvested) errors.push({ key: "maxPerGroup", kind: "groupAboveInvested" });
  return errors;
}

/** Limites mais arriscados que os de Murphy (permitidos, mas com aviso). */
export function limitWarnings(limits: AccountLimits): LimitKey[] {
  return LIMIT_KEYS.filter((key) => (key === "minRewardRisk" ? limits[key] < MURPHY_LIMITS[key] : limits[key] > MURPHY_LIMITS[key]));
}

export interface AccountBudget {
  /** Pode ficar investido no total. */
  investable: number;
  /** Fica em caixa. */
  reserve: number;
  perAsset: number;
  perGroup: number;
  /** Perda máxima aceita numa operação. */
  riskPerTrade: number;
  /** Quantos ativos cabem no limite total, cada um no limite por ativo. */
  maxPositions: number;
}

/** Os limites em dinheiro; null sem capital. */
export function accountBudget(account: Account): AccountBudget | null {
  const { capital, limits } = account;
  if (capital === null || !(capital > 0)) return null;
  const pct = (p: number) => (capital * p) / 100;
  return {
    investable: pct(limits.maxInvested),
    reserve: capital - pct(limits.maxInvested),
    perAsset: pct(limits.maxPerAsset),
    perGroup: pct(limits.maxPerGroup),
    riskPerTrade: pct(limits.riskPerTrade),
    maxPositions: Math.floor(limits.maxInvested / limits.maxPerAsset),
  };
}

const STORAGE_KEY = "risktrade:portfolio:account:v1";
/** Avisa os outros painéis da página que a conta mudou. */
export const ACCOUNT_CHANGE_EVENT = "risktrade:portfolio-account-change";
/** Capital e risco da "Gestão de risco" do painel do ativo (mesmo formato de lá). */
const RISK_SETTINGS_KEY = "risktrade:risk-settings:v1";

/** Valida o que veio do storage; o que estiver errado volta ao padrão. */
export function parseAccount(raw: unknown): Account {
  if (typeof raw !== "object" || raw === null) return DEFAULT_ACCOUNT;
  const r = raw as Partial<Account>;
  const capital = typeof r.capital === "number" && r.capital > 0 ? r.capital : null;
  const currency = CURRENCIES.includes(r.currency as Currency) ? (r.currency as Currency) : DEFAULT_ACCOUNT.currency;
  const limits = Object.fromEntries(
    LIMIT_KEYS.map((k) => [k, typeof r.limits?.[k] === "number" ? r.limits[k] : DEFAULT_ACCOUNT.limits[k]]),
  ) as unknown as AccountLimits;
  const valid = limitErrors(limits).length === 0;
  const finalLimits = valid ? limits : DEFAULT_ACCOUNT.limits;
  return { capital, currency, limits: finalLimits, profile: profileOf(finalLimits) };
}

/** Conta salva. Sem conta, usa o capital e o risco da "Gestão de risco", se houver. */
export function loadAccount(): Account {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return parseAccount(JSON.parse(raw));
    const risk = JSON.parse(localStorage.getItem(RISK_SETTINGS_KEY) ?? "null");
    const capital = parseNumber(risk?.capital);
    const riskPerTrade = parseNumber(risk?.riskPercent);
    const limits = { ...DEFAULT_ACCOUNT.limits, ...(riskPerTrade !== null ? { riskPerTrade } : {}) };
    return parseAccount({ ...DEFAULT_ACCOUNT, capital, limits });
  } catch {
    return DEFAULT_ACCOUNT;
  }
}

/** Salva a conta e leva capital e risco para a "Gestão de risco" do painel do ativo. */
export function saveAccount(account: Account): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
    window.dispatchEvent(new Event(ACCOUNT_CHANGE_EVENT));
    const risk = JSON.parse(localStorage.getItem(RISK_SETTINGS_KEY) ?? "{}");
    localStorage.setItem(
      RISK_SETTINGS_KEY,
      JSON.stringify({ ...risk, capital: account.capital === null ? "" : formatNumber(account.capital), riskPercent: formatNumber(account.limits.riskPerTrade) }),
    );
  } catch {
    // Storage bloqueado: a conta vale só nesta sessão.
  }
}

/** A "Gestão de risco" mudou capital ou risco: atualiza a conta da carteira, se ela existir. */
export function syncAccountFromRiskSettings(capitalText: string, riskText: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const account = parseAccount(JSON.parse(raw));
    const capital = parseNumber(capitalText);
    const riskPerTrade = parseNumber(riskText);
    const limits = riskPerTrade !== null ? { ...account.limits, riskPerTrade } : account.limits;
    if (limitErrors(limits).length) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...account, capital, limits, profile: profileOf(limits) }));
  } catch {
    // Storage bloqueado: nada a sincronizar.
  }
}

/** Número do storage ou digitado ("100.000,50", "100000.5", 2); null se inválido. */
function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  return typeof value === "string" ? (parseDecimal(value) ?? null) : null;
}

/** Número no formato dos campos da "Gestão de risco" (vírgula decimal). */
function formatNumber(n: number): string {
  return String(n).replace(".", ",");
}
