# Financeiro Designer

Sistema de gestão financeira para designer freelancer — Next.js + Supabase.

## 1. Configurar o Supabase

1. Crie um projeto em https://supabase.com.
2. Vá em **SQL Editor** e rode todo o conteúdo do arquivo `supabase/schema.sql` (cria as tabelas, segurança por usuário e o bucket de arquivos).
3. Em **Project Settings > API**, copie a **Project URL** e a **anon public key**.
4. (Opcional, recomendado) Em **Authentication > Providers > Email**, desative "Confirm email" enquanto estiver testando, para poder logar direto após criar a conta.

## 2. Rodar localmente

```bash
npm install
cp .env.local.example .env.local
# edite .env.local com sua URL e anon key do Supabase
npm run dev
```

Acesse http://localhost:3000, clique em "Criar conta" e faça seu primeiro login.

## 3. Subir para o GitHub

```bash
git init
git add .
git commit -m "Primeira versão do sistema"
git branch -M main
git remote add origin https://github.com/viiniiciuz/financeirodesigner.git
git push -u origin main
```

## 4. Publicar na Vercel com seu domínio

1. Acesse https://vercel.com, clique em **Add New > Project** e importe o repositório `financeirodesigner`.
2. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Clique em **Deploy**.
4. Depois do deploy, vá em **Settings > Domains**, adicione seu domínio próprio e siga as instruções de DNS (a Vercel mostra exatamente quais registros criar no seu provedor de domínio).

## Estrutura do projeto

```
app/
  login/            → tela de login/cadastro
  (app)/            → área logada (sidebar + páginas)
    dashboard/
    demandas/
    freela/
    trabalhos-empresa/
    clientes/
    empresas/
    pagamentos/
    configuracoes/
components/ui.js     → componentes visuais reutilizáveis
lib/                  → cliente Supabase, helpers, upload de arquivos
supabase/schema.sql   → schema completo do banco de dados
```

## Próximos passos (ainda não incluídos nesta versão)

- Calendário e Relatórios mensais com comparação (existiam na versão em artifact, serão portados a seguir).
- Busca global.
