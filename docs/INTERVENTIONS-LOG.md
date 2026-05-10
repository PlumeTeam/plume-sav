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
