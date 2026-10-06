// Tiny file-based database: all groups live in one JSON file inside DATA_DIR.
// No external services, no native dependencies. Writes are atomic (tmp + rename)
// and serialised through a queue so concurrent requests never corrupt the file.
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Group } from "./splits";

let cache: Group[] | null = null;
let queue: Promise<unknown> = Promise.resolve();
let persistent = true;

function file() {
  const dir = process.env.DATA_DIR || "./data";
  return { dir, file: path.join(dir, "spliteasy.json") };
}

async function load(): Promise<Group[]> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(file().file, "utf8");
    const parsed = JSON.parse(raw);
    cache = Array.isArray(parsed.groups) ? parsed.groups : [];
  } catch {
    cache = [];
  }
  return cache!;
}

async function persist() {
  if (!persistent) return;
  try {
    const { dir, file: f } = file();
    await fs.mkdir(dir, { recursive: true });
    const tmp = `${f}.tmp`;
    await fs.writeFile(tmp, JSON.stringify({ version: 1, groups: cache }, null, 2));
    await fs.rename(tmp, f);
  } catch (e) {
    // Runtimes without a writable disk (e.g. hosted preview) keep data in memory.
    persistent = false;
    console.warn("[spliteasy] data dir not writable, using in-memory store", e);
  }
}

function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

export const db = {
  list: () => serial(async () => [...(await load())].sort((a, b) => b.createdAt - a.createdAt)),
  get: (id: string) => serial(async () => (await load()).find((g) => g.id === id) ?? null),
  upsert: (g: Group) =>
    serial(async () => {
      const all = await load();
      const i = all.findIndex((x) => x.id === g.id);
      if (i >= 0) all[i] = g;
      else all.push(g);
      await persist();
      return g;
    }),
  remove: (id: string) =>
    serial(async () => {
      cache = (await load()).filter((g) => g.id !== id);
      await persist();
    }),
};
