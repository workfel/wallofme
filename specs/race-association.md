Race Association (Comparaison Sociale)
En tant que Athlète compétiteur,
Je veux que mon trophée soit automatiquement lié à l'événement officiel de la course (ex: "Marathon de Paris 2024"),
Afin de découvrir les autres utilisateurs qui ont couru la même épreuve et comparer ma "Pain Cave" et ma performance avec les leurs.

1. Le Trigger (Déclencheur)
Quand ? Juste après l'étape de validation du trophée (US-01).

Contexte : L'utilisateur vient de confirmer via l'OCR/IA que son image correspond au "Triathlon de Deauville - Distance L - 2023".

2. Mécanique de "Matching" (Backend Hono)
Recherche d'Existant : Le système vérifie si cette course existe déjà dans la base de données globale races.

Si OUI : On associe l'ID de la course au trophée de l'utilisateur (medal.race_id = races.id).

Si NON : Le système crée une nouvelle entrée "Course" propre (basée sur les données validées par l'user) pour que les prochains utilisateurs puissent s'y rattacher.

Normalisation (Anti-Doublon) : Le système doit être assez malin pour comprendre que "Ironman Nice" et "Nice Ironman France" sont probablement la même course (Fuzzy Matching simple).

3. La Vue "Finisher's Club" (Social)
Une fois le trophée accroché au mur, un nouveau bouton/badge apparaît sur la fiche du trophée : "Voir les 42 Finishers".

Le Leaderboard Visuel : Une liste des utilisateurs ayant cette médaille, triée par :

Temps/Performance (si disponible).

Popularité (nombre de likes sur leur Cave).

Comparaison Directe : En cliquant sur un utilisateur de la liste, je suis téléporté directement dans sa Pain Cave 3D.

Objectif : Voir où il a placé cette médaille spécifique chez lui.

Engagement : Voir son matos (a-t-il un meilleur vélo que moi ?).

Critères d'Acceptation (Definition of Done)
[ ] Aggregation : Si 10 utilisateurs uploadent la médaille du "Paris-Versailles 2024", ils sont tous rattachés au même race_id en base de données.

[ ] Création Dynamique : Si je suis le premier à uploader une course obscure (ex: "Trail du Pâté de maisons 2012"), la course est créée et je deviens le premier membre du groupe.

[ ] Navigation Sociale : Depuis le détail de ma médaille ( TrophyInfoSheet), un bouton permet d'accéder à la liste des autres participants inscrits sur l'app ( si je suis connecté, sinon on affiche un message de connexion pour montre qu'il doit etre connecté pour voir plus de detail).

💡 Le petit + Technique (Crowdsourcing)
Pour éviter d'avoir une base de données "sale" avec des doublons (Marathon Paris vs Paris Marathon), tu peux ajouter une étape simple côté Front (Expo) lors de la validation :

"L'IA a détecté 'Marathon de Paris'. S'agit-il de cette course déjà connue ?"
[ Oui, lier à l'événement ]  [ Non, créer une nouvelle course ]

Cela permet aux premiers utilisateurs de faire le travail de nettoyage pour toi gratuitement !
