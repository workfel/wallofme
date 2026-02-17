# Forcer la Création du Premier Trophée (Force First Trophy)

## Objectif

S'assurer que chaque nouvel utilisateur vit le moment "WOW" de l'application — sa médaille en 3D dans sa Pain Cave — avant d'avoir accès au reste de l'app. C'est le moment de rétention #1 : un utilisateur qui a placé son premier trophée a une raison de revenir.

## Problème Actuel

La page `/trophy/first` (affichée après onboarding) propose un bouton "Skip" qui permet à l'utilisateur de contourner la création du premier trophée. Un utilisateur qui skip arrive sur une room 3D vide, ce qui est l'opposé d'une première impression mémorable. Il n'y a aucune incitation à revenir.

## User Stories

### En tant que Nouvel Utilisateur

1. **Engagement forcé** : Après avoir complété mon onboarding, je veux être guidé directement vers la création de mon premier trophée sans possibilité de passer à côté, afin de vivre immédiatement la magie de l'appli.
2. **Sentiment d'accomplissement** : Après avoir scanné ma première médaille/dossard et l'avoir vue apparaître dans ma Pain Cave 3D, je veux ressentir la fierté de l'avoir construite moi-même.
3. **Incitation au partage immédiat** : À la fin de la création de mon premier trophée, je veux avoir un CTA clair pour partager ma room avec mes amis.

### En tant que Product Owner

1. **Conversion onboarding → first trophy** : Je veux que 100% des utilisateurs qui finissent l'onboarding créent au moins 1 trophée avant de pouvoir accéder à la home page.
2. **Métriques claires** : Je veux pouvoir mesurer le taux de drop-off à chaque étape du flow de création du premier trophée.

## Spécifications Fonctionnelles

### 1. Suppression du bouton "Skip" sur `/trophy/first`

- Retirer le bouton "Skip" de la page `first-trophy.page.ts`.
- Remplacer par une expérience immersive avec un seul CTA : **"Scanner ma première médaille"**.
- Si l'utilisateur appuie sur le bouton retour (système), afficher une modale de confirmation :
  - Titre : "Tu es sûr ?"
  - Message : "Ta Pain Cave t'attend. Scanne ta première médaille maintenant, ça prend moins de 2 minutes."
  - Bouton primaire : "Continuer le scan"
  - Bouton secondaire (destructif, discret) : "Passer pour l'instant" — redirige vers home uniquement si confirmé.

### 2. Amélioration visuelle de la page `/trophy/first`

- Afficher un **rendu statique animé** d'une Pain Cave avec quelques trophées génériques (screenshot ou image pré-rendue) pour montrer l'objectif final.
- Titre motivant : "Ta Pain Cave t'attend. Commence par scanner ta première médaille."
- Sous-titre : "En moins de 2 minutes, ta médaille sera en 3D."
- Indicateur : "Étape 1/1 pour débloquer ta room."

### 3. Guard de navigation post-onboarding

- Créer un **`firstTrophyGuard`** Angular qui vérifie si l'utilisateur possède au moins 1 trophée avec `status = 'ready'`.
- Si l'utilisateur n'a pas de trophée prêt et n'a pas encore vu la page `/trophy/first`, le guard redirige vers `/trophy/first` au lieu de `/tabs/home`.
- Le flag `hasSeenFirstTrophyPrompt` (stocké en `localStorage` ou dans le profil user) est mis à `true` uniquement après confirmation explicite de skip ou après création réussie — pas simplement en visitant la page.
- **Exception** : Si l'utilisateur a déjà des trophées (ex: re-connexion après réinstall), ne pas afficher la page.

### 4. Fin du flow premier trophée — Moment de célébration

Après la phase "done" du pipeline de création (`trophy-creation.page.ts`), si c'est le **premier trophée** de l'utilisateur :

- Afficher un écran de célébration spécial (distinct de l'écran "done" standard) :
  - Confettis animés (Lottie ou CSS keyframes).
  - Titre : "🏆 Ta Pain Cave prend vie !"
  - Message : "Tu viens de créer ton premier trophée. Il est maintenant dans ta room."
  - CTA primaire : "Voir ma room" → redirige vers `/tabs/home`.
  - CTA secondaire : "Partager" → déclenche le flow de partage gamifié (voir `gamified_sharing.md`).

### 5. Détection "premier trophée"

- Un trophée est considéré comme "premier" si c'est le seul trophée avec `status = 'ready'` pour cet utilisateur au moment de la validation.
- Cette détection se fait côté frontend via le `TrophyService` (count des trophées `ready` avant la validation).
- Pas de changement backend requis.

## Scénarios de Test

| Scénario | Comportement Attendu |
|---|---|
| Nouvel utilisateur finit l'onboarding | Redirigé vers `/trophy/first` (pas de Skip visible) |
| Utilisateur clique "retour" sur `/trophy/first` | Modale de confirmation affichée |
| Utilisateur confirme le skip | Redirigé vers home, flag `hasSeenFirstTrophyPrompt = true` |
| Utilisateur crée son premier trophée | Écran de célébration avec confettis |
| Utilisateur existant avec trophées se reconnecte | `/trophy/first` jamais affiché |
| Utilisateur ré-installe l'app (trophées existants en BDD) | Guard détecte les trophées existants, pas de redirection |

## Impact Attendu

- Augmentation du taux d'activation (onboarding → first trophy) de ~40% estimé.
- Augmentation de la rétention J+1 (un utilisateur avec une room meublée a une raison de revenir).
- Augmentation du partage organique (le moment de célébration est le meilleur moment pour déclencher le partage).
