<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- `src/lib/db.server.ts` stores groups in the Cloud `groups` table (server-only, service role) when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY exist, else a JSON file in DATA_DIR — self-hosting stays dependency-free. Access only via `src/lib/groups.functions.ts`.
- No accounts: each device keeps its group ids in localStorage and lists only those; opening a group link adds it — privacy without login.
- Self-hosting builds with `NITRO_PRESET=node-server` (see Dockerfile) — the default build targets the edge, which has no persistent disk.
