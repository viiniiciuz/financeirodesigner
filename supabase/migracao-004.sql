-- ============================================================
-- MIGRAÇÃO 004 — Contratos e propostas
-- Rode no Supabase: SQL Editor > New query > cole tudo > Run
-- ============================================================

-- Contratos e propostas
create table if not exists public.contratos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  demanda_id uuid references public.demandas_freela(id) on delete set null,
  titulo text not null,
  tipo text default 'contrato',
  status text default 'rascunho',
  conteudo text,
  cliente text,
  valor numeric default 0,
  prazo date,
  vars jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.contratos enable row level security;
drop policy if exists "own rows" on public.contratos;
create policy "own rows" on public.contratos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.contrato_modelos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nome text not null,
  tipo text default 'contrato',
  conteudo text,
  created_at timestamptz default now()
);
alter table public.contrato_modelos enable row level security;
drop policy if exists "own rows" on public.contrato_modelos;
create policy "own rows" on public.contrato_modelos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
