-- ============================================================
-- MIGRAÇÃO 005 — Segurança (opcional, seguro de rodar mais de uma vez)
-- 1) Trilha de auditoria: registra quem criou/alterou/apagou o quê (sem guardar o conteúdo)
-- 2) Travas contra valores negativos em novos registros
-- Rode no Supabase: SQL Editor > New query > cole tudo > Run
-- (se aparecer "Potential issues", escolha "Run and enable RLS")
-- ============================================================

-- 1) AUDITORIA ------------------------------------------------
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid,
  tabela text not null,
  operacao text not null,        -- INSERT, UPDATE ou DELETE
  registro_id text,
  criado_em timestamptz not null default now()
);

alter table public.audit_log enable row level security;

-- Você só LÊ o próprio histórico; ninguém altera ou apaga pelo app
drop policy if exists "ver proprio historico" on public.audit_log;
create policy "ver proprio historico" on public.audit_log for select using (auth.uid() = user_id);

create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (user_id, tabela, operacao, registro_id)
  values (
    auth.uid(),
    tg_table_name,
    tg_op,
    case when tg_op = 'DELETE' then (to_jsonb(old)->>'id') else (to_jsonb(new)->>'id') end
  );
  return null;
end;
$$;

revoke all on function public.audit_trigger() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['contratos','contrato_modelos','clientes','empresas','demandas_freela',
                           'pagamentos_freela','trabalhos_empresa','despesas','config']
  loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists audit_%1$s on public.%1$I', t);
      execute format('create trigger audit_%1$s after insert or update or delete on public.%1$I
                      for each row execute function public.audit_trigger()', t);
    end if;
  end loop;
end $$;

-- 2) TRAVAS DE VALOR (valem só para novos registros; não mexem no que já existe)
do $$
declare r record;
begin
  for r in select * from (values
      ('despesas','valor'), ('pagamentos_freela','valor'), ('trabalhos_empresa','valor'),
      ('demandas_freela','valor_total'), ('contratos','valor')
  ) as x(tabela, coluna)
  loop
    if to_regclass('public.' || r.tabela) is not null
       and exists (select 1 from information_schema.columns
                   where table_schema='public' and table_name=r.tabela and column_name=r.coluna)
       and not exists (select 1 from pg_constraint where conname = 'chk_' || r.tabela || '_' || r.coluna || '_pos')
    then
      execute format('alter table public.%I add constraint %I check (%I >= 0) not valid',
                     r.tabela, 'chk_' || r.tabela || '_' || r.coluna || '_pos', r.coluna);
    end if;
  end loop;
end $$;
