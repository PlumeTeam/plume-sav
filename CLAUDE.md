# Plume SAV — Contexte projet

> 📘 **NOUVEAU SUR LE PROJET / NOUVELLE SESSION** : commence par [`docs/BRIEFING-PROJET.md`](docs/BRIEFING-PROJET.md) — sujet, GitHub, Vercel, état actuel, comment démarrer. Le présent fichier ne couvre que les règles techniques.

> 🚨 **AVANT TOUTE RECHERCHE** : lis [`./.claude/PRE-SEARCH.md`](.claude/PRE-SEARCH.md). Ce repo est indexé par **GitNexus** (~1 329 symboles, ~3 379 relations, ~96 flux). Utilise les outils MCP `gitnexus_*` (cf. section finale) au lieu de `grep`/`glob`/`Read` aveugle.
>
> 🧪 **MODE DÉMO** (mai 2026) — site pas encore en ligne pour vrais clients. Prod : https://plume-sav.vercel.app. On push **direct sur `main`** sauf demande explicite de branche preview.
>
> 📔 **JOURNAL** — fin de session non triviale → ajoute une entrée dans [`docs/INTERVENTIONS-LOG.md`](docs/INTERVENTIONS-LOG.md).

**Application Next.js 14 — SAV des parapentes Plume Paragliders.** Domaine cible : `sav.plumeparagliders.com`. Backend Supabase mutualisé (`gxighesxbavnzzyngjaz`).

Contexte métier complet → [`docs/SAV-Plume-Bible.md`](docs/SAV-Plume-Bible.md). Ne le duplique jamais ici.

---

## 🌐 Infrastructure (état mai 2026)

| Service | Détail |
|---|---|
| **Vercel** | Team `plumes-projects-32ca7a67` · projet `plume-sav` (Next.js, Node 24) · prod = alias de `main` · branches → previews auto · runtime logs via MCP `get_runtime_logs` |
| **GitHub** | `PlumeTeam/plume-sav` (public) · branche par défaut `main` · commits attribués à `PlumeTeam` (bot) ou `jbchandelier` (humain) |
| **Supabase** | Project `gxighesxbavnzzyngjaz` (plume-migration-clean, eu-central-1, PG 17) · **partagé entre toutes les apps Plume** (~150 tables) · MCP : `execute_sql`, `apply_migration`, `list_tables`, `get_advisors` · vérifier qu'une table équivalente n'existe pas avant d'en créer une nouvelle |

---

## 📏 Limites de taille des fichiers (anti-spaghetti)

| Lignes | Action |
|---|---|
| < 300 | ✅ OK |
| 300–500 | 🟡 À chaque ajout, demande-toi si ça mérite un nouveau fichier |
| 500–800 | 🟠 Avant nouvelle feature dans ce fichier, propose un split |
| > 800 | 🔴 Refactor obligatoire avant tout ajout |

**Conception** : si un fichier risque de dépasser 500 lignes à 6 mois, structure-le en plusieurs fichiers dès le départ (ex : `actions/{creation,messaging,school,…}.ts` + `index.ts` re-export — pas un seul `actions.ts` qui finit à 1 700 lignes comme avant le commit `4c80970`).

**Audit rapide** : `find apps/sav -name "*.ts*" -exec wc -l {} + | sort -rn | head -20`

---

## Stack figée (non négociable)

- **Next.js 14 App Router** — Server Components par défaut · TypeScript strict (`noUncheckedIndexedAccess: true`)
- **Tailwind + shadcn/ui** (composants copiés dans le repo)
- **`@supabase/ssr`** côté auth/DB (jamais `auth-helpers`, déprécié)
- **React Query** côté client · queries directes côté Server Components
- **Zustand** (rôle actif, brouillons formulaires) · **RHF + Zod** (forms ↔ Server Actions, même schéma)
- **Photos** : `browser-image-compression` (max 1600px, qualité 0.8) avant upload Storage
- **Emails** : Resend.io · **Tests** : Vitest + Playwright + tests RLS dédiés · **Monorepo** : pnpm workspaces

---

## Cinq règles non-négociables

1. **Database-first** — `pnpm db:gen-types` après chaque migration. Plus jamais d'`any` dans les queries Supabase.
2. **RLS-first** — client user-scoped côté browser/Server Components. `service_role` UNIQUEMENT en Server Action/Edge Function avec vérif rôle explicite. Policies testées pour les 4 rôles (`client`, `school`, `workshop`, `plume_admin`).
3. **Mutations via Server Actions** — pas d'API routes inutiles. Validation Zod en entrée. RHF appelle l'action, pas `fetch()`.
4. **Photos compressées côté client** avant upload. Bucket par contexte : `ticket-photos`, `inspection-photos`, `workshop-photos`.
5. **Realtime ciblé** — subscribe par `ticket_id`, pas globalement. Cleanup au démontage. Optimistic updates pour les messages.

---

## Politique de migrations

**Jamais via le dashboard Supabase.** Tout passe par des fichiers SQL versionnés dans `supabase/migrations/` (nommage `YYYYMMDDHHMMSS_description.sql`), appliqués via le MCP `apply_migration` ou `supabase db push`.

---

## Architecture du repo

Structure standard `apps/sav/` (Next.js) + `packages/{db,ui,shared}/` + `supabase/migrations/`. Détail dans le repo lui-même.

**Une feature ne dépend jamais d'une autre directement** → passer par `packages/shared/`.

**Convention par feature** : `features/<feature>/{components,actions,queries,hooks,types,schemas,utils}.ts`. Si `actions` dépasse 300 lignes, le splitter en sous-dossier (cf. `features/tickets/actions/`).

---

## Agents, commandes et skills

- **Agents Claude Code** dans `.claude/agents/` : `architecte-en-chef`, `sav-builder`, `sav-ui-builder`, `sav-db-schema`, `sav-rls-auditor`. Pipeline type : `sav-db-schema` → validation → `sav-builder` → `sav-ui-builder` → `sav-rls-auditor` → `architecte-en-chef`.
- **Slash commands** dans `.claude/commands/` : `/sav-investigate`, `/sav-table`, `/sav-feature`, `/sav-checkpoint`.
- **Skills marketplace** à invoquer si pertinent : `/security-review` avant push, `engineering:code-review` avant merge, `engineering:debug` si bug > 15 min.

---

## Commandes essentielles

```bash
pnpm dev              # dev server
pnpm build            # build prod
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest
pnpm db:gen-types     # régénérer types Supabase après migration
```

`pnpm typecheck` ne suffit PAS comme garde-fou Next.js — vérifier le preview Vercel après chaque push (cf. piège `'use server'` re-export documenté dans `INTERVENTIONS-LOG.md`).

---

## Style de communication attendu

- Français, direct, sans flatterie ni emoji décoratif.
- Justifier le « pourquoi », pas de dogme.
- Distinguer **critique / majeur / mineur** quand on remonte un problème.
- Pas de résumé final si le contenu tient en un paragraphe.
- Annoncer le plan avant action non triviale (création multi-fichiers, migration SQL).

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **SAV** (1343 symbols, 3401 relationships, 98 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

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
3. `READ gitnexus://repo/SAV/process/{processName}` — trace the full execution flow step by step
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
| `gitnexus://repo/SAV/context` | Codebase overview, check index freshness |
| `gitnexus://repo/SAV/clusters` | All functional areas |
| `gitnexus://repo/SAV/processes` | All execution flows |
| `gitnexus://repo/SAV/process/{name}` | Step-by-step execution trace |

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

<!-- gitnexus:end -->
