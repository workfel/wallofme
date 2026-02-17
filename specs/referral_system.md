# Système de Parrainage (Referral System)

## Objectif

Créer une boucle de croissance virale en incitant les utilisateurs actuels à inviter leurs amis sportifs. Le système doit être "Gagnant-Gagnant" : le parrain gagne des tokens, et le filleul reçoit un bonus de bienvenue.

## User Stories

### En tant que Parrain (Utilisateur Actuel)

1.  **Accès Facile** : Je veux voir un bouton "Inviter un ami" bien visible dans mon profil et potentiellement sur la page d'accueil (Dashboard).
2.  **Partage** : En cliquant, je veux utiliser le système de partage natif de mon téléphone (SMS, WhatsApp, etc.) avec un message pré-rempli sympa et un lien unique.
3.  **Suivi** : Je veux voir combien d'amis j'ai invités et combien de tokens j'ai gagnés grâce à eux.
4.  **Récompense** : Je veux recevoir une notification Push gratifiante quand mon ami s'inscrit et valide son premier trophée.

### En tant que Filleul (Nouvel Utilisateur)

1.  **Onboarding Personnalisé** : Quand je clique sur le lien, je veux comprendre que je suis invité par mon ami (ex: "Johan t'invite sur WallOfMe").
2.  **Bonus de Bienvenue** : Je veux voir immédiatement que j'ai reçu un "Starter Pack" (ex: 500 Tokens ou un objet exclusif) grâce à l'invitation.

## Spécifications Fonctionnelles

### 1. Génération de Code/Lien

- Chaque utilisateur a un code de parrainage unique (ex: `JOHAN88`).
- Le lien de partage doit inclure ce code (ex: `wallofme.com/invite/JOHAN88`).

### 2. Mécanisme de Récompense (Double-Sided)

- **Pour le Parrain** : +500 Tokens.
- **Pour le Filleul** : +500 Tokens (visible dès la création du compte).
- **Condition de Déblocage (Trigger)** :
  - Le filleul reçoit ses tokens immédiatement (pour l'effet "Waouh").
  - Le parrain reçoit ses tokens **UNIQUEMENT** quand le filleul a créé son premier trophée 3D (Anti-fraude et qualification).

### 3. Interface Utilisateur (UI)

- Ajouter une section "Parrainage" dans les Réglages ou le Profil.
- Afficher une barre de progression ou un compteur : "3 amis invités = 1500 Tokens gagnés".
- Utiliser des visuels attrayants (coffre au trésor, pièces d'or).

## Points Techniques

- Nécessite de modifier le modèle `User` pour stocker `referralCode` et `referredBy`.
- Nécessite un système de Deep Linking (géré par le routeur de l'app).

---

Analyse bien tout, et surtout hésites pas a mes poser des questions pour affiner le besoin et avoir une UX optimale.
