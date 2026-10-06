-- SplitEasy · base de datos para el APK (modo directo)
-- Pega todo esto en el SQL Editor de tu proyecto Supabase y pulsa Run.

create table if not exists public.groups (
  id text primary key,
  data jsonb not null,
  created_at bigint not null,
  updated_at timestamptz not null default now()
);

-- La tabla queda cerrada: nadie puede leerla ni listarla directamente.
alter table public.groups enable row level security;
revoke all on public.groups from anon, authenticated;
grant all on public.groups to service_role;

-- Solo devuelve los grupos cuyos ids ya conoce el móvil.
create or replace function public.spliteasy_list(ids text[])
returns setof jsonb language sql security definer set search_path = public as $$
  select data from public.groups where id = any(ids) limit 500;
$$;

create or replace function public.spliteasy_save(g jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  if (g->>'id') !~ '^[a-z0-9]{6,32}$' then raise exception 'id no válido'; end if;
  if length(g::text) > 2000000 then raise exception 'grupo demasiado grande'; end if;
  insert into public.groups (id, data, created_at, updated_at)
  values (g->>'id', g, coalesce((g->>'createdAt')::bigint, 0), now())
  on conflict (id) do update set data = excluded.data, updated_at = now();
end $$;

create or replace function public.spliteasy_delete(gid text)
returns void language sql security definer set search_path = public as $$
  delete from public.groups where id = gid;
$$;

revoke all on function public.spliteasy_list(text[]), public.spliteasy_save(jsonb), public.spliteasy_delete(text) from public;
grant execute on function public.spliteasy_list(text[]), public.spliteasy_save(jsonb), public.spliteasy_delete(text) to anon, authenticated;
