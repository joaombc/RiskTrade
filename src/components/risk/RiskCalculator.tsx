"use client";

import { useEffect, useId, useMemo, useState } from "react";
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

function toInput(price: number): string {
  return price.toFixed(price < 1 ? 4 : 2).replace(".", ",");
}

interface Props {
  symbol: string;
  currency: string;
  currentPrice: number;
  onLevelsChange: (levels: PlanLevel[]) => void;
}

export function RiskCalculator({ symbol, currency, currentPrice, onLevelsChange }: Props) {
  // Montado só no cliente (após a cotação), então o localStorage está disponível.
  const [settings, setSettings] = useState<Settings>(() => load(SETTINGS_KEY, { capital: "", riskPercent: "1" }));
  const [plan, setPlan] = useState<SymbolPlan>(() =>
    load(PLAN_KEY_PREFIX + symbol, {
      direction: "long" as Direction,
      entry: toInput(currentPrice),
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
      }),
    [settings, plan.direction, plan.lotSize, entry, stop, target],
  );

  // Linhas no gráfico: só os níveis válidos do plano (entrada e stop coerentes).
  const levels = useMemo<PlanLevel[]>(() => {
    if (!result.ok || entry === undefined || stop === undefined) return [];
    const list: PlanLevel[] = [
      { price: entry, label: "Entrada", kind: "entry" },
      { price: stop, label: "Stop", kind: "stop" },
    ];
    if (target !== undefined) list.push({ price: target, label: "Alvo", kind: "target" });
    const first = result.plan.partials?.[0]?.price;
    if (first !== undefined) list.push({ price: first, label: "1/3 (1R)", kind: "partial" });
    return list;
  }, [result, entry, stop, target]);

  useEffect(() => onLevelsChange(levels), [levels, onLevelsChange]);
  useEffect(() => () => onLevelsChange([]), [onLevelsChange]);

  const money = (value: number) => {
    try {
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency || "BRL" }).format(value);
    } catch {
      return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
    }
  };
  const update = (patch: Partial<SymbolPlan>) => setPlan((p) => ({ ...p, ...patch }));
  const long = plan.direction === "long";

  return (
    <section aria-label={`Gestão de risco para ${symbol}`} className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Gestão de risco</h2>
          <p className="text-xs text-muted">Defina o stop antes de entrar. O tamanho da posição sai do risco aceito.</p>
        </div>
        <div role="group" aria-label="Direção" className="flex rounded-lg bg-border/60 p-0.5 text-xs font-medium">
          {(["long", "short"] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={plan.direction === d}
              onClick={() => update({ direction: d })}
              className={`rounded-md px-3 py-1 ${plan.direction === d ? (d === "long" ? "bg-positive text-white" : "bg-negative text-white") : "text-muted"}`}
            >
              {d === "long" ? "Compra" : "Venda"}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="grid grid-cols-2 gap-3 self-start">
          <Field
            label={`Capital total${currency ? ` (${currency})` : ""}`}
            value={settings.capital}
            placeholder="100.000"
            onChange={(v) => setSettings((s) => ({ ...s, capital: v }))}
            className="col-span-2"
          />
          <Field
            label="Risco por operação (%)"
            value={settings.riskPercent}
            placeholder="1"
            onChange={(v) => setSettings((s) => ({ ...s, riskPercent: v }))}
            hint={`Recomendado: 1% a ${RECOMMENDED_MAX_RISK_PERCENT}%`}
          />
          <Field
            label="Lote"
            value={plan.lotSize}
            inputMode="numeric"
            onChange={(v) => update({ lotSize: v.replace(/\D/g, "") })}
            hint={symbol.endsWith(".SA") ? "100 = lote padrão B3" : "Múltiplo de negociação"}
          />
          <Field
            label="Entrada"
            value={plan.entry}
            onChange={(v) => update({ entry: v })}
            className="col-span-2"
            action={{ label: "Usar preço atual", onClick: () => update({ entry: toInput(currentPrice) }) }}
          />
          <Field
            label="Stop-loss"
            value={plan.stop}
            placeholder={long ? "Abaixo do suporte" : "Acima da resistência"}
            onChange={(v) => update({ stop: v })}
            hint={long ? "Logo abaixo do suporte" : "Logo acima da resistência"}
          />
          <Field
            label="Alvo"
            value={plan.target}
            placeholder={long ? "Acima da entrada" : "Abaixo da entrada"}
            onChange={(v) => update({ target: v })}
            hint="Ex.: alvo do padrão"
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
  const qty = plan.quantity.toLocaleString("pt-BR");
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <Stat label="Quantidade" value={qty} emphasis />
        <Stat label="Valor da posição" value={money(plan.positionValue)} />
        <Stat
          label="Risco efetivo"
          value={money(plan.actualRisk)}
          detail={`${plan.actualRiskPercent.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% do capital · máx. ${money(plan.maxRisk)}`}
        />
      </div>

      {hasTarget && plan.rewardRisk !== undefined ? (
        <RewardRiskBadge rewardRisk={plan.rewardRisk} ok={Boolean(plan.meetsMinRewardRisk)} profit={plan.potentialProfit} money={money} />
      ) : (
        <p className="rounded-xl border border-dashed border-border p-3 text-sm text-muted">
          Defina o alvo para validar a relação recompensa/risco (mínimo {MIN_REWARD_RISK}:1) e planejar as parciais.
        </p>
      )}

      {plan.partials && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Realização parcial em terços</h3>
          <table className="w-full text-sm">
            <thead className="sr-only">
              <tr>
                <th>Parcial</th>
                <th>Quantidade</th>
                <th>Preço</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {plan.partials.map((p) => (
                <tr key={p.label} className="border-t border-border align-top">
                  <td className="py-2 pr-2">
                    <div className="font-medium">{p.label}</div>
                    <div className="text-xs text-muted">{p.note}</div>
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums">{p.quantity.toLocaleString("pt-BR")}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{p.price !== undefined ? money(p.price) : "Stop móvel"}</td>
                  <td className="py-2 text-right tabular-nums text-positive">{p.profit !== undefined ? `+${money(p.profit)}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {plan.riskFreeProfit !== undefined && (
            <p className="mt-2 rounded-lg bg-positive/10 p-2 text-xs text-positive">
              Após o 1º terço, com o stop na entrada, a operação fica livre de risco: o pior resultado passa a ser +{money(plan.riskFreeProfit)}.
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
  const ratio = rewardRisk.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  // Barra até 5:1, com marca no mínimo de 3:1.
  const fill = Math.min(rewardRisk / 5, 1) * 100;
  return (
    <div role={ok ? undefined : "alert"} className={`rounded-xl border p-3 ${ok ? "border-positive/40 bg-positive/10" : "border-negative/40 bg-negative/10"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className={`text-lg font-semibold tabular-nums ${ok ? "text-positive" : "text-negative"}`}>
          Recompensa/Risco {ratio} : 1
        </span>
        {profit !== undefined && <span className="text-sm tabular-nums text-muted">Potencial: +{money(profit)}</span>}
      </div>
      <div className="relative mt-2 h-1.5 rounded-full bg-border" aria-hidden>
        <div className={`h-full rounded-full ${ok ? "bg-positive" : "bg-negative"}`} style={{ width: `${fill}%` }} />
        <div className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-foreground" style={{ left: `${(MIN_REWARD_RISK / 5) * 100}%` }} />
      </div>
      <p className={`mt-2 text-xs ${ok ? "text-positive" : "text-negative"}`}>
        {ok
          ? "Relação saudável: o alvo paga ao menos 3 vezes o risco assumido."
          : `Abaixo de ${MIN_REWARD_RISK}:1. O alvo não compensa o risco: reavalie o stop, o alvo ou não entre.`}
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
