import { useEffect, useState, useCallback } from "react";

export type Expense = { id: string; concept: string; amount: number; paidBy: string; splitAmong: string[] };
export type Group = { id: string; name: string; people: { id: string; name: string }[]; expenses: Expense[]; settled: string[]; createdAt: number };

const KEY = "spliteasy:groups";
export const uid = () => Math.random().toString(36).slice(2, 10);

function readAll(): Group[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function writeAll(g: Group[]) {
  localStorage.setItem(KEY, JSON.stringify(g));
  window.dispatchEvent(new Event("spliteasy"));
}

export function useGroups() {
  const [groups, setGroups] = useState<Group[] | null>(null);
  useEffect(() => {
    const load = () => setGroups(readAll());
    load();
    window.addEventListener("spliteasy", load);
    window.addEventListener("storage", load);
    return () => { window.removeEventListener("spliteasy", load); window.removeEventListener("storage", load); };
  }, []);
  const save = useCallback((g: Group) => {
    const all = readAll();
    const i = all.findIndex((x) => x.id === g.id);
    if (i >= 0) all[i] = g; else all.unshift(g);
    writeAll(all);
  }, []);
  const remove = useCallback((id: string) => writeAll(readAll().filter((g) => g.id !== id)), []);
  return { groups, save, remove };
}

export const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Math.round(n * 100) / 100);

export function computeBalances(g: Group) {
  const paid: Record<string, number> = {};
  const owed: Record<string, number> = {};
  g.people.forEach((p) => { paid[p.id] = 0; owed[p.id] = 0; });
  for (const e of g.expenses) {
    const among = e.splitAmong.filter((id) => id in owed);
    if (!among.length || !(e.paidBy in paid)) continue;
    const cents = Math.round(e.amount * 100);
    const base = Math.floor(cents / among.length);
    let rest = cents - base * among.length;
    paid[e.paidBy] += cents;
    among.forEach((id) => { owed[id] += base + (rest > 0 ? 1 : 0); rest--; });
  }
  return g.people.map((p) => ({
    id: p.id, name: p.name,
    paid: paid[p.id] / 100, owed: owed[p.id] / 100,
    balance: (paid[p.id] - owed[p.id]) / 100,
  }));
}

export type Transfer = { key: string; from: string; to: string; amount: number };

export function computeTransfers(g: Group): Transfer[] {
  const b = computeBalances(g).map((x) => ({ id: x.id, c: Math.round(x.balance * 100) }));
  const debtors = b.filter((x) => x.c < 0).map((x) => ({ ...x, c: -x.c }));
  const creditors = b.filter((x) => x.c > 0);
  const out: Transfer[] = [];
  // exact matches first to minimise transfers
  for (const d of debtors) {
    const cr = creditors.find((c) => c.c === d.c && c.c > 0);
    if (cr && d.c > 0) { out.push({ key: "", from: d.id, to: cr.id, amount: d.c }); cr.c = 0; d.c = 0; }
  }
  debtors.sort((a, z) => z.c - a.c); creditors.sort((a, z) => z.c - a.c);
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i], c = creditors[j];
    if (d.c === 0) { i++; continue; }
    if (c.c === 0) { j++; continue; }
    const m = Math.min(d.c, c.c);
    out.push({ key: "", from: d.id, to: c.id, amount: m });
    d.c -= m; c.c -= m;
  }
  return out.map((t) => ({ ...t, amount: t.amount / 100, key: `${t.from}>${t.to}:${t.amount}` }));
}
