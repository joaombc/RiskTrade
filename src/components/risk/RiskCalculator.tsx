"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import {
  computeRiskPlan,
  MIN_REWARD_RISK,
  parseDecimal,
  RECOMMENDED_MAX_RISK_PERCENT,
  type Direction,
  type PlanLevel,
  type RiskPlan,
} from "@/lib/risk";

interface Settings {
  capital: string;
  riskPercent: string;
}

interface SymbolPlan {
  direction: Direction;
  entry: string;
  stop: string;
  target: string;
  lotSize: string;
}

const SETTINGS_KEY = "risktrade:risk-settings:v1";
const PLAN_KEY_PREFIX = "risktrade:risk-plan:v1:";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sem storage os valores valem só nesta sessão.
  }
}

/** Preço no formato do campo: vírgula decimal em português, ponto em inglês. */
function toInput(price: number, locale: string): string {
  const text = price.toFixed(price < 1 ? 4 : 2);
  return locale === "pt-BR" ? text.replace(".", ",") : text;
}

interface Props {
  symbol: string;
  currency: string;
  currentPrice: number;
  onLevelsChange: (levels: PlanLevel[]) => void;
}

export function RiskCalculator({ symbol, currency, currentPrice, onLevelsChange }: Props) {
  const { t, locale } = useI18n();
  const r = t.risk;
  // Montado só no cliente (após a cotação), então o localStorage está disponível.
  const [settings, setSettings] = useState<Settings>(() => load(SETTINGS_KEY, { capital: "", riskPercent: "1" }));
  const [plan, setPlan] = useState<SymbolPlan>(() =>
    load(PLAN_KEY_PREFIX + symbol, {
      direction: "long" as Direction,
      entry: toInput(currentPrice, locale),
      stop: "",
      target: "",
      lotSize: symbol.endsWith(".SA") ? "100" : "1",
    }),
  );

  useEffect(() => save(SETTINGS_KEY, settings), [settings]);
  useEffect(() => save(PLAN_KEY_PREFIX + symbol, plan), [symbol, plan]);

  const entry = parseDecimal(plan.entry);
  const stop = parseDecimal(plan.stop);
  const target = parseDecimal(plan.target);
  const result = useMemo(
    () =>
      computeRiskPlan({
        capital: parseDecimal(settings.capital) ?? NaN,
        riskPercent: parseDecimal(settings.riskPercent) ?? NaN,
        direction: plan.direction,
        entry: entry ?? NaN,
        stop: stop ?? NaN,
        target,
        lotSize: Number(plan.lotSize),
      }, r.messages),
    [settings, plan.direction, plan.lotSize, entry, stop, target, r.messages],
  );

  // Linhas no gráfico: só os níveis válidos do plano (entrada e stop coerentes).
  const levels = useMemo<PlanLevel[]>(() => {
    if (!result.ok || entry === undefined || stop === undefined) return [];
    const list: PlanLevel[] = [
      { price: entry, label: r.levelEntry, kind: "entry" },
      { price: stop, label: r.levelStop, kind: "stop" },
    ];
    if (target !== undefined) list.push({ price: target, label: r.levelTarget, kind: "target" });
    const first = result.plan.partials?.[0]?.price;
    if (first !== undefined) list.push({ price: first, label: "1/3 (1R)", kind: "partial" });
    return list;
  }, [result, entry, stop, target, r]);

  useEffect(() => onLevelsChange(levels), [levels, onLevelsChange]);
  useEffect(() => () => onLevelsChange([]), [onLevelsChange]);

  const money = (value: number) => {
    try {
      return new Intl.NumberFormat(locale, { style: "currency", currency: currency || "BRL" }).format(value);
    } catch {
      return value.toLocaleString(locale, { maximumFractionDigits: 2 });
    }
  };
  const update = (patch: Partial<SymbolPlan>) => setPlan((p) => ({ ...p, ...patch }));
  const long = plan.direction === "long";

  return (
    <section aria-label={fmt(r.label, { symbol })} className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{r.title}</h2>
          <p className="text-xs text-muted">{r.subtitle}</p>
        </div>
        <div role="group" aria-label={r.direction} className="flex rounded-lg bg-border/60 p-0.5 text-xs font-medium">
          {(["long", "short"] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={plan.direction === d}
              onClick={() => update({ direction: d })}
              className={`rounded-md px-3 py-1 ${plan.direction === d ? (d === "long" ? "bg-positive text-white" : "bg-negative text-white") : "text-muted"}`}
            >
              {d === "long" ? r.long : r.short}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="grid grid-cols-2 gap-3 self-start">
          <Field
            label={currency ? fmt(r.capitalCurrency, { currency }) : r.capital}
            value={settings.capital}
            placeholder={r.capitalPlaceholder}
            onChange={(v) => setSettings((s) => ({ ...s, capital: v }))}
            className="col-span-2"
          />
          <Field
            label={r.riskPercent}
            value={settings.riskPercent}
            placeholder="1"
            onChange={(v) => setSettings((s) => ({ ...s, riskPercent: v }))}
            hint={fmt(r.recommended, { max: RECOMMENDED_MAX_RISK_PERCENT })}
          />
          <Field
            label={r.lot}
            value={plan.lotSize}
            inputMode="numeric"
            onChange={(v) => update({ lotSize: v.replace(/\D/g, "") })}
            hint={symbol.endsWith(".SA") ? r.lotB3 : r.lotOther}
          />
          <Field
            label={r.entry}
            value={plan.entry}
            onChange={(v) => update({ entry: v })}
            className="col-span-2"
            action={{ label: r.useCurrent, onClick: () => update({ entry: toInput(currentPrice, locale) }) }}
          />
          <Field
            label={r.stop}
            value={plan.stop}
            placeholder={long ? r.stopPlaceholderLong : r.stopPlaceholderShort}
            onChange={(v) => update({ stop: v })}
            hint={long ? r.stopHintLong : r.stopHintShort}
          />
          <Field
            label={r.target}
            value={plan.target}
            placeholder={long ? r.targetPlaceholderLong : r.targetPlaceholderShort}
            onChange={(v) => update({ target: v })}
            hint={r.targetHint}
          />
        </div>

        <div aria-live="polite">
          {result.ok ? (
            <PlanSummary plan={result.plan} money={money} hasTarget={target !== undefined} />
          ) : (
            <ul className="flex flex-col gap-1 rounded-xl border border-border p-4 text-sm text-muted">
              {result.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function PlanSummary({ plan, money, hasTarget }: { plan: RiskPlan; money: (v: number) => string; hasTarget: boolean }) {
  const { t, locale } = useI18n();
  const r = t.risk;
  const qty = plan.quantity.toLocaleString(locale);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <Stat label={r.quantity} value={qty} emphasis />
        <Stat label={r.positionValue} value={money(plan.positionValue)} />
        <Stat
          label={r.actualRisk}
          value={money(plan.actualRisk)}
          detail={fmt(r.actualRiskDetail, {
            percent: plan.actualRiskPercent.toLocaleString(locale, { maximumFractionDigits: 2 }),
            max: money(plan.maxRisk),
          })}
        />
      </div>

      {hasTarget && plan.rewardRisk !== undefined ? (
        <RewardRiskBadge rewardRisk={plan.rewardRisk} ok={Boolean(plan.meetsMinRewardRisk)} profit={plan.potentialProfit} money={money} />
      ) : (
        <p className="rounded-xl border border-dashed border-border p-3 text-sm text-muted">
          {fmt(r.noTargetHint, { min: MIN_REWARD_RISK })}
        </p>
      )}

      {plan.partials && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{r.partialsTitle}</h3>
          <table className="w-full text-sm">
            <thead className="sr-only">
              <tr>
                <th>{r.partial}</th>
                <th>{r.quantity}</th>
                <th>{r.price}</th>
                <th>{r.result}</th>
              </tr>
            </thead>
            <tbody>
              {plan.partials.map((p) => (
                <tr key={p.label} className="border-t border-border align-top">
                  <td className="py-2 pr-2">
                    <div className="font-medium">{p.label}</div>
                    <div className="text-xs text-muted">{p.note}</div>
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums">{p.quantity.toLocaleString(locale)}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{p.price !== undefined ? money(p.price) : r.trailingStop}</td>
                  <td className="py-2 text-right tabular-nums text-positive">{p.profit !== undefined ? `+${money(p.profit)}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {plan.riskFreeProfit !== undefined && (
            <p className="mt-2 rounded-lg bg-positive/10 p-2 text-xs text-positive">
              {fmt(r.riskFree, { profit: money(plan.riskFreeProfit) })}
            </p>
          )}
        </div>
      )}

      {plan.warnings.length > 0 && (
        <ul className="flex flex-col gap-1">
          {plan.warnings.map((w) => (
            <li key={w} className="rounded-lg bg-warning/10 p-2 text-xs text-warning">
              {w}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RewardRiskBadge({
  rewardRisk,
  ok,
  profit,
  money,
}: {
  rewardRisk: number;
  ok: boolean;
  profit?: number;
  money: (v: number) => string;
}) {
  const { t, locale } = useI18n();
  const r = t.risk;
  const ratio = rewardRisk.toLocaleString(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  // Barra até 5:1, com marca no mínimo de 3:1.
  const fill = Math.min(rewardRisk / 5, 1) * 100;
  return (
    <div role={ok ? undefined : "alert"} className={`rounded-xl border p-3 ${ok ? "border-positive/40 bg-positive/10" : "border-negative/40 bg-negative/10"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className={`text-lg font-semibold tabular-nums ${ok ? "text-positive" : "text-negative"}`}>
          {fmt(r.rewardRisk, { ratio })}
        </span>
        {profit !== undefined && <span className="text-sm tabular-nums text-muted">{fmt(r.potential, { profit: money(profit) })}</span>}
      </div>
      <div className="relative mt-2 h-1.5 rounded-full bg-border" aria-hidden>
        <div className={`h-full rounded-full ${ok ? "bg-positive" : "bg-negative"}`} style={{ width: `${fill}%` }} />
        <div className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-foreground" style={{ left: `${(MIN_REWARD_RISK / 5) * 100}%` }} />
      </div>
      <p className={`mt-2 text-xs ${ok ? "text-positive" : "text-negative"}`}>
        {ok ? r.healthy : fmt(r.unhealthy, { min: MIN_REWARD_RISK })}
      </p>
    </div>
  );
}

function Stat({ label, value, detail, emphasis }: { label: string; value: string; detail?: string; emphasis?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted">{label}</div>
      <div className={`break-words tabular-nums ${emphasis ? "text-2xl font-semibold" : "text-base font-medium"}`}>{value}</div>
      {detail && <div className="text-[11px] text-muted">{detail}</div>}
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  className?: string;
  inputMode?: "decimal" | "numeric";
  action?: { label: string; onClick: () => void };
}

function Field({ label, value, onChange, placeholder, hint, className = "", inputMode = "decimal", action }: FieldProps) {
  const id = useId();
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium">
          {label}
        </label>
        {action && (
          <button type="button" onClick={action.onClick} className="text-[11px] font-medium text-accent hover:underline">
            {action.label}
          </button>
        )}
      </div>
      <input
        id={id}
        value={value}
        inputMode={inputMode}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm tabular-nums outline-none placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/25"
      />
      {hint && <span className="text-[11px] text-muted">{hint}</span>}
    </div>
  );
}
