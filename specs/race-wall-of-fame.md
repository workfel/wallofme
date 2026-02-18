# Race Wall of Fame — Page Discover par Course (Race Wall of Fame)

## Objectif

Transformer la page Explore en une expérience de découverte sociale basée sur les courses. Chaque fois qu'un utilisateur scanne un bib ou une médaille d'une course, il rejoint automatiquement le "Wall of Fame" de cette course. Cela crée une compétition naturelle entre athlètes qui ont couru la même épreuve, sans friction de configuration.

## Contexte

L'onglet Explore existe déjà dans l'app mais son contenu est minimal. Le système de courses (`race` table) et les résultats (`race_result` table) existent déjà en base. La plupart des trophées sont déjà associés à des courses via le pipeline de scan. C'est un feature qui exploite les données déjà existantes pour créer une expérience sociale sans infrastructure supplémentaire majeure.

## User Stories

### En tant qu'Utilisateur

1. **Découverte de sa course** : Après avoir scanné ma médaille du Marathon de Paris, je veux voir automatiquement que 47 autres utilisateurs WallOfMe ont aussi terminé cette course.
2. **Comparaison amicale** : Je veux voir les classements des autres finishers de ma course sur WallOfMe pour savoir si j'ai fait mieux ou moins bien qu'eux.
3. **Exploration des courses** : Je veux pouvoir parcourir les courses populaires sur WallOfMe (celles avec le plus de finishers) pour découvrir de nouveaux athlètes.
4. **Visite des rooms** : Depuis un Wall of Fame de course, je veux pouvoir visiter la Pain Cave de n'importe quel finisheur listé.

### En tant que Visiteur (Non connecté)

1. **Découverte sociale** : En arrivant sur l'app via un lien de partage, je veux voir le Wall of Fame de la course de mon ami pour comprendre immédiatement la dimension sociale de l'app.

## Spécifications Fonctionnelles

### 1. Page Explore — Vue principale

**Route** : `/tabs/explore` (existant, à améliorer)

**Layout :**
```
┌─────────────────────────────────────────┐
│  🔍 Rechercher une course...            │  ← search bar
├─────────────────────────────────────────┤
│                                         │
│  🔥 COURSES TENDANCES                   │
│  ┌───────┐ ┌───────┐ ┌───────┐         │
│  │Mara   │ │UTMB   │ │Ironman│         │  ← horizontal scroll
│  │Paris  │ │2024   │ │Nice   │         │
│  │47 🏃  │ │12 🏃  │ │8 🏃   │         │
│  └───────┘ └───────┘ └───────┘         │
│                                         │
│  📅 COURSES RÉCENTES (tes sports)       │
│  ┌──────────────────────────────────┐   │
│  │ Marathon de Paris 2024      47 🏃│   │  ← liste verticale
│  │ Trail Ventoux 2024          12 🏃│   │
│  │ Ironman 70.3 Nice 2024       8 🏃│   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Données affichées par course :**
- Nom de la course
- Date
- Sport (icon + couleur)
- Nombre de finishers WallOfMe (`finisherCount`)
- Si l'utilisateur connecté a scanné cette course : badge "✓ Tu as couru ça"

**Filtrage** :
- Par défaut : filtré sur les sports de l'utilisateur (from `user.sports`)
- Toggle : "Tous les sports" vs "Mes sports"
- Recherche textuelle sur `race.name`

### 2. Page Wall of Fame d'une Course

**Route** : `/race/:raceId/wall-of-fame` (nouveau)

**Header :**
- Nom de la course
- Date + lieu
- `X finishers sur WallOfMe`
- Si l'utilisateur a couru cette race : bannière "🏆 Tu es dans ce Wall of Fame !"

**Liste des Finishers :**
```
┌─────────────────────────────────────────┐
│ 1. [Avatar] Johan P.        1:23:45 ★  │  ← ★ = Pro avec stats vérifiées
│    🏆 Pain Cave · 12 médailles          │
│    [Voir sa room →]                     │
├─────────────────────────────────────────┤
│ 2. [Avatar] Marie L.        1:31:20    │
│    🏆 Pain Cave · 8 médailles           │
│    [Voir sa room →]                     │
├─────────────────────────────────────────┤
│ ...                                     │
└─────────────────────────────────────────┘
```

**Tri disponible :**
- Par temps de course (croissant) — par défaut si données disponibles
- Par nombre de trophées dans la room
- Par nombre de likes de la room

**Données affichées par finisher :**
- Avatar (ou initiales)
- Prénom + initiale du nom
- Temps officiel (si `race_result.time` disponible et `result.source !== 'manual'` OU si Pro a validé)
- Nombre de trophées dans la room
- Bouton "Voir sa room" → `/room/:userId`

**Confidentialité des temps :**
- Les temps ne sont affichés que si l'utilisateur les a renseignés via le scan (pas de `source = 'manual'` sauf si l'utilisateur Pro a un percentile validé).
- Jamais de classement inventé.

### 3. Backend — Nouveaux endpoints

**GET `/api/races`** (existant, à enrichir)
- Ajouter `finisherCount` (COUNT des race_results liés)
- Ajouter `userHasRun` (boolean, si utilisateur connecté a un result sur cette race)
- Filtrage par `sport[]` array (query param)
- Pagination standard

**GET `/api/races/:id/wall-of-fame`** (nouveau)
- Retourne la liste des utilisateurs ayant un `race_result` pour cette race
- Chaque entrée : `{ userId, displayName, avatarUrl, time, trophyCount, roomLikes, roomSlug }`
- Tri par temps (croissant) si temps disponible, sinon par trophyCount
- Pagination : 20 par page
- Public (pas d'auth requise) mais enrichi si connecté (`isMe` flag)

**GET `/api/races/trending`** (nouveau)
- Top 10 courses avec le plus de `finisherCount` sur les 30 derniers jours
- Cacheable (TTL 1h)

### 4. Intégration avec le flow de scan

Après validation d'un trophée (`POST /scan/validate`) :
- Si la race a déjà d'autres finishers WallOfMe → afficher une notification inline sur l'écran "done" :
  - "🔥 44 autres athlètes ont aussi terminé le Marathon de Paris ! Voir le Wall of Fame →"
- Ce CTA redirige vers `/race/:raceId/wall-of-fame`.
- C'est un hook social fort : l'utilisateur découvre la communauté au moment de sa plus grande fierté.

### 5. Profil Public — Section "Courses Partagées"

Sur le profil public (`/profile/:userId`) :
- Ajouter une section "Courses" listant les races de cet utilisateur.
- Chaque course est cliquable → `/race/:raceId/wall-of-fame`.
- Aide la découverte croisée : si je visite le profil d'un ami, je vois ses courses et je peux rejoindre les Wall of Fame communs.

## Scénarios de Test

| Scénario | Comportement Attendu |
|---|---|
| Utilisateur scanne Marathon de Paris | Après validation, notification "44 autres athlètes" affichée |
| Clic sur notification Wall of Fame | Redirige vers `/race/:raceId/wall-of-fame` |
| Wall of Fame d'une course avec 0 finisher | Page d'état vide : "Sois le premier finisher WallOfMe !" |
| Tri par temps sur wall of fame | Ordre croissant par `race_result.time`, null en dernier |
| Recherche "marathon" dans explore | Toutes les races contenant "marathon" dans le nom |
| Toggle "mes sports" activé | Seulement les courses du sport de l'utilisateur |
| Visiteur non connecté | Wall of Fame visible, CTA "Crée ta Pain Cave" en bas |

## Impact Attendu

- Engagement : les athlètes qui ont couru les mêmes courses s'entre-découvrent naturellement.
- Rétention : la comparaison amicale des temps donne une raison de revenir.
- Viralité : les utilisateurs partagent les Wall of Fame de leurs courses avec leurs partenaires d'entraînement ("Tu es aussi dans le Wall of Fame de l'UTMB !").
- Données : exploite les données `race` + `race_result` déjà existantes sans infrastructure supplémentaire.
