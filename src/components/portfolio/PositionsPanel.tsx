"use client";

import Link from "next/link";
import { useState } from "react";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import { isClosed, pyramidQuantity, trackPosition, type Instruction, type Position, type PositionTracking } from "@/lib/positions";
import { parseDecimal } from "@/lib/risk";
import { lotOf } from "@/lib/tradePlan";
import { dateToUnix } from "./BuyForm";
import { useAccount } from "./useAccount";
import type { PortfolioPlans } from "./usePortfolioPlans";
import { positionActions } from "./usePositions";

const today = () => new Date().toISOString().slice(0, 10);
const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

/** Posições abertas e a gestão automática de cada uma (Murphy, cap. 16). */
export function PositionsPanel({ plans, positions }: { plans: PortfolioPlans; positions: Position[] }) {
  const { t } = useI18n();
  const s = t.portfolio.positions;
  const open = positions.filter((p) => !isClosed(p));
  const closed = positions.length - open.length;

  return (
    <section aria-labelledby="posicoes-carteira" className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div className="max-w-3xl">
        <h2 id="posicoes-carteira" className="text-xl font-semibold">
          {s.title}
        </h2>
        <p className="mt-1 text-sm text-muted">{s.subtitle}</p>
      </div>
      {open.length === 0 ? (
        <p className="text-sm text-muted">{s.empty}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {open.map((p) => {
            const item = plans.items[p.symbol];
            const tracking = item?.bars ? trackPosition(p, item.bars) : null;
            return (
              <li key={p.id}>
                <PositionCard position={p} tracking={tracking} fx={item?.fx ?? null} loading={plans.checkedAt === null && !plans.failed} />
              </li>
            );
          })}
        </ul>
      )}
      {closed > 0 && <p className="text-xs text-muted">{fmt(s.closedCount, { n: closed })}</p>}
    </section>
  );
}

const TONE: Record<Instruction["key"], string> = {
  sellStop: "border-negative/50 bg-negative/10",
  trendReversed: "border-negative/50 bg-negative/10",
  takeProfit: "border-positive/50 bg-positive/10",
  targetReached: "border-positive/50 bg-positive/10",
  raiseStop: "border-accent/50 bg-accent/10",
  hold: "border-border bg-border/30",
  pyramid: "border-accent/50 bg-accent/10",
  noAddLoser: "border-amber-500/50 bg-amber-500/10",
};

interface CardProps {
  position: Position;
  tracking: PositionTracking | null;
  fx: number | null;
  loading: boolean;
}

function PositionCard({ position, tracking, fx, loading }: CardProps) {
  const { t, locale, href } = useI18n();
  const s = t.portfolio.positions;
  const account = useAccount();
  const [form, setForm] = useState<"sell" | "add" | null>(null);
  const long = position.side === "long";
  const side = position.side;
  const num = (v: number, digits = 2) => v.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const price = (v: number) => {
    // Centavos de cripto e moedas pedem 4 casas; o zero, não.
    const digits = v !== 0 && Math.abs(v) < 1 ? 4 : 2;
    try {
      return new Intl.NumberFormat(locale, { style: "currency", currency: position.currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
    } catch {
      return num(v, digits);
    }
  };
  const money = (v: number) => new Intl.NumberFormat(locale, { style: "currency", currency: account.currency, maximumFractionDigits: 0 }).format(v);
  const signed = (v: number, text: string) => (v > 0 ? `+${text}` : v < 0 ? `−${text.replace("-", "")}` : text);
  const date = (time: number) => new Date(time * 1000).toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "2-digit" });
  const unitName = (id: string) => s.units[position.units.find((u) => u.id === id)?.kind ?? "trending"];

  const instructionText = (i: Instruction) => {
    const I = s.instructions;
    switch (i.key) {
      case "sellStop":
        return fmt(I.sellStop[side], { price: price(i.price) });
      case "trendReversed":
        return I.trendReversed[side];
      case "takeProfit":
        return fmt(I.takeProfit, { price: price(i.price) });
      case "targetReached":
        return fmt(I.targetReached, { price: price(i.price), stop: price(i.stop) });
      case "raiseStop":
        return fmt(I.raiseStop[side], { price: price(i.to) });
      case "hold":
        return fmt(I.hold, { price: price(i.stop) });
      case "pyramid":
        return I.pyramid;
      case "noAddLoser":
        return I.noAddLoser;
    }
  };

  const pnlPct = tracking?.averageEntry ? ((tracking.price - tracking.averageEntry) / tracking.averageEntry) * 100 * (long ? 1 : -1) : null;
  const canAdd = tracking?.instructions.some((i) => i.key === "pyramid");

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link href={`${href("/")}?symbol=${encodeURIComponent(position.symbol)}`} className="font-mono text-base font-semibold hover:underline">
            {position.symbol}
          </Link>
          <span className={`ml-2 rounded px-1.5 py-0.5 text-[11px] font-semibold ${long ? "bg-positive/15 text-positive" : "bg-negative/15 text-negative"}`}>
            {long ? s.long : s.short}
          </span>
          {tracking && <span className="ml-2 tabular-nums text-muted">{price(tracking.price)}</span>}
          <div className="max-w-64 truncate text-xs text-muted">{position.name}</div>
        </div>
        {tracking && (
          <div className="text-right text-sm">
            <div className={`font-semibold tabular-nums ${tracking.pnl >= 0 ? "text-positive" : "text-negative"}`}>
              {signed(tracking.pnl, price(Math.abs(tracking.pnl)))}
              {pnlPct !== null && ` (${signed(pnlPct, `${num(Math.abs(pnlPct), 1)}%`)})`}
            </div>
            {fx && <div className="text-xs tabular-nums text-muted">{signed(tracking.pnl, money(Math.abs(tracking.pnl * fx)))}</div>}
          </div>
        )}
      </header>

      {!tracking ? (
        <p className="text-sm text-muted">{loading ? s.loading : fmt(s.noData, { symbol: position.symbol })}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-1.5">
            {tracking.instructions.map((i, k) => (
              <li key={k} className={`rounded-lg border p-2.5 text-sm ${TONE[i.key]} ${k === 0 ? "font-semibold" : ""}`}>
                {instructionText(i)}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
            {tracking.averageEntry !== null && <span>{fmt(s.average, { price: price(tracking.averageEntry) })}</span>}
            {tracking.riskFree ? (
              <span className="font-medium text-positive">{s.riskFree}</span>
            ) : (
              <span>
                {s.openRisk}: {price(tracking.openRisk)}
                {fx && ` (${money(tracking.openRisk * fx)})`}
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[480px] text-xs tabular-nums">
              <thead className="bg-border/30 text-left text-muted">
                <tr>
                  <th className="px-2 py-1.5 font-medium">{s.columns.unit}</th>
                  <th className="px-2 py-1.5 text-right font-medium">{s.columns.quantity}</th>
                  <th className="px-2 py-1.5 text-right font-medium">{s.columns.entry}</th>
                  <th className="px-2 py-1.5 text-right font-medium">{s.columns.stop}</th>
                  <th className="px-2 py-1.5 font-medium">{s.columns.status}</th>
                  <th className="px-2 py-1.5 text-right font-medium">{s.columns.result}</th>
                </tr>
              </thead>
              <tbody>
                {tracking.units.map((u) => (
                  <tr key={u.unit.id} className="border-t border-border">
                    <td className="px-2 py-1.5 font-medium">{s.units[u.unit.kind]}</td>
                    <td className="px-2 py-1.5 text-right">{u.unit.quantity.toLocaleString(locale, { maximumFractionDigits: 4 })}</td>
                    <td className="px-2 py-1.5 text-right">{price(u.unit.entry)}</td>
                    <td className="px-2 py-1.5 text-right text-negative">{u.status === "closed" ? "—" : price(u.stop)}</td>
                    <td className={`px-2 py-1.5 ${u.status === "stopHit" ? "font-semibold text-negative" : ""}`}>
                      {u.status === "closed" ? fmt(s.status.closed, { price: price(u.unit.exit!.price) }) : s.status[u.status]}
                    </td>
                    <td className={`px-2 py-1.5 text-right ${u.pnlPerUnit >= 0 ? "text-positive" : "text-negative"}`}>
                      {signed(u.pnlPerUnit, price(Math.abs(u.pnlPerUnit * u.unit.quantity)))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {form === "sell" && <SellForm position={position} tracking={tracking} onDone={() => setForm(null)} />}
          {form === "add" && <AddForm position={position} tracking={tracking} onDone={() => setForm(null)} />}
          {form === null && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setForm("sell")} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-border/60">
                {long ? s.sell : s.buyBack}
              </button>
              {canAdd && (
                <button type="button" onClick={() => setForm("add")} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-border/60">
                  {s.add}
                </button>
              )}
              <button
                type="button"
                onClick={() => window.confirm(fmt(s.confirmRemove, { symbol: position.symbol })) && positionActions.remove(position.id)}
                className="ml-auto rounded-lg px-3 py-1.5 text-xs text-muted hover:text-negative"
              >
                {s.remove}
              </button>
            </div>
          )}

          {tracking.events.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer font-medium text-muted">{fmt(s.history, { n: tracking.events.length })}</summary>
              <ul className="mt-1.5 space-y-0.5 pl-4 text-foreground/90">
                {[...tracking.events].reverse().map((e, k) => (
                  <li key={k}>
                    {e.key === "stopRaised"
                      ? fmt(s.events.stopRaised[side], { date: date(e.time), unit: unitName(e.unitId), from: price(e.from), to: price(e.to) })
                      : e.key === "breakeven"
                        ? fmt(s.events.breakeven, { date: date(e.time), unit: unitName(e.unitId), to: price(e.to) })
                        : e.key === "stopHit"
                          ? fmt(s.events.stopHit, { date: date(e.time), unit: unitName(e.unitId), price: price(e.price) })
                          : fmt(s.events[e.key], { date: date(e.time), price: price(e.price) })}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </article>
  );
}

const fieldClass = "w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm tabular-nums";

/** Registro da venda (ou recompra) de uma ou mais unidades, com o preço sugerido pela gestão. */
function SellForm({ position, tracking, onDone }: { position: Position; tracking: PositionTracking; onDone: () => void }) {
  const { t, locale } = useI18n();
  const s = t.portfolio.positions;
  const open = tracking.units.filter((u) => u.status !== "closed");
  const first = tracking.instructions[0];
  // Sugestão: as unidades e o preço da instrução principal (stop atingido, realização); senão, todas ao preço atual.
  const suggested =
    first?.key === "sellStop" ? { ids: first.unitIds, price: first.price } : first?.key === "takeProfit" ? { ids: [first.unitId], price: first.price } : { ids: open.map((u) => u.unit.id), price: tracking.price };
  const [ids, setIds] = useState<string[]>(suggested.ids);
  const [priceText, setPriceText] = useState(suggested.price.toLocaleString(locale, { maximumFractionDigits: 4, useGrouping: false }));
  // Stop atingido: a data sugerida é a do candle em que o preço tocou o stop.
  const hitTimes = tracking.events.flatMap((e) => (e.key === "stopHit" && suggested.ids.includes(e.unitId) ? [e.time] : []));
  const [date, setDate] = useState(first?.key === "sellStop" && hitTimes.length ? new Date(Math.max(...hitTimes) * 1000).toISOString().slice(0, 10) : today());
  const value = parseDecimal(priceText);
  const errors = [!(value && value > 0) && s.errors.price, ids.length === 0 && s.errors.units].filter(Boolean) as string[];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (errors.length || !value) return;
        positionActions.recordExit(position.id, ids, { price: value, at: dateToUnix(date) });
        onDone();
      }}
      className="flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent/5 p-3"
    >
      <h4 className="text-sm font-semibold">{fmt(s.sellTitle, { symbol: position.symbol })}</h4>
      <fieldset className="flex flex-wrap gap-3 text-xs">
        <legend className="mb-1 font-medium">{s.sellUnits}</legend>
        {open.map((u) => (
          <label key={u.unit.id} className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={ids.includes(u.unit.id)}
              onChange={(e) => setIds((list) => (e.target.checked ? [...list, u.unit.id] : list.filter((x) => x !== u.unit.id)))}
            />
            {s.units[u.unit.kind]} · {u.unit.quantity.toLocaleString(locale, { maximumFractionDigits: 4 })}
          </label>
        ))}
      </fieldset>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium">{s.sellPrice}</span>
          <input inputMode="decimal" value={priceText} onChange={(e) => setPriceText(e.target.value)} className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium">{s.sellDate}</span>
          <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
        </label>
      </div>
      {errors.length > 0 && <p className="text-xs text-negative">{errors.join(" ")}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={errors.length > 0} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
          {s.sellSave}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-border/60">
          {s.cancel}
        </button>
      </div>
    </form>
  );
}

/** Nova camada da pirâmide: menor que a anterior, com o stop no breakeven ou acima (regra 10). */
function AddForm({ position, tracking, onDone }: { position: Position; tracking: PositionTracking; onDone: () => void }) {
  const { t, locale } = useI18n();
  const s = t.portfolio.positions;
  const long = position.side === "long";
  const lot = lotOf(position.symbol);
  const open = tracking.units.filter((u) => u.status === "open");
  // Stop da nova camada: o da unidade de tendência (já no breakeven ou acima).
  const protective = long ? Math.max(...open.map((u) => u.stop)) : Math.min(...open.map((u) => u.stop));
  const text = (v: number) => v.toLocaleString(locale, { maximumFractionDigits: 4, useGrouping: false });
  const [form, setForm] = useState({ quantity: text(pyramidQuantity(position, lot)), price: text(tracking.price), stop: text(protective), date: today() });
  const qty = parseDecimal(form.quantity);
  const value = parseDecimal(form.price);
  const stop = parseDecimal(form.stop);
  const errors = [
    !(qty && qty > 0) && s.errors.quantity,
    !(value && value > 0) && s.errors.price,
    !(stop && value && (long ? stop < value : stop > value)) && s.errors.stop,
  ].filter(Boolean) as string[];
  const field = (key: "quantity" | "price" | "stop", label: string) => (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium">{label}</span>
      <input inputMode="decimal" value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className={fieldClass} />
    </label>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (errors.length || !qty || !value || !stop) return;
        positionActions.addUnit(position.id, { id: newId(), kind: "pyramid", quantity: qty, entry: value, at: dateToUnix(form.date), stop });
        onDone();
      }}
      className="flex flex-col gap-2 rounded-lg border border-accent/40 bg-accent/5 p-3"
    >
      <h4 className="text-sm font-semibold">{fmt(s.addTitle, { symbol: position.symbol })}</h4>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {field("quantity", t.portfolio.buy.quantity)}
        {field("price", s.sellPrice)}
        {field("stop", t.portfolio.buy.stop)}
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium">{s.sellDate}</span>
          <input type="date" value={form.date} max={today()} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={fieldClass} />
        </label>
      </div>
      <p className="text-[11px] text-muted">{s.addNote}</p>
      {errors.length > 0 && <p className="text-xs text-negative">{errors.join(" ")}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={errors.length > 0} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
          {s.addSave}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-border/60">
          {s.cancel}
        </button>
      </div>
    </form>
  );
}
