-- ============================================================
-- MIGRAÇÃO 001 — adiciona colunas que faltavam
-- Rode este arquivo no SQL Editor do Supabase se você já criou
-- o banco antes desta correção. É seguro rodar mais de uma vez.
-- ============================================================

alter table public.trabalhos_empresa add column if not exists nf_arquivo_path text;
alter table public.trabalhos_empresa add column if not exists comprovante_path text;
alter table public.pagamentos_freela add column if not exists comprovante_path text;
