import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "./db.server";
import type { Group } from "./splits";

const id = z.string().regex(/^[a-z0-9]{6,32}$/);
const name = z.string().trim().min(1).max(60);

const groupSchema = z
  .object({
    id,
    name,
    createdAt: z.number().int().nonnegative(),
    people: z.array(z.object({ id, name })).max(100),
    expenses: z
      .array(
        z.object({
          id,
          concept: z.string().trim().min(1).max(120),
          amount: z.number().positive().max(10_000_000),
          paidBy: id,
          splitAmong: z.array(id).min(1).max(100),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        }),
      )
      .max(5000),
    settled: z.array(z.string().max(200)).max(5000),
  })
  .superRefine((g, ctx) => {
    const ids = new Set(g.people.map((p) => p.id));
    for (const e of g.expenses) {
      if (!ids.has(e.paidBy) || e.splitAmong.some((x) => !ids.has(x)))
        ctx.addIssue({ code: "custom", message: "Expense references unknown person" });
    }
  });

// Only returns the groups whose ids the device already knows (stored in the browser).
export const listGroups = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ ids: z.array(id).max(500) }).parse(d))
  .handler(async ({ data }) => db.listByIds(data.ids));

export const saveGroup = createServerFn({ method: "POST" })
  .inputValidator((d) => groupSchema.parse(d))
  .handler(async ({ data }) => db.upsert(data as Group));

export const deleteGroup = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id }).parse(d))
  .handler(async ({ data }) => {
    await db.remove(data.id);
    return { ok: true };
  });
