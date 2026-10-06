// Storage for groups. Two backends, chosen at runtime:
// - Cloud database, when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set.
// - A single JSON file inside DATA_DIR otherwise (zero-dependency self-hosting).
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Group } from "./splits";

type Store = {
  listByIds: (ids: string[]) => Promise<Group[]>;
  get: (id: string) => Promise<Group | null>;
  upsert: (g: Group) => Promise<Group>;
  remove: (id: string) => Promise<void>;
};

const useCloud = () => !!process.env["SUPABASE_URL"] && !!process.env["SUPABASE_SERVICE_ROLE_KEY"];
const sortNewest = (gs: Group[]) => gs.sort((a, b) => b.createdAt - a.createdAt);

// ---------- Cloud ----------
const cloud: Store = {
  async listByIds(ids) {
    if (!ids.length) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("groups").select("data").in("id", ids);
    if (error) throw new Error(error.message);
    return sortNewest(data.map((r) => r.data as unknown as Group));
  },
  async get(id) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("groups").select("data").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return (data?.data as unknown as Group) ?? null;
  },
  async upsert(g) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("groups")
      .upsert({ id: g.id, data: g as never, created_at: g.createdAt, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return g;
  },
  async remove(id) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("groups").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

// ---------- File ----------
let cache: Group[] | null = null;
let queue: Promise<unknown> = Promise.resolve();
let persistent = true;

function file() {
  const dir = process.env["DATA_DIR"] || "./data";
  return { dir, file: path.join(dir, "spliteasy.json") };
}

async function load(): Promise<Group[]> {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(await fs.readFile(file().file, "utf8"));
    cache = Array.isArray(parsed.groups) ? parsed.groups : [];
  } catch {
    cache = [];
  }
  if (cache!.length === 0 && process.env["SEED_DEMO"] === "true") cache!.push(demoGroup());
  return cache!;
}

async function persist() {
  if (!persistent) return;
  try {
    const { dir, file: f } = file();
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(`${f}.tmp`, JSON.stringify({ version: 1, groups: cache }, null, 2));
    await fs.rename(`${f}.tmp`, f);
  } catch (e) {
    persistent = false;
    console.warn("[spliteasy] data dir not writable, using in-memory store", e);
  }
}

function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

const local: Store = {
  listByIds: (ids) => serial(async () => sortNewest((await load()).filter((g) => ids.includes(g.id)))),
  get: (id) => serial(async () => (await load()).find((g) => g.id === id) ?? null),
  upsert: (g) =>
    serial(async () => {
      const all = await load();
      const i = all.findIndex((x) => x.id === g.id);
      if (i >= 0) all[i] = g;
      else all.push(g);
      await persist();
      return g;
    }),
  remove: (id) =>
    serial(async () => {
      cache = (await load()).filter((g) => g.id !== id);
      await persist();
    }),
};

export const db: Store = {
  listByIds: (ids) => (useCloud() ? cloud : local).listByIds(ids),
  get: (id) => (useCloud() ? cloud : local).get(id),
  upsert: (g) => (useCloud() ? cloud : local).upsert(g),
  remove: (id) => (useCloud() ? cloud : local).remove(id),
};

function demoGroup(): Group {
  const d = new Date().toISOString().slice(0, 10);
  return {
    id: "demogroup1",
    name: "Cena de ejemplo",
    createdAt: Date.now(),
    people: [
      { id: "alexdemo", name: "Alex" },
      { id: "mariademo", name: "María" },
      { id: "pablodemo", name: "Pablo" },
    ],
    expenses: [
      { id: "cenademo", concept: "Cena", amount: 60, paidBy: "alexdemo", splitAmong: ["alexdemo", "mariademo", "pablodemo"], date: d },
      { id: "entradasdemo", concept: "Entradas", amount: 30, paidBy: "mariademo", splitAmong: ["alexdemo", "mariademo", "pablodemo"], date: d },
    ],
    settled: [],
  };
}
