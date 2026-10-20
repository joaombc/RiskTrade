"use client";

import { useState } from "react";
import { fmt } from "@/i18n/format";
import { useI18n } from "@/i18n/I18nProvider";
import type { PortfolioAsset } from "@/lib/portfolioAssets";
import { splitUnits, type Position, type PositionUnit } from "@/lib/positions";
import { parseDecimal } from "@/lib/risk";
import type { TradePlan } from "@/lib/tradePlan";
import { positionActions } from "./usePositions";

interface Props {
  asset: PortfolioAsset;
  side: "long" | "short";
  plan: TradePlan;
  /** Quantidade sugerida pela gestão do dinheiro. */
  quantity: number;
  lot: number;
  currency: string;
  onDone: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);
/** Data do formulário (AAAA-MM-DD) em unix segundos, ao meio-dia UTC (o mesmo dia em qualquer fuso). */
export const dateToUnix = (date: string) => Date.parse(`${date}T12:00:00Z`) / 1000;
const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

/** "Comprei" (ou "Vendi a descoberto"): registra a operação com os níveis do plano, ajustáveis. */
export function BuyForm({ asset, side, plan, quantity, lot, currency, onDone }: Props) {
  const { t, locale } = useI18n();
  const b = t.portfolio.buy;
  const text = (v: number | null) => (v === null ? "" : v.toLocaleString(locale, { maximumFractionDigits: Math.abs(v) < 1 ? 6 : 2, useGrouping: false }));
  const [form, setForm] = useState({
    date: today(),
    price: text(plan.action === "enterNow" ? plan.close : (plan.entry ?? plan.close)),
    quantity: text(quantity || null),
    stop: text(plan.stop),
    target1: text(plan.target1),
    target: text(plan.target),
    split: true,
  });
  const set = (key: keyof typeof form, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const price = parseDecimal(form.price);
  const qty = parseDecimal(form.quantity);
  const stop = parseDecimal(form.stop);
  const target1 = form.target1.trim() ? parseDecimal(form.target1) : null;
  const target = form.target.trim() ? parseDecimal(form.target) : null;
  const long = side === "long";
  const beyond = (level: number | null | undefined, ref: number) => level === null || (level !== undefined && (long ? level > ref : level < ref));
  const errors = [
    !(price && price > 0) && b.errors.price,
    !(qty && qty > 0) && b.errors.quantity,
    qty && qty > 0 && Math.abs(qty / lot - Math.round(qty / lot)) > 1e-6 && fmt(b.errors.lot, { lot: lot.toLocaleString(locale) }),
    !(stop && price && (long ? stop < price : stop > price)) && (long ? b.errors.stopLong : b.errors.stopShort),
    price && !(beyond(target1, price) && beyond(target, price)) && (long ? b.errors.targetLong : b.errors.targetShort),
    !form.date && b.errors.date,
  ].filter(Boolean) as string[];

  const save = () => {
    if (errors.length || !price || !qty || !stop) return;
    const at = dateToUnix(form.date);
    const unit = (kind: PositionUnit["kind"], quantity: number): PositionUnit => ({ id: newId(), kind, quantity, entry: price, at, stop });
    const parts = form.split ? splitUnits(qty, lot) : { trading: 0, trending: qty };
    const units = [...(parts.trading > 0 ? [unit("trading", parts.trading)] : []), ...(parts.trending > 0 ? [unit("trending", parts.trending)] : [])];
    const position: Position = {
      id: newId(),
      symbol: asset.symbol,
      name: asset.name,
      side,
      currency,
      target1: target1 ?? null,
      target: target ?? null,
      units,
    };
    positionActions.open(position);
    onDone();
  };

  const input = (key: "price" | "quantity" | "stop" | "target1" | "target", label: string) => (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium">{label}</span>
      <input
        inputMode="decimal"
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm tabular-nums"
      />
    </label>
  );
  const parts = qty && qty > 0 && form.split ? splitUnits(qty, lot) : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex flex-col gap-3 rounded-lg border border-accent/40 bg-accent/5 p-3"
    >
      <h4 className="text-sm font-semibold">{long ? fmt(b.titleLong, { symbol: asset.symbol }) : fmt(b.titleShort, { symbol: asset.symbol })}</h4>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium">{b.date}</span>
          <input type="date" value={form.date} max={today()} onChange={(e) => set("date", e.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
        </label>
        {input("price", fmt(b.price, { currency }))}
        {input("quantity", b.quantity)}
        {input("stop", b.stop)}
        {input("target1", b.target1)}
        {input("target", b.target)}
      </div>
      <label className="flex items-start gap-2 text-xs">
        <input type="checkbox" checked={form.split} onChange={(e) => set("split", e.target.checked)} className="mt-0.5" />
        <span>
          {b.split}
          {parts && (
            <span className="block text-muted">
              {fmt(b.splitDetail, { trading: parts.trading.toLocaleString(locale), trending: parts.trending.toLocaleString(locale) })}
            </span>
          )}
        </span>
      </label>
      {errors.length > 0 && (
        <ul className="list-disc pl-4 text-xs text-negative">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-muted">{b.note}</p>
      <div className="flex gap-2">
        <button type="submit" disabled={errors.length > 0} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
          {b.save}
        </button>
        <button type="button" onClick={onDone} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-border/60">
          {b.cancel}
        </button>
      </div>
    </form>
  );
}
