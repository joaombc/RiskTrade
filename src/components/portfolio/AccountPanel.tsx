"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import {
  accountBudget,
  CURRENCIES,
  LIMIT_KEYS,
  limitErrors,
  limitWarnings,
  loadAccount,
  MURPHY_LIMITS,
  PROFILE_LIMITS,
  PROFILES,
  profileOf,
  saveAccount,
  type Account,
  type AccountLimits,
  type Currency,
  type LimitKey,
} from "@/lib/portfolioAccount";
import { parseDecimal } from "@/lib/risk";

const noSubscription = () => () => {};
/** true depois da hidratação: só então o localStorage pode ser lido. */
const useHydrated = () => useSyncExternalStore(noSubscription, () => true, () => false);

type Drafts = { capital: string } & Record<LimitKey, string>;

const toText = (n: number, locale: string) => n.toLocaleString(locale, { maximumFractionDigits: 2, useGrouping: false });
const draftsOf = (account: Account, locale: string): Drafts => ({
  capital: account.capital === null ? "" : account.capital.toLocaleString(locale, { maximumFractionDigits: 2 }),
  ...(Object.fromEntries(LIMIT_KEYS.map((k) => [k, toText(account.limits[k], locale)])) as Record<LimitKey, string>),
});

/** Conta da carteira: capital, moeda, perfil e os limites de Murphy (cap. 16). */
export function AccountPanel() {
  const { t, locale } = useI18n();
  const a = t.portfolio.account;
  // Só no cliente: o storage não existe no servidor, então o painel começa vazio e carrega depois.
  const [account, setAccount] = useState<Account | null>(null);
  const [drafts, setDrafts] = useState<Drafts | null>(null);
  const hydrated = useHydrated();
  if (hydrated && account === null) {
    const loaded = loadAccount();
    setAccount(loaded);
    setDrafts(draftsOf(loaded, locale));
  }

  // Os campos digitados viram uma conta; inválidos ficam destacados e não são salvos.
  const parsed = useMemo(() => {
    if (!drafts || !account) return null;
    const limits = Object.fromEntries(LIMIT_KEYS.map((k) => [k, parseDecimal(drafts[k]) ?? NaN])) as unknown as AccountLimits;
    const capitalValue = parseDecimal(drafts.capital);
    const capitalError = drafts.capital.trim() !== "" && !(capitalValue !== undefined && capitalValue > 0);
    return { limits, capital: capitalValue && capitalValue > 0 ? capitalValue : null, capitalError, errors: limitErrors(limits) };
  }, [drafts, account]);

  useEffect(() => {
    if (!account || !parsed || parsed.capitalError || parsed.errors.length) return;
    const next: Account = { ...account, capital: parsed.capital, limits: parsed.limits, profile: profileOf(parsed.limits) };
    saveAccount(next);
  }, [account, parsed]);

  if (!account || !drafts || !parsed) {
    return <section aria-label={a.title} className="h-64 animate-pulse rounded-2xl border border-border bg-surface" />;
  }

  const valid = !parsed.capitalError && parsed.errors.length === 0;
  const current: Account = valid ? { ...account, capital: parsed.capital, limits: parsed.limits } : account;
  const profile = profileOf(parsed.limits);
  const budget = accountBudget(current);
  const warnings = valid ? limitWarnings(parsed.limits) : [];
  const money = (value: number) => new Intl.NumberFormat(locale, { style: "currency", currency: current.currency, maximumFractionDigits: 0 }).format(value);
  const setDraft = (key: keyof Drafts, value: string) => setDrafts((d) => (d ? { ...d, [key]: value } : d));
  const applyProfile = (limits: AccountLimits) =>
    setDrafts((d) => (d ? { ...d, ...(Object.fromEntries(LIMIT_KEYS.map((k) => [k, toText(limits[k], locale)])) as Record<LimitKey, string>) } : d));
  const murphyText = (key: LimitKey) => (key === "minRewardRisk" ? `${toText(MURPHY_LIMITS[key], locale)}${a.ratioSuffix}` : `${toText(MURPHY_LIMITS[key], locale)}%`);

  return (
    <section aria-labelledby="conta-carteira" className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div>
        <h2 id="conta-carteira" className="text-xl font-semibold">
          {a.title}
        </h2>
        <p className="mt-1 text-sm text-muted">{a.subtitle}</p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{a.capital}</span>
          <input
            inputMode="decimal"
            value={drafts.capital}
            placeholder={a.capitalPlaceholder}
            onChange={(e) => setDraft("capital", e.target.value)}
            aria-invalid={parsed.capitalError}
            className={`w-48 rounded-lg border bg-background px-3 py-2 tabular-nums ${parsed.capitalError ? "border-negative" : "border-border"}`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{a.currency}</span>
          <select
            value={account.currency}
            onChange={(e) => setAccount({ ...account, currency: e.target.value as Currency })}
            className="rounded-lg border border-border bg-background px-3 py-2"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div role="group" aria-label={a.profile} className="flex flex-col gap-2">
        <span className="text-sm font-medium">{a.profile}</span>
        <div className="flex flex-wrap gap-1.5">
          {PROFILES.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={profile === p}
              title={a.profileHints[p]}
              onClick={() => applyProfile(PROFILE_LIMITS[p])}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                profile === p ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:bg-border/60 hover:text-foreground"
              }`}
            >
              {a.profiles[p]}
            </button>
          ))}
          {profile === null && <span className="rounded-full border border-dashed border-foreground px-3 py-1 text-xs font-medium">{a.custom}</span>}
        </div>
        <p className="text-xs text-muted">{profile ? a.profileHints[profile] : null}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {LIMIT_KEYS.map((key) => {
          const error = parsed.errors.find((e) => e.key === key);
          const warning = warnings.includes(key);
          const ratio = key === "minRewardRisk";
          return (
            <label key={key} className="flex flex-col gap-1 rounded-xl border border-border p-3 text-sm" title={a.limits[key].hint}>
              <span className="font-medium">{a.limits[key].label}</span>
              <span className="flex items-center gap-1">
                <input
                  inputMode="decimal"
                  value={drafts[key]}
                  onChange={(e) => setDraft(key, e.target.value)}
                  aria-invalid={!!error}
                  className={`w-16 rounded-md border bg-background px-2 py-1 text-right tabular-nums ${error ? "border-negative" : "border-border"}`}
                />
                <span className="text-muted">{ratio ? a.ratioSuffix : "%"}</span>
              </span>
              <span className="text-[11px] leading-snug text-muted">{a.limits[key].hint}</span>
              {error && (
                <span className="text-[11px] font-medium text-negative">
                  {error.kind === "range" ? fmt(a.errors.range, { min: toText(error.min, locale), max: toText(error.max, locale) }) : a.errors[error.kind]}
                </span>
              )}
              {!error && warning && (
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  {fmt(ratio ? a.warningBelow : a.warningAbove, { limit: murphyText(key) })}
                </span>
              )}
            </label>
          );
        })}
      </div>

      {!valid && <p className="text-xs font-medium text-negative">{a.notSaved}</p>}

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">{a.budgetTitle}</h3>
        {budget ? (
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {(
              [
                ["investable", money(budget.investable)],
                ["reserve", money(budget.reserve)],
                ["perAsset", money(budget.perAsset)],
                ["perGroup", money(budget.perGroup)],
                ["riskPerTrade", money(budget.riskPerTrade)],
                ["maxPositions", fmt(a.maxPositionsValue, { n: budget.maxPositions })],
              ] as const
            ).map(([key, value]) => (
              <div key={key} className="rounded-lg border border-border p-2">
                <dt className="text-[11px] text-muted">{a.budget[key]}</dt>
                <dd className={`text-sm font-semibold tabular-nums ${key === "riskPerTrade" ? "text-negative" : ""}`}>{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-muted">{a.noCapital}</p>
        )}
      </div>

      <p className="text-[11px] text-muted">{a.synced}</p>
    </section>
  );
}
