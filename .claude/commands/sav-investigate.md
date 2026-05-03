---
description: Inspecte une table Supabase existante (colonnes, FK, RLS, échantillon de données) avant tout code
argument-hint: <nom_de_table>
---

# /sav-investigate — Inspection d'une table Supabase

Tu es invoqué pour **investiguer** la table `$1` du projet Supabase `gxighesxbavnzzyngjaz` (Plume SAV mutualisé). Le but : comprendre ce qui existe AVANT d'écrire du code ou une migration. Ne pas dupliquer.

## Mission

Produire un **rapport structuré** sur la table `$1` répondant à ces questions :

1. La table existe-t-elle ? Si oui, quelle est sa structure complète ?
2. Quels sont les FK entrantes et sortantes ?
3. RLS activée ? Quelles policies ?
4. Combien de lignes ? Données réelles ou table vide ?
5. À quelle feature SAV cette table pourrait servir ? Est-ce un doublon potentiel ?
6. Recommandation : **réutiliser** / **étendre** / **créer une nouvelle table** ?

## Étapes à exécuter

### 1. Vérifier l'existence et la structure

```
mcp__044eeef6-6ad3-4f71-96e4-beb35d193dcd__list_tables({
  project_id: "gxighesxbavnzzyngjaz",
  schemas: ["public"],
  verbose: true
})
```

Filtrer le résultat sur `$1`. Si la table n'existe pas, signaler immédiatement et proposer les tables au nom proche.

### 2. Inspecter les colonnes en détail

```
mcp__044eeef6-6ad3-4f71-96e4-beb35d193dcd__execute_sql({
  project_id: "gxighesxbavnzzyngjaz",
  query: "SELECT column_name, data_type, is_nullable, column_default, character_maximum_length FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '$1' ORDER BY ordinal_position;"
})
```

### 3. Lister les contraintes (PK, FK, UNIQUE, CHECK)

```
mcp__044eeef6-6ad3-4f71-96e4-beb35d193dcd__execute_sql({
  project_id: "gxighesxbavnzzyngjaz",
  query: "SELECT con.conname, con.contype, pg_get_constraintdef(con.oid) AS definition FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace WHERE nsp.nspname = 'public' AND rel.relname = '$1';"
})
```

### 4. Lister les indexes

```
mcp__044eeef6-6ad3-4f71-96e4-beb35d193dcd__execute_sql({
  project_id: "gxighesxbavnzzyngjaz",
  query: "SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = '$1';"
})
```

### 5. Vérifier RLS et policies

```
mcp__044eeef6-6ad3-4f71-96e4-beb35d193dcd__execute_sql({
  project_id: "gxighesxbavnzzyngjaz",
  query: "SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = '$1' AND relnamespace = 'public'::regnamespace;"
})
```

```
mcp__044eeef6-6ad3-4f71-96e4-beb35d193dcd__execute_sql({
  project_id: "gxighesxbavnzzyngjaz",
  query: "SELECT polname, polcmd, polroles::text, pg_get_expr(polqual, polrelid) AS using_expr, pg_get_expr(polwithcheck, polrelid) AS check_expr FROM pg_policy WHERE polrelid = 'public.$1'::regclass;"
})
```

### 6. Compter les lignes et échantillonner

```
mcp__044eeef6-6ad3-4f71-96e4-beb35d193dcd__execute_sql({
  project_id: "gxighesxbavnzzyngjaz",
  query: "SELECT count(*) FROM public.$1;"
})
```

Si `count > 0`, échantillonner 3 lignes (anonymiser si PII visible) :

```
mcp__044eeef6-6ad3-4f71-96e4-beb35d193dcd__execute_sql({
  project_id: "gxighesxbavnzzyngjaz",
  query: "SELECT * FROM public.$1 LIMIT 3;"
})
```

### 7. Lister les FK qui pointent vers cette table

```
mcp__044eeef6-6ad3-4f71-96e4-beb35d193dcd__execute_sql({
  project_id: "gxighesxbavnzzyngjaz",
  query: "SELECT con.conname AS constraint_name, rel_src.relname AS source_table, att_src.attname AS source_column FROM pg_constraint con JOIN pg_class rel_src ON rel_src.oid = con.conrelid JOIN pg_class rel_tgt ON rel_tgt.oid = con.confrelid JOIN pg_attribute att_src ON att_src.attrelid = con.conrelid AND att_src.attnum = ANY(con.conkey) WHERE con.contype = 'f' AND rel_tgt.relname = '$1';"
})
```

### 8. Récupérer les advisors Supabase

```
mcp__044eeef6-6ad3-4f71-96e4-beb35d193dcd__get_advisors({
  project_id: "gxighesxbavnzzyngjaz",
  type: "security"
})
```

Filtrer ce qui concerne `$1`.

## Format de rapport attendu

```markdown
# Rapport d'investigation — public.$1

## Statut
[EXISTE / ABSENTE] — <résumé en 1 ligne>

## Structure
| Colonne | Type | Nullable | Défaut |
|---|---|---|---|
| ... | ... | ... | ... |

## Contraintes
- PK : ...
- FK sortantes : <liste>
- UNIQUE : <liste>
- CHECK : <liste>

## Indexes
- <liste>

## RLS
- Activée : OUI / NON
- Policies : <N>
| Nom | Cmd | Roles | USING | WITH CHECK |
| ... |

## Données
- Nombre de lignes : <N>
- Échantillon : <3 lignes anonymisées si PII>

## FK entrantes (qui dépend de cette table)
- <liste>

## Advisors Supabase
- <liste warnings filtrés>

## Analyse pour le SAV

- À quoi cette table sert-elle aujourd'hui ?
- Quelle feature SAV pourrait l'utiliser ?
- Est-ce un doublon potentiel avec ce qu'on veut créer ?

## Recommandation

[RÉUTILISER / ÉTENDRE / IGNORER ET CRÉER NOUVELLE TABLE]

Justification : <2-3 lignes>
```

## Notes

- Si l'utilisateur a passé un nom approximatif, ne pas inventer — chercher les tables aux noms proches via `list_tables` puis demander confirmation.
- Si la table contient des données sensibles (PII, emails, téléphones), ne pas afficher les valeurs réelles dans le rapport — masquer (`john@***`, `+33 6 ** ** ** **`).
- Cette commande est **read-only**. Ne jamais déclencher d'`apply_migration` ni d'écriture.
