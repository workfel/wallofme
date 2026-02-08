PRD : WallOfMe – Le Métavers de l'Athlète

1. Vision du Produit
   Transformer l'effort éphémère d'une course en un trophée numérique permanent. WallOfMe est une plateforme sociale où chaque athlète possède un sanctuaire virtuel (bureau/salle de sport de 3 étages) pour exposer ses médailles et dossards réels, numérisés par IA, et personnaliser son environnement d'entraînement idéal.

2. Fonctionnalités Détaillées (Core Features)
   A. Pipeline de Numérisation "Magic Capture"
   Upload & Détourage : L'utilisateur photographie sa médaille ou son dossard. Le backend (Hono) utilise une IA de segmentation pour supprimer l'arrière-plan (mains, carrelage, etc.) et ne garder que l'objet.

Identification Automatique : L'IA analyse l'image pour identifier la course (ex: "Ironman Nice 2024").

Data Scraping : Le serveur récupère automatiquement le classement (scratch/catégorie) et le temps officiel via le nom de l'utilisateur.

Validation Utilisateur : Interface de correction si l'IA ou le scraper font une erreur avant la génération 3D.

Pour l'IA on utilise ai-sdk https://ai-sdk.dev/docs/getting-started/nodejs récupérer les infos de la course. En utilisant chat gpt comme provider. Tu as un example de prompt dans le fichier SEARCH_RESULT_PROMPT.MD.

B. Le Moteur de la "Pain Cave" (Rendu 3D)

Génération de Trophées : Transformation de la photo détourée en un objet 3D texturé (médaille avec relief ou dossard) placé automatiquement sur les murs de la Pain Cave.

Mode Édition Isométrique : Système de drag & drop pour placer des meubles et équipements high-tech (Home-trainer connecté, TV pour Zwift, vélos de rêve). System de theme de la chambre 3d pour pouvoir personnaliser la chambre.

C. Social & Partage
Visite de Chambres : Possibilité de "lurker" les chambres d'autres athlètes.

Social Share : Génération de visuels optimisés (Snapshots 3D) pour partage sur Instagram, Facebook.

Token Economy : Système de monnaie virtuelle pour acheter des objets de décoration rares.

3. Business Model & Monétisation
   A. L'Abonnement "Finisher Pro" (RevenueCat)
   Stockage illimité : Plus de 3 médailles/dossards au mur.

Accès Premium : Objets de déco exclusifs (marques partenaires, vélos de pros).

B. Micro-transactions & Engagement
Boutique de Props : Achat de "skins" pour la chambre (ex: éclairage néon, modèles de vélos spécifiques). ( Des modeles existant pour les tesat dans assets/models)

Rewarded Videos : Regarder une publicité pour obtenir des tokens et débloquer un accessoire (ex: une plante verte, une nouvelle TV).

4. Spécifications Techniques (Stack Finale)
   Mobile/Web : Expo + React Three Fiber (Même code source). S'assurer que ça fonctionne sur mobile et web. Avec une UX parfait suivant les meilleurs app comme Airbnb, Apple niveau UX/UI. Utilisant Tamagui pour le design.

API & Logique : Hono (Bun) avec RPC et Zod Validator sur VPS Coolify.

Auth : Google/Apple et email( otp ) with BetterAuth ( pour expo: https://www.better-auth.com/docs/integrations/expo)

Data : Postgres + Drizzle ORM.

Storage : Cloudflare R2 pour les textures des médailles et fichiers .glb.

Processing : Sharp pour optimiser les textures WebP avant rendu 3D.

IA : ai-sdk nodejs avec chat gpt comme provider.

Monetization : RevenueCat.

Multilangage : Utiliser la localization d'expo https://docs.expo.dev/versions/latest/sdk/localization/ avec par défault EN et FR seulement.
