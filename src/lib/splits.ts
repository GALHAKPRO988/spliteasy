import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listGroups, saveGroup, deleteGroup } from "./groups.functions";
import { direct, directMode } from "./direct";

export type Expense = { id: string; concept: string; amount: number; paidBy: string; splitAmong: string[]; date: string; kind?: "debt" };
export type Group = { id: string; name: string; people: { id: string; name: string }[]; expenses: Expense[]; settled: string[]; createdAt: number };

export const uid = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(8)), (b: number) => (b % 36).toString(36)).join("");
export const today = () => new Date().toISOString().slice(0, 10);

const QK = ["groups"];
const LS = "spliteasy:groups";

// Group ids this device has created or opened. Only these are listed.
function myIds(): string[] {
  try { return JSON.parse(localStorage.getItem(LS) || "[]"); } catch { return []; }
}
function setIds(ids: string[]) {
  localStorage.setItem(LS, JSON.stringify([...new Set(ids)]));
}

export function useGroups() {
  const qc = useQueryClient();
  const listS = useServerFn(listGroups);
  const saveS = useServerFn(saveGroup);
  const delS = useServerFn(deleteGroup);
  const list = directMode ? (a: { data: { ids: string[] } }) => direct.list(a.data.ids) : listS;
  const saveFn = directMode ? (a: { data: Group }) => direct.save(a.data) : saveS;
  const delFn = directMode ? (a: { data: { id: string } }) => direct.remove(a.data.id) : delS;
  const { data } = useQuery({ queryKey: QK, queryFn: () => list({ data: { ids: myIds() } }) });
  const track = useCallback(
    (id: string) => {
      if (myIds().includes(id)) return;
      setIds([...myIds(), id]);
      qc.invalidateQueries({ queryKey: QK });
    },
    [qc],
  );
  const save = useCallback(
    (g: Group) => {
      if (!myIds().includes(g.id)) setIds([...myIds(), g.id]);
      qc.setQueryData<Group[]>(QK, (old = []) =>
        old.some((x) => x.id === g.id) ? old.map((x) => (x.id === g.id ? g : x)) : [g, ...old],
      );
      return saveFn({ data: g }).catch((e) => {
        alert("No se pudo guardar. Revisa los datos.");
        console.error(e);
        qc.invalidateQueries({ queryKey: QK });
      });
    },
    [qc, saveFn],
  );
  const remove = useCallback(
    (id: string) => {
      setIds(myIds().filter((x) => x !== id));
      qc.setQueryData<Group[]>(QK, (old = []) => old.filter((g) => g.id !== id));
      return delFn({ data: { id } }).finally(() => qc.invalidateQueries({ queryKey: QK }));
    },
    [qc, delFn],
  );
  return { groups: data ?? null, save, remove, track };
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
    paid[e.paidBy] = (paid[e.paidBy] ?? 0) + cents;
    among.forEach((id) => { owed[id] = (owed[id] ?? 0) + base + (rest > 0 ? 1 : 0); rest--; });
  }
  return g.people.map((p) => ({
    id: p.id, name: p.name,
    paid: paid[p.id]! / 100, owed: owed[p.id]! / 100,
    balance: (paid[p.id]! - owed[p.id]!) / 100,
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
    const d = debtors[i]!, c = creditors[j]!;
    if (d.c === 0) { i++; continue; }
    if (c.c === 0) { j++; continue; }
    const m = Math.min(d.c, c.c);
    out.push({ key: "", from: d.id, to: c.id, amount: m });
    d.c -= m; c.c -= m;
  }
  return out.map((t) => ({ ...t, amount: t.amount / 100, key: `${t.from}>${t.to}:${t.amount}` }));
}
