# Amélioration UX des Séries Quotidiennes (Daily Streaks)

## Objectif

Rendre la fonctionnalité de "Daily Streaks" (Séries de connexion) plus visible et excitante pour maximiser la rétention quotidienne. Actuellement, elle est cachée et les utilisateurs ne savent pas qu'elle existe.

## User Stories

### En tant qu'Utilisateur

1.  **Visibilité Immédiate** : Dès que j'ouvre l'application, je veux savoir si j'ai validé ma journée ou si je dois faire une action.
2.  **Feedback Gratifiant** : Je veux une animation ou une pop-up "Claim" (Réclamer) satisfaisante lorsque je gagne mon bonus quotidien.
3.  **Compréhension** : Je veux voir ma progression (ex: "Jour 3/7") et savoir quel est le gros lot si je tiens la semaine.

## Spécifications Fonctionnelles

### 1. Composant "Streak" sur la Home

- Déplacer l'indicateur de Streak **tout en haut** de la page d'accueil (Dashboard), à côté du solde de Tokens.
- Icône "Flamme" 🔥 avec le nombre de jours.
- État : "Validé aujourd'hui" (Flamme allumée) vs "Pas encore validé" (Flamme grise ou clignotante).

### 2. Modal de Connexion Quotidienne (Daily Reward Pop-up)

- À la première ouverture de l'app de la journée :
  - Afficher une belle Modale ou Bottom Sheet.
  - Titre : "Bonus Quotidien !".
  - Animation : Une pièce qui tourne ou un coffre qui s'ouvre.
  - Bouton : "Réclamer 50 Tokens".
  - Afficher la frise de la semaine pour montrer que dans 3 jours, le gain est plus gros (ex: "Jour 7 = Objet Rare").

### 3. Notification de Rappel

- Si l'utilisateur ne s'est pas connecté à 20h, envoyer une notif : "Ne perds pas ta flamme ! Connecte-toi maintenant pour garder ta série de 5 jours."

---

Analyse bien tout, et surtout hésites pas a mes poser des questions pour affiner le besoin et avoir une UX optimale.
