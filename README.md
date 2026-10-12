# NivvoBank

Controle financeiro pessoal. Next.js (App Router) + Tailwind + Supabase (Auth, Postgres, RLS).

## Rodar

```bash
cp .env.local.example .env.local   # preencha URL e chave anon do Supabase
npm install
npm run dev
```

## Banco

Migrations em `supabase/migrations` (aplicar na ordem `001` → `003`).

## Design

Tokens e regras em `docs/DESIGN.md`, aplicados em `src/app/globals.css`.
