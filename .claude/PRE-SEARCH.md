# 🚨 PRE-SEARCH PROTOCOL — À lire avant toute recherche dans le code

> Ce fichier est **prioritaire**. Il définit la procédure obligatoire à suivre quand tu cherches du code, comprends une feature, ou planifies une modification dans le repo `plume-sav`.
>
> Objectif : **éviter de te perdre dans le contexte** en utilisant le knowledge graph GitNexus en premier, plutôt que de grep/glob aveuglément des fichiers.

---

## Pourquoi ?

Ce repo a déjà ~150 fichiers TypeScript significatifs, ~50 features, et continue de grossir. À chaque session, Claude peut facilement consommer 30-50 % de son contexte juste en `Read`-ant des fichiers à l'aveugle pour reconstituer une architecture qui est **déjà connue par GitNexus**.

GitNexus a indexé tout le repo dans un knowledge graph structuré :
- **887 symboles** (fonctions, classes, composants, types)
- **1 749 relations** (calls, imports, héritages, implémentations)
- **34 clusters** (zones fonctionnelles : Tickets, Wizard, Messages, Auth, etc.)
- **60 flux d'exécution** tracés (entry point → call chain → side effects)

→ Une seule requête GitNexus remplace 10-30 reads de fichiers + grep + suivis manuels.

---

## Règle d'or : 4 cas d'usage, 4 réflexes

### Cas 1 — « Comment fonctionne X dans ce projet ? »

**❌ Ne fais pas** : `grep -r "X" apps/sav/`, puis `Read` 5 fichiers, puis suivre les imports manuellement.

**✅ Fais** :
```ts
gitnexus_query({ query: "X" })
```
Tu reçois les flux d'exécution liés à X, regroupés par process, classés par pertinence.

Pour creuser un symbole précis (callers, callees, processes participés) :
```ts
gitnexus_context({ name: "monSymbole" })
```

### Cas 2 — « Je vais modifier la fonction Y, qu'est-ce que je risque de casser ? »

**❌ Ne fais pas** : éditer puis prier que les tests passent.

**✅ Fais — OBLIGATOIRE avant tout edit** :
```ts
gitnexus_impact({ target: "Y", direction: "upstream" })
```
Tu reçois la blast radius : appelants directs, processus affectés, niveau de risque (LOW / MEDIUM / HIGH / CRITICAL).

**Si HIGH ou CRITICAL** → préviens l'utilisateur AVANT de modifier.

### Cas 3 — « Je veux renommer Z »

**❌ Ne fais pas** : find-and-replace.

**✅ Fais** :
```ts
gitnexus_rename({ symbol_name: "Z", new_name: "Z2", dry_run: true })
```
GitNexus comprend le call graph, gère les imports, et te montre l'aperçu. Si OK :
```ts
gitnexus_rename({ symbol_name: "Z", new_name: "Z2", dry_run: false })
```

### Cas 4 — « Avant de commit, est-ce que mes changements touchent ce que je crois ? »

**✅ Fais** :
```ts
gitnexus_detect_changes({ scope: "staged" })
```
Compare avec les attentes. Si des symboles non prévus apparaissent → tu fais peut-être plus que ce que tu pensais.

---

## Outils GitNexus disponibles (résumé)

| Outil MCP | Sert à | Quand l'utiliser |
|---|---|---|
| `gitnexus_query` | Trouver du code par concept | Au lieu de `grep`/`Glob` pour "comment marche X" |
| `gitnexus_context` | Vue 360° sur 1 symbole | Avant de modifier ou comprendre une fonction |
| `gitnexus_impact` | Blast radius d'une modif | **Toujours** avant un edit |
| `gitnexus_detect_changes` | Scope check | **Toujours** avant un commit |
| `gitnexus_rename` | Rename safe multi-fichiers | À la place de find-and-replace |
| `gitnexus_cypher` | Requêtes graph custom | Cas avancés (chemins, communautés, etc.) |

Resources MCP :
- `gitnexus://repo/15_Plume_SAV/context` — overview + fraîcheur de l'index
- `gitnexus://repo/15_Plume_SAV/clusters` — toutes les zones fonctionnelles
- `gitnexus://repo/15_Plume_SAV/processes` — tous les flux d'exécution
- `gitnexus://repo/15_Plume_SAV/process/{name}` — trace step-by-step

---

## Hooks automatiques

GitNexus a installé **deux hooks** dans Claude Code qui s'exécutent sans que tu aies à y penser :

- **PreToolUse** : avant chaque `Grep` / `Glob`, GitNexus enrichit automatiquement la recherche avec le contexte du graph (symboles concernés, processus liés). Tu reçois donc plus que ce que tu as demandé — utilise-le.
- **PostToolUse** : après un `git commit` ou `git merge`, l'index est marqué stale et un re-analyze est suggéré (ou auto-déclenché selon config).

---

## Skills auto-générés (par cluster)

GitNexus a généré des skills spécifiques au repo, dans `.claude/skills/generated/` :

| Cluster | Skill file | Quand y aller |
|---|---|---|
| **Tickets** (138 symboles, 54 fichiers) | `.claude/skills/generated/tickets/SKILL.md` | Tout ce qui touche aux tickets SAV |
| **Wizard** (15 symboles) | `.claude/skills/generated/wizard/SKILL.md` | Wizard de création de ticket client |
| **Components** (12 symboles) | `.claude/skills/generated/components/SKILL.md` | Composants UI partagés |
| **Messages** (10 symboles) | `.claude/skills/generated/messages/SKILL.md` | Messagerie inter-rôles |
| **[id]** (9 symboles) | `.claude/skills/generated/id/SKILL.md` | Pages dynamiques `/<role>/ticket/[id]` |
| **Auth** (7 symboles) | `.claude/skills/generated/auth/SKILL.md` | Auth Supabase, sélection de rôle |
| **Inspection** (7 symboles) | `.claude/skills/generated/inspection/SKILL.md` | Wizard de check terrain école |
| **Plume** (4 symboles) | `.claude/skills/generated/plume/SKILL.md` | Composants Plume HQ |

Et les skills GitNexus génériques (debugging, refactoring, exploring, impact-analysis) sont dans `.claude/skills/gitnexus/`.

→ **Avant d'attaquer une feature, va lire le SKILL.md de son cluster.**

---

## Cas où GitNexus n'aide PAS (et où tu peux grep normalement)

- Recherche de **strings littéraux dans les commentaires** (GitNexus indexe la structure, pas les textes libres)
- Recherche dans les fichiers **non-code** : `.md`, `.json`, `.sql` (utilise `Grep` standard)
- Recherche dans `supabase/migrations/` : c'est du SQL, pas indexé par GitNexus
- Recherche dans les fichiers de **config** : `next.config.mjs`, `tailwind.config.ts`, `tsconfig.json`

Pour ces cas, `Grep`/`Read` directs restent la bonne approche.

---

## Self-check avant de finir une tâche

Avant de marquer une tâche comme complétée, vérifie :

1. ✅ `gitnexus_impact` lancé pour **chaque symbole modifié**
2. ✅ Aucun warning HIGH / CRITICAL ignoré sans en parler à l'utilisateur
3. ✅ `gitnexus_detect_changes()` confirme que le scope correspond aux attentes
4. ✅ Tous les dépendants directs (depth=1, "WILL BREAK") ont été mis à jour

---

## Si l'index est stale

Quand un outil GitNexus signale que l'index est désynchronisé :

```bash
npx gitnexus analyze
```

Si l'index avait des embeddings (vérifier `.gitnexus/meta.json` → `stats.embeddings`) :

```bash
npx gitnexus analyze --embeddings
```

⚠️ Lancer `analyze` **sans** `--embeddings` supprime les embeddings existants.

---

> Ce fichier est **un contrat avec Claude**. Le ne pas respecter conduit à se perdre dans le contexte, à re-implementer du code existant, ou à casser des callers invisibles. Lis-le, suis-le.
