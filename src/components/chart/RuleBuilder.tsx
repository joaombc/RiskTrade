"use client";

import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { CONDITION_OPTIONS, conditionKey, mirror, type Condition, type ConditionId, type CustomRules } from "@/lib/customSystem";

interface Props {
  rules: CustomRules;
  onChange: (rules: CustomRules) => void;
  /** Comprado e vendido: mostra as regras espelhadas do lado vendido. */
  shortSide: boolean;
}

/** Máximo de condições em cada regra. */
const MAX_CONDITIONS = 5;

const GROUPS: { id: "trend" | "macd" | "oscillators" | "wilder"; conditions: ConditionId[] }[] = [
  { id: "trend", conditions: ["maCross", "priceMa", "channel"] },
  { id: "macd", conditions: ["macdCross", "macdZero"] },
  { id: "oscillators", conditions: ["rsiExit", "rsiMid", "cciExit", "rocZero"] },
  { id: "wilder", conditions: ["adx", "di", "sarFlip", "sarSide"] },
];

/** Regras de entrada e saída do "Meu sistema" (Murphy, cap. 15: crie o seu). */
export function RuleBuilder({ rules, onChange, shortSide }: Props) {
  const { t } = useI18n();
  const c = t.backtest.custom;
  const label = (cond: Condition) => fmt(c.conditions[cond.id][cond.side], { a: cond.params[0] ?? "", b: cond.params[1] ?? "" });

  const section = (kind: "entry" | "exit") => {
    const list = rules[kind];
    const used = new Set(list.map(conditionKey));
    return (
      <div className="flex flex-col gap-1.5">
        <h4 className="text-xs font-semibold">{c[kind]}</h4>
        <ul className="flex flex-wrap gap-1.5">
          {list.map((cond, k) => (
            <li key={conditionKey(cond)} className="flex items-center rounded-full border border-border bg-surface text-xs">
              {k > 0 && <span className="pl-2.5 text-muted">{(kind === "entry" ? c.and : c.or).trim()}</span>}
              <span className="py-1 pl-2.5">{label(cond)}</span>
              <button
                type="button"
                aria-label={fmt(c.remove, { name: label(cond) })}
                title={fmt(c.remove, { name: label(cond) })}
                onClick={() => onChange({ ...rules, [kind]: list.filter((x) => conditionKey(x) !== conditionKey(cond)) })}
                className="rounded-full px-2 py-1 text-muted hover:text-negative"
              >
                ×
              </button>
            </li>
          ))}
          {list.length < MAX_CONDITIONS && (
            <li>
              <select
                value=""
                aria-label={`${c[kind]}: ${c.add}`}
                onChange={(e) => {
                  const cond = CONDITION_OPTIONS.find((x) => conditionKey(x) === e.target.value);
                  if (cond) onChange({ ...rules, [kind]: [...list, cond] });
                }}
                className="rounded-full border border-dashed border-border bg-surface px-2.5 py-1 text-xs text-muted"
              >
                <option value="">{c.add}</option>
                {GROUPS.map((group) => (
                  <optgroup key={group.id} label={c.groups[group.id]}>
                    {CONDITION_OPTIONS.filter((x) => group.conditions.includes(x.id) && !used.has(conditionKey(x))).map((x) => (
                      <option key={conditionKey(x)} value={conditionKey(x)}>
                        {label(x)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </li>
          )}
        </ul>
        {kind === "entry" && list.length === 0 && <p className="text-xs text-negative">{c.noEntry}</p>}
        {kind === "exit" && list.length === 0 && <p className="text-xs text-muted">{c.noExit}</p>}
      </div>
    );
  };

  const join = (list: Condition[], sep: string) => list.map((x) => label(mirror(x))).join(sep);
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      {section("entry")}
      {section("exit")}
      {shortSide && rules.entry.length > 0 && (
        <p className="text-xs text-muted">
          {rules.exit.length > 0
            ? fmt(c.mirror, { entry: join(rules.entry, c.and), exit: join(rules.exit, c.or) })
            : fmt(c.mirrorNoExit, { entry: join(rules.entry, c.and) })}
        </p>
      )}
      <p className="text-[11px] text-muted">{c.eventsHint}</p>
    </div>
  );
}
