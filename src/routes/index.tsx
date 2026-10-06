import logo from "@/assets/logo.png";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Users, Receipt, ArrowRightLeft, ChevronRight, Github } from "lucide-react";
import { useGroups, uid, eur } from "@/lib/splits";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SplitEasy — Divide gastos entre amigos" },
      { name: "description", content: "Crea un grupo, añade gastos y descubre quién paga a quién. Sin cuentas, sin líos." },
      { property: "og:title", content: "SplitEasy — Divide gastos entre amigos" },
      { property: "og:description", content: "La forma más sencilla de dividir cenas, viajes y pisos compartidos." },
    ],
  }),
  component: Home,
});

function Home() {
  const { groups, save } = useGroups();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  const create = () => {
    const id = uid();
    save({ id, name: name.trim() || "Mi grupo", people: [], expenses: [], settled: [], createdAt: Date.now() });
    nav({ to: "/grupo/$id", params: { id } });
  };

  const steps = [
    { icon: Users, t: "Crea un grupo", d: "Añade a tus amigos solo con su nombre." },
    { icon: Receipt, t: "Apunta los gastos", d: "Quién pagó, cuánto y entre quiénes." },
    { icon: ArrowRightLeft, t: "Salda cuentas", d: "Te decimos quién paga a quién, con el mínimo de pagos." },
  ];

  return (
    <main className="mx-auto max-w-xl px-5 py-12 sm:py-20">
      <p className="text-sm font-semibold uppercase tracking-widest text-accent">Cuentas claras</p>
      <h1 className="mt-2"><img src={logo} alt="SplitEasy" className="h-28 w-auto sm:h-36" /></h1>
      <p className="mt-4 text-lg text-muted-foreground">Divide cualquier gasto entre amigos en segundos. Nosotros hacemos las cuentas.</p>

      <div className="mt-8">
        {open ? (
          <form className="card flex flex-col gap-3 p-4" onSubmit={(e) => { e.preventDefault(); create(); }}>
            <label className="text-sm font-medium">Nombre del grupo</label>
            <input autoFocus className="field" placeholder="Viaje a Lisboa, Piso, Cena…" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="btn btn-primary py-4 text-lg">Crear grupo</button>
          </form>
        ) : (
          <button onClick={() => setOpen(true)} className="btn btn-primary w-full py-5 text-xl">
            <Plus className="h-6 w-6" /> Crear grupo
          </button>
        )}
      </div>

      {groups && groups.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-xl font-semibold">Tus grupos</h2>
          <div className="flex flex-col gap-2">
            {groups.map((g) => (
              <Link key={g.id} to="/grupo/$id" params={{ id: g.id }} className="card flex items-center justify-between p-4 hover:border-primary">
                <div>
                  <div className="font-semibold">{g.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {g.people.length} personas · {eur(g.expenses.reduce((s, e) => s + e.amount, 0))}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-semibold">Cómo funciona</h2>
        <ol className="flex flex-col gap-3">
          {steps.map((s, i) => (
            <li key={s.t} className="flex gap-4 rounded-2xl bg-secondary p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card font-display font-extrabold text-primary">{i + 1}</span>
              <div>
                <div className="flex items-center gap-2 font-semibold"><s.icon className="h-4 w-4 text-accent" />{s.t}</div>
                <p className="text-sm text-muted-foreground">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section className="mt-10 rounded-2xl border border-dashed border-primary/40 p-5">
        <div className="flex items-center gap-2 font-semibold text-primary"><Github className="h-5 w-5" />Open source y selfhosteable</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Sin cuentas, sin anuncios, sin servicios externos. Instálalo en tu propio servidor con un solo
          <code className="mx-1 rounded bg-secondary px-1.5 py-0.5 text-xs">docker compose up -d</code>
          y tus datos se quedan contigo.
        </p>
      </section>
    </main>
  );
}
