-- ============================================================
-- Schema: Gestão Financeira Designer Freelancer
-- Rode este arquivo inteiro no SQL Editor do Supabase (Database > SQL Editor)
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- CONFIG (um registro por usuário) ----------
create table if not exists public.config (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text default '',
  nome_profissional text default 'Designer Freelancer',
  telefone text default '',
  email text default '',
  moeda text default 'BRL',
  updated_at timestamptz default now()
);

-- ---------- EMPRESAS ----------
create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nome text not null,
  cor text,
  responsavel text,
  telefone text,
  email text,
  valor_padrao numeric,
  tipo_contratacao text default 'Mensal',
  observacoes text,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- ---------- CLIENTES ----------
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nome text not null,
  empresa_texto text,
  whatsapp text,
  email text,
  created_at timestamptz default now()
);

-- ---------- DEMANDAS FREELA ----------
create table if not exists public.demandas_freela (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  cliente text not null,
  servico text,
  servico_custom text,
  descricao text,
  data_contratacao date,
  prazo_entrega date,
  vencimento_pagamento date,
  valor_total numeric not null default 0,
  observacoes text,
  status_trabalho text default 'nao_iniciado',
  created_at timestamptz default now()
);

-- ---------- PAGAMENTOS FREELA (múltiplos por demanda) ----------
create table if not exists public.pagamentos_freela (
  id uuid primary key default gen_random_uuid(),
  demanda_id uuid references public.demandas_freela(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  valor numeric not null,
  data date not null,
  forma text,
  descricao text,
  comprovante_url text,
  comprovante_path text,
  created_at timestamptz default now()
);

-- ---------- TRABALHOS DE EMPRESA ----------
create table if not exists public.trabalhos_empresa (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  empresa_id uuid references public.empresas(id) on delete set null,
  servico text,
  descricao text,
  data date,
  mes_referencia date,
  valor numeric not null default 0,
  data_prevista_pagamento date,
  status text default 'em_andamento',
  observacoes text,
  pago boolean default false,
  data_pagamento date,
  forma_pagamento text,
  nf_numero text,
  nf_data_emissao date,
  nf_arquivo_url text,
  nf_arquivo_path text,
  comprovante_url text,
  comprovante_path text,
  created_at timestamptz default now()
);

-- ---------- LISTAS DE DEMANDAS (diárias) ----------
create table if not exists public.listas_demandas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  titulo text,
  data date not null,
  observacao text,
  created_at timestamptz default now()
);

-- ---------- TAREFAS (checklist dentro de cada lista) ----------
create table if not exists public.tarefas (
  id uuid primary key default gen_random_uuid(),
  lista_id uuid references public.listas_demandas(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  descricao text not null,
  vinculo_tipo text,
  vinculo_id uuid,
  vinculo_texto text,
  prioridade text default 'normal',
  concluida boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- RLS: cada usuário só vê e edita os próprios dados
-- ============================================================

alter table public.config enable row level security;
alter table public.empresas enable row level security;
alter table public.clientes enable row level security;
alter table public.demandas_freela enable row level security;
alter table public.pagamentos_freela enable row level security;
alter table public.trabalhos_empresa enable row level security;
alter table public.listas_demandas enable row level security;
alter table public.tarefas enable row level security;

create policy "own rows" on public.config for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.empresas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.clientes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.demandas_freela for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.pagamentos_freela for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.trabalhos_empresa for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.listas_demandas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.tarefas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- STORAGE: bucket para comprovantes e notas fiscais
-- (Rode isto também; se o bucket já existir, ignore o erro)
-- ============================================================

insert into storage.buckets (id, name, public) values ('arquivos', 'arquivos', false)
on conflict (id) do nothing;

create policy "own files read" on storage.objects for select
  using (bucket_id = 'arquivos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "own files insert" on storage.objects for insert
  with check (bucket_id = 'arquivos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "own files update" on storage.objects for update
  using (bucket_id = 'arquivos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "own files delete" on storage.objects for delete
  using (bucket_id = 'arquivos' and auth.uid()::text = (storage.foldername(name))[1]);
