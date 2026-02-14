Infinite Likes & Pulse Animation
En tant que Visiteur (connecté ou simple invité),
Je veux pouvoir "mitrailler" le bouton Like sur une Pain Cave que j'apprécie,
Afin de montrer mon enthousiasme de manière ludique et faire grimper le score de popularité de l'athlète.

1. Le Contexte (La Page de Partage)
Accessibilité : Cette fonctionnalité est disponible sur la vue publique de la "Room 3D" (celle qu'on ouvre via un lien Instagram/Strava).

Zéro Friction : Aucune connexion n'est requise. Un inconnu total peut liker.

2. Le Comportement du "Like" (Tap to Like)
Action : Un bouton "Cœur"  flotte en bas de l'écran (Overlay UI).

Multi-Tap : Je peux cliquer dessus 1 fois, 10 fois ou 100 fois d'affilée. Chaque clic ajoute +1 au compteur local instantanément.

Pas de "Dislike" : On ne peut pas retirer un like. C'est un compteur d'appréciation cumulatif (comme des applaudissements).

3. Feedback Visuel & Animation (Juice)
L'Explosion : À chaque tap/clic :

Le bouton "pulse" (grossit et rétrécit).

Des petites particules (cœurs) s'envolent du bouton vers le haut de l'écran en disparaissant progressivement (fade out).

Variation : Si je clique très vite (combo), les particules changent de couleur ou grossissent pour récompenser le "spam".

Compteur Dynamique : Le chiffre total (ex: 1.2k) s'incrémente visuellement en temps réel à chaque clic.

4. Contraintes Techniques (Performance & Anti-Abus)
Batching (Regroupement) : Pour ne pas tuer le serveur (Hono/Postgres) avec 50 requêtes par seconde :

L'application ne doit pas envoyer une requête API à chaque clic.

Elle doit accumuler les likes localement (ex: l'utilisateur a cliqué 15 fois en 2 secondes) et envoyer une seule requête "Ajouter +15 likes" après un court délai d'inactivité (Debounce) ou toutes les X secondes.

Optimistic UI : Le compteur se met à jour immédiatement pour l'utilisateur, même si le serveur n'a pas encore répondu.

Critères d'Acceptation (Definition of Done)
[ ] Anonymous Access : Un utilisateur non connecté peut cliquer sur le bouton et voir l'animation.

[ ] Animation Fluide : Les particules apparaissent sans ralentir le rendu de la scène 3D (60 FPS maintenus).

[ ] Compteur Temps Réel : Le nombre de likes augmente instantanément à l'écran.

[ ] Network Optimization : En regardant l'onglet "Network" du navigateur, je ne vois pas 50 appels API si je clique 50 fois, mais seulement 1 ou 2 appels groupés.

[ ] Persistance : Si je rafraîchis la page, le compteur global inclut bien mes nouveaux likes.

💡 Petit conseil UX (Haptic)
Sur mobile, ajoute un retour haptique (petite vibration) à chaque pression sur le bouton Like. C'est incroyablement satisfaisant et ça augmente considérablement le nombre de clics (c'est ce que fait l'app "Medium" ou les lives "Instagram").
