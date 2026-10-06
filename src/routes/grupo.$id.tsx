import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, X, Pencil, Trash2, Copy, Share2, Check, ArrowRight, RotateCcw } from "lucide-react";
import { useGroups, uid, eur, computeBalances, computeTransfers, type Group, type Expense } from "@/lib/splits";

export const Route = createFileRoute("/grupo/$id")({
  head: () => ({
    meta: [
      { title: "Grupo — SplitEasy" },
      { name: "description", content: "Gastos, balances y quién paga a quién en tu grupo." },
      { property: "og:title", content: "Grupo — SplitEasy" },
      { property: "og:description", content: "Gastos, balances y quién paga a quién en tu grupo." },
    ],
  }),
  component: GroupPage,
});

function GroupPage() {
  const { id } = Route.useParams();
  const { groups, save, remove } = useGroups();
  const nav = useNavigate();
  if (!groups) return <main className="p-10 text-center text-muted-foreground">Cargando…</main>;
  const g = groups.find((x) => x.id === id);
  if (!g)
    return (
      <main className="mx-auto max-w-xl p-10 text-center">
        <p className="mb-4">Este grupo no existe.</p>
        <Link to="/" className="btn btn-primary">Volver al inicio</Link>
      </main>
    );
  return <GroupView g={g} save={save} onDelete={() => { remove(g.id); nav({ to: "/" }); }} />;
}

function GroupView({ g, save, onDelete }: { g: Group; save: (g: Group) => void; onDelete: () => void }) {
  const [newPerson, setNewPerson] = useState("");
  const [editing, setEditing] = useState<Expense | "new" | null>(null);
  const [copied, setCopied] = useState(false);
  const names = useMemo(() => Object.fromEntries(g.people.map((p) => [p.id, p.name])), [g.people]);
  const balances = computeBalances(g);
  const transfers = computeTransfers(g);
  const total = g.expenses.reduce((s, e) => s + e.amount, 0);

  const addPerson = () => {
    const n = newPerson.trim();
    if (!n) return;
    save({ ...g, people: [...g.people, { id: uid(), name: n }] });
    setNewPerson("");
  };
  const removePerson = (pid: string) => {
    if (g.expenses.some((e) => e.paidBy === pid || e.splitAmong.includes(pid))) {
      alert("Esta persona tiene gastos asociados. Elimínalos o edítalos primero.");
      return;
    }
    save({ ...g, people: g.people.filter((p) => p.id !== pid) });
  };
  const toggleSettled = (k: string) =>
    save({ ...g, settled: g.settled.includes(k) ? g.settled.filter((x) => x !== k) : [...g.settled, k] });

  const summary = () => {
    const lines = transfers.map((t) => `${g.settled.includes(t.key) ? "✅" : "•"} ${names[t.from]} paga ${eur(t.amount)} a ${names[t.to]}`);
    return `SplitEasy · ${g.name}\nTotal: ${eur(total)}\n\n${lines.length ? lines.join("\n") : "¡Todo saldado!"}`;
  };
  const copy = async () => { await navigator.clipboard.writeText(summary()); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: `SplitEasy · ${g.name}`, text: summary() }); } catch {} }
    else copy();
  };

  return (
    <main className="mx-auto max-w-xl px-4 pb-32 pt-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Inicio</Link>
      <h1 className="mt-3 text-4xl font-extrabold text-primary">{g.name}</h1>
      <p className="text-muted-foreground">Total gastado: <span className="font-semibold text-foreground">{eur(total)}</span></p>

      {/* People */}
      <section className="card mt-6 p-4">
        <h2 className="mb-3 text-lg font-semibold">Participantes</h2>
        <div className="flex flex-wrap gap-2">
          {g.people.map((p) => (
            <span key={p.id} className="chip inline-flex items-center gap-1">
              {p.name}
              <button aria-label={`Quitar ${p.name}`} onClick={() => removePerson(p.id)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
            </span>
          ))}
          {!g.people.length && <p className="text-sm text-muted-foreground">Añade a las personas del grupo.</p>}
        </div>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); addPerson(); }}>
          <input className="field" placeholder="Nombre" value={newPerson} onChange={(e) => setNewPerson(e.target.value)} />
          <button className="btn btn-ghost shrink-0" aria-label="Añadir persona"><Plus className="h-5 w-5" /></button>
        </form>
      </section>

      {/* Expenses */}
      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Gastos</h2>
        {!g.expenses.length && <p className="rounded-2xl bg-secondary p-4 text-sm text-muted-foreground">Aún no hay gastos.</p>}
        <div className="flex flex-col gap-2">
          {g.expenses.map((e) => (
            <div key={e.id} className="card flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{e.concept}</div>
                <div className="text-sm text-muted-foreground">
                  {names[e.paidBy]} pagó · {e.splitAmong.length === g.people.length ? "entre todos" : e.splitAmong.map((x) => names[x]).join(", ")}
                </div>
              </div>
              <div className="font-display text-lg font-extrabold">{eur(e.amount)}</div>
              <button aria-label="Editar" onClick={() => setEditing(e)} className="p-1 text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
              <button aria-label="Eliminar" onClick={() => confirm("¿Eliminar este gasto?") && save({ ...g, expenses: g.expenses.filter((x) => x.id !== e.id) })} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </section>

      {/* Balances */}
      {g.expenses.length > 0 && (
        <section className="card mt-6 p-4">
          <h2 className="mb-3 text-lg font-semibold">Balances</h2>
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 gap-y-2 text-sm">
            <span className="text-muted-foreground">Persona</span>
            <span className="text-right text-muted-foreground">Pagó</span>
            <span className="text-right text-muted-foreground">Le toca</span>
            <span className="text-right text-muted-foreground">Saldo</span>
            {balances.map((b) => (
              <div key={b.id} className="contents">
                <span className="font-medium">{b.name}</span>
                <span className="text-right">{eur(b.paid)}</span>
                <span className="text-right">{eur(b.owed)}</span>
                <span className={`text-right font-semibold ${b.balance > 0.004 ? "text-success" : b.balance < -0.004 ? "text-destructive" : "text-muted-foreground"}`}>
                  {b.balance > 0.004 ? "+" : ""}{eur(b.balance)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transfers */}
      {g.expenses.length > 0 && (
        <section className="mt-6 rounded-3xl bg-primary p-5 text-primary-foreground">
          <h2 className="mb-3 text-xl font-semibold">Quién paga a quién</h2>
          {!transfers.length && <p>¡Todo saldado! 🎉</p>}
          <div className="flex flex-col gap-2">
            {transfers.map((t) => {
              const done = g.settled.includes(t.key);
              return (
                <button key={t.key} onClick={() => toggleSettled(t.key)}
                  className={`flex items-center gap-3 rounded-2xl bg-primary-foreground/10 p-3 text-left transition ${done ? "opacity-50" : ""}`}>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-primary-foreground/60 ${done ? "bg-success border-success" : ""}`}>
                    {done && <Check className="h-4 w-4" />}
                  </span>
                  <span className={`flex flex-1 flex-wrap items-center gap-1.5 ${done ? "line-through" : ""}`}>
                    <b>{names[t.from]}</b><ArrowRight className="h-4 w-4 opacity-70" /><b>{names[t.to]}</b>
                  </span>
                  <span className="font-display text-lg font-extrabold">{eur(t.amount)}</span>
                </button>
              );
            })}
          </div>
          {transfers.length > 0 && (
            <div className="mt-4 flex gap-2">
              <button onClick={copy} className="btn btn-accent flex-1">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Copiado" : "Copiar"}</button>
              <button onClick={share} className="btn btn-accent flex-1"><Share2 className="h-4 w-4" />Compartir</button>
            </div>
          )}
          <p className="mt-3 text-xs opacity-70">Toca un pago para marcarlo como realizado.</p>
        </section>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {g.expenses.length > 0 && (
          <button className="btn btn-ghost text-sm" onClick={() => confirm("¿Borrar todos los gastos y mantener a las personas?") && save({ ...g, expenses: [], settled: [] })}>
            <RotateCcw className="h-4 w-4" />Reiniciar gastos
          </button>
        )}
        <button className="btn btn-danger text-sm" onClick={() => confirm("¿Eliminar el grupo por completo?") && onDelete()}>
          <Trash2 className="h-4 w-4" />Eliminar grupo
        </button>
      </div>

      {/* Floating add */}
      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-background via-background to-transparent p-4">
        <div className="mx-auto max-w-xl">
          <button disabled={g.people.length < 1} onClick={() => setEditing("new")} className="btn btn-primary w-full py-4 text-lg shadow-lg">
            <Plus className="h-5 w-5" />Añadir gasto
          </button>
          {g.people.length < 1 && <p className="mt-1 text-center text-xs text-muted-foreground">Añade participantes primero</p>}
        </div>
      </div>

      {editing && (
        <ExpenseForm
          g={g}
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(e) => {
            const exists = g.expenses.some((x) => x.id === e.id);
            save({ ...g, expenses: exists ? g.expenses.map((x) => (x.id === e.id ? e : x)) : [...g.expenses, e] });
            setEditing(null);
          }}
        />
      )}
    </main>
  );
}

function ExpenseForm({ g, initial, onClose, onSave }: { g: Group; initial: Expense | null; onClose: () => void; onSave: (e: Expense) => void }) {
  const [concept, setConcept] = useState(initial?.concept ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [paidBy, setPaidBy] = useState(initial?.paidBy ?? g.people[0]?.id ?? "");
  const [among, setAmong] = useState<string[]>(initial?.splitAmong ?? g.people.map((p) => p.id));
  const num = parseFloat(amount.replace(",", "."));
  const valid = concept.trim() && num > 0 && paidBy && among.length > 0;
  const allOn = among.length === g.people.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 sm:items-center" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); if (valid) onSave({ id: initial?.id ?? uid(), concept: concept.trim(), amount: Math.round(num * 100) / 100, paidBy, splitAmong: among }); }}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-card p-5 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold">{initial ? "Editar gasto" : "Añadir gasto"}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="p-1 text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-[1fr_8rem] gap-2">
            <input autoFocus className="field" placeholder="Concepto (Cena…)" value={concept} onChange={(e) => setConcept(e.target.value)} />
            <div className="relative">
              <input className="field pr-7 text-right" inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm font-medium">Pagado por</div>
            <div className="flex flex-wrap gap-2">
              {g.people.map((p) => (
                <button type="button" key={p.id} data-on={paidBy === p.id} onClick={() => setPaidBy(p.id)} className="chip">{p.name}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-sm font-medium">
              Dividir entre
              <button type="button" className="text-primary" onClick={() => setAmong(allOn ? [] : g.people.map((p) => p.id))}>{allOn ? "Ninguno" : "Todos"}</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {g.people.map((p) => (
                <button type="button" key={p.id} data-on={among.includes(p.id)} className="chip"
                  onClick={() => setAmong(among.includes(p.id) ? among.filter((x) => x !== p.id) : [...among, p.id])}>{p.name}</button>
              ))}
            </div>
            {num > 0 && among.length > 0 && <p className="mt-2 text-sm text-muted-foreground">{eur(num / among.length)} por persona</p>}
          </div>
          <button disabled={!valid} className="btn btn-primary py-4 text-lg">{initial ? "Guardar cambios" : "Añadir gasto"}</button>
        </div>
      </form>
    </div>
  );
}
