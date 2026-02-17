# Paywall Stats de Course — "Débloquer mes résultats complets" (Stats Paywall)

## Objectif

Monétiser la fonctionnalité de recherche AI des résultats officiels de course en affichant les données partielles aux utilisateurs gratuits et en invitant à passer Pro pour voir le classement complet et le percentile estimé. Convertir à l'instant de plus grande émotion : juste après que l'IA ait trouvé les résultats officiels.

## Contexte Technique

Le pipeline de scan (`POST /scan/search-results`) effectue déjà une recherche web AI pour extraire les données officielles d'une course : temps de passage, classement général, classement catégorie, nombre de participants. Ces données sont **disponibles mais montrées librement** à tous les utilisateurs, sans friction. Ce spec ajoute une couche de valeur perçue et un paywall au bon moment.

**Important — Fiabilité des données** : Le scraping web ne fonctionne pas à 100%. Les données retournées peuvent contenir des erreurs. Toute donnée affichée doit être clairement présentée comme une **estimation** basée sur des sources publiques, avec un disclaimer légal permanent.

## User Stories

### En tant qu'Utilisateur Gratuit

1. **Teaser émotionnel** : Après que l'IA ait cherché mes résultats officiels, je veux voir que des données ont été trouvées et avoir un aperçu partiel (mon temps) pour savoir que la fonctionnalité a fonctionné.
2. **Curiosité déclenchée** : Je veux voir que mon classement et mon percentile existent mais sont masqués, pour avoir envie de les débloquer.
3. **Honnêteté** : Je veux être informé clairement que ces données sont des estimations et peuvent contenir des erreurs, afin de ne pas être induit en erreur.

### En tant qu'Utilisateur Pro

1. **Résultats complets** : Je veux voir mon classement général, mon classement catégorie, mon nombre de participants et mon percentile estimé.
2. **Percentile partageable** : Je veux voir ma performance exprimée en percentile (ex: "~Top 8%") car c'est plus parlant et fier à partager que mon numéro de classement brut.
3. **Transparence** : Je veux voir un indicateur `~` (approximatif) devant mes stats pour savoir que ces données viennent d'un scraping et peuvent ne pas être parfaitement exactes.

### En tant que Product Owner

1. **Trigger de conversion** : Je veux que le paywall se déclenche au moment de plus grande émotion (résultats trouvés) pour maximiser les conversions vers Pro.
2. **Protection légale** : Je veux que toutes les données de classement soient clairement labellisées "estimées" avec un disclaimer visible et permanent.

## Spécifications Fonctionnelles

### 1. Conditions d'Affichage du Bloc Stats

Le bloc "stats paywall" **ne doit s'afficher que si toutes les conditions suivantes sont remplies** :

```
searchResult.found === true
&& ranking !== null
&& totalParticipants !== null
&& ranking > 0
&& totalParticipants > 0
&& ranking <= totalParticipants   // sanity check : le classement doit être cohérent
```

Si une condition échoue → affichage du formulaire standard (comportement actuel). Aucun percentile inventé ou affiché sans données valides.

### 2. Calcul du Percentile

Calcul côté frontend uniquement, jamais en backend :

```typescript
const percentile = Math.round((ranking / totalParticipants) * 100);
// Affichage : "~Top {percentile}%"
// Exemple : ranking=542, totalParticipants=6847 → "~Top 8%"
```

Cas limites :
- `percentile = 0` (top 0%) → afficher `"~Top 1%"` (arrondir au minimum à 1)
- `percentile > 99` → afficher `"~Top 99%"` (ne jamais afficher "Top 100%")
- Toujours utiliser le signe `~` devant le pourcentage

### 3. Affichage pour Utilisateur Gratuit (Non-Pro)

Dans le composant `trophy-results-search.component.ts`, après le `searchResult.found === true` et si les conditions du §1 sont remplies :

**Bloc "Stats Preview" :**
```
┌─────────────────────────────────────────┐
│  ✓ Résultats officiels trouvés          │
│                                         │
│  ⏱ Temps       1:23:45                 │  ← visible (donnée de base)
│                                         │
│  🏆 Classement  ▓▓▓ / ▓▓▓▓  🔒         │  ← flouté + cadenas
│  📊 Catégorie   ▓▓ / ▓▓▓    🔒         │  ← flouté + cadenas
│  ⭐ Percentile  ~Top ▓▓%     🔒         │  ← flouté + cadenas
│                                         │
│  [ Débloquer mes résultats complets ]   │  ← bouton Pro
│                                         │
│  * Estimation basée sur données         │
│    publiques. Peut contenir des         │  ← disclaimer permanent
│    erreurs.                             │
└─────────────────────────────────────────┘
```

Détails techniques :
- Le flou CSS s'applique sur les valeurs : `filter: blur(6px); user-select: none;`
- Les valeurs floutées sont des chaînes aléatoires plausibles (ex: `"347"`, `"2541"`) — **jamais les vraies valeurs** pour éviter que le blur soit contourné via le DOM.
- Le bouton "Débloquer" ouvre la bottom sheet Pro (`/pro`).

### 4. Affichage pour Utilisateur Pro

Affichage complet et non flouté :

```
┌─────────────────────────────────────────┐
│  ✓ Résultats officiels trouvés          │
│                                         │
│  ⏱ Temps        1:23:45                │
│  🏆 Classement   ~#542 / 6 847          │
│  📊 Catégorie    ~#12 / 891             │
│  ⭐ Percentile   ~Top 8%                │
│                                         │
│  * Estimation basée sur données         │
│    publiques. Peut contenir des erreurs.│
└─────────────────────────────────────────┘
```

Détails :
- Le signe `~` est présent devant **toutes** les valeurs de classement (pas devant le temps, qui est plus fiable).
- Les milliers sont formatés avec des espaces (6 847) pour la lisibilité.

### 5. Disclaimer Légal — Texte Exact

Le disclaimer doit être présent à **deux endroits** :

**Inline (sous les stats — obligatoire) :**
> *Estimation basée sur des données publiques. Les résultats peuvent différer des données officielles.*

**Dans les CGU / page Paramètres (une fois, permanent) :**
> *Les estimations de résultats de course sont extraites automatiquement de sources publiques via analyse IA. WallOfMe ne garantit pas l'exactitude de ces données et ne peut être tenu responsable d'éventuelles erreurs ou différences avec les résultats officiels.*

### 6. Affichage dans la Trophy Detail Page (`/trophy/:id`)

Même logique que pendant la création :
- Utilisateur gratuit : temps visible, classement/percentile floutés + CTA Pro.
- Utilisateur Pro : tout visible avec `~` devant les valeurs de classement.
- Si les données `ranking` / `totalParticipants` sont null → aucun bloc stats affiché (pas de percentile vide).

### 7. Badge Percentile sur le Trophy Frame dans la Room

Si Pro + données valides + percentile ≤ 20% (seuil configurable, top performers seulement) :
- Afficher un petit badge `"~Top X%"` sur le trophy frame dans la Pain Cave 3D.
- Badge visible par les visiteurs de la room (public + share).
- Effet aspirationnel : les visiteurs voient des badges sur les trophées des autres et veulent les leurs.
- Voir spec dédiée : `trophy-percentile-badge.md`.

## Scénarios de Test

| Scénario | Comportement Attendu |
|---|---|
| AI ne trouve pas de résultats (`found=false`) | Formulaire manuel standard, aucun percentile |
| AI trouve résultats mais `ranking=null` | Temps affiché si disponible, pas de bloc percentile |
| AI trouve `ranking > totalParticipants` | Sanity check échoue → formulaire standard |
| Utilisateur gratuit, données valides | Temps visible, classement flouté, bouton Pro |
| Utilisateur Pro, données valides | Tout visible avec `~`, disclaimer présent |
| `ranking=1`, `totalParticipants=100` | Percentile affiché : "~Top 1%" (pas "Top 0%") |
| Utilisateur clique "Débloquer" | Bottom sheet Pro s'ouvre |
| Utilisateur Pro clique "Retry" (new search) | Mêmes règles d'affichage s'appliquent aux nouvelles données |

## Impact Attendu

- Conversion Free → Pro au moment de plus haute intention (résultats de course trouvés).
- Protection légale grâce au disclaimer systématique sur toutes les données scrapées.
- Valeur perçue du tier Pro augmentée (feature concrète et émotionnelle).
