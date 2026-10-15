-- ============================================================
-- MIGRAÇÃO 003 — Chave Pix (lembrete de cobrança) e Despesas
-- Rode no Supabase: SQL Editor > New query > cole tudo > Run
-- ============================================================

alter table public.config add column if not exists chave_pix text;

create table if not exists public.despesas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  descricao text not null,
  categoria text,
  valor numeric not null default 0,
  data date not null default current_date,
  recorrente boolean default false,
  observacoes text,
  created_at timestamptz default now()
);

alter table public.despesas enable row level security;
create policy "own rows" on public.despesas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
