---
description: Pipeline complet de création d'une feature SAV (DB → scaffold → UI → audit RLS → review architecte)
argument-hint: <nom_feature> [description]
---

# /sav-feature — Pipeline complet d'une feature

Tu lances le pipeline complet de création d'une feature SAV pour le projet Plume. Le but : enchaîner les agents spécialisés dans le bon ordre, avec validations intermédiaires, sans perdre le contexte global.

Argument : `$ARGUMENTS` — nom de la feature (et optionnellement description courte). Exemple : `client-create-ticket`, `school-inspection`, `workshop-diagnostic-precheck`.

## Pipeline d'agents (ordre strict)

```
1. Lecture contexte
   ├─ docs/SAV-Plume-Bible.md (sections pertinentes)
   └─ CLAUDE.md (règles non-négociables)

2. sav-db-schema           → besoin DB ? migration ? validation utilisateur

3. sav-builder             → scaffold features/<nom>/ (queries, actions, schemas, hooks, types)

4. sav-ui-builder          → pages, composants UI, états (loading/empty/error), responsive

5. sav-rls-auditor         → tests RLS si nouvelle table touchée

6. architecte-en-chef      → audit qualité (taille fichiers, séparation, types, red flags)

7. Tests automatisés       → pnpm typecheck + pnpm test + pnpm lint

8. Rapport final
```

À chaque étape, tu **résumes** ce qui a été fait avant de passer à la suivante. Tu **arrêtes** le pipeline si une étape lève un bloquant.

---

## Étape 1 — Lecture contexte

Lis dans cet ordre :
1. `CLAUDE.md` à la racine — règles, stack, commandes
2. `docs/SAV-Plume-Bible.md` — section(s) pertinente(s) selon `$ARGUMENTS`

Identifie :
- Quel(s) dashboard(s) sont concernés (client / école / atelier / Plume) ?
- Quelles tables Supabase sont impliquées ?
- Quels QCM ou scénarios métier sont touchés ?
- Y a-t-il une maquette HTML existante (`Dashboard-*.html`) ?

Synthétise en 5-8 lignes pour cadrer la feature avant de déléguer.

---

## Étape 2 — sav-db-schema (si DB touchée)

Délègue à `sav-db-schema` :

```
Pour la feature `$ARGUMENTS` :

1. Identifie les tables Supabase impliquées (lecture / écriture).
2. Si nouvelle table requise, lance le workflow d'investigation puis propose une migration.
3. Si modification de schéma requise, propose une migration ALTER.
4. Si seulement lecture/écriture sur des tables existantes, signale-le sans rien créer.

Annonce le plan, attends validation utilisateur avant tout `apply_migration`.
```

**Si aucune DB modifiée** : on passe directement à l'étape 3.
**Si DB modifiée** : validation user → application → régénération types.

---

## Étape 3 — sav-builder (scaffold logique)

Délègue à `sav-builder` :

```
Scaffold la feature `$ARGUMENTS` dans `apps/sav/features/<nom>/`.

Structure attendue :
- queries.ts : lectures Supabase utilisées par Server Components
- actions.ts : Server Actions (mutations) avec validation Zod
- schemas.ts : schémas Zod (partagés form ↔ action)
- types.ts : types métier dérivés des types DB générés
- hooks/ : si data côté client (React Query)
- utils.ts : helpers purs si besoin

Garde-fous :
- Pas d'`any`
- Validation Zod sur chaque Server Action
- `revalidatePath` après mutation
- Tests unit colocalisés sur les utils et schemas

NE construis PAS l'UI — c'est le job de sav-ui-builder. Reste sur la logique.
```

À la fin, fais lister les fichiers créés et signale si des warnings sont apparus (taille fichier, complexité).

---

## Étape 4 — sav-ui-builder (UI)

Délègue à `sav-ui-builder` :

```
Construis l'UI de la feature `$ARGUMENTS` en utilisant la logique scaffoldée par sav-builder.

Lis la maquette HTML correspondante si elle existe (Dashboard-<role>.html) avant de coder.

Livrables :
- Pages (app/...) en Server Components qui appellent les queries
- Composants client minimaux (uniquement où interactivité nécessaire)
- États visuels : loading.tsx (skeleton), empty state, error.tsx
- Forms RHF + Zod connectés aux Server Actions de sav-builder
- Mobile-first, accessibilité WCAG AA

Garde-fous :
- Pas de `'use client'` au sommet d'une page entière
- Pas de fetch côté client pour le rendu initial
- shadcn/ui en priorité, pas de réinvention
- Pas de couleurs hardcodées
```

À la fin, liste les composants créés + côté Server vs Client.

---

## Étape 5 — sav-rls-auditor (si DB nouvelle/modifiée)

Si étape 2 a modifié la DB, délègue à `sav-rls-auditor` :

```
Audite les RLS de la feature `$ARGUMENTS`.

Pour chaque table touchée à l'étape 2, produis :
- Audit RLS au format défini dans ton fichier d'agent
- Tests RLS minimaux (un par rôle + test cross-rôle critique)
- Rapport [OK / WARNING / CRITIQUE]

Si CRITIQUE, propose une migration corrective et stoppe le pipeline jusqu'à validation user.
```

Si aucune DB touchée, passer directement à l'étape 6.

---

## Étape 6 — architecte-en-chef (audit final)

Délègue à `architecte-en-chef` :

```
Audit final de la feature `$ARGUMENTS` avant merge.

Périmètre à auditer :
- Tous les fichiers créés/modifiés à l'étape 3 (sav-builder)
- Tous les fichiers créés/modifiés à l'étape 4 (sav-ui-builder)
- Migration de l'étape 2 (si applicable)

Vérifie :
- Tailles de fichiers vs seuils
- Séparation Server/Client
- Red flags génériques + Plume SAV (RLS, service_role, useEffect-fetch, etc.)
- Types stricts, pas d'`any`
- Server Actions avec Zod
- Imports propres, pas de dépendances circulaires

Rends un rapport prioritaire (CRITIQUE / MAJEUR / MINEUR) avec corrections proposées.
NE corrige PAS toi-même. Propose, attends validation user.
```

---

## Étape 7 — Tests automatisés

Lance dans cet ordre :

```bash
pnpm typecheck
pnpm lint
pnpm test
```

Si tests RLS dédiés existent : `pnpm test:rls`.

Tu collectes les sorties. Si une commande échoue, tu signales et stoppes.

---

## Étape 8 — Rapport final

```markdown
## Pipeline /sav-feature — terminé pour `$ARGUMENTS`

### Étape 1 — Cadrage
- Dashboards concernés : <liste>
- Tables impliquées : <liste>
- Maquette source : <fichier ou "aucune">

### Étape 2 — DB
- Migrations appliquées : <N> ou "aucune"
- Types régénérés : <oui/non>

### Étape 3 — Logique (sav-builder)
- Fichiers créés : <N>
- Server Actions : <N>
- Queries : <N>
- Schémas Zod : <N>

### Étape 4 — UI (sav-ui-builder)
- Pages créées : <N>
- Composants Server : <N>
- Composants Client : <N>

### Étape 5 — Audit RLS
- Statut : [OK / WARNING / CRITIQUE / N/A]

### Étape 6 — Audit architecture
- Critique : <N>
- Majeur : <N>
- Mineur : <N>

### Étape 7 — Tests
- typecheck : [✓/✗]
- lint : [✓/✗]
- test : [✓/✗ (X passés / Y total)]

### Prochaines actions
- <à corriger / à compléter par humain>

### Avant merge
- Lancer `/security-review`
- Lancer `engineering:code-review`
- Validation humaine du diff
```

---

## Garde-fous globaux

- **Aucune étape ne s'enchaîne automatiquement** si la précédente lève un bloquant.
- **Validation utilisateur explicite** avant toute migration DB.
- **Pas de skip d'étape** sauf si justifié (ex. pas de DB → skip étape 5).
- Si tu hésites sur le périmètre de la feature, **demande à l'utilisateur** plutôt que de deviner.
- Si une étape échoue de façon non triviale, **arrête-toi**, fais un rapport partiel, et demande comment continuer.
