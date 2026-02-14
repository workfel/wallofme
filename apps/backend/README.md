To install dependencies:

```sh
bun install
```

To run:

```sh
bun run dev
```

open http://localhost:3000

## Gestion des Modèles 3D (Décorations)

Le backend inclut un outil pour synchroniser automatiquement les modèles 3D ajoutés dans le frontend avec la base de données.

### Workflow

1. **Ajouter un modèle** : Déposez vos fichiers `.glb` dans le dossier `apps/frontend-ionic/src/assets/models`.

2. **Mettre à jour le fichier de seed** :
   Lancez la commande suivante pour scanner le dossier et ajouter les nouveaux modèles au fichier de configuration (`src/db/seed-decorations.ts`) avec des valeurs par défaut :

   ```sh
   bun run db:seed:update
   ```

   _Note : Cette commande ajoute uniquement les nouveaux fichiers détectés. Les entrées existantes (et vos modifications manuelles comme le prix ou la catégorie) sont conservées._

3. **Peupler la base de données** :
   Lancez la commande suivante pour insérer les nouvelles décorations en base de données :
   ```sh
   bun run db:seed
   ```
   _Note : Cette commande vérifie si une décoration avec le même nom existe déjà en base pour éviter les doublons._
