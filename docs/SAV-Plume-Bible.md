# SAV Plume Paragliders — Bible Complète

> Document de référence consolidé — Tout ce qui a été conçu, décidé et chiffré pour le système SAV de Plume Paragliders.
>
> Dernière mise à jour : 29 avril 2026

---

## Table des matières

1. [Vision & Philosophie](#1-vision--philosophie)
2. [Chiffres clés de la marque](#2-chiffres-clés-de-la-marque)
3. [Architecture SAV à 4 niveaux](#3-architecture-sav-à-4-niveaux)
4. [Rôle de l'école — Le pilier du système](#4-rôle-de-lécole--le-pilier-du-système)
5. [Les 5 scénarios de résolution](#5-les-5-scénarios-de-résolution)
6. [Score Santé — Scoring automatique](#6-score-santé--scoring-automatique)
7. [QCM Client (N0)](#7-qcm-client-n0)
8. [QCM École (N1)](#8-qcm-école-n1)
9. [QCM Atelier (N2)](#9-qcm-atelier-n2)
10. [Plume Protect — Crash Replacement](#10-plume-protect--crash-replacement)
11. [Anti-fraude — Analyse & Boucliers](#11-anti-fraude--analyse--boucliers)
12. [Projections financières par volume](#12-projections-financières-par-volume)
13. [Architecture technique — Dashboards](#13-architecture-technique--dashboards)
14. [Les 4 dashboards](#14-les-4-dashboards)
15. [Système de messagerie](#15-système-de-messagerie)
16. [Base de données Supabase](#16-base-de-données-supabase)
17. [KPIs & Indicateurs de performance](#17-kpis--indicateurs-de-performance)
18. [Timeline Domino's — Suivi en temps réel](#18-timeline-dominos--suivi-en-temps-réel)
19. [Programme CPO (Certified Pre-Owned)](#19-programme-cpo-certified-pre-owned)
20. [Roadmap de développement](#20-roadmap-de-développement)
21. [Livrables produits à date](#21-livrables-produits-à-date)
22. [Prochaines étapes](#22-prochaines-étapes)

---

## 1. Vision & Philosophie

Plume Paragliders positionne son SAV autour du concept **« Zero Downtime »** : le client ne doit jamais manquer un créneau de vol à cause d'une réparation. Le SAV n'est pas un centre de coût, c'est un levier de fidélisation.

Ce positionnement repose sur le **Service Recovery Paradox** — un client bien traité en SAV devient plus fidèle qu'un client n'ayant jamais eu de problème. Chaque incident est une opportunité de prouver la fiabilité de la marque.

Les 5 principes directeurs :

1. **L'école comme gardien du système** — avec 550€ de commission par aile vendue, l'école filtre les demandes gratuitement pour Plume.
2. **Protéger les ateliers du bruit** — objectif : 70% des demandes résolues à l'école, pour éviter les envois inutiles.
3. **Le seuil de rentabilité dicte la stratégie** — avec 1 000€ de marge par aile, tout remplacement efface le bénéfice. Seuil de décision réparation vs remplacement : 40% du coût usine = 320€.
4. **Digital en amont, humain pour décider** — le formulaire en ligne pré-qualifie les cas, mais un humain (moniteur, réparateur) prend toujours la décision finale.
5. **Carnet digital enrichi** — chaque intervention alimente l'historique de la voile, créant un passeport technique complet.

L'indicateur maître est la **LTV (Lifetime Value)** : augmenter la valeur vie client en transformant chaque incident en preuve de fiabilité.

---

## 2. Chiffres clés de la marque

| Donnée | Valeur |
|---|---|
| Coût usine (Asie) | 600€ – 1 000€ (~800€ moyen) |
| Prix public | 3 500€ – 5 000€ (~4 000€ moyen) |
| Commission école | 500€ – 600€ (~550€ moyen) |
| **Marge brute Plume par aile** | **~1 000€** |
| Garantie légale | 2 ans |
| Seuil réparation / remplacement | 40% du coût usine = **320€** |
| Réseau partenaires (cible) | 5 – 20 écoles et ateliers |
| Volume cible Année 1-2 | 200 voiles/an |
| Volume cible Année 3+ | 500 – 1 000 voiles/an |

---

## 3. Architecture SAV à 4 niveaux

Le SAV Plume fonctionne en escalade progressive. Chaque niveau filtre et résout ce qu'il peut avant de passer la main au suivant.

### N0 — Self-service (Client web)

Le client se connecte à son espace, sélectionne son aile, et remplit un formulaire structuré (QCM) avec anamnèse de la voile + déclaration du dommage + photos. Un scoring automatique (Score Santé) pré-route la demande. Absorbe environ 30% des cas simples (questions, conseils). Coût pour Plume : ~0€.

### N1 — Réseau Expert (École partenaire)

L'école reçoit physiquement la voile. Le moniteur inspecte, remplit son propre QCM, et décide : résoudre sur place (réparation légère type ripstop, accroc <5cm) ou envoyer en atelier. L'école est le seul point de contact direct du client au départ. Résout environ 70% des cas. Coût pour Plume : 0€ (inclus dans la commission de 550€).

### N2 — Atelier Certifié

L'atelier reçoit l'aile avec le dossier complet (QCM client + rapport école + photos + carnet digital). Deux phases : pré-check technique plafonné à 50€ TTC, puis diagnostic approfondi jusqu'à 150€ (sur accord Plume). L'atelier mesure, diagnostique, chiffre et recommande un scénario de résolution.

### N3 — Plume HQ

Plume intervient pour les décisions stratégiques : validation des diagnostics approfondis >50€, autorisation des remplacements garantie, gestion des cas Plume Protect, suivi R&D qualité. Plume a une vue complète sur tout le réseau et tous les tickets.

---

## 4. Rôle de l'école — Le pilier du système

L'école n'est pas un simple intermédiaire. C'est le **filtre physique** du système SAV, et son rôle est justifié économiquement par la commission de 550€ qu'elle touche sur chaque vente.

Ce que l'école fait dans le SAV :
- Réceptionne physiquement la voile du client
- Inspecte visuellement (10 points de contrôle)
- Fait des tests rapides (porosité, suspentes)
- Décide du routage : résolu sur place, atelier optionnel, atelier nécessaire, atelier prioritaire, urgence N2/N3
- Prend des photos professionnelles
- Rédige des notes internes (une pour l'atelier, une pour Plume)
- Communique avec le client tout au long du processus
- Valide la crédibilité de l'histoire du client (bouclier anti-fraude n°1)

**Principe fondamental : le client ne contacte jamais l'atelier ni Plume directement au départ.** L'école est le point d'entrée unique. Exception : une fois la voile physiquement chez l'atelier, le client peut contacter l'atelier directement pour le suivi technique.

---

## 5. Les 5 scénarios de résolution

Chaque ticket SAV se termine par l'un de ces 5 scénarios :

### S1 — Résolu à l'école (objectif : 70% des cas)

Réparation légère effectuée par le moniteur (ripstop, accroc <5cm, ajustement). Le client repart avec sa voile. Coût Plume : 0€.

### S2 — Réparation atelier

Diagnostic atelier confirme un problème réparable. Devis établi. Si devis < 320€ (seuil de 40% du coût usine), la réparation est validée. L'atelier répare, la voile retourne au client via l'école. Coût Plume : 50€ à 150€ (diagnostic) + coût réparation variable.

### S3 — Remplacement garantie

Défaut de fabrication confirmé dans les 2 ans. Plume envoie une aile neuve gratuitement. L'ancienne aile est récupérée (CPO ou pièces). Coût Plume : ~800€ (prix usine).

### S4 — Crash Replacement (Plume Protect)

Crash accidentel, voile irréparable ou réparation > 320€. Si le client a souscrit Plume Protect, il paie une franchise de 150€ et reçoit une aile neuve du même modèle. L'ancienne aile est récupérée pour CPO. Coût Plume : ~800€ aile neuve + 300€ réparation CPO, compensé par la souscription.

### S5 — Retour sans réparation

Usure normale constatée (porosité naturelle, vieillissement). Conseil de maintenance donné au client. La voile est retournée en l'état. Coût Plume : 0€ à 50€ (pré-check).

---

## 6. Score Santé — Scoring automatique

Le Score Santé est calculé automatiquement à partir des réponses du client (Q1 à Q7). Il n'est jamais affiché au client — il est visible uniquement par l'école, l'atelier et Plume. C'est un outil de priorisation, pas un diagnostic.

| Score | Niveau | Pré-routage | Action école |
|---|---|---|---|
| 0 – 4 | Voile saine | N1 — École, diagnostic rapide | Inspection visuelle standard |
| 5 – 10 | Vigilance | N1+ — École, checklist renforcée | Inspection approfondie, attention aux flags |
| 11 – 17 | Risque élevé | N2 — Atelier systématique | Inspection école + envoi atelier recommandé |
| 18+ ou ALERTE | Risque structurel | N2/N3 — Prioritaire | Consigner l'aile, envoi immédiat |

Le pré-routage est une suggestion. L'école peut toujours modifier après inspection physique. Le scoring aide à prioriser, le moniteur décide.

En plus du score numérique, des **flags** sont déclenchés automatiquement : usure bord d'attaque (gonflage intensif), dégradation UV (stockage déployé), hydrolyse (choc thermique humide), etc. Chaque flag déclenche une alerte spécifique dans le dossier.

---

## 7. QCM Client (N0)

Le formulaire client est rempli en ligne, depuis l'espace client du site. Le client est déjà identifié (100% des achats se font en ligne).

### Identification automatique (pré-rempli)

Les informations suivantes sont récupérées automatiquement du compte client :
- Nom, prénom, email, téléphone
- Liste des ailes enregistrées (le client sélectionne celle concernée)
- Modèle, taille, numéro de série, date d'achat
- Statut garantie (calculé : date d'achat + 2 ans)
- Statut Plume Protect
- École de rattachement

### Anamnèse voile (Q0 – Q7)

**Q0 — Événement marquant à signaler** : texte libre. Si rempli, déclenche un flag `human_review` pour attention particulière.

**Q1 — Heures de vol estimées** : 0-20h (0 pt) | 20-50h (1 pt) | 50-150h (2 pts) | >150h (3 pts) | Ne sais pas (2 pts).

**Q1b — Gonflages au sol intensifs** : Rarement (0 pt) | Occasionnels (1 pt) | Fréquents (2 pts → flag `leading_edge_wear`).

**Q2 — Stockage habituel** : Sac fermé, endroit sec (0 pt) | Endroit lumineux (1 pt) | Voile déployée/suspendue (3 pts → flag `uv_degradation`).

**Q2b — Habitude de pliage** : Accordéon soigné (0 pt) | Pliage classique (1 pt) | Rapide/en boule (2 pts).

**Q3 — Chocs thermiques** : Non (0 pt) | Séchage rapide (1 pt) | Expositions répétées (2 pts) | Stockage humide après vol (4 pts → alerte `hydrolyse`).

**Q4 — Exposition humidité, gel, sel** : multi-choix avec points cumulables.

**Q5 — Dépôt de matière étrangère** : résine, mousse, substances.

**Q6 — Manipulation brutale / chocs** : au sol, en transport, autre.

**Q7 — Autres incidents à signaler** : texte libre.

### Déclaration dommage (D1 – D7)

**D1 — Type d'incident** : choix multiples (collision vol, collision sol, arbre, eau, décollage/atterrissage raté, usure constatée, autre).

**D2 — Date de l'incident** : sélecteur de date.

**D3 — Localisation du dommage** : schéma interactif de la voile (bord d'attaque, intrados, extrados, bord de fuite, suspentes, élévateurs, etc.) avec sélection de zones.

**D4 — Description libre** : texte décrivant le problème.

**D5 — Photos** : minimum 3 photos obligatoires (vue globale, zone endommagée de près, contexte). Compression automatique + horodatage. Stockage Supabase Storage.

**D6 — Urgence ressentie** : Pas pressé | Voyage/stage dans X jours (→ champ date) | Besoin de revoler rapidement.

**D7 — Note libre** : zone de texte optionnelle (max 2 000 caractères) pour que le client ajoute tout ce qu'il juge utile.

Après soumission, le client reçoit un message de confirmation : "Merci ! Votre demande a été transmise à votre école [Nom école]. Vous serez contacté sous 4h pour organiser l'inspection de votre voile."

---

## 8. QCM École (N1)

Le formulaire école peut être rempli avec le client présent ou en solo après inspection. Le moniteur a accès au QCM client complet + photos + Score Santé + flags.

### Réception & Conformité (E1 – E2)

**E1 — Checklist de conformité** : numéro de série correspond ? Modèle correspond ? État cohérent avec déclaration client ?

**E2 — Dommage confirmé ?** : Confirmé tel que décrit | Plus grave que décrit | Différent de ce qui est décrit | Dommages supplémentaires découverts.

### Inspection 10 points (E3)

Chaque élément est évalué : OK | Surveillé | Endommagé | Critique.

1. Bord d'attaque
2. Bord de fuite
3. Intrados
4. Extrados
5. Caissons / cloisons
6. Suspentes hautes
7. Suspentes basses
8. Élévateurs
9. Freins
10. Points d'ancrage / coutures

Chaque point peut avoir une note et des photos associées.

### Tests rapides (E4)

Porosité faite ? (oui/non) → valeur mesurée (secondes). Test suspentes réalisé ? → résultat (OK / anomalie).

### Photos école (E5)

Photos professionnelles de l'inspection, avec zones annotées.

### Décision de routage (E6)

8 issues possibles :
- Résolu N1 — problème mineur réglé sur place
- Résolu N1 avec suivi — résolu mais à surveiller
- Atelier optionnel — conseil envoi atelier, client décide
- Atelier nécessaire — envoi recommandé
- Atelier prioritaire — envoi rapide nécessaire
- Urgence N2/N3 — danger, consigner l'aile, escalade immédiate
- Plume Protect activé — crash confirmé, lancer procédure remplacement
- Retour sans action — usure normale, pas d'intervention

### Notes (E7, E10, E11)

**E7 — Note interne école** : non visible par le client.

**E10 — Note pour l'atelier** : visible uniquement par l'atelier. Contexte, suspicion, point d'attention particulier.

**E11 — Note pour Plume** : visible uniquement par Plume, jamais partagée avec le client ni l'atelier. Alerte, doute, suggestion, retour terrain.

### Clôture (E8, E9)

**E8 — Score CES école (1-7)** : "À quel point ce diagnostic a-t-il été facile à réaliser via l'app ?"

**E9 — Sélection de l'atelier** : si envoi N2, l'école choisit parmi les ateliers partenaires actifs. Le bon d'envoi se génère automatiquement.

---

## 9. QCM Atelier (N2)

L'atelier reçoit l'aile + le dossier complet (QCM client + rapport école + photos + carnet digital + historique SAV antérieur).

### Phase 1 : Pré-check (50€ TTC max)

**A0 — Résumé du dossier** : affichage automatique de toutes les infos (lecture seule).

**A1 — Conformité réception** : aile conforme au bon d'envoi ? État cohérent avec rapport école ? Anomalie de transport ?

**A2 — Résultat du pré-check** (30-45 min) : 3 issues possibles :
- A : Pas de problème technique confirmé → retour au client via école
- B : Problème confirmé, réparation simple < 200€ → devis envoyé à Plume
- C : Diagnostic approfondi nécessaire → demande de budget à Plume (≤150€)

### Phase 2 : Diagnostic approfondi (≤150€, sur accord Plume)

**A3 — Expertise détaillée** : inspection complète de la zone signalée + zones adjacentes. Identification de la cause racine.

**A4 — Mesures techniques** :
- Porosité sur 12 points de la voile (bord d'attaque, intrados, extrados, centre, extrémités). Chaque point : valeur mesurée en secondes, comparaison avec référence neuve (0-5s). Statuts : OK (<10s), Surveillé (10-15s), Critique (>15s).
- Résistance suspentes par groupes (A, B, C, freins) : mesurée vs référence constructeur en daN.
- Trim / calage : mesures de symétrie.

**A5 — Décision finale** : l'atelier recommande l'un des 5 scénarios (S1 à S5). Si remplacement (S3 ou S4), l'aile est consignée en attente de validation Plume.

**A6 — Devis** : système de devis avec lignes détaillées (pièces, main d'œuvre, diagnostic). Alerte automatique si le total dépasse 320€ (40% du coût usine) → remplacement à considérer.

**A7 — Rapport final** : synthèse technique complète, photos avant/après, recommandations maintenance.

---

## 10. Plume Protect — Crash Replacement

### Le concept

Plume Protect est une option payante souscrite à l'achat de l'aile. En cas de crash accidentel rendant la voile irréparable (ou réparation > 320€), le client reçoit une aile neuve du même modèle en échange d'une franchise fixe de 150€. L'ancienne aile est récupérée par Plume pour le programme CPO.

**Positionnement concurrentiel unique** : aucune autre marque de parapente au monde ne propose de Crash Replacement. Plume serait la première. En comparaison, les marques vélo (Trek, Specialized) proposent du remplacement casque gratuit + cadre à -25/30%.

### Tarification

| Paramètre | Valeur |
|---|---|
| Taux option (sweet spot) | 7,5% du prix public |
| Aile à 3 500€ | Option = 262€ |
| Aile à 4 000€ | Option = 300€ |
| Aile à 5 000€ | Option = 375€ |
| Franchise fixe | 150€ |
| Validité | 2 ans |
| Utilisations | 1 par souscription |

Argument de vente : « Pour 7,5% du prix, vous êtes couvert 2 ans. En cas de crash, 150€ pour repartir avec du neuf. »

### Conditions

- Souscription à l'achat uniquement (pas après coup → anti-fraude)
- Retour obligatoire de l'aile endommagée
- Passage par le circuit SAV normal (école → atelier → diagnostic)
- Remplacement par modèle équivalent (pas d'upgrade gratuit)
- Non transférable en cas de revente de l'aile

Ce qui n'est PAS couvert : usure normale (porosité, UV), petit accroc <5cm (SAV école), perte/vol (assurance personnelle), défaut de fabrication (couvert par la garantie 2 ans gratuite).

### Analyse financière (scénario de base : 200 voiles/an)

Hypothèses : 60% de taux de souscription, 7% de taux de crash, coût usine 800€, prix CPO 2 000€, 70% de revendabilité CPO.

| Poste | Montant |
|---|---|
| Options (120 × 300€) | +36 000€ |
| Franchises (8 × 150€) | +1 200€ |
| Revente CPO (5 × 2 000€) | +10 000€ |
| Pièces détachées | +450€ |
| **Total revenus** | **+47 650€** |
| Ailes neuves (8 × 800€) | -6 400€ |
| Transport | -400€ |
| Réparation CPO (5 × 300€) | -1 500€ |
| Admin | -500€ |
| **Total coûts** | **-8 800€** |
| **Résultat net** | **+38 850€/an** |
| **Par aile vendue** | **+194€ (+19,4% de marge supplémentaire)** |

Le break-even se situe à 38% de taux de crash — soit 4x le taux réaliste de 5-10%. Même sans CPO, le programme reste rentable à +26 200€/an.

---

## 11. Anti-fraude — Analyse & Boucliers

### Contexte

La question : quelqu'un peut-il souscrire Plume Protect, attendre 18 mois, puis détruire volontairement sa voile pour en obtenir une neuve ?

Réponse : le risque est négligeable dans le milieu du parapente, et les boucliers structurels du système l'éliminent presque entièrement.

### Benchmark industrie

| Secteur | Taux de fraude |
|---|---|
| Parapente (communauté niche) | 2 – 5% |
| Vélo | 3 – 6% |
| Casques | 5 – 8% |
| Smartphone | 8 – 12% |
| Automobile | 10 – 15% |
| Assurance santé | 15 – 20% |

Le parapente est naturellement protégé par la taille de la communauté (~15 000 pilotes en France), le lien personnel moniteur-pilote, l'attachement émotionnel à l'aile, le risque sécuritaire (endommager volontairement une aile = risquer de voler avec une aile fragilisée), et le gain limité (450€ déjà dépensés en option + franchise).

### Les 7 boucliers anti-fraude

1. **Bouclier école (efficacité 90%)** — Le moniteur connaît personnellement le pilote, valide la crédibilité de l'histoire en face à face.
2. **Photos géolocalisées (60%)** — Métadonnées EXIF (GPS + horodatage) difficiles à falsifier.
3. **Retour obligatoire de l'aile (95%)** — Inspection physique par l'atelier, le bouclier le plus dissuasif.
4. **Expertise atelier (85%)** — Un technicien distingue une déchirure de crash (irrégulière) d'une coupe nette (ciseau).
5. **Franchise 150€ (50%)** — Le client paie toujours quelque chose, réduit l'attrait de la fraude.
6. **Carnet digital (70%)** — Historique complet de la voile, schémas suspects détectables.
7. **Pression sociale (80%)** — Petite communauté, la rumeur circule vite, risque de blacklist.

### Filtrage en cascade

Sur 100 demandes de Crash Replacement :
- ~5 suspectes à l'entrée (5%)
- Après filtre école : ~1 suspecte restante
- Après photos + retour obligatoire : ~0,5
- Après expertise atelier : ~0,1
- **Fraude non détectée estimée : 0,1%** (soit 0-1 fraude tous les 5 ans avec 200 voiles/an)

### Impact financier

Même à 10% de fraude (hypothèse extrême), le programme reste rentable à +34 100€/an. Le break-even fraude est à 53% — totalement irréaliste.

**Recommandation : ne pas sur-investir dans l'anti-fraude.** Le plus grand risque n'est pas la fraude, c'est de rendre le processus tellement pénible qu'on dégoûte les 95% de clients honnêtes. Faire confiance par défaut, laisser les boucliers structurels travailler en silence.

---

## 12. Projections financières par volume

Le modèle Plume Protect est parfaitement linéaire (~194€/aile quelle que soit l'échelle) avec des effets d'échelle positifs.

### Résultats par palier

| Indicateur | 200 voiles/an | 500 voiles/an | 1 000 voiles/an |
|---|---|---|---|
| Souscripteurs (60%) | 120 | 300 | 600 |
| Crashes (~7%/an) | ~8 | ~21 | ~42 |
| CPO revendables | ~5 | ~13 | ~26 |
| **Revenus totaux** | **47 650€** | **120 350€** | **240 700€** |
| **Coûts totaux** | **-8 800€** | **-23 750€** | **-48 500€** |
| **Résultat net** | **+38 850€** | **+96 600€** | **+192 200€** |
| Résultat par aile | +194€ | +193€ | +192€ |
| Ressources humaines | 0 ETP dédié | 0,2 ETP | 0,5 ETP |

### Effets d'échelle favorables

Avec le volume, plusieurs paramètres s'améliorent :
- Pouvoir de négociation usine : 800€ → 750€ (500 voiles) → 700€ (1 000 voiles)
- Taux de souscription : bouche-à-oreille améliore 60% → 65-70%
- Taux de revente CPO : 70% → 80-90% (boutique dédiée, liste d'attente)
- Données R&D : 42 crashes/an = données statistiquement fiables pour améliorer les produits

Avec effets d'échelle, le résultat par aile passe de 194€ à ~240€ (+24%).

### Projection cumulée sur 5 ans

| Année | Volume | Résultat annuel | Cumul |
|---|---|---|---|
| Année 1 | 200 voiles | +38 850€ | 38 850€ |
| Année 2 | 200 voiles | +38 850€ | 77 700€ |
| Année 3 | 500 voiles | +96 600€ | 174 300€ |
| Année 4 | 1 000 voiles | +192 200€ | 366 500€ |
| Année 5 | 1 000 voiles | +192 200€ | **558 700€** |

**Plus d'un demi-million d'euros de résultat cumulé en 5 ans**, uniquement grâce à Plume Protect.

---

## 13. Architecture technique — Dashboards

### Décision : site séparé

Le système SAV est une **application web séparée** (sav.plumeparagliders.com) connectée au même backend Supabase que le site principal (plumeparagliders.com). Pas de spaghetti de code.

Raisons :
- Cycles de mise à jour différents (SAV itère vite, boutique doit rester stable)
- Utilisateurs fondamentalement différents (clients vs professionnels)
- Complexité du code maîtrisée (chaque app a un périmètre clair)
- Liberté de faire évoluer l'un sans risquer de casser l'autre

### Stack technique recommandée

| Composant | Technologie |
|---|---|
| Frontend | Next.js 14+ (App Router, SSR/SSG) |
| UI | React 18 + Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions) |
| État client | React Query (data fetching) + Zustand (state) |
| Emails | Resend.io |
| Temps réel | Supabase Realtime (WebSocket) |
| Déploiement | Vercel (frontend) + Supabase Cloud (backend) |
| Monitoring | Sentry (erreurs) + PostHog (analytics produit) |

### Structure monorepo

Un seul dépôt Git contenant :
- `apps/web` — le site principal (boutique)
- `apps/sav` — l'application SAV (dashboards)
- `packages/shared` — types TypeScript partagés, client Supabase, utilitaires
- `packages/ui` — composants UI partagés

Deux déploiements indépendants, un seul Supabase.

---

## 14. Les 4 dashboards

### Dashboard Client (N0)

Interface simple et rassurante. Le client ne doit jamais se sentir perdu.

Sections :
- **Mes Ailes** — liste des ailes enregistrées avec photo, numéro de série, date d'achat, statut garantie, statut Plume Protect, heures de vol estimées.
- **Nouveau Ticket SAV** — lance le QCM guidé (étapes : sélection aile → anamnèse → dommage → photos → envoi).
- **Mes Tickets** — liste des tickets ouverts/fermés avec badges de statut.
- **Suivi en direct** — timeline Domino's pour chaque ticket (cf. section 18).
- **Messages** — fil de conversation par ticket avec l'école, et avec l'atelier une fois la voile envoyée.
- **Paramètres** — préférences de notification (email immédiat, résumé quotidien, in-app).

### Dashboard École (N1)

Interface professionnelle orientée action. Le moniteur gère son flux de tickets.

Sections :
- **Tableau de bord** — KPIs (tickets ce mois, en attente, temps moyen résolution, CES moyen) + fil d'activité récente.
- **Tickets en attente** — liste des tickets clients à traiter, triés par urgence et date, avec Score Santé visible.
- **Inspection en cours** — formulaire complet E1-E11 avec accès au QCM client + photos.
- **Envois atelier** — gestion des envois (sélection atelier, bon d'envoi, numéro de suivi).
- **Historique** — tickets passés avec filtres (date, statut, modèle d'aile).
- **Messages** — conversations par ticket avec clients et ateliers.
- **Mes stats** — indicateurs personnels (tickets traités, temps de réponse, CES moyen, répartition des problèmes).

### Dashboard Atelier (N2)

Interface technique avec données complètes sur les ailes. Le réparateur a besoin de tout savoir sur la voile avant d'y toucher.

Sections :
- **Tableau de bord** — KPIs + pipeline kanban (Réception → Pré-check → Diagnostic → Réparation → Prêt à expédier).
- **Ailes en cours** — liste détaillée des voiles en atelier avec dossier complet.
- **Fiche Technique Aile** — page centrale, le dossier complet de chaque voile :
  - Identité : modèle, taille, numéro de série, date de fabrication, couleur, surface, allongement, nombre de caissons, PTV, homologation.
  - Spécifications constructeur : tissu extrados/intrados (type, grammage), suspentes (modèle, résistance de référence), porosité neuve de référence.
  - Propriétaire : nom, date d'achat, âge de la voile, garantie, Plume Protect.
  - Historique de vol : heures, gonflage sol, stockage, incidents.
  - Historique SAV : tous les tickets passés, interventions, mesures antérieures.
- **Diagnostic** — formulaire A1-A7 en deux phases (pré-check puis diagnostic approfondi).
- **Mesures techniques** — porosité (12 points avec schéma de la voile), résistance suspentes, trim/calage.
- **Devis** — constructeur de devis avec lignes détaillées et alerte automatique si >320€.
- **Galerie photos** — toutes les photos organisées par source (client, école, atelier).
- **Messages** — conversations avec écoles, clients et Plume.

### Dashboard Plume HQ (N3)

Interface d'administration puissante avec analytics avancés.

Sections :
- **Vue d'ensemble** — KPIs exécutifs (tickets actifs, temps moyen résolution, CES moyen, taux résolution N1) + graphiques (tickets par mois, types de problèmes).
- **Temps réel** — tableau de tous les tickets actifs avec filtres (statut, urgence, école, modèle, atelier).
- **Validations en attente** — cartes de décision pour les approbations nécessaires (diagnostic approfondi, remplacement garantie, devis réparation).
- **Analytics avancés** — la page maîtresse :
  - Heatmap problèmes × modèle d'aile (matrice colorée : quel type de problème sur quel modèle)
  - Tendances temporelles (courbes de tickets par mois, par type de problème)
  - Alertes qualité automatiques (si un modèle concentre soudainement trop de problèmes → alerte automatique)
  - Performance réseau (classement écoles par tickets traités, temps moyen, CES)
  - Distribution géographique
  - Ratio garantie vs hors garantie
  - Rentabilité Plume Protect (souscriptions, utilisation, CPO)
  - Filtres croisés interactifs (modèle × type de problème × période × école)
- **Alertes** — centre de notifications (qualité, SLA, approbations).
- **Messages** — vue admin de toutes les conversations, possibilité d'intervenir partout.
- **Réseau partenaires** — gestion des écoles et ateliers (statut, performance, contact, contrat).
- **Plume Protect** — tableau de bord souscriptions, sinistres, CPO.
- **Configuration** — templates email, seuils SLA, scoring, gestion utilisateurs/rôles.

---

## 15. Système de messagerie

### Architecture

Système combiné : fil de discussion in-app (type Intercom) par ticket + notifications email automatiques à chaque événement clé.

### Matrice de communication

| Émetteur | → Client | → École | → Atelier | → Plume |
|---|---|---|---|---|
| **Client** | — | ✅ Toujours | ⚡ Dès que la voile est à l'atelier | ❌ Jamais |
| **École** | ✅ | — | ✅ | ❌ |
| **Atelier** | ✅ | ✅ | — | ✅ |
| **Plume** | ✅ | ✅ | ✅ | — |

Règle conditionnelle : le client ne peut contacter l'atelier que lorsque le ticket est en statut `workshop_received` ou supérieur (voile physiquement chez le réparateur). Avant cela, l'école est le seul interlocuteur du client. Le client ne contacte jamais Plume directement.

### Visibilité des notes privées

- Note E7 (interne école) : visible par école + atelier + Plume. Pas par le client.
- Note E10 (pour l'atelier) : visible par atelier + Plume. Pas par le client ni les autres écoles.
- Note E11 (pour Plume) : visible uniquement par Plume. Pas par le client, ni l'école, ni l'atelier.

### Notifications email

Templates automatiques pour chaque événement du cycle de vie :
- Ticket créé → client reçoit confirmation
- Inspection école terminée → client reçoit mise à jour
- Aile envoyée à l'atelier → client + atelier notifiés
- Devis prêt → Plume reçoit demande d'approbation
- Changement de statut → parties concernées notifiées
- Rappel sans réponse (>4h école, >48h atelier) → relance automatique

Chaque utilisateur configure ses préférences : email immédiat, résumé quotidien, ou désactivé.

---

## 16. Base de données Supabase

### Tables existantes (déjà en production)

| Table | Contenu | Lignes actuelles |
|---|---|---|
| profiles | Comptes utilisateurs | 14 |
| wing_serial_numbers | Numéros de série des ailes | 61 |
| customer_wings | Liaison client-aile | 1 |
| partner_schools | Écoles partenaires | 5 |
| shop_orders | Commandes boutique | 109 |
| service_requests | Tickets SAV (vide, prêt pour implémentation) | 0 |

### Nouvelles tables à créer

**service_requests** (table principale du ticket SAV) : id, user_id, wing_id, status (state machine), current_level (n0/n1/n2/n3), health_score, flags (JSONB), alerts (JSONB), routing_suggestion, resolution_scenario (s1-s5), assigned_school_id, assigned_workshop_id, created_at, updated_at, resolved_at.

**ticket_responses** (réponses QCM client) : id, ticket_id (FK unique), q0 à q7 (colonnes individuelles), d1 à d7 (colonnes individuelles), created_at.

**ticket_photos** (photos SAV) : id, ticket_id (FK), source (client/school/workshop), storage_path, description, taken_at (EXIF), geo_lat, geo_lng (GPS EXIF).

**school_inspections** (rapport école N1) : id, ticket_id (FK unique), inspector_id, mode (with_client/solo), e1 (conformité), e2 (dommage confirmé), inspection_points (JSONB × 10), e4 (tests rapides), e6_routing_decision, e7_internal_note, e8_ces_score, e10_note_workshop, e11_note_plume, created_at.

**workshop_diagnostics** (rapport atelier N2) : id, ticket_id (FK unique), technician_id, precheck_result (a/b/c), precheck_cost, deep_diag_approved, recommendation (s1-s5), estimated_cost, final_report, created_at.

**workshop_measurements** (mesures techniques) : id, diagnostic_id (FK), porosity_points (JSONB array × 12), line_strength (JSONB par groupe), trim_data (JSONB), created_at.

**workshop_quotes** (devis atelier) : id, diagnostic_id (FK), line_items (JSONB), total_amount, threshold_alert (bool, auto si >320€), status (draft/sent/approved/rejected), approved_by, created_at.

**wing_protect_subscriptions** (souscriptions Plume Protect) : id, wing_id (FK unique), option_price, franchise_amount, status (active/used/expired), subscribed_at, expires_at, crash_used_at.

**ticket_status_history** (timeline Domino's) : id, ticket_id (FK), old_status, new_status, changed_by, changed_at, note.

**ticket_messages** (messagerie) : id, ticket_id (FK), sender_id, sender_role (client/school/workshop/plume_admin), content, attachments (JSONB), is_private, visibility_level, read_by (JSONB), created_at.

**notification_preferences** (préférences notifications) : id, user_id (FK), channel (email/in_app/both), frequency (immediate/daily_digest/off), event_types (JSONB).

**email_queue** (file d'attente emails) : id, to, template, variables (JSONB), status (pending/sent/failed), sent_at.

### Sécurité

- Row Level Security (RLS) activée sur toutes les tables
- Policies par rôle (client, school, workshop, plume_admin)
- Le client ne voit que ses propres données
- L'école ne voit que les tickets de ses clients
- L'atelier ne voit que les tickets qui lui sont assignés
- Plume voit tout
- Règle conditionnelle messagerie : client → atelier uniquement si current_level ≥ 'workshop'

---

## 17. KPIs & Indicateurs de performance

| KPI | Cible | Description |
|---|---|---|
| CES (Customer Effort Score) | ≥ 6/7 | Facilité de résolution perçue par le client |
| NPS Post-SAV | ≥ 70 | Score de recommandation après intervention SAV |
| FCR (First Contact Resolution) | ≥ 70% | % de tickets résolus dès l'école (N1) |
| FRT (First Response Time) | < 4h | Temps entre soumission client et première réponse école |
| MTTR (Mean Time To Resolution) | < 21 jours | Délai moyen déclaration → retour aile au client |
| Coût SAV par aile vendue | < 15€ | Coût moyen SAV rapporté au nombre d'ailes vendues |
| Taux de cohérence diagnostic | ≥ 85% | Alignement entre diagnostic client, école et atelier |
| Taux souscription Plume Protect | ≥ 60% | % des acheteurs qui souscrivent l'option |

---

## 18. Timeline Domino's — Suivi en temps réel

Inspirée du suivi de commande Domino's Pizza. Le client voit en temps réel où en est son ticket, avec des étapes claires et des horodatages.

Étapes de la timeline :

1. ✅ **Ticket envoyé** — date + heure de soumission
2. ✅ **Réception école** — nom de l'école + horodatage
3. 🔄 **Inspection en cours** — étape active, animation pulsante
4. ⬜ **Décision école** — en attente
5. ⬜ **Envoi atelier** (si nécessaire) — en attente
6. ⬜ **Diagnostic atelier** — en attente
7. ⬜ **Réparation / Décision** — en attente
8. ⬜ **Retour de votre aile** — en attente

Chaque transition de statut alimente automatiquement la table `ticket_status_history` et met à jour la timeline en temps réel via Supabase Realtime (WebSocket).

Le vert = étape terminée. L'orange = étape en cours. Le gris = étape à venir. Les étapes non pertinentes (ex: pas d'atelier si résolu N1) sont masquées dynamiquement.

---

## 19. Programme CPO (Certified Pre-Owned)

Les ailes récupérées via Plume Protect ou les remplacements garantie alimentent un marché d'occasion certifié.

| Paramètre | Valeur |
|---|---|
| Prix de vente CPO | ~2 000€ (50-60% du neuf) |
| Coût de remise en état | ~300€ |
| Marge nette CPO | ~1 700€ (+70% de plus qu'une aile neuve) |
| Garantie CPO | 1 an (garantie Plume réduite) |
| Carnet digital | Historique complet inclus (transparence) |
| Éligible Plume Protect | Oui, le client CPO peut souscrire |

Cible : débutants, petits budgets, deuxième aile de voyage. Avec le volume (1 000 voiles/an), le CPO devient un véritable canal de distribution avec ~26 ailes/an et +52 000€ de revenus.

---

## 20. Roadmap de développement

### Phase 1 — MVP (4-6 semaines)

- Dashboard Client basique (mes ailes, créer ticket, suivi simple)
- Dashboard École (queue tickets, inspection, routage)
- QCM client fonctionnel (Q0-Q7, D1-D7)
- Tables Supabase principales (service_requests, ticket_responses, ticket_photos, school_inspections)
- Auth Supabase avec rôles (client, school)
- Notifications email basiques

### Phase 2 — Core (4 semaines)

- Dashboard Atelier (diagnostic, devis, mesures, fiche technique aile)
- Système de messagerie (fil de discussion par ticket)
- Carnet digital basique (historique interventions)
- QCM Atelier complet (A1-A7)
- Tables : workshop_diagnostics, workshop_measurements, workshop_quotes, ticket_messages

### Phase 3 — Intelligence (3 semaines)

- Dashboard Plume HQ (supervision, validations, analytics)
- Timeline Domino's en temps réel (Supabase Realtime)
- Analytics avancés (heatmap problèmes × modèle, tendances, alertes qualité)
- KPIs en temps réel (CES, NPS, FCR, FRT)
- Système d'alertes automatiques
- Tables : ticket_status_history, notification_preferences, email_queue

### Phase 4 — Polish (2 semaines)

- Intégration Plume Protect complète
- Filtres avancés et export rapports
- Optimisation mobile
- Boutique CPO
- Sécurité RGPD (export/suppression données)

**Total estimé : ~14-16 semaines de développement.**

---

## 21. Livrables produits à date

| Fichier | Contenu |
|---|---|
| SAV-Plume-Systeme.html | Blueprint consolidé du système SAV (architecture, flux, scénarios, KPIs) |
| Crash-Replacement-Analyse.html | Analyse financière complète de Plume Protect (200 voiles/an) |
| Plume-Protect-Anti-Fraude.html | Analyse anti-fraude avec benchmark industrie et 7 boucliers |
| Plume-Protect-Scenarios-Volume.html | Projections 200/500/1000 voiles avec simulateur interactif |
| SAV-QCM-Plan-Complet.html | Plan QCM complet (3 formulaires) + schéma base de données + flux |
| SAV-Dashboards-Architecture.html | Architecture technique des dashboards + messagerie + roadmap |
| Dashboard-Client.html | Maquette interactive du dashboard client |
| Dashboard-Ecole.html | Maquette interactive du dashboard école |
| Dashboard-Atelier.html | Maquette interactive du dashboard atelier |
| Dashboard-Plume-HQ.html | Maquette interactive du dashboard Plume HQ |

---

## 22. Prochaines étapes

- [ ] Validation par JB des maquettes dashboard (retours UX)
- [ ] Contrat de partenariat école (incluant obligations SAV)
- [ ] Module Crash Replacement détaillé (franchise, conditions, processus de commande usine)
- [ ] Développement Phase 1 MVP (client + école + flux de base)
- [ ] Programme CPO / upcycling détaillé (V2/V3)
- [ ] Tests utilisateurs avec écoles pilotes

---

## 23. Décisions techniques validées (29 avril 2026)

Cette section consolide les décisions prises lors de la session de cadrage du 29 avril 2026. Elle prime sur les sections précédentes en cas de divergence.

### 23.1 Authentification & Dashboard Switcher

Au login sur `sav.plumeparagliders.com`, le système lit la table `user_roles` du user :

- **1 seul rôle** → redirection automatique vers le dashboard correspondant (`/client`, `/ecole`, `/atelier`, `/plume`)
- **Plusieurs rôles** → écran de sélection « Vous avez accès à plusieurs espaces »
- **Plume admin** → accès à tous les dashboards + capacité « voir comme » un client/école/atelier pour le support

Le rôle actif est stocké en cookie httpOnly + état Zustand côté client. Un user peut changer de rôle actif à tout moment via le menu de profil.

Ce design permet à un moniteur d'école qui est aussi pilote propriétaire d'aile Plume d'avoir un seul compte avec accès aux deux espaces.

### 23.2 Confirmation : 4 dashboards distincts

Le dashboard Atelier (N2) et le dashboard Plume HQ (N3) sont **deux applications distinctes**. Pas de fusion. Chacun a son propre routage, ses propres permissions, et son propre périmètre fonctionnel.

### 23.3 Domaine

`sav.plumeparagliders.com` (sous-domaine du domaine principal `plumeparagliders.com`). Configuration DNS à finaliser au déploiement.

### 23.4 Projet Supabase

| Paramètre | Valeur |
|---|---|
| Nom | plume-migration-clean |
| Project ID | `gxighesxbavnzzyngjaz` |
| Région | eu-central-1 |
| Postgres | 17.6.1.011 |
| Statut | ACTIVE_HEALTHY |
| Organisation | Plumeparagliders |

Ce projet héberge **toutes les apps Plume** (boutique, démo, partner, accounting, futurlog, factory, proto, SAV). On NE crée PAS de projet Supabase séparé pour le SAV — l'app SAV se branche sur le projet existant.

### 23.5 Tables existantes pertinentes (à investiguer avant de coder)

| Table | Lignes | Statut |
|---|---|---|
| `service_requests` | 0 | Prête, RLS activée — table principale du SAV |
| `user_roles` | 7 | Existante — base du dashboard switcher |
| `partner_schools` | 5 | Existante — réseau d'écoles |
| `customer_wings` | 1 | Liaison client-aile |
| `wing_serial_numbers` | 61 | Numéros de série |
| `profiles` | 14 | Comptes utilisateurs |
| `wing_repair_conversations` | 0 | À investiguer — possible début d'implémentation SAV antérieure |
| `wing_repair_messages` | 0 | À investiguer — idem, avant de créer `ticket_messages` |
| `wing_inspections` | 1 | À investiguer — utilisée par les ailes de démo, peut chevaucher avec `school_inspections` |
| `inspection_photos` | 0 | À investiguer — idem |
| `partner_messages` | 0 | À investiguer — vérifier si le système de messagerie peut être réutilisé |

**Avant de créer une nouvelle table, vérifier qu'il n'existe pas déjà un équivalent.** Le projet Supabase contient ~150 tables (toutes apps confondues). Ne pas dupliquer.

### 23.6 Stack technique figée

| Composant | Choix |
|---|---|
| Framework | Next.js 14+ (App Router, Server Components par défaut) |
| Langage | TypeScript strict (`strict: true` + `noUncheckedIndexedAccess: true`) |
| UI | Tailwind CSS + shadcn/ui (composants copiés dans le repo, pas de lib externe) |
| Auth/DB client | `@supabase/ssr` (PAS `@supabase/auth-helpers`, déprécié) |
| Data fetching | React Query (`@tanstack/react-query`) |
| State client | Zustand (état UI, rôle actif, brouillons de formulaires) |
| Forms | React Hook Form + Zod |
| Photos | `browser-image-compression` côté client |
| Emails | Resend.io |
| Déploiement | Vercel (frontend) + Supabase Cloud (backend) |
| Tests | Vitest (unit) + Playwright (e2e) + tests RLS dédiés |
| Monitoring | Sentry (erreurs) + PostHog (analytics produit) |

### 23.7 Structure monorepo

```
plume-sav/
├── apps/
│   └── sav/                    # Next.js 14 App Router
│       ├── app/
│       │   ├── (auth)/         # login, select-dashboard
│       │   ├── (client)/       # dashboard client
│       │   ├── (school)/       # dashboard école
│       │   ├── (workshop)/     # dashboard atelier
│       │   └── (plume)/        # dashboard Plume HQ
│       └── ...
├── packages/
│   ├── db/                     # types Supabase générés + helpers + RLS guards
│   ├── ui/                     # shadcn components partagés
│   └── shared/                 # Zod schemas, constants, utils
├── supabase/
│   └── migrations/             # SQL versionné (jamais via dashboard)
├── .claude/
│   ├── agents/                 # architecte-en-chef, sav-builder
│   └── settings.json           # permissions Claude Code
├── CLAUDE.md                   # contexte projet pour Claude
└── package.json
```

Manager de paquets : **pnpm workspaces**. Turborepo si les builds deviennent lents.

### 23.8 Cinq règles non-négociables

1. **Database-first** : `pnpm db:gen-types` régénère `packages/db/types.ts` après chaque migration. Tout est typé. Plus jamais d'`any` dans les requêtes Supabase.

2. **RLS-first** : côté browser et Server Components, toujours le client Supabase user-scoped. La `service_role` UNIQUEMENT dans des Server Actions ou Edge Functions précises avec vérification explicite du rôle. Chaque table a des policies testées pour les 4 rôles (`client`, `school`, `workshop`, `plume_admin`).

3. **Mutations via Server Actions** : pas d'API routes inutiles. Validation Zod à l'entrée. Les forms RHF appellent des Server Actions, pas `fetch()`.

4. **Photos compressées côté client** : avant upload Storage, max 1600px côté long, qualité 0.8. Bucket par contexte (`ticket-photos`, `inspection-photos`, `workshop-photos`).

5. **Realtime ciblé** : subscribe par `ticket_id`, pas globalement. Cleanup au démontage. Optimistic updates pour les messages.

### 23.9 Politique de migrations

**On ne touche JAMAIS la structure de la DB via le dashboard Supabase.** Toutes les modifications de schéma passent par des fichiers SQL versionnés dans `supabase/migrations/` :

- Nommage : `YYYYMMDDHHMMSS_description.sql`
- Application : via le MCP Supabase (`apply_migration`) ou via `supabase db push` localement
- Avantages : rejouable sur staging, traçable dans Git, code review sur le SQL

### 23.10 Stratégie d'agents Claude Code

Deux agents complémentaires dans `.claude/agents/` :

**`architecte-en-chef`** — Mode reviewer/auditor (Opus)
- Invoqué pour : revue avant merge, audit d'un fichier qui dépasse les seuils, décisions d'architecture, audit RLS
- Discipline stricte sur les seuils (taille, complexité, types stricts)
- Ne touche pas au code existant sans validation explicite
- Spécifique stack Plume SAV : RLS, Supabase, Next.js App Router

**`sav-builder`** — Mode constructeur (Sonnet ou Opus selon complexité)
- Invoqué pour : créer une feature de zéro, scaffolder une page, ajouter une route
- Permissif sur la création de fichiers neufs
- Bloqué dès qu'il touche à un fichier existant → repasse en mode validation explicite
- Maîtrise précise de la stack (Server Actions, RLS, RHF + Zod, `@supabase/ssr`)

Workflow type :
1. `sav-builder` crée la feature
2. `architecte-en-chef` audit ce qui vient d'être créé
3. JB valide en review humaine
4. Merge

### 23.11 Skills Claude Code à utiliser

- `engineering:code-review` avant chaque merge
- `engineering:debug` pour les bugs résistants
- `/security-review` avant chaque push (RLS, secrets, injection, OWASP)
- `claude-api` si on intègre du LLM dans le produit (résumé tickets, suggestion de routage école, classification de photos)

### 23.12 Permissions Claude Code

Le fichier `.claude/settings.json` du repo pré-autorise :
- Commandes courantes : `pnpm`, `npx supabase`, `gh`, `git status`, `git diff`, `git log`
- MCP Supabase read-only : `list_*`, `get_*`, `execute_sql` (SELECT uniquement)

Validation manuelle requise pour :
- `git push`, `git push --force`
- `apply_migration` destructive (DROP, ALTER COLUMN, TRUNCATE)
- Toute commande `delete_*` sur le MCP Supabase

### 23.13 Stratégie de tests

| Niveau | Outil | Périmètre |
|---|---|---|
| Unit | Vitest | Utils, hooks, helpers RLS, validation Zod |
| Integration | Vitest + Supabase local | Server Actions complètes (input → DB → output) |
| E2E | Playwright | Parcours critiques : création ticket client, inspection école, diagnostic atelier |
| RLS | Tests dédiés (un par table × par rôle) | Vérification que chaque rôle ne voit que ce qu'il doit voir |

Les tests RLS sont **non négociables** : pour chaque nouvelle table, on teste qu'un client ne peut pas lire les tickets d'un autre client, qu'une école ne voit que ses tickets, etc.

### 23.14 Investigations à faire avant tout code

Avant la première ligne de code de feature, ces 5 points doivent être tranchés :

1. **`wing_repair_conversations` / `wing_repair_messages`** : structure, lien avec quelle entité, à réutiliser ou à abandonner ?
2. **`wing_inspections` / `inspection_photos`** : utilisé pour quoi aujourd'hui, peut-on étendre ou faut-il créer `school_inspections` séparément ?
3. **`user_roles`** : structure, valeurs possibles, comment un user en a plusieurs, RLS actuelles
4. **`service_requests`** : colonnes existantes, RLS, contraintes, FK
5. **`partner_schools`** : structure, FK, lien avec `profiles` / `user_roles`

L'agent `sav-builder` doit lire ces tables (verbose=true) avant de proposer toute migration.

---

## 24. Historique des décisions

| Date | Décision | Contexte |
|---|---|---|
| 2026-04-29 | Site séparé `sav.plumeparagliders.com` | Cycles de mise à jour différents, utilisateurs différents |
| 2026-04-29 | Backend Supabase mutualisé avec le site principal | Pas de projet séparé, économie d'infra et accès aux données existantes (clients, ailes, écoles) |
| 2026-04-29 | Dashboard switcher au login | Un user peut avoir plusieurs rôles (moniteur + client) |
| 2026-04-29 | Stack Next.js 14 App Router + Supabase + Tailwind + shadcn/ui | Standard moderne, type-safe, Server Components |
| 2026-04-29 | Monorepo pnpm workspaces | Plus simple que Turborepo au démarrage, switch possible plus tard |
| 2026-04-29 | Migrations SQL versionnées, jamais via dashboard | Reproductibilité, code review, staging |
| 2026-04-29 | Deux agents Claude Code complémentaires | architecte-en-chef (review) + sav-builder (création) |
