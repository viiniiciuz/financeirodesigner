-- ============================================================
-- MIGRAÇÃO 002 — Quadro de demandas (estilo Trello)
-- Rode no Supabase: SQL Editor > New query > cole tudo > Run
-- ============================================================

-- Demandas freela passam a ter checklist e posição no quadro
alter table public.demandas_freela add column if not exists checklist jsonb default '[]'::jsonb;
alter table public.demandas_freela add column if not exists quadro_pos numeric default 0;

-- Cartões livres do quadro (demandas que não são freela)
create table if not exists public.quadro_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  titulo text not null,
  descricao text,
  status text default 'nao_iniciado',
  etiqueta text,
  prioridade text,
  prazo date,
  checklist jsonb default '[]'::jsonb,
  posicao numeric default 0,
  created_at timestamptz default now()
);

alter table public.quadro_cards enable row level security;
create policy "own rows" on public.quadro_cards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
