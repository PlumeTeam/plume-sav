# Plume SAV

Application Next.js 14 qui gère le SAV des parapentes Plume Paragliders.

## Stack

- Next.js 14 App Router + TypeScript strict
- Supabase (Auth + DB + Realtime + Storage)
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod
- React Query + Zustand
- Resend.io (emails)

## Setup

```bash
pnpm install
cp apps/sav/.env.example apps/sav/.env.local
# Remplir NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
pnpm dev
```

## Documentation

- **Bible métier** : `docs/SAV-Plume-Bible.md`
- **Plan étape 4** : `docs/plan-detaille-etape-4.md`
- **Contexte projet** : `CLAUDE.md`
- **Agents Claude** : `.claude/agents/`
- **Slash commands** : `.claude/commands/`

## Commandes

| Commande | Action |
|---|---|
| `pnpm dev` | Lancer le dev server |
| `pnpm build` | Build production |
| `pnpm typecheck` | Type-check de tout le monorepo |
| `pnpm lint` | Lint |
| `pnpm test` | Tests unit/integration |
| `pnpm db:gen-types` | Régénérer les types Supabase |

## Contribuer

Voir `.claude/agents/architecte-en-chef.md` pour les standards qualité.
