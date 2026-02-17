# Partage vers Instagram Stories — "Share my Pain Cave" (Instagram Stories Share)

## Objectif

Permettre aux utilisateurs de partager un screenshot formaté de leur Pain Cave (ou d'un trophée spécifique) directement vers Instagram Stories, WhatsApp, et autres apps sociales en un seul tap. C'est le mécanisme de croissance organique #1 : chaque partage expose l'app à des dizaines de nouveaux athlètes potentiels.

## Problème Actuel

La fonctionnalité "Partager une capture" existe dans l'édition de la room, mais elle est **cassée** (erreur "impossible d'envoyer un message vide") et peu découvrable. Il n'y a pas de format optimisé pour Instagram Stories (9:16), pas de branding intégré, et aucune récompense pour inciter à partager.

## User Stories

### En tant qu'Utilisateur

1. **Partage en 1 tap** : Après avoir créé un trophée ou depuis ma home page, je veux partager une image de ma Pain Cave vers Instagram Stories en 1 seul tap, sans quitter l'app.
2. **Image belle et formatée** : Je veux que l'image générée soit au format Story (9:16), contienne mon trophée en 3D, mes stats si je suis Pro, et un branding discret de l'app.
3. **Partage récompensé** : Je veux gagner des tokens en partageant, pour avoir une raison supplémentaire de le faire.
4. **Partage depuis plusieurs points** : Je veux pouvoir partager depuis l'écran de création (juste après validation), depuis la home, ou depuis mon profil.

### En tant que Visiteur qui reçoit un partage

1. **Curiosité déclenchée** : En voyant la story de mon ami avec sa Pain Cave, je veux voir un lien ou un QR code pour créer la mienne.
2. **Contexte immédiat** : Je veux comprendre en 2 secondes ce qu'est l'application ("Ta Pain Cave d'athlète en 3D").

## Spécifications Fonctionnelles

### 1. Points de déclenchement du partage

Le partage peut être déclenché depuis **3 endroits** :

**A) Après création d'un trophée** (priorité #1 — moment de fierté)
- Sur l'écran de célébration du premier trophée (voir `force-first-trophy.md`).
- Sur l'écran "done" standard de la création de trophée.
- CTA : "Partager ma réussite 🏆 → +50 tokens".

**B) Depuis la Home Page**
- Bouton "Partager ma room" dans le menu ou en floating button secondaire.
- CTA : "Partager ma Pain Cave".

**C) Depuis la Room Edit Page**
- Correction du bug existant + amélioration du bouton "Partager une capture".

### 2. Génération de l'image de partage

**Format Story (9:16, 1080x1920px) :**

```
┌──────────────────────────────────┐
│                                  │
│       [Fond : couleur/texture    │
│        du thème actuel de room]  │
│                                  │
│    ┌────────────────────────┐    │
│    │                        │    │
│    │   [Screenshot 3D du    │    │  ← Capture HTML2Canvas ou
│    │    trophée ou de la    │    │    image pré-rendue du trophée
│    │    room entière]       │    │
│    │                        │    │
│    └────────────────────────┘    │
│                                  │
│   [Nom de la course]             │  ← ex: "Marathon de Paris 2024"
│   [Temps si disponible]          │  ← ex: "1:23:45"
│   [Percentile si Pro + valide]   │  ← ex: "~Top 8% 🔥"
│                                  │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│   [Logo WallOfMe]  wallofme.app  │  ← Branding discret en bas
└──────────────────────────────────┘
```

**Génération technique :**
- Utiliser `html2canvas` ou une approche HTML/CSS export vers PNG pour capturer un composant Angular dédié.
- Composant `ShareCardComponent` — rendu hors-écran (off-screen rendering) pour ne pas perturber l'UI.
- Le composant reçoit en input : `trophyImageUrl`, `raceName`, `time`, `percentile` (optionnel, seulement si Pro + données valides), `roomThemeColor`.

**Format Post Carré (1:1, optionnel, pour plus tard) :**
- Variante plus compacte pour les posts Instagram classiques.
- Même contenu mais centré.

### 3. Mécanisme de partage natif

```typescript
// Capacitor Share API
await Share.share({
  title: 'Ma Pain Cave — WallOfMe',
  text: 'Je construis ma Pain Cave d\'athlète 🏆 Crée la tienne sur wallofme.app',
  url: `https://wallofme.app/room/share/${roomSlug}`,
  files: [imagePath],  // chemin local vers l'image générée
  dialogTitle: 'Partager ma Pain Cave',
});
```

- Sur **iOS** : ouvre le share sheet natif (Instagram Stories détecte automatiquement l'image 9:16).
- Sur **Android** : ouvre le share sheet natif.
- Sur **Web** : `navigator.share()` avec fallback vers copie du lien dans le clipboard.
- **Correction bug actuel** : s'assurer que `files` est toujours un tableau non vide, et `text` non vide même sans story.

### 4. Récompense tokens pour partage

- Chaque partage récompense **50 tokens**, limité à **1 récompense par trophée** (pas par jour).
- Le flag est stocké côté backend : `token_transaction` avec `referenceType = 'share_trophy'` et `referenceId = trophyId`.
- Vérification idempotente : si l'utilisateur a déjà partagé ce trophée, pas de double récompense (mais le partage fonctionne quand même).
- **Vérification pragmatique** : la récompense est accordée au moment où l'utilisateur clique "Partager" et que le share sheet s'ouvre (on ne peut pas vérifier qu'il a effectivement posté sur Instagram). On fait confiance à l'utilisateur.
- Toast de confirmation : "🎉 +50 tokens pour ton partage !"

**Nouveau endpoint backend :**
`POST /api/trophies/:id/share` (auth) → vérifie si déjà récompensé, crédite 50 tokens, retourne le nouveau solde.

### 5. Branding et lien de retour

- L'image générée inclut toujours le logo WallOfMe + URL `wallofme.app` (ou lien deep link).
- Si l'utilisateur a un referral code actif, l'URL dans la story peut être `wallofme.app/invite/{referralCode}` pour combiner partage + referral.
- Le lien pointe vers la room publique de l'utilisateur (`/room/share/{slug}`).

### 6. Gestion des cas sans trophée / sans image

- Si le trophée n'a pas d'image processée (`textureUrl = null`) : utiliser une image placeholder générique au format du sport (médaille running, etc.).
- Si c'est un partage de room entière sans trophées : afficher la room vide avec un texte "Je construis ma Pain Cave 🏗️".
- Si le share sheet ne s'ouvre pas (erreur Capacitor) : fallback → copie du lien de la room dans le clipboard + toast "Lien copié !".

## Scénarios de Test

| Scénario | Comportement Attendu |
|---|---|
| 1er partage d'un trophée | Share sheet ouvre + 50 tokens crédités + toast |
| 2ème partage du même trophée | Share sheet ouvre, pas de tokens supplémentaires, pas de toast |
| Partage sur web (`navigator.share`) | Share sheet web OU clipboard fallback |
| Image trophée non disponible | Placeholder générique utilisé |
| `files` array vide (bug actuel) | Fallback vers partage texte + URL uniquement |
| Utilisateur Pro avec percentile valide | Percentile `~Top X%` visible sur l'image générée |
| Utilisateur Free | Percentile absent de l'image (non exposé même sur l'image) |

## Impact Attendu

- Correction du bug bloquant existant (partage cassé).
- Chaque story partagée = exposition organique à ~200-500 followers d'un athlète.
- Combinaison partage + referral code dans l'URL → loop de croissance virale.
- Récompense tokens → incitation concrète à partager plusieurs trophées.
