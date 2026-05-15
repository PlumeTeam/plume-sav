# Journal d'interventions — Plume SAV

> Mémoire long-terme des sessions Claude Code / Cowork. À la fin de chaque
> intervention non triviale, ajoute une entrée ici. Le journal sert à reprendre
> rapidement le contexte d'une session précédente sans devoir relire les diffs.

## Format d'une entrée

Chaque entrée doit suivre ce gabarit pour rester scannable. Date au format `YYYY-MM-DD`, ordre **chronologique inverse** (la plus récente en haut).

```markdown
## YYYY-MM-DD — Titre court de l'intervention

**Intent** : ce que JB voulait, en 1 phrase
**Status** : ✅ livré / 🟡 partiel / 🔴 bloqué

### Commits poussés
- `<sha>` — message court

### Ce qui a été fait
- Bullets factuels, fichiers touchés
- Décisions techniques notables

### Ce qui reste à faire
- TODOs explicites pour la prochaine session

### Pièges rencontrés (à mémoriser)
- Bugs subtils ou règles non évidentes pour éviter de retomber dedans
```

---

## 2026-05-15 — Section dépliable « Détails complets » dans la fiche déclaration

**Intent** : JB trouvait la fiche déclaration partagée (4 dashboards) « beaucoup trop simplifiée » — il voulait un bouton pour voir **toutes** les infos saisies par le pilote, pas juste celles déjà rendues en cartes.
**Status** : ✅ livré

### Ce qui a été fait
- `apps/sav/features/tickets/components/DeclarationFullDetails.tsx` (nouveau, ~210 l) : section repliable via `<details>` natif (Server Component, zéro JS) en pied de `ClientDeclarationPanel`. Deux niveaux :
  - **business** (toujours visible) : référence ticket court (`#XXXXXXXX`), `sav_claim_number`, `created_at`, `warranty_expires_at`, destinataire (école *ou* atelier avec date d'assignation), méthode de livraison, **changement d'école** si `referent_school_id ≠ school_id` (nom école d'achat + raison + note libre), premier message du client (blockquote dorée), étiquetage photos (label `photo_type` + caption).
  - **technical** (école / atelier / admin) : UUIDs (ticket, client, écoles, atelier), `service_type` / `request_type` / `status` bruts, **description brute pré-parsing** (le bloc `[Catégorie] ... [Historique aile] ...` complet dans un `<pre>` scrollable), timestamps ISO (`created_at`, `updated_at`, `school_acknowledged_at`, `workshop_assigned_at`).
- `apps/sav/features/tickets/components/ClientDeclarationPanel.tsx` : 3 nouvelles props (`detailLevel?: 'business' | 'technical'`, `schoolName?`, `referentSchoolName?`). Le panel reste pur (zéro I/O DB) — chaque page résout les noms et les passe.
- `apps/sav/app/(client)/client/ticket/[id]/page.tsx` : level `business`. Résout `destinationSchool` (school_id) séparément seulement si ≠ referent_school_id (sinon réutilise le `school` déjà fetché → pas de query en plus dans le cas par défaut).
- `apps/sav/app/(school)/school/ticket/[id]/page.tsx` : level `technical`. `Promise.all` pour résoudre destinataire + référente en parallèle, `.catch(() => null)` pour ne pas planter la page si `getPartnerSchoolById` foire.
- `apps/sav/app/(workshop)/workshop/ticket/[id]/page.tsx` : level `technical`. Le `school` était déjà résolu, on ajoute `referentSchool` au `Promise.all`.

### Décisions techniques
- **`<details>` natif** plutôt que composant client-side : Server Component safe, accessible nativement, zéro JS, fonctionne sans React. Pas besoin d'un Dialog Radix pour un repliable simple.
- **Niveau différencié par dashboard** demandé explicitement par JB : client ne voit pas les UUIDs ni la description brute, école / atelier / admin oui (support).
- **Composant dédié** au lieu d'enfler `ClientDeclarationPanel.tsx` (était 327 l → aurait dépassé 500 avec l'ajout inline). Règle CLAUDE.md : split si risque de dépasser 500 l.
- **Résolution des noms d'école côté page** (Server Component) plutôt que dans le panel : le panel reste testable / réutilisable hors I/O, et chaque page contrôle sa propre stratégie de fetch (parallel vs lazy).

### Ce qui reste à faire
- Snapshot visuel pas validé localement : middleware auth Supabase répond 307 → /login sans session, et je n'ai pas de creds de test ici. À valider sur preview Vercel après push.
- Pas de test Vitest dédié (cohérent avec le reste de `components/` qui n'a pas de tests unitaires non plus).

### Pièges rencontrés
- Le worktree fraîchement créé n'a pas de `node_modules` — `pnpm typecheck` plantait. Workaround : `New-Item -ItemType Junction` depuis le worktree vers le `node_modules` du repo parent (à la racine ET dans `apps/sav/`). Pas tracké par git.
- Le `.env.local` n'est pas non plus dans le worktree → middleware Supabase crash au boot du dev server. Copie depuis le repo parent pour tester.
- `assigned_workshop_label` est stocké figé en colonne (cf. `creation.ts`) — pas besoin de join pour l'atelier, juste lire la colonne. Seul le nom d'école nécessite `getPartnerSchoolById`.
- `getPartnerSchoolById` retourne `null` si la cascade de fallbacks PostgREST échoue (lat/lng manquants, etc.). Le panel collapse alors sur "(nom non résolu)" plutôt que de planter — comportement voulu.

---

## 2026-05-12 — Vérification serial vs aile sélectionnée (Tâche 2 plan dashboard client)

**Intent** : Étape « Quelle aile ? » — quand le client sélectionne une aile dans la liste puis scanne/saisit un sérial, comparer les deux. Si mismatch → erreur explicite + blocage Continuer.
**Status** : ✅ livré

### Ce qui a été fait
- `apps/sav/features/tickets/components/wizard/WingScanCard.tsx` : `selectedSerial` (jusqu'ici inutilisé, préfixé `_`) est désormais le garde-fou principal de `resolveSerial`. Si non-null et `normalized !== selectedSerial.toUpperCase()` → état d'erreur avec message « Le numéro de série ne correspond pas à l'aile sélectionnée. Vérifiez que vous avez la bonne aile en main, ou changez votre sélection dans la liste. »
- Mode démo : utilise `selectedSerial` comme cible si présent (sinon `wings[0].serial_number`) pour rester cohérent avec la sélection.
- `useEffect([selectedSerial])` : reset à `idle` quand le client change d'aile dans la liste (la confirmation précédente devient caduque).
- Nouveau callback `onVerificationErrorChange(hasError)` : remonte au parent l'état de mismatch (préfixe `MISMATCH_ERROR_PREFIX` pour distinguer cette erreur des « aile inconnue »).
- `apps/sav/features/tickets/components/wizard/StepWingInfo.tsx` : ajoute `hasSerialMismatch` (state), branche le callback, désactive « Continuer » via `nextDisabled={!selectedId || hasSerialMismatch}`. Cliquer une aile dans la liste lève l'erreur de vérif (correction de sélection).

### Ce qui reste à faire
- Tests Vitest sur la logique de `resolveSerial` (mismatch + match + inconnu) — pas faits car pas de tests existants sur ce composant.
- E2E Playwright sur le scénario « sélection A + scan B → erreur » non écrit (auth requise, pas dans le scope).

### Pièges rencontrés
- `useEffect([state, onVerificationErrorChange])` : sans `useCallback` côté parent, le callback se recrée à chaque render → l'effet boucle. `useCallback(..., [])` côté `StepWingInfo` stabilise.
- Le manual flow étape 2 appelle `resolveSerial` après double saisie OK : si le sérial ne matche pas `selectedSerial`, on bascule de `manual-step2` vers `error`. Le sous-composant `ManualStep2` est démonté → pas de fuite, comportement correct.
- Préfixe `MISMATCH_ERROR_PREFIX` : nécessaire pour ne pas bloquer Continuer en cas d'erreur « Aucune aile correspondant » (qui peut survenir mais n'a pas le même sens — la sélection est intacte).

---

## 2026-05-10 — Module Flashcode v3 + GitNexus + refactor actions.ts

**Intent** : Construire un système de scan QR pour traçabilité physique des ailes (anti-erreur, anti-perte). Installer un knowledge graph (GitNexus) pour alléger le contexte Claude. Refactor les fichiers obèses.
**Status** : ✅ livré (client + école + caméra réelle), atelier et Plume HQ restent à faire

### Commits poussés (ordre chronologique)
- `4891d39` — feat(sav): module Flashcode v1 — scan client à la création de ticket
- `7789db4` — chore: install GitNexus + bannière PRE-SEARCH dans CLAUDE.md
- `4c80970` — refactor(sav): split actions.ts (1712 lignes) en 9 sous-fichiers par domaine
- `756163e` — fix(sav): retire 'use server' de actions/index.ts (re-export only)
- `2c820c0` — fix(sav): scan flashcode toujours visible (idle par défaut + empty state)
- `e955978` — feat(sav): module Flashcode v2 — scans école (3 points : reception, check, bon d'envoi)
- `3af4221` — feat(sav): module Flashcode v3 — vraie caméra + friction sur saisie manuelle
- `b378816` — fix(sav): QRCameraScanner — dynamic import de html5-qrcode (anti-crash SSR)
- `6e8841e` — chore(gitnexus): re-index après ajout module Flashcode v3
- `365175b` — feat(sav): scan client obligatoire avant génération du bon de transport
- `aa0f08b` — fix(sav): scanner caméra robuste — next/dynamic ssr:false + import statique

### Ce qui a été fait

**Module Flashcode** (en prod sur https://plume-sav.vercel.app)
- Scan obligatoire au moment où le **client crée un ticket SAV** (étape « Quelle aile ? »)
- Scan obligatoire au moment où le **client génère son bon de transport** vers l'école
- 3 scans obligatoires côté **école** : réception colis, ouverture du check, génération bon d'envoi atelier
- Vraie caméra via `html5-qrcode@2.3.8` (back camera mobile, webcam desktop)
- Bouton « 🧪 Test sans flashcode » mode démo
- Saisie manuelle laborieuse exprès : raison + double saisie + copier-coller bloqué
- Numéro de série masqué dans la liste des ailes côté client (`PLM-•••••-••••-•••••`)
- Composant générique `<ScanGateModal>` réutilisable + `<QRCameraScanner>` dédié

**GitNexus**
- Setup global Claude Code + Cursor (7 skills + hooks PreToolUse / PostToolUse)
- Index repo : 928 symboles, 1 921 relations, 38 clusters, 69 flux d'exécution
- 9 skills auto-générés par cluster (Tickets, Actions, Wizard, etc.) dans `.claude/skills/generated/`
- Bannière PRE-SEARCH en tête de CLAUDE.md
- Fichier `.claude/PRE-SEARCH.md` avec protocole obligatoire (4 cas d'usage)

**Refactor `actions.ts`** (1 712 → 9 fichiers max 375 lignes)
- `actions/{_helpers,_step-advance,creation,messaging,school,workshop,lifecycle,shipping,admin}.ts`
- `actions/index.ts` re-export pour backward compat (sans `'use server'` — règle Next.js)

**Données de test**
- Tous les tickets SAV de démo (9 tickets, du 8 au 10 mai) ont été supprimés via SQL Supabase pour repartir propre.

### Ce qui reste à faire (priorité décroissante)

1. **Scan Atelier** : 3 points (réception colis · ouverture diagnostic · bon retour vers école/client). Pattern identique à école : modifier les pages `/workshop/ticket/[id]` et le `WorkshopActionBar`. Utiliser le composant `<ScanGateModal>` existant.
2. **Scan Plume HQ** : 3 points + widget supervision (ailes en transit > J+5 sans scan-in). Plus simple car Plume utilise les vues école/atelier en mode support.
3. **Persistence BDD** : créer migration Supabase `wing_scans` (id, wing_id, ticket_id, user_id, role, scan_type, scanned_at, geo, demo_mode, manual_reason) + colonne `physical_state` sur `wings`. Server Action `recordScan()` à connecter dans tous les `onScanSuccess`.
4. **Adapter la carte « Statut de l'aile »** côté ticket client (commit `2db8161`) pour afficher les 9 états physiques au lieu de la dérivation timeline.
5. **Gater le bouton démo** en prod via `process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production'`.
6. **Splitter `CheckWizard.tsx` (794 lignes)** par phase si on continue d'y ajouter du code.
7. **Sourcing étiquettes tissu cousues** (usine Asie) + liaison sac↔aile au premier appairage.

### Pièges rencontrés (à mémoriser)

- **Next.js 14 — `'use server'` interdit les re-exports**. Un fichier `'use server'` ne peut PAS faire `export { foo } from './x'`. Mettre `'use server'` uniquement dans les sous-fichiers, jamais dans l'index barrel. Ref commit fix : `756163e`. Erreur exacte : `Only async functions are allowed to be exported in a "use server" file`.

- **`tsc --noEmit` ne suffit pas comme garde-fou Next.js**. Le typecheck local peut passer alors que `next build` échoue (cas du re-export `'use server'`). Vérifier le preview Vercel après chaque push avant de déclarer « fait ».

- **`html5-qrcode` crash en SSR / consomme le user gesture**. La lib touche `navigator.mediaDevices` au top du module → crash si évaluée côté serveur. Solution : charger le composant `QRCameraScanner` via `next/dynamic` avec `ssr: false`. Ne PAS faire `await import('html5-qrcode')` dans un useEffect — ça consomme le user gesture et Safari refuse la perm caméra ensuite. Ref commits : `b378816` puis `aa0f08b`.

- **PAT GitHub fine-grained** : Resource owner = `PlumeTeam` (pas `jbchandelier`) + Contents: Read **and** write + repo `plume-sav` explicitement coché. Sinon push refusé en 403. La caisse Vercel API (`api.github.com`) est bloquée par le proxy du sandbox — verifying via ls-remote uniquement.

- **Cowork ≠ Claude Code** côté MCP : Cowork n'a pas de connecteur GitHub natif. Pour push depuis Cowork, on passe par Windows-MCP PowerShell qui utilise le git CLI authentifié de la machine JB. Avec ce workaround, plus besoin de PAT.

### Documentation produite (workspace SAV — pas dans le repo)

- `Flashcode-Tracabilite-Systeme.html` — spec interactive complète (11 sections)
- `SAV-Plume-Bible-Complete.md` — section §23 ajoutée
- 4 dashboards HTML mis à jour avec scan flashcode (`Dashboard-Client.html` notamment)

---

<!-- Ajouter ici les futures interventions au-dessus de cette ligne -->
