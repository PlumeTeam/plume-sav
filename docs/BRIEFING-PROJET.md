# Briefing projet — Plume SAV

> Document d'entrée unique. Lis-le en premier quand tu reprends le projet
> après une pause, quand tu changes d'ordinateur, ou quand tu lances une
> nouvelle session Claude. Tout le reste s'enchaîne à partir d'ici.

---

## 1. Le sujet (en 3 lignes)

Plume Paragliders est une **marque de parapente** en cours de lancement. Ce repo construit le **système SAV** complet de cette marque — du formulaire client web jusqu'aux dashboards école / atelier / Plume HQ, avec messagerie inter-rôles, étiquettes GLS automatiques, traçabilité physique par QR code cousu sur l'aile.

L'application **`plume-sav`** est un Next.js 14 (App Router + Server Components) avec backend Supabase. Domaine cible final : `sav.plumeparagliders.com` (pas encore branché).

Contexte métier complet : [`docs/SAV-Plume-Bible.md`](SAV-Plume-Bible.md) (vision, 4 niveaux d'escalade, scénarios, KPIs, financier, anti-fraude).

---

## 2. Où récupérer le code

**Repo GitHub** : `PlumeTeam/plume-sav` ([github.com/PlumeTeam/plume-sav](https://github.com/PlumeTeam/plume-sav))
- Visibilité : **public**
- Branche par défaut : `main`
- Commits attribués à `PlumeTeam <plumeparagliders@gmail.com>` quand Claude / un agent pousse, à `jbchandelier <jbchandelier@gmail.com>` quand JB pousse à la main.

**Clone initial** (sur une machine neuve) :

```bash
git clone https://github.com/PlumeTeam/plume-sav.git
cd plume-sav
pnpm install
```

**Sync rapide** (au début de chaque session) :

```bash
git fetch origin
git pull --ff-only origin main
```

**Path local de référence sur les machines JB** : `C:\Plume_code\15_Plume_SAV\`

---

## 3. Où ça tourne (Vercel)

**URL prod** : **https://plume-sav.vercel.app** — alias de la branche `main`.

| Paramètre | Valeur |
|---|---|
| Team Vercel | Plume's projects (`plumes-projects-32ca7a67`) |
| Projet Vercel | `plume-sav` |
| Framework | Next.js 14 (Node 24) |
| Auto-deploy | push sur `main` → prod · push sur autre branche → preview |
| URL preview branche | `plume-sav-git-<branch-slug>-plumes-projects-32ca7a67.vercel.app` |
| Runtime logs | dispo via le MCP Vercel (`get_runtime_logs`) pour debugger les Server Components / Server Actions en prod |

🧪 **MODE DÉMO** — le site **n'est pas encore en ligne pour les vrais clients**. C'est un environnement de pré-production utilisé pour valider l'UX et le flux avant le go-live. Conséquence pratique : **on push directement sur `main`** au lieu de faire des branches preview, sauf demande explicite.

---

## 4. Backend Supabase

| Paramètre | Valeur |
|---|---|
| Project ID | `gxighesxbavnzzyngjaz` |
| Nom | plume-migration-clean |
| Région | eu-central-1 |
| Postgres | 17 |

⚠️ Ce projet Supabase est **partagé entre toutes les apps Plume** (boutique, démo, partner, accounting, futurlog, factory, proto, SAV) — ~150 tables. **Avant de créer une nouvelle table, vérifier qu'il n'existe pas déjà un équivalent.**

MCP Supabase disponible pour : `execute_sql`, `apply_migration`, `list_tables`, `get_advisors`.

**Politique migrations** : **jamais via le dashboard Supabase.** Tout passe par des fichiers SQL versionnés dans `supabase/migrations/` (nommage `YYYYMMDDHHMMSS_description.sql`).

---

## 5. État du projet (mai 2026)

### ✅ En prod sur https://plume-sav.vercel.app
- 4 rôles fonctionnels : **client · école · atelier · Plume HQ**
- Wizard de création de ticket SAV côté client (anamnèse, photos, école partenaire, bon de transport GLS)
- Page ticket détaillée avec tabs (État · Messages · Check) côté école
- Wizard de check terrain côté école (3 phases : visuel · gonflage · décision)
- Messagerie inter-rôles avec règles de visibilité (`all`, `school_plume`, `workshop_plume`, `plume_only`)
- Notifications messages non lus avec compteur par rôle
- Bons de transport GLS générés directement depuis l'app (3 legs : client→école, école→atelier, atelier→retour)
- **Module Flashcode (traçabilité QR cousu) — vue client + école complète** :
  - Scan obligatoire à la création du ticket (`WingScanCard`)
  - Scan obligatoire avant génération du bon de transport client → école
  - 3 scans école : réception, début de check, bon d'envoi atelier
  - Vraie caméra via `html5-qrcode` (back camera mobile, sélection robuste PC)
  - Friction sur saisie manuelle : raison + double saisie + copier-coller bloqué
  - N° de série masqué dans la liste des ailes côté client (anti-cheat)
  - Error boundary dédié pour isoler les crashs scanner

### ⏳ Reste à faire (par priorité)
1. **Scan Atelier** : 3 points (réception · diagnostic · bon retour)
2. **Scan Plume HQ** : 3 points + widget supervision flashcode (ailes en transit > J+5 sans scan-in)
3. **Persistence BDD du scan** : créer migration Supabase `wing_scans` (id, wing_id, ticket_id, user_id, role, scan_type, scanned_at, geo, demo_mode, manual_reason) + colonne `physical_state` sur `wings`. Server Action `recordScan()` à connecter dans tous les `onScanSuccess`.
4. **Adapter la carte « Statut de l'aile »** côté ticket client pour afficher les 9 états physiques au lieu de la dérivation timeline.
5. **Gater le bouton démo** en prod via `process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production'`.
6. **Sourcing étiquettes tissu cousues** (usine Asie) + liaison sac ↔ aile au premier appairage.

Historique détaillé des sessions Claude : [`docs/INTERVENTIONS-LOG.md`](INTERVENTIONS-LOG.md) (entrées chronologiques inverses).

---

## 6. Pour démarrer une session Claude (checklist)

1. **Lire ce fichier en premier** pour le contexte général.
2. **Lire [`CLAUDE.md`](../CLAUDE.md)** à la racine — règles techniques, stack figée, limites de taille fichiers, style de communication. (Auto-loadé par Claude Code et Cowork — pas besoin de l'ouvrir explicitement, mais utile de savoir qu'il existe.)
3. **Survoler [`docs/INTERVENTIONS-LOG.md`](INTERVENTIONS-LOG.md)** — dernière entrée = état le plus récent + pièges connus.
4. **Sync GitHub** : `git fetch origin && git pull --ff-only` (pour récupérer ce que d'autres machines ont poussé).
5. **Si tu modifies du code** : avant tout, consulte GitNexus via les MCP tools (`gitnexus_query`, `gitnexus_impact`, etc. — détails dans la section GitNexus de `CLAUDE.md`). Ne grep pas / glob pas à l'aveugle.
6. **À la fin de la session** : ajoute une entrée dans `docs/INTERVENTIONS-LOG.md` avec ce qui a été fait, les commits poussés, ce qui reste à faire, les pièges rencontrés.

---

## 7. Outils MCP disponibles (côté Cowork)

| Outil | Quand l'utiliser |
|---|---|
| **Vercel MCP** | Lister déploiements, get runtime logs, vérifier état build après push |
| **Supabase MCP** | `execute_sql` pour des queries simples, `apply_migration` pour les changements DDL |
| **Windows-MCP PowerShell** | Exécuter des commandes git / pnpm sur la machine de JB (= push depuis Cowork sans PAT GitHub) |
| **Desktop Commander** | Pour les long-running processes (`npx gitnexus analyze`, builds, etc.) |

GitNexus (knowledge graph du code) tourne en local côté Claude Code uniquement, pas dans Cowork. Mais ses outputs (CLAUDE.md auto-injecté + `.claude/skills/generated/*.md`) sont commités dans le repo et donc accessibles à toute session.

---

## 8. Pièges connus à mémoriser

(Détails complets dans [`docs/INTERVENTIONS-LOG.md`](INTERVENTIONS-LOG.md) — section « Pièges rencontrés ».)

- **Next.js 14 — `'use server'` interdit les re-exports.** Un fichier `'use server'` ne peut pas faire `export { foo } from './x'`. Mettre `'use server'` uniquement dans les sous-fichiers.
- **`tsc --noEmit` ne suffit pas comme garde-fou Next.js**. Le typecheck local peut passer alors que `next build` échoue. Vérifier le preview Vercel après chaque push.
- **`html5-qrcode` et SSR** : la lib touche `navigator.mediaDevices` au top du module → crash si évaluée côté serveur. Solution : charger le composant `QRCameraScanner` via `next/dynamic` avec `ssr: false`. **Ne PAS faire `await import('html5-qrcode')` dans un useEffect** — ça consomme le user gesture et Safari refuse la perm caméra.
- **PAT GitHub fine-grained** : Resource owner = `PlumeTeam` (pas `jbchandelier`) + Contents: Read **and** write + repo `plume-sav` explicitement coché. Sinon push refusé en 403.
- **Cowork ≠ Claude Code côté MCP** : Cowork n'a pas de connecteur GitHub natif. Pour push depuis Cowork, on passe par Windows-MCP PowerShell qui utilise le git CLI authentifié de la machine JB.

---

## 9. Liens utiles

| Doc | Pour quoi |
|---|---|
| [`CLAUDE.md`](../CLAUDE.md) | Règles techniques, stack, limites fichiers, conventions |
| [`docs/SAV-Plume-Bible.md`](SAV-Plume-Bible.md) | Contexte métier complet (vision, scénarios, financier) |
| [`docs/INTERVENTIONS-LOG.md`](INTERVENTIONS-LOG.md) | Journal chronologique des sessions Claude |
| [`.claude/PRE-SEARCH.md`](../.claude/PRE-SEARCH.md) | Protocole obligatoire avant grep/glob (GitNexus first) |
| [`.claude/agents/`](../.claude/agents/) | 5 agents Claude Code (sav-builder, sav-rls-auditor, etc.) |
| [`.claude/skills/generated/`](../.claude/skills/) | 9 skills auto-générés par cluster (Tickets, Wizard, etc.) |
| [GitHub repo](https://github.com/PlumeTeam/plume-sav) | Sources, issues, PRs |
| [Vercel inspector](https://vercel.com/plumes-projects-32ca7a67/plume-sav) | Logs build, déploiements, runtime |
| [Supabase dashboard](https://supabase.com/dashboard/project/gxighesxbavnzzyngjaz) | DB, RLS, storage (mais on touche tout via MCP / migrations SQL) |

---

Dernière mise à jour de ce briefing : **2026-05-10**. Pour vérifier qu'il est encore à jour, comparer la section « État du projet » avec la dernière entrée de [`docs/INTERVENTIONS-LOG.md`](INTERVENTIONS-LOG.md).
