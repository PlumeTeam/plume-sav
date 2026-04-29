# Plan détaillé — Étape 4 : Test sur feature minimale (login + select-dashboard)

> **Usage depuis mobile** : ouvre Claude Code sur le projet `C:\Plume_code\15_Plume_SAV` (via SSH, web, ou app mobile Claude Code), puis envoie comme prompt : **« Exécute le plan dans `docs/plan-detaille-etape-4.md` étape par étape, en respectant tous les checkpoints de validation. »**
>
> Ce fichier contient à la fois la doc lisible **et** les instructions exécutables pour Claude Code. Il est conçu pour être suivi sans intervention humaine sauf aux checkpoints explicitement marqués `[VALIDATION REQUISE]`.

---

## Objectif

Scaffolder un monorepo Next.js 14 + Supabase fonctionnel avec :

- Le boilerplate complet du projet `plume-sav`
- Une page `/login` qui authentifie via Supabase
- Une page `/select-dashboard` qui lit `user_roles` et redirige
- Un middleware qui protège les espaces `(client)/`, `(school)/`, `(workshop)/`, `(plume)/`
- Le tout buildable et démarrable avec `pnpm dev`

---

## Pré-requis et décisions à prendre par défaut

Si l'utilisateur n'a pas répondu explicitement, applique ces **valeurs par défaut** :

### Q1 — Git init
- **Défaut : OUI**, lancer `git init` au tout début. Sans repo Git, pas de traçabilité ni de retour arrière propre.
- **Override possible** : l'utilisateur dit explicitement « pas de git ».

### Q2 — Approche Supabase pendant le scaffold
- **Défaut : Option C** — Scaffolder sans ENV réelles, créer `.env.example` documenté, et laisser un `.env.local` vide à compléter par l'utilisateur après.
- L'UI sera visible en `pnpm dev`, et le login sera fonctionnel **dès** que l'utilisateur remplira `.env.local` avec :
  - `NEXT_PUBLIC_SUPABASE_URL` (URL du projet Supabase)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (clé anon publique)

Pour récupérer ces valeurs, l'utilisateur peut lancer (avec son token Supabase) :
```
mcp__044eeef6-6ad3-4f71-96e4-beb35d193dcd__get_project_url({ project_id: "gxighesxbavnzzyngjaz" })
mcp__044eeef6-6ad3-4f71-96e4-beb35d193dcd__get_publishable_keys({ project_id: "gxighesxbavnzzyngjaz" })
```

### Q3 — Node + pnpm
- **Défaut** : tester `pnpm --version` au début. Si absent, signaler et proposer `npm install -g pnpm@9` (mais NE PAS exécuter sans validation).

---

## Plan d'exécution — 12 étapes

À chaque étape, tu **annonces** ce que tu vas faire (1 ligne), tu **exécutes**, et tu **résumes** le résultat (1-3 lignes). Pas plus.

À chaque `[VALIDATION REQUISE]`, tu **t'arrêtes** et attends une réponse explicite de l'utilisateur. Sans validation, tu ne poursuis pas.

---

### Étape 4.0 — Vérification environnement

```bash
node --version
pnpm --version
git --version
```

- Si `pnpm` absent : **arrêt**, signaler à l'utilisateur, proposer `npm install -g pnpm@9` ou `corepack enable && corepack prepare pnpm@9 --activate`. Attendre validation.
- Si Node < 18.17 : **arrêt**, signaler.

---

### Étape 4.1 — Init repo Git

```bash
git init
git config init.defaultBranch main
git checkout -b main 2>/dev/null || true
```

Créer `.gitignore` racine :

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
.next/
out/
dist/
build/

# Env
.env
.env.local
.env*.local
!.env.example

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Tests
coverage/
.nyc_output/
playwright-report/
test-results/

# Claude
.claude/settings.local.json

# Supabase
supabase/.branches/
supabase/.temp/
```

---

### Étape 4.2 — Init pnpm workspaces

Créer `pnpm-workspace.yaml` :

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Créer `package.json` racine :

```json
{
  "name": "plume-sav",
  "version": "0.0.1",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "scripts": {
    "dev": "pnpm --filter @plume/sav dev",
    "build": "pnpm --filter @plume/sav build",
    "start": "pnpm --filter @plume/sav start",
    "lint": "pnpm --filter @plume/sav lint",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test --run",
    "test:e2e": "pnpm --filter @plume/sav test:e2e",
    "db:gen-types": "pnpm --filter @plume/db gen-types"
  },
  "engines": {
    "node": ">=18.17.0",
    "pnpm": ">=9"
  }
}
```

Créer la structure de dossiers :

```bash
mkdir -p apps packages supabase/migrations supabase/tests/rls
```

---

### Étape 4.3 — `packages/db` (types Supabase)

Créer `packages/db/package.json` :

```json
{
  "name": "@plume/db",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "gen-types": "echo 'Use MCP supabase generate_typescript_types — see docs'",
    "typecheck": "tsc --noEmit"
  }
}
```

Créer `packages/db/tsconfig.json`, `packages/db/src/index.ts` (ré-export `types.ts`), `packages/db/src/types.ts` (placeholder vide pour l'instant — sera régénéré).

Placeholder `types.ts` minimal :

```ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
```

**Note** : ces types seront remplacés à la régénération réelle (étape 4.11).

---

### Étape 4.4 — `packages/ui` (shadcn shared)

Créer `packages/ui/package.json` :

```json
{
  "name": "@plume/ui",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@radix-ui/react-slot": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "lucide-react": "^0.453.0",
    "tailwind-merge": "^2.5.4"
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

Créer `packages/ui/src/index.ts`, `packages/ui/src/lib/utils.ts` (avec `cn()` standard shadcn).

Pour le moment, on **ne pré-installe PAS de composants shadcn** dans `@plume/ui`. On le fera à l'étape 4.10 quand on saura précisément quels composants on a besoin pour login.

---

### Étape 4.5 — `apps/sav` — init Next.js

Depuis la racine, créer le projet Next.js dans `apps/sav` :

```bash
pnpm dlx create-next-app@14 apps/sav \
  --typescript --tailwind --app \
  --eslint --src-dir=false \
  --import-alias="@/*" \
  --no-turbopack \
  --use-pnpm \
  --skip-install
```

**Si la commande pose des questions interactives**, utiliser plutôt la création manuelle du `package.json` (voir variant ci-dessous).

#### Variant manuel `apps/sav/package.json`

```json
{
  "name": "@plume/sav",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.0",
    "@plume/db": "workspace:*",
    "@plume/ui": "workspace:*",
    "@supabase/ssr": "^0.5.1",
    "@supabase/supabase-js": "^2.45.4",
    "@tanstack/react-query": "^5.59.0",
    "next": "14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.0",
    "zod": "^3.23.8",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.16.10",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.1",
    "eslint-config-next": "14.2.15",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.3"
  }
}
```

Créer en plus :
- `apps/sav/tsconfig.json` (strict + noUncheckedIndexedAccess + paths `@/*`)
- `apps/sav/next.config.mjs` (transpilePackages: `["@plume/db", "@plume/ui"]`)
- `apps/sav/tailwind.config.ts` (avec content scan sur `apps/sav/**` ET `packages/ui/**`)
- `apps/sav/postcss.config.mjs`
- `apps/sav/app/layout.tsx`, `app/page.tsx`, `app/globals.css` (Tailwind)
- `apps/sav/.eslintrc.json` (next/core-web-vitals)

Configurer `apps/sav/tsconfig.json` avec `strict: true` et `noUncheckedIndexedAccess: true`.

---

### Étape 4.6 — `apps/sav/lib/supabase/` (clients SSR)

Créer trois fichiers :

#### `apps/sav/lib/supabase/server.ts`

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@plume/db'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — silently ignore (cookie set fails outside actions/middleware)
          }
        },
      },
    }
  )
}
```

#### `apps/sav/lib/supabase/client.ts`

```ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@plume/db'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### `apps/sav/lib/supabase/middleware.ts`

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@plume/db'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/select-dashboard')
  const isProtectedRoute = ['/client', '/school', '/workshop', '/plume'].some(p => pathname.startsWith(p))

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/select-dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

#### `apps/sav/middleware.ts` (à la racine d'apps/sav)

```ts
import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

### Étape 4.7 — `.env.example` documenté

Créer `apps/sav/.env.example` :

```dotenv
# ============================================================
# SUPABASE — projet plume-migration-clean (gxighesxbavnzzyngjaz)
# ============================================================
# URL du projet Supabase. Récupérer via :
#   MCP Supabase get_project_url({ project_id: "gxighesxbavnzzyngjaz" })
NEXT_PUBLIC_SUPABASE_URL=https://gxighesxbavnzzyngjaz.supabase.co

# Clé anon (publique). Récupérer via :
#   MCP Supabase get_publishable_keys({ project_id: "gxighesxbavnzzyngjaz" })
NEXT_PUBLIC_SUPABASE_ANON_KEY=<à remplir>

# Service role (CONFIDENTIELLE — JAMAIS exposée côté client).
# À utiliser uniquement dans des Server Actions vérifiées.
# SUPABASE_SERVICE_ROLE_KEY=<à remplir si besoin>

# ============================================================
# RESEND — envoi d'emails
# ============================================================
# RESEND_API_KEY=<à remplir si besoin>

# ============================================================
# SENTRY — monitoring d'erreurs (optionnel pour le dev local)
# ============================================================
# NEXT_PUBLIC_SENTRY_DSN=<optionnel>

# ============================================================
# POSTHOG — analytics produit (optionnel pour le dev local)
# ============================================================
# NEXT_PUBLIC_POSTHOG_KEY=<optionnel>
# NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

Créer aussi `apps/sav/.env.local` vide (juste pour que ça démarre) :

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

### Étape 4.8 — Auth feature : login + select-dashboard

Créer la feature `apps/sav/features/auth/`.

#### `apps/sav/features/auth/schemas.ts`

```ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
})

export type LoginInput = z.infer<typeof loginSchema>
```

#### `apps/sav/features/auth/actions.ts`

```ts
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { loginSchema } from './schemas'

export async function loginAction(_prev: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: { _form: [error.message] } }
  }

  revalidatePath('/', 'layout')
  redirect('/select-dashboard')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

#### `apps/sav/features/auth/queries.ts`

```ts
import { createClient } from '@/lib/supabase/server'

export type UserRole = 'client' | 'school' | 'workshop' | 'plume_admin'

export async function getCurrentUserRoles(): Promise<UserRole[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  return (data ?? []).map(r => r.role as UserRole)
}
```

> Note : `user_roles` est une table existante (Bible §23.5). Sa structure exacte sera vérifiée à l'étape 4.11. Adapter le `select` si nécessaire.

#### `apps/sav/features/auth/components/LoginForm.tsx`

```tsx
'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { loginAction } from '../actions'

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, { error: null })

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
        {state?.error?.email && <p className="text-sm text-red-600">{state.error.email[0]}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">Mot de passe</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 block w-full rounded-md border px-3 py-2"
        />
        {state?.error?.password && <p className="text-sm text-red-600">{state.error.password[0]}</p>}
      </div>

      {state?.error?._form && (
        <p className="text-sm text-red-600" role="alert">{state.error._form[0]}</p>
      )}

      <SubmitButton />
    </form>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
    >
      {pending ? 'Connexion…' : 'Se connecter'}
    </button>
  )
}
```

#### `apps/sav/app/(auth)/layout.tsx`

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        {children}
      </div>
    </div>
  )
}
```

#### `apps/sav/app/(auth)/login/page.tsx`

```tsx
import { LoginForm } from '@/features/auth/components/LoginForm'

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Connexion</h1>
      <LoginForm />
    </>
  )
}
```

#### `apps/sav/app/(auth)/select-dashboard/page.tsx`

```tsx
import { redirect } from 'next/navigation'
import { getCurrentUserRoles, type UserRole } from '@/features/auth/queries'

const ROLE_PATHS: Record<UserRole, string> = {
  client: '/client',
  school: '/school',
  workshop: '/workshop',
  plume_admin: '/plume',
}

const ROLE_LABELS: Record<UserRole, string> = {
  client: 'Espace client',
  school: 'Espace école',
  workshop: 'Espace atelier',
  plume_admin: 'Plume HQ',
}

export default async function SelectDashboardPage() {
  const roles = await getCurrentUserRoles()

  if (roles.length === 0) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-semibold">Aucun rôle assigné</h1>
        <p className="mt-2 text-sm text-slate-600">
          Contactez Plume pour obtenir l'accès à un espace.
        </p>
      </div>
    )
  }

  if (roles.length === 1) {
    redirect(ROLE_PATHS[roles[0]!])
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Vos espaces</h1>
      <p className="mb-6 text-sm text-slate-600">
        Choisissez l'espace dans lequel vous souhaitez travailler.
      </p>
      <ul className="space-y-2">
        {roles.map(role => (
          <li key={role}>
            <a
              href={ROLE_PATHS[role]}
              className="block rounded-md border px-4 py-3 hover:bg-slate-50"
            >
              {ROLE_LABELS[role]}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

#### Stubs des dashboards

Créer 4 pages minimales pour que les redirections fonctionnent :

- `apps/sav/app/(client)/client/page.tsx`
- `apps/sav/app/(school)/school/page.tsx`
- `apps/sav/app/(workshop)/workshop/page.tsx`
- `apps/sav/app/(plume)/plume/page.tsx`

Chacune affiche un placeholder simple :

```tsx
import { logoutAction } from '@/features/auth/actions'

export default function ClientDashboardPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Espace client</h1>
      <p className="mt-2 text-sm text-slate-600">Dashboard à construire — voir Bible §14.</p>
      <form action={logoutAction} className="mt-6">
        <button type="submit" className="text-sm underline">Se déconnecter</button>
      </form>
    </main>
  )
}
```

(Adapter le titre et le path pour chaque rôle.)

---

### Étape 4.9 — `apps/sav/app/page.tsx` (root → redirect login)

Remplacer le contenu généré par `create-next-app` par :

```tsx
import { redirect } from 'next/navigation'

export default function HomePage() {
  redirect('/login')
}
```

---

### Étape 4.10 — README.md court

Créer `README.md` à la racine du repo :

```markdown
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

\`\`\`bash
pnpm install
cp apps/sav/.env.example apps/sav/.env.local
# Remplir NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
pnpm dev
\`\`\`

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
```

---

### Étape 4.11 — Régénération des types Supabase + vérif `user_roles`

Vérifier la structure réelle de `user_roles` avant que l'app s'en serve :

```
mcp__044eeef6-6ad3-4f71-96e4-beb35d193dcd__execute_sql({
  project_id: "gxighesxbavnzzyngjaz",
  query: "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles' ORDER BY ordinal_position;"
})
```

Si la colonne s'appelle différemment de `role` (par exemple `role_name`, `type`), **adapter** `apps/sav/features/auth/queries.ts` en conséquence et signaler la divergence.

Régénérer les types :

```
mcp__044eeef6-6ad3-4f71-96e4-beb35d193dcd__generate_typescript_types({
  project_id: "gxighesxbavnzzyngjaz"
})
```

Écrire le résultat dans `packages/db/src/types.ts` (remplacer le placeholder).

---

### Étape 4.12 — Install + checkpoint

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm build
```

`[VALIDATION REQUISE]` — Si tout passe au vert, signaler :
- ✅ Build OK
- ✅ Type-check OK (0 erreur)
- ✅ Lint OK
- Prochaine étape : `pnpm dev` puis ouvrir http://localhost:3000 → redirige vers /login.

Si des erreurs apparaissent, **stop**, lister précisément les erreurs et attendre instruction.

---

## Premier commit

Une fois le build vert :

```bash
git add CLAUDE.md .claude .gitignore .env.example apps packages docs README.md package.json pnpm-workspace.yaml supabase
git status
```

`[VALIDATION REQUISE]` — Présenter à l'utilisateur le contenu de `git status`. Sur validation, créer le commit :

```bash
git commit -m "$(cat <<'EOF'
chore: scaffold monorepo Next.js 14 + Supabase + auth (login + select-dashboard)

- Init pnpm workspaces (apps/sav, packages/db, packages/ui)
- Next.js 14 App Router + TypeScript strict + Tailwind
- Supabase clients SSR (server, client, middleware)
- Auth feature : LoginForm RHF+Zod + Server Actions, select-dashboard avec lecture user_roles
- Stubs des 4 dashboards (client, school, workshop, plume)
- .env.example documenté
- Régénération types Supabase

Refs: docs/plan-detaille-etape-4.md, docs/SAV-Plume-Bible.md §23

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Rapport final attendu

Tu rends à l'utilisateur :

```markdown
## Étape 4 — Terminée

### Fichiers créés
- Racine : <N>
- apps/sav : <N>
- packages/db : <N>
- packages/ui : <N>
- supabase : <N>

### Vérifications
- pnpm install : ✓
- typecheck : ✓
- lint : ✓
- build : ✓

### Tables Supabase touchées
- user_roles : LECTURE SEULE (structure vérifiée à l'étape 4.11)
- Aucune migration appliquée

### Reste à faire (par humain)
1. Remplir `apps/sav/.env.local` avec les vraies clés Supabase
2. Créer un user de test dans Supabase Auth + lui assigner un rôle dans `user_roles`
3. `pnpm dev` puis tester le flow login → select-dashboard
4. Premier commit Git (si non encore fait)

### Prochaines étapes recommandées
- Construire le dashboard client (`/sav-feature client-tickets-list`)
- Construire le QCM client (`/sav-feature client-create-ticket`)
- Construire le dashboard école (`/sav-feature school-tickets-queue`)
```

---

## Garde-fous globaux pour Claude Code

- **Aucune `apply_migration`** dans cette étape (seulement régénération de types via `generate_typescript_types`).
- **Aucun secret** ne doit apparaître dans les fichiers (`.env.local` reste vide).
- **Aucun commit Git** automatique sans validation explicite à l'étape « Premier commit ».
- Si une commande `pnpm` échoue, **arrêt immédiat** et lecture du log d'erreur — ne pas relancer en boucle.
- Si `create-next-app` est interactif et bloque, basculer sur le variant manuel (étape 4.5).
- En cas de doute sur la structure de `user_roles`, **toujours vérifier avant de coder** la query (étape 4.11).
- Si l'utilisateur n'est pas joignable et qu'un `[VALIDATION REQUISE]` est atteint, **t'arrêter là** et écrire un résumé clair de l'état pour reprise plus tard.

---

## Notes pour exécution depuis mobile

- Tu peux interrompre l'exécution à tout moment en envoyant un message. Claude Code stoppera après la commande en cours.
- Pour reprendre où on en était, envoie : « Reprends le plan `docs/plan-detaille-etape-4.md` à partir de l'étape 4.X. »
- Si tu veux skipper l'étape 4.11 (régénération types) parce que tu n'as pas les credentials Supabase à dispo, dis : « Skippe la régénération de types, garde le placeholder. » — l'app build quand même.
- Si tu veux que je commit automatiquement à la fin (sans validation), dis explicitement : « Commit auto autorisé pour cette étape. »
