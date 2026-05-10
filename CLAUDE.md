# Plume SAV — Contexte projet

> 🚨 **AVANT TOUTE RECHERCHE / EXPLORATION DU CODE — LIS [`./.claude/PRE-SEARCH.md`](.claude/PRE-SEARCH.md)** 🚨
>
> Ce repo est indexé par **GitNexus** (knowledge graph : 887 symboles, 1 749 relations, 60 flux d'exécution). Avant de `grep`, `glob`, `find` ou `Read` au hasard, tu dois interroger GitNexus — c'est plus rapide, plus précis, et ça allège ton contexte de 10× à 100×. Le protocole détaillé est dans `.claude/PRE-SEARCH.md`. La référence complète des outils GitNexus est plus bas dans ce fichier (section « GitNexus — Code Intelligence »).

> **Application Next.js 14 qui gère le SAV des parapentes Plume Paragliders.**
> Domaine cible : `sav.plumeparagliders.com`. Backend mutualisé avec le site principal (Supabase `gxighesxbavnzzyngjaz`).

Le contexte métier complet (vision, architecture 4 niveaux, QCM, scénarios, KPIs, financier, anti-fraude) est dans **[`docs/SAV-Plume-Bible.md`](docs/SAV-Plume-Bible.md)**. Lis-la quand tu manques de contexte sur le métier ou les décisions prises. Ne la duplique jamais ici.

---

## Stack figée (non négociable)

| Composant | Choix |
|---|---|
| Framework | Next.js 14+ (App Router, Server Components par défaut) |
| Langage | TypeScript strict (`strict: true` + `noUncheckedIndexedAccess: true`) |
| UI | Tailwind CSS + shadcn/ui (composants copiés dans le repo) |
| Auth/DB client | `@supabase/ssr` (**JAMAIS** `@supabase/auth-helpers`, déprécié) |
| Data fetching | React Query (`@tanstack/react-query`) côté client, queries directes côté Server Components |
| State client | Zustand (rôle actif, brouillons formulaires, UI ephemera) |
| Forms | React Hook Form + Zod (même schéma côté form ET Server Action) |
| Photos | `browser-image-compression` côté client (max 1600px, qualité 0.8) |
| Emails | Resend.io |
| Déploiement | Vercel (frontend) + Supabase Cloud (backend) |
| Tests | Vitest (unit/integration) + Playwright (e2e) + tests RLS dédiés |
| Monitoring | Sentry (erreurs) + PostHog (analytics produit) |
| Monorepo | pnpm workspaces |

---

## Projet Supabase

| Paramètre | Valeur |
|---|---|
| Project ID | `gxighesxbavnzzyngjaz` |
| Nom | plume-migration-clean |
| Région | eu-central-1 |
| Postgres | 17.6.1.011 |

**Toutes les apps Plume partagent ce projet** (boutique, démo, partner, accounting, futurlog, factory, proto, SAV). Il contient ~150 tables. Avant de créer une nouvelle table, vérifier qu'il n'existe pas déjà un équivalent — voir Bible §23.5 et §23.14.

---

## Cinq règles non-négociables

1. **Database-first** : `pnpm db:gen-types` régénère `packages/db/types.ts` après chaque migration. Plus jamais d'`any` dans les requêtes Supabase.

2. **RLS-first** : côté browser et Server Components, toujours le client Supabase user-scoped. La `service_role` UNIQUEMENT dans des Server Actions ou Edge Functions précises avec vérification explicite du rôle. Chaque table a des policies testées pour les 4 rôles (`client`, `school`, `workshop`, `plume_admin`).

3. **Mutations via Server Actions** : pas d'API routes inutiles. Validation Zod à l'entrée. Les forms RHF appellent des Server Actions, pas `fetch()`.

4. **Photos compressées côté client** : avant upload Storage. Bucket par contexte (`ticket-photos`, `inspection-photos`, `workshop-photos`).

5. **Realtime ciblé** : subscribe par `ticket_id`, pas globalement. Cleanup au démontage. Optimistic updates pour les messages.

---

## Structure monorepo cible

```
plume-sav/
├── apps/
│   └── sav/                    # Next.js 14 App Router
│       ├── app/
│       │   ├── (auth)/         # login, select-dashboard
│       │   ├── (client)/       # dashboard client
│       │   ├── (school)/       # dashboard école
│       │   ├── (workshop)/     # dashboard atelier
│       │   └── (plume)/        # dashboard Plume HQ
│       ├── features/<feature>/ # composants, actions, queries, hooks, schemas, types
│       └── lib/supabase/       # server.ts, client.ts, admin.ts (service_role isolé)
├── packages/
│   ├── db/                     # types Supabase générés + helpers + RLS guards
│   ├── ui/                     # shadcn components partagés
│   └── shared/                 # Zod schemas, constants, utils
├── supabase/
│   └── migrations/             # SQL versionné (jamais via dashboard)
├── .claude/
│   ├── agents/                 # architecte-en-chef, sav-builder, sav-rls-auditor, sav-db-schema, sav-ui-builder
│   ├── commands/               # /sav-table, /sav-feature, /sav-investigate, /sav-checkpoint
│   └── settings.json           # permissions Claude Code
├── docs/SAV-Plume-Bible.md     # contexte métier complet
└── CLAUDE.md                   # ce fichier
```

---

## Architecture par feature (pas par type)

```
features/<feature>/
  ├── components/        # UI (Server + Client séparés)
  ├── actions.ts         # Server Actions (mutations) — Zod en entrée
  ├── queries.ts         # Lectures Supabase (utilisé par Server Components)
  ├── hooks/             # Logique React Query côté client
  ├── types.ts           # Types dérivés du schéma Supabase + types métier
  ├── schemas.ts         # Schémas Zod (partagés form ↔ action)
  └── utils.ts           # Helpers purs
```

Une feature ne dépend **jamais** d'une autre feature directement → passer par `packages/shared/`.

---

## Politique de migrations

**On ne touche JAMAIS la structure de la DB via le dashboard Supabase.** Toutes les modifs passent par des fichiers SQL versionnés dans `supabase/migrations/` :

- Nommage : `YYYYMMDDHHMMSS_description.sql`
- Application : via le MCP Supabase (`apply_migration`) ou `supabase db push` localement
- Avantages : rejouable sur staging, traçable dans Git, code review sur le SQL

---

## Agents Claude Code

| Agent | Rôle | Modèle |
|---|---|---|
| `sav-builder` | Scaffolder une feature greenfield (composants, actions, schemas) | Sonnet |
| `sav-ui-builder` | Construire les pages/composants UI à partir des maquettes HTML | Sonnet |
| `sav-db-schema` | Designer une migration SQL après inspection des tables existantes | Opus |
| `sav-rls-auditor` | Auditer/écrire les RLS pour les 4 rôles + tests RLS | Opus |
| `architecte-en-chef` | Reviewer/auditeur final avant merge | Opus |

Workflow type :
```
sav-db-schema → [validation] → sav-builder → sav-ui-builder → sav-rls-auditor → architecte-en-chef
```

---

## Slash commands

| Commande | Effet |
|---|---|
| `/sav-investigate <table>` | Inspecte une table existante (colonnes, FK, RLS, échantillon) |
| `/sav-table <nom>` | Workflow création table : `sav-db-schema` → migration → types regen → tests RLS |
| `/sav-feature <nom>` | Pipeline complet : DB → scaffold → UI → audit RLS → review architecte |
| `/sav-checkpoint` | Type-check + lint + tests + audit RLS sur le diff courant |

---

## Skills à invoquer

| Skill | Quand |
|---|---|
| `/security-review` | Avant chaque push (RLS, secrets, OWASP) |
| `engineering:code-review` | Avant chaque merge |
| `engineering:debug` | Bug résistant > 15 min |
| `engineering:testing-strategy` | Avant feature non triviale |
| `claude-api` | Si on intègre du LLM (résumé tickets, classif photos) |

---

## Commandes courantes

| Action | Commande |
|---|---|
| Lancer le dev | `pnpm dev` |
| Build | `pnpm build` |
| Tests unit/integration | `pnpm test` |
| Tests e2e | `pnpm test:e2e` |
| Lint | `pnpm lint` |
| Type-check | `pnpm typecheck` |
| Régénérer les types Supabase | `pnpm db:gen-types` |
| Nouvelle migration | `pnpm db:migration <nom>` |
| Appliquer migrations en local | `pnpm db:migrate` |

---

## Style de communication attendu

- **Français**, direct, sans flatterie ni emojis.
- Justifier le « pourquoi » de chaque recommandation, pas de dogmes.
- Distinguer **critique / majeur / mineur** quand on remonte des problèmes.
- Pas de résumé de fin de message si le contenu tient en un paragraphe.
- Annoncer le plan avant d'exécuter une action non triviale (création de fichiers multiples, migration SQL).

---

## À lire en cas de doute

1. **Métier** → `docs/SAV-Plume-Bible.md`
2. **Architecture / red flags** → `.claude/agents/architecte-en-chef.md`
3. **Stack opérationnelle** → `.claude/agents/sav-builder.md`
4. **RLS** → `.claude/agents/sav-rls-auditor.md`
5. **DB / migrations** → `.claude/agents/sav-db-schema.md`
6. **UI / composants** → `.claude/agents/sav-ui-builder.md`

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **15_Plume_SAV** (887 symbols, 1749 relationships, 60 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/15_Plume_SAV/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/15_Plume_SAV/context` | Codebase overview, check index freshness |
| `gitnexus://repo/15_Plume_SAV/clusters` | All functional areas |
| `gitnexus://repo/15_Plume_SAV/processes` | All execution flows |
| `gitnexus://repo/15_Plume_SAV/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |
| Work in the Tickets area (138 symbols) | `.claude/skills/generated/tickets/SKILL.md` |
| Work in the Wizard area (15 symbols) | `.claude/skills/generated/wizard/SKILL.md` |
| Work in the Components area (12 symbols) | `.claude/skills/generated/components/SKILL.md` |
| Work in the Messages area (10 symbols) | `.claude/skills/generated/messages/SKILL.md` |
| Work in the [id] area (9 symbols) | `.claude/skills/generated/id/SKILL.md` |
| Work in the Auth area (7 symbols) | `.claude/skills/generated/auth/SKILL.md` |
| Work in the Inspection area (7 symbols) | `.claude/skills/generated/inspection/SKILL.md` |
| Work in the Plume area (4 symbols) | `.claude/skills/generated/plume/SKILL.md` |

<!-- gitnexus:end -->
