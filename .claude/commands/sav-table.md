---
description: Workflow complet de création d'une nouvelle table Supabase (investigation, design, migration, types, RLS, tests RLS)
argument-hint: <nom_de_table> [description courte]
---

# /sav-table — Création d'une nouvelle table SAV

Tu lances le workflow complet de création d'une table Supabase pour le projet Plume SAV. Le but : pas de table créée sans investigation préalable, sans RLS, sans tests RLS, et sans régénération des types.

Argument : `$ARGUMENTS` — nom de la table à créer (et optionnellement sa description).

## Pipeline d'agents

Tu vas orchestrer **dans l'ordre** :

1. **`sav-db-schema`** (Opus) — investigation + design SQL + migration
2. **Validation utilisateur** — affichage du SQL, attente du « go »
3. **`apply_migration`** — exécution (uniquement après go)
4. **Régénération des types** — `pnpm db:gen-types`
5. **`sav-rls-auditor`** (Opus) — audit RLS + tests RLS pour les 4 rôles
6. **Rapport final** — résumé pour l'utilisateur

## Étape 1 — Lancer sav-db-schema

Délègue à l'agent `sav-db-schema` avec ce prompt :

```
Tu dois designer la table `$ARGUMENTS` pour le projet Plume SAV.

Avant tout SQL :
1. Lis docs/SAV-Plume-Bible.md pour comprendre où cette table s'inscrit.
2. Lis CLAUDE.md pour les règles non-négociables.
3. Investigue les tables existantes du projet Supabase gxighesxbavnzzyngjaz qui pourraient déjà couvrir ce besoin (voir Bible §23.5 pour les candidats).

Si une table existante peut faire l'affaire, propose la réutilisation/extension plutôt qu'une nouvelle table. Justifie.

Si nouvelle table justifiée, produis :
- Une migration SQL complète (BEGIN/COMMIT, table + indexes + FK + ENABLE RLS + squelette de policies)
- Les triggers utiles (updated_at)
- Les commentaires explicatifs (COMMENT ON TABLE)
- Une note pour @sav-rls-auditor sur les règles métier complexes (ex. notes asymétriques, conditionnels)

Annonce le plan en respectant ton format [MIGRATION PROPOSÉE — NON EXÉCUTÉE] avant le SQL.

ATTENTS la validation utilisateur. NE LANCE PAS apply_migration toi-même.
```

## Étape 2 — Validation utilisateur

Une fois le SQL proposé, tu attends le « go » explicite. Tu rappelles à l'utilisateur :
- Cette migration est-elle **réversible** ?
- A-t-elle un impact sur des données existantes ?
- Veut-il que tu l'exécutes (`apply_migration`) ou la sauve dans `supabase/migrations/` puis push manuel ?

**Sans go explicite, pas d'exécution.**

## Étape 3 — Application

Une fois validé, tu lances :

```
mcp__044eeef6-6ad3-4f71-96e4-beb35d193dcd__apply_migration({
  project_id: "gxighesxbavnzzyngjaz",
  name: "<nom_du_fichier>",
  query: "<SQL complet>"
})
```

Tu sauves aussi le fichier dans `supabase/migrations/YYYYMMDDHHMMSS_<description>.sql` pour traçabilité Git.

## Étape 4 — Régénération des types

```
Bash: pnpm db:gen-types
```

Si la commande n'existe pas encore (projet en setup initial), génère via le MCP :

```
mcp__044eeef6-6ad3-4f71-96e4-beb35d193dcd__generate_typescript_types({
  project_id: "gxighesxbavnzzyngjaz"
})
```

Et écris le résultat dans `packages/db/types.ts`.

## Étape 5 — Lancer sav-rls-auditor

Délègue à l'agent `sav-rls-auditor` :

```
Audite la table `$ARGUMENTS` qui vient d'être créée.

1. Vérifier RLS activée
2. Vérifier policies pour les 4 rôles (client, school, workshop, plume_admin)
3. Vérifier indexes sur les colonnes des policies
4. Identifier les failles potentielles (USING (true), WITH CHECK manquant, leaks cross-rôle)
5. Écrire les tests RLS minimaux (un test par rôle, plus le test critique « rôle X ne voit pas les données du rôle Y »)
6. Rendre un rapport au format défini dans ton fichier d'agent

Ne propose pas de modifications de RLS sans validation utilisateur. Si des ajustements sont nécessaires, génère une migration SQL séparée et attends le go.
```

## Étape 6 — Rapport final

Tu rends un résumé synthétique :

```
## Création de table — public.$ARGUMENTS — terminée

### Migration appliquée
- Fichier : supabase/migrations/<nom>.sql
- Lignes SQL : <N>
- Indexes créés : <N>
- Policies RLS créées : <N>

### Types régénérés
- packages/db/types.ts : OK

### Tests RLS
- Fichier : <chemin>
- Tests créés : <N> (couvrant les 4 rôles)
- À exécuter : `pnpm test:rls`

### Audit final
- Statut : [OK / WARNING / CRITIQUE]
- Détails : <résumé en 1 ligne>

### Prochaines étapes suggérées
1. Exécuter les tests RLS
2. Coder la feature qui consomme cette table (`/sav-feature <nom>`)
3. Avant merge : `architecte-en-chef` pour audit qualité globale
```

## Garde-fous

- **Aucune création** sans `sav-db-schema` invoqué d'abord
- **Aucune `apply_migration`** sans validation utilisateur explicite
- **Aucun rapport final** sans `sav-rls-auditor` validé
- Si l'agent `sav-db-schema` recommande de **réutiliser une table existante**, tu transmets cette recommandation à l'utilisateur et tu attends sa décision avant de poursuivre.
