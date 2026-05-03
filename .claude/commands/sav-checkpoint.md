---
description: Pre-commit local rapide — type-check + lint + tests + audit RLS sur le diff courant
---

# /sav-checkpoint — Validation locale avant commit

Tu lances une validation locale rapide du projet avant un commit. Le but : attraper les régressions évidentes en moins de 2 minutes, AVANT que le push déclenche la CI ou avant un audit plus lourd (`/security-review`, `engineering:code-review`).

Cette commande est un **hub d'exécution**, pas un travail créatif. Tu enchaînes les commandes, tu collectes les résultats, tu rends un statut clair.

## Étapes

### 1. État Git

Affiche l'état du repo pour cadrer :

```bash
git status
git diff --stat
git log --oneline -5
```

Objectif : savoir quels fichiers ont changé depuis le dernier commit, et la branche courante.

### 2. Type-check TypeScript

```bash
pnpm typecheck
```

Si la commande échoue ou n'existe pas (projet en setup initial), essayer `npx tsc --noEmit -p apps/sav/tsconfig.json` ou équivalent. Si rien n'est setup, signaler que le type-check est skippé et pourquoi.

Critère de succès : **0 erreur TypeScript**.

### 3. Lint

```bash
pnpm lint
```

Critère de succès : **0 erreur, warnings tolérés** (les flagger dans le rapport).

### 4. Tests

```bash
pnpm test --run
```

Critère de succès : **100% de tests passent**. Si certains sont skippés, le signaler.

### 5. Tests RLS (si applicable)

Si `supabase/tests/rls/*.sql` existe ou si `pnpm test:rls` est défini :

```bash
pnpm test:rls
```

Critère de succès : **tous les tests RLS passent**.

### 6. Audit RLS sur le diff courant

Détecter automatiquement les fichiers modifiés liés à la DB :

```bash
git diff --name-only HEAD | grep -E '(supabase/migrations|features/.*/(actions|queries)\.ts)'
```

S'il y a des changements DB ou Server Actions, **inviter** (mais ne pas exécuter automatiquement) à lancer `sav-rls-auditor` sur les tables touchées :

```
Détecté : modification de <fichier>.
Recommandation : invoquer sav-rls-auditor pour valider que les changements n'introduisent pas de leak.
```

### 7. Vérifier qu'il n'y a pas de secrets

```bash
git diff HEAD | grep -iE '(SUPABASE_SERVICE_ROLE_KEY|SK_LIVE|API_KEY|password\s*=)'
```

Si match, **alerte CRITIQUE** : un secret a été staged. Refuser de continuer.

### 8. Vérifier la taille des fichiers

Pour les fichiers TypeScript modifiés :

```bash
git diff --name-only HEAD | grep -E '\.(ts|tsx)$' | xargs wc -l 2>/dev/null | sort -nr | head -10
```

Flag tout fichier > 250 lignes — invitation à demander un découpage à `architecte-en-chef`.

## Format de rapport

```markdown
## /sav-checkpoint — Rapport

### Branche
- Nom : <branche>
- Fichiers modifiés : <N>
- Commits depuis main : <N>

### Résultats

| Étape | Statut | Détails |
|---|---|---|
| typecheck | ✓/✗ | <N erreurs> |
| lint | ✓/✗ | <N erreurs, M warnings> |
| test | ✓/✗ | <X/Y passent> |
| test:rls | ✓/✗/N-A | <X/Y passent> |
| secrets check | ✓/✗ | <leak détecté ?> |

### Fichiers volumineux (> 250 lignes)
- <liste ou "aucun">

### Recommandations
- <liste : invoquer sav-rls-auditor, découper un gros fichier, etc.>

### Verdict
[GO COMMIT / NE PAS COMMIT — fixer d'abord]
```

## Garde-fous

- Cette commande **ne modifie pas** les fichiers. Read-only sauf l'exécution des commandes ci-dessus.
- Si une commande échoue de façon inattendue (binaire manquant, env cassé), tu signales et tu n'inventes pas un substitut sans validation.
- **Ne JAMAIS** lancer `git commit` ou `git push` automatiquement, même si tout passe au vert. La décision de commit reste humaine.
- Si **secret détecté**, refuser explicitement de poursuivre et conseiller `git restore --staged <fichier>` ou équivalent.

## Notes

- Cette commande est complémentaire à `/security-review` (audit OWASP/RLS plus approfondi) et `engineering:code-review` (revue qualité). Elle ne les remplace pas.
- Idéale en pré-commit, à lancer plusieurs fois par jour.
- Si la base de tests grandit et que cette commande prend > 5 min, envisager un mode `--quick` qui skippe les tests e2e.
