Exploration & Globe 3D Connecté
En tant que Athlète en quête d'inspiration,
Je veux pouvoir explorer la communauté soit via une recherche filtrée classique, soit via une carte du monde interactive en 3D,
Afin de découvrir les "Pain Caves" d'autres passionnés, qu'ils soient mes voisins ou à l'autre bout du monde.

1. La Page "Explorer" (Le Hub)
Double Vue : En arrivant sur l'onglet Explorer, j'ai le choix entre les 2 vues disponibles.

Vue Liste (Par défaut) : Une grille efficace de miniatures de chambres.

Vue Globe (Immersive) : Le globe 3D interactif.

Filtres Globaux (Chips) : Une barre de filtres horizontale (Triathlon, Running, Cyclisme, Pro) reste toujours visible.

Comportement : Si je sélectionne "Triathlon", la Vue Liste ne montre que des triathlètes, et la Vue Globe ne montre que les points géolocalisés des triathlètes.


. Le Globe 3D (Spécifications)
Rendu : Niveau tech utiliser https://globe.gl/ .

Navigation Tactile :

Rotation : Un doigt pour tourner la terre.

Zoom : Pincement pour se rapprocher d'un continent ou d'un pays.

Affichage des Utilisateurs (Clustering) :

Vue Éloignée (Monde/Continent) : Des bulles de chiffres (Clusters) indiquent la densité (ex: "1.2k" sur l'Europe, "500" sur les US).

Vue Rapprochée (Pays/Région) : Les bulles se divisent pour laisser apparaître les avatars individuels des utilisateurs (Photo de profil ronde).

Confidentialité (Privacy) : La position affichée sur le globe est approximative. Elle est basée sur le centre-ville déclaré ou un rayon aléatoire de 2-5km autour de la position réelle.


Interaction & Découverte
Preview Rapide :

Au clic sur un avatar (sur le Globe) ou une carte (sur la Liste), un panneau (Bottom Sheet) s'ouvre partiellement en bas de l'écran.

Infos : Nom, Sport, Niveau, et un aperçu miniature de sa Room ( image URL de sa room).

Action "Visiter" :

Un bouton "Entrer dans la Cave" lance le chargement de la scène 3D de l'utilisateur

Note Tech : Le Globe est "démonté" (unmount) de la mémoire pour laisser toute la puissance GPU à la Room qui va s'afficher.
