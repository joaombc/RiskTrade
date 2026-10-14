"use client";

import Link from "next/link";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { Bar } from "@/lib/drawings/types";
import type { ElliottCount } from "@/lib/elliott";
import { TREND_DEGREES, type Trend, type TrendDegree } from "@/lib/trend";

interface Props {
  bars: Bar[];
  counts: ElliottCount[];
  degree: TrendDegree;
  onDegreeChange: (degree: TrendDegree) => void;
  /** Prazo escolhido sozinho pelo período do gráfico (e não pelo usuário). */
  auto: boolean;
  onAuto: () => void;
  /** Tendência pelos topos e fundos no mesmo prazo, para o contexto. */
  trend: Trend | null;
  intraday: boolean;
}

const RULES = ["wave2", "wave3", "wave4"] as const;

/** Leitura da contagem de Elliott: ondas, regras, proporções de Fibonacci, níveis e alternativas (Murphy, cap. 13). */
export function ElliottPanel({ bars, counts, degree, onDegreeChange, auto, onAuto, trend, intraday }: Props) {
  const { t, locale, href } = useI18n();
  const e = t.elliott;
  const num = (v: number) => v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (v: number) => `${(v * 100).toLocaleString(locale, { maximumFractionDigits: 1 })}%`;
  /** Proporção de Fibonacci com as 3 casas de sempre (1,618 e não 1,62). */
  const times = (v: number) => `${v.toLocaleString(locale, { maximumFractionDigits: 3 })}×`;
  const dateFormat = new Intl.DateTimeFormat(
    locale,
    intraday ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "2-digit", year: "2-digit" },
  );
  const dateOf = (i: number) => dateFormat.format(new Date(bars[i].time * 1000));
  const [best, ...others] = counts;
  const labels = (c: ElliottCount) => c.points.filter((p) => p.label !== "0").map((p) => p.label + (p.provisional ? "?" : "")).join("-");

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {e.title} <span className="font-normal text-muted">{e.params}</span>
        </h3>
        <div role="group" aria-label={e.degree} className="flex flex-wrap gap-1">
          {TREND_DEGREES.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={d === degree}
              onClick={() => onDegreeChange(d)}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                d === degree ? "border-foreground bg-foreground text-background" : "border-border text-muted hover:bg-border/60 hover:text-foreground"
              }`}
            >
              {t.ma.trendDegrees[d]}
            </button>
          ))}
        </div>
      </div>

      <p className="-mt-1 text-[11px] text-muted">
        {auto ? (
          e.autoNote
        ) : (
          <button type="button" onClick={onAuto} className="font-medium text-accent hover:underline">
            {e.autoReset}
          </button>
        )}
      </p>

      {!best ? (
        <p className="text-sm text-muted">{e.none}</p>
      ) : (
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <strong>{e.count}</strong> {e.direction[best.direction]} ·{" "}
            {best.points.map((p, k) => (
              <span key={p.index}>
                {k > 0 && " → "}
                {fmt(e.point, { label: p.label, price: num(p.price), date: dateOf(p.index) })}
                {p.provisional && <span className="text-muted"> ({e.provisional})</span>}
              </span>
            ))}
          </li>
          <li className="rounded-lg border border-target/40 bg-target/10 p-3">
            <strong>{e.now}</strong> {e.current[best.current]}
          </li>
          <li>
            <strong>{e.rules}:</strong>
            <ul className="mt-1 flex flex-col gap-0.5 pl-1">
              {RULES.map((rule) => {
                const ok = best.rules[rule];
                return (
                  <li key={rule} className="flex gap-1.5">
                    <span aria-hidden className={ok === null ? "text-muted" : "text-positive"}>
                      {ok === null ? "–" : "✓"}
                    </span>
                    <span>
                      {e.ruleNames[rule]} <span className="text-muted">({ok === null ? e.ruleNa : e.ruleOk})</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </li>
          {best.ratios.length > 0 && (
            <li>
              <strong>{e.ratios}:</strong>
              <ul className="mt-1 flex flex-col gap-0.5 pl-1">
                {best.ratios.map((r) => (
                  <li key={r.key}>
                    {e.ratioNames[r.key]}:{" "}
                    {fmt(e.ratioLine, {
                      value: r.key === "wave3" || r.key === "wave5" || r.key === "waveC" ? `${num(r.value)}×` : pct(r.value),
                      ideal: typeof r.ideal === "number" ? (r.ideal >= 1 ? times(r.ideal) : pct(r.ideal)) : `${pct(r.ideal[0])}–${pct(r.ideal[1])}`,
                    })}
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-muted">{fmt(e.fit, { fit: Math.round(best.fit * 100) })}</p>
            </li>
          )}
          {best.levels.length > 0 && (
            <li>
              <strong>{e.levels}:</strong>{" "}
              {best.levels
                .map((l) => `${num(l.price)} (${l.kind === "retracement" ? fmt(e.retracement, { pct: pct(l.ratio) }) : fmt(e.projection, { ratio: times(l.ratio).slice(0, -1) })})`)
                .join(" · ")}
            </li>
          )}
          {best.invalidation && (
            <li>{fmt(e.invalidation, { side: best.invalidation.side === "below" ? e.below : e.above, price: num(best.invalidation.price) })}</li>
          )}
          {others.length > 0 && (
            <li className="text-muted">
              {e.alternatives}{" "}
              {others.map((c) => fmt(e.alternative, { labels: labels(c), current: c.current, fit: Math.round(c.fit * 100) })).join("; ")}
            </li>
          )}
          {trend && <li className="text-muted">{fmt(e.trend, { trend: t.trend.trends[trend].toLocaleLowerCase(locale) })}</li>}
        </ul>
      )}

      <p className="text-[11px] text-muted">
        {e.footer}{" "}
        <Link href={href("/glossario/teorias/ondas-de-elliott")} className="font-medium text-accent hover:underline">
          {e.link}
        </Link>
      </p>
    </div>
  );
}
