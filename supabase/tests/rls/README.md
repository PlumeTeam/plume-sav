# Tests RLS — SAV Plume

Tests pgTAP des Row Level Security policies, un fichier par sujet.

## Convention

- Un fichier `<sujet>.test.sql` par périmètre de policy.
- Chaque fichier est encapsulé dans `BEGIN ... ROLLBACK` : rien n'est
  persisté, exécution sûre même sur la base mutualisée.
- Couverture obligatoire des 4 rôles métier : `client`, `school`/`ecole`,
  `workshop`/`atelier`, `plume_admin`.
- Le test critique n'est pas « le rôle voit ses lignes » mais
  « un autre acteur ne voit PAS les lignes » (témoin négatif).

## Pré-requis

Les helpers `tests.create_supabase_user`, `tests.authenticate_as`,
`tests.get_supabase_uid` proviennent de l'extension
[supabase-test-helpers](https://github.com/usebasejump/supabase-test-helpers).
À installer dans l'environnement de test (pas en prod) :

```sql
create extension if not exists pgtap;
-- puis charger supabase_test_helpers (schéma `tests`)
```

## Exécution

En local, contre une base de test (jamais la prod) :

```bash
supabase test db
```

## Fichiers

- `workshop_role_source.test.sql` — double source de vérité du rôle
  atelier (`user_roles` ET `profiles.role`). Couvre `service_requests`,
  `ticket_messages` (canaux + legacy), `ticket_photos`. Valide la
  migration `20260516130000_sav_workshop_role_source_fix.sql`.
