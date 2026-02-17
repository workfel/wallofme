# Partage Gamifié (Gamified Sharing)

## Objectif

Encourager le partage spontané sur les réseaux sociaux (Instagram, Strava, WhatsApp) en récompensant l'utilisateur pour cette action.

## User Stories

### En tant qu'Utilisateur

1.  **Incitation** : Je veux savoir que si je partage ma nouvelle médaille sur Instagram, je gagne quelque chose.
2.  **Facilité** : Je veux que l'image générée pour le partage soit déjà au bon format (Story 9:16 ou Post Carré 1:1) et qu'elle soit belle (pas juste une capture d'écran floue).
3.  **Génération d'Asset** : Je veux que l'image contienne mon nom, le temps de ma course, et le rendu 3D de ma médaille.

## Spécifications Fonctionnelles

### 1. Bouton "Share to Earn"

- Après la création d'un trophée (moment de fierté), afficher un écran : "Partage ta réussite !".
- Mentionner : "Gagne 50 Tokens en partageant".

### 2. Génération d'Image (Sharp / Canvas)

- Le système doit générer une image composite propre.
- Fond : Une couleur ou texture sympa (celle de la room).
- Centre : Le Trophée 3D (Rendu 2D).
- Texte : "Finisher - [Nom de la Course] - [Temps]".
- Branding : Logo WallOfMe discret + QR Code vers la room.

### 3. Vérification du Partage

- _Techniquement difficile de vérifier un partage externe (Instagram API fermé)._
- **Solution pragmatique** : Récompenser l'action de cliquer sur "Partager" (via `navigator.share`) et de revenir dans l'app. On fait confiance à l'utilisateur (pour l'instant) pour éviter la frustration technique. Limiter à 1 récompense par trophée.

---

Analyse bien tout, et surtout hésites pas a mes poser des questions pour affiner le besoin et avoir une UX optimale.
