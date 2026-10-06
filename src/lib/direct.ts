// "Direct mode" for the Android APK: the app talks to your own Supabase project
// from the device, without any server. Enabled when both VITE_DIRECT_* vars are set.
// The table stays locked; the app only calls the SQL functions in docs/apk-supabase.sql.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Group } from "./splits";

const URL = import.meta.env["VITE_DIRECT_SUPABASE_URL"] as string | undefined;
const KEY = import.meta.env["VITE_DIRECT_SUPABASE_KEY"] as string | undefined;

export const directMode = !!URL && !!KEY;

let client: SupabaseClient | null = null;
const sb = () =>
  (client ??= createClient(URL!, KEY!, { auth: { persistSession: false, autoRefreshToken: false } }));

export const direct = {
  async list(ids: string[]): Promise<Group[]> {
    if (!ids.length) return [];
    const { data, error } = await sb().rpc("spliteasy_list", { ids });
    if (error) throw error;
    return ((data ?? []) as Group[]).sort((a, b) => b.createdAt - a.createdAt);
  },
  async save(g: Group) {
    const { error } = await sb().rpc("spliteasy_save", { g });
    if (error) throw error;
    return g;
  },
  async remove(id: string) {
    const { error } = await sb().rpc("spliteasy_delete", { gid: id });
    if (error) throw error;
    return { ok: true };
  },
};
