# Badge Percentile sur les Trophées 3D (Trophy Percentile Badge)

## Objectif

Afficher un petit badge "~Top X%" sur les frames de trophées dans la Pain Cave 3D, visible par tous les visiteurs de la room. Ce badge est à la fois un signal de statut social pour l'owner, et un élément aspirationnel pour les visiteurs — ils voient la performance chiffrée de l'athlète et veulent la même chose sur leurs propres trophées.

## Contexte

Ce spec est une extension de `stats-paywall.md`. Le calcul du percentile est déjà défini dans ce spec. Ici, on spécifie comment ce percentile est **affiché dans le rendu 3D** de la room et visible publiquement.

## User Stories

### En tant qu'Utilisateur Pro

1. **Fierté visible** : Je veux que mes meilleurs résultats soient visibles sur mes trophées dans ma Pain Cave, pour que les visiteurs voient directement ma performance sans avoir à cliquer.
2. **Distinction** : Je veux que le badge soit visuellement distinct et élégant, pas un simple texte brut collé sur une image.

### En tant que Visiteur de la Room

1. **Admiration et curiosité** : Quand je visite la room d'un athlète et que je vois "~Top 3% 🔥" sur sa médaille d'Ironman, je veux savoir comment j'obtiens ça pour mes propres médailles.
2. **Aspiration** : Je veux comprendre que ce badge vient de la fonctionnalité Pro de l'app, ce qui me donne envie de passer Pro.

### En tant que Product Owner

1. **Viralité passive** : Chaque visiteur de room qui voit un badge percentile est exposé à une preuve sociale de la valeur Pro → conversion indirecte.

## Spécifications Fonctionnelles

### 1. Conditions d'affichage du badge

Le badge "~Top X%" n'est affiché sur le trophée 3D **que si toutes les conditions suivantes sont remplies** :

```
trophy.raceResult !== null
&& trophy.raceResult.ranking !== null
&& trophy.raceResult.totalParticipants !== null
&& trophy.raceResult.ranking > 0
&& trophy.raceResult.totalParticipants > 0
&& trophy.raceResult.ranking <= trophy.raceResult.totalParticipants
&& user.isPro === true              // badge uniquement pour les Pros
&& percentile <= 30                 // seulement les performances notables (top 30% max)
```

**Seuil de 30%** : Un athlète dans le top 30% mérite d'afficher son badge. Au-delà, le badge perd son caractère distinctif. Ce seuil est configurable (constante dans le code).

### 2. Calcul du percentile (identique à stats-paywall.md)

```typescript
const percentile = Math.max(1, Math.round((ranking / totalParticipants) * 100));
// Affichage : "~Top {percentile}%"
```

### 3. Rendu visuel du badge dans la scene 3D

**Implémentation** : Le badge n'est pas un objet 3D natif mais un **overlay HTML2D** positionné par-dessus le canvas 3D, aligné sur la position projetée du trophy frame dans le canvas.

**Ou alternative** : Une texture 2D générée dynamiquement (canvas HTML) appliquée comme overlay sur le mesh du frame.

**Design du badge :**
```
┌─────────────────┐
│  🔥 ~Top 8%     │  ← fond glassmorphism semi-transparent
└─────────────────┘
```

- Fond : `rgba(0, 0, 0, 0.6)` avec `border-radius: 8px` et `backdrop-filter: blur(4px)`
- Couleur de texte selon la tier du percentile :
  - `≤ 5%` : `#FFD700` (or) + 🔥
  - `6% - 15%` : `#C0C0C0` (argent) + ⭐
  - `16% - 30%` : `#CD7F32` (bronze) + ✨
- Police : bold, 10-12px, en majuscules
- Taille : petit (environ 60px de large), pour ne pas masquer la photo du trophée

### 4. Position dans la scene 3D

Le badge doit être positionné **en bas à droite** du frame du trophée dans la vue 3D.

**Approche avec Angular Three (angular-three) :**
- Utiliser un sprite 3D (`THREE.Sprite`) ou un plane avec texture canvas, attaché comme enfant du mesh du trophy frame.
- La texture est générée via un `OffscreenCanvas` avec le texte rendu dessus.
- Le sprite fait face à la caméra (`billboard` behavior — toujours orienté vers la caméra).

**Fallback HTML overlay :**
Si l'intégration 3D est trop complexe pour cette itération, utiliser des overlays HTML positionnés via projection 3D→2D :
1. À chaque frame de rendu, calculer la position 2D du trophée dans le canvas (`vector.project(camera)` → coordonnées CSS).
2. Positionner le badge HTML absolument par rapport au canvas.
3. Masquer si le trophée est hors-champ ou derrière un objet.

### 5. Visibilité publique

- Le badge est **visible par tous les visiteurs** de la room (room edit, room view, room share public).
- Il ne s'affiche que si `user.isPro === true` — les visiteurs voient donc les badges uniquement sur les rooms d'utilisateurs Pro.
- Sur la room d'un utilisateur free, même si des données de ranking existent, le badge ne s'affiche pas → incitation à passer Pro.

### 6. Interaction au clic/tap

Quand un visiteur tape sur un badge percentile dans la room :
- Ouvrir la bottom sheet du trophée (comportement existant).
- Dans la bottom sheet, afficher la stat mise en avant : "~Top 8% des finishers" en grand, avec le disclaimer `*estimation`.
- Si visiteur non-Pro qui consulte la room d'un Pro : afficher en bas de la sheet un CTA "Affiche tes stats sur tes trophées → Passer Pro".

### 7. Disclaimer sur le badge

Le badge lui-même ne contient pas le disclaimer (trop petit). Le disclaimer apparaît :
- Dans la bottom sheet du trophée quand l'utilisateur clique dessus.
- Texte : *"Estimation basée sur des données publiques. Peut différer des résultats officiels."*

## Scénarios de Test

| Scénario | Comportement Attendu |
|---|---|
| User Pro, ranking=10/200 (top 5%) | Badge or 🔥 "~Top 5%" affiché |
| User Pro, ranking=100/200 (top 50%) | Percentile=50%, au-delà du seuil → badge non affiché |
| User Free, ranking valide | Badge non affiché (Pro uniquement) |
| ranking > totalParticipants | Sanity check échoue → badge non affiché |
| ranking = null | Badge non affiché |
| Visiteur tape sur le badge | Bottom sheet avec stats + disclaimer + CTA Pro si visiteur free |
| Room partagée publiquement | Badge visible même pour visiteurs non connectés |

## Dépendances

- `stats-paywall.md` : définit les conditions de validité des données et le calcul du percentile
- `force-first-trophy.md` : le badge donne de la valeur aspirationnelle au premier trophée créé

## Impact Attendu

- Chaque visiteur de room voit une preuve tangible de la valeur Pro.
- Le badge "~Top 3% 🔥" sur une médaille d'Ironman est un élément de statut social fort dans la communauté des athlètes.
- Conversion passive des visiteurs free en Pro via la désirabilité du badge.
