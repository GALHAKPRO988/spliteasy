CREATE TABLE public.groups (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  created_at bigint NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;