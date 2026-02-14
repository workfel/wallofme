Programme de Parrainage (Referral System)
En tant que Utilisateur actif (Parrain),
Je veux inviter des amis via un lien unique et recevoir des tokens automatiquement lorsqu'ils deviennent actifs,
Afin de pouvoir m'acheter des objets de décoration premium (nouveaux vélos, posters) sans dépenser d'argent réel.

1. Le Lien de Parrainage (Le "Share")
Accès : Un bouton "Inviter un ami & Gagner 50 Tokens" est visible dans le profil utilisateur et peut apparaître via une "Pop-up" après avoir ajouté un trophée (moment de satisfaction).

Génération : L'application génère un lien unique (Deep Link) associé à mon ID utilisateur (ex: paincave.app/invite/johan-pujol-88).

Partage Natif : En cliquant sur le bouton, j'ouvre la fiche de partage native de mon téléphone (WhatsApp, SMS, Instagram, Copier le lien).

2. L'Expérience du Filleul (Onboarding)
Redirection Intelligente :

Si l'ami n'a pas l'app : Le lien redirige vers l'App Store / Play Store.

Si l'ami a l'app : Le lien ouvre l'app.

Attribution : Au premier lancement après installation via le lien, le système enregistre discrètement que "Nouvel Utilisateur B" vient de "Parrain A".

3. La Condition de Succès (Activation)
La Règle d'Or : L'inscription seule ne suffit pas (pour éviter les faux comptes).

Le Déclencheur (Trigger) : Le parrainage est considéré comme "Validé" uniquement lorsque le Filleul a uploadé et validé son premier trophée dans sa Pain Cave.

Pourquoi ? Cela garantit que tu ne récompenses que des utilisateurs qualifiés (vrais sportifs) qui ont compris la valeur de ton produit.

4. La Récompense & Notification
Crédit Automatique : Dès que le Filleul valide son trophée, le solde de Tokens du Parrain est crédité (ex: +100 Tokens).

Notification Push : Le Parrain reçoit une notification gratifiante : "Bravo ! Thomas vient d'accrocher sa première médaille. Vous avez gagné 100 Tokens !"

(Optionnel mais recommandé) Bonus Filleul : Pour motiver l'ami à utiliser ton lien plutôt que de télécharger l'app en direct, il gagne lui aussi un "Starter Pack" de tokens à son arrivée.

Critères d'Acceptation (Definition of Done)
[ ] Deep Linking : Le lien de parrainage survit à l'installation (Deferred Deep Linking). Si j'installe l'app via le lien, le système sait qui m'a invité au premier lancement.

[ ] Sécurité Anti-Fraude (Basique) : Le système empêche le parrainage de soi-même (même Device ID).

[ ] Délai de Récompense : Les tokens ne sont versés qu'après la création du premier trophée par le filleul, pas avant.

[ ] Feedback Visuel : Le parrain voit son compteur de tokens augmenter et reçoit une notification (In-App ou Push).

[ ] Traçabilité : Dans la base de données, on garde une trace de la relation (referral_id) pour des stats futures.
