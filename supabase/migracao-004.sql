-- ============================================================
-- MIGRAÇÃO 004 — Cobrança por link, Pix completo e Contratos
-- Rode no Supabase: SQL Editor > New query > cole tudo > Run
-- ============================================================

-- 1) Pix: tipo da chave e cidade (usados no QR Code)
alter table public.config add column if not exists pix_tipo text;
alter table public.config add column if not exists pix_cidade text;

-- 2) Links de cobrança (o cliente abre sem login)
create table if not exists public.cobranca_links (
  token text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  cliente text,
  servico text,
  descricao text,
  valor numeric not null default 0,
  vencimento date,
  profissional text,
  telefone text,
  pix_chave text,
  pix_tipo text,
  pix_nome text,
  pix_cidade text,
  expira_em timestamptz default (now() + interval '30 days'),
  created_at timestamptz default now()
);
alter table public.cobranca_links enable row level security;
drop policy if exists "own rows" on public.cobranca_links;
create policy "own rows" on public.cobranca_links for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Função que o link público usa: devolve SOMENTE os dados daquele token (sem user_id, sem outras linhas)
create or replace function public.get_cobranca(p_token text)
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'cliente', cliente, 'servico', servico, 'descricao', descricao, 'valor', valor,
    'vencimento', vencimento, 'profissional', profissional, 'telefone', telefone,
    'pix_chave', pix_chave, 'pix_tipo', pix_tipo, 'pix_nome', pix_nome, 'pix_cidade', pix_cidade
  )
  from public.cobranca_links
  where token = p_token and expira_em > now();
$$;
revoke all on function public.get_cobranca(text) from public;
grant execute on function public.get_cobranca(text) to anon, authenticated;

-- 3) Contratos e propostas
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
