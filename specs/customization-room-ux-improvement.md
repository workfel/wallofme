# Room Customization & Atmosphere (Designer Mode)
En tant que Athlète soucieux de son image,
Je veux modifier instantanément les matériaux (sol, murs) et l'ambiance (arrière-plan) de ma pièce,
Afin de créer une identité visuelle unique qui fait ressortir mes médailles.

1. L'Entrée en Matière (Mode Édition)
Accès : Un bouton flottant "Pinceau" ou "Rouleau" (Icône Design) est visible sur la vue principale de ma chambre.

Transition : Au clic, l'interface de navigation (menus, profils) disparaît pour laisser place à une Barre d'Outils "Architecture" en bas de l'écran (Bottom Sheet).

Focus Caméra : La caméra recule légèrement (Zoom Out) pour bien montrer l'ensemble de la "boîte" et le fond, afin que je voie l'impact global des changements.

2. L'Interface de Customisation (UX Mobile First)
L'outil est divisé en 3 onglets clairs (Tabs) :

Sols (Floors)

Murs (Walls)

Ambiance (Background)

A. Gestion des Matériaux (Sols & Murs)
Carrousel Visuel : Au lieu d'une liste de noms ("Béton", "Bois"), j'ai des sphères de prévisualisation (Thumbnails) montrant la texture réelle.

Live Preview :

Dès que je touche une texture (ex: "Parquet Chevrons"), elle s'applique instantanément sur le sol de la scène 3D.

Pas de bouton "Valider" à chaque fois. Je teste, ça change. Si j'aime pas, je clique sur le suivant.

Choix varié :

Sols : Béton ciré (Look industriel), Parquet (Chaleureux), Tapis de gym (Sportif), Carrelage piscine.

Murs : Brique peinte, Placo blanc, Béton brut, Néons incrustés.

B. Gestion de l'Atmosphere (Background)
C'est ce qui donne le "Mood" de la pièce.

Types de Fonds :

Couleurs Unies (Solid) : Palette de couleurs mates (Gris anthracite, Bleu nuit, Blanc studio).

Environnements (Skybox/Gradient) : "Ciel étoilé", "Aube", "Nuit Cyberpunk" (Grid), "Garage sombre".

Feedback : Le changement d'arrière-plan doit être fluide (transition douce si possible) pour ne pas agresser l'œil.

3. Validation & Sauvegarde
Boutons d'Action : En haut de la barre d'outils :

[ Annuler ] (Croix) : Remet la chambre comme elle était avant l'ouverture du mode.

[ Sauvegarder ] (Check) : Enregistre la configuration (JSON) en base de données et ferme le mode édition.

Critères d'Acceptation (Definition of Done)
[ ] Zero Latency : L'application de la texture sur le mesh 3D (mur/sol) est immédiate au clic (< 100ms).

[ ] Visual Accuracy : Les miniatures (thumbnails) dans le menu représentent fidèlement la texture finale.

[ ] State Management : Si je change le sol en "Bois", puis le mur en "Brique", puis que je clique sur "Annuler", la chambre revient à son état initial (ex: Béton/Blanc).

[ ] Persistance : Une fois sauvegardée, la configuration est visible par tous les visiteurs (ma Pain Cave garde ce look sur le Web et Mobile).

[ ] Adaptabilité : Les textures se répètent proprement (UV Mapping correct) sans être étirées ou floues, quelle que soit la taille du mur.

💡 Le petit + UX (Haptic Feedback)
Ajoute une petite vibration (Haptic) à chaque fois que l'utilisateur sélectionne un nouveau matériau. Ça donne une sensation physique de "poser" le matériau.


Très important de tout analyser avant de commencer à coder. Assurez-vous de comprendre les besoins et les contraintes du projet avant de vous lancer dans la création du code et pose moi des questions pour affiner les spécifications.
