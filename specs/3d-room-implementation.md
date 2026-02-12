# Spec : 3D Room — Implementation Plan

## 1. Overview

La Pain Cave est une room 3D personnalisable (6x6x3 unites) ou les athletes exposent medailles, dossards et decorations. Ce document consolide l'architecture complete : UX, 3D, backend, et monetisation.

**Features cles :**
- Selecteur de theme (couleurs, textures, background) — 3 gratuits, reste payant en tokens
- Edition de la room (placement/suppression/deplacement d'objets) — grille 9x6 par mur = 108 slots
- Catalogue de decorations 3D achetables avec des tokens ("Flames")
- Interaction medaille/dossard : camera zoom + panel infos course
- Partage social : screenshot 3D + lien deep link
- Monetisation : RevenueCat IAP + AdMob rewarded video + Stripe web

---

## 2. Etat Actuel du Code

### 2.1 Frontend (angular-three v4)

| Fichier | Role |
|---|---|
| `pain-cave-scene.component.ts` | Scene 3D : room box 6x6x3, 3 lumieres, rendu items |
| `trophy-frame.component.ts` | PlaneGeometry texture pour medailles/dossards, animation sway, hover emissive |
| `decoration-model.component.ts` | Chargement GLB via `gltfResource()` → `ngt-primitive` |
| `camera-controls.component.ts` | `NgtsOrbitControls` avec contraintes distance/angle |
| `room-view.page.ts` | Affichage public read-only |
| `room-edit.page.ts` | Editeur split 55% canvas / 45% panel, select/add/remove/move |
| `room.service.ts` | Service signal-based CRUD (fetchMyRoom, addItem, updateItem, removeItem) |
| `room-placement.ts` | Grille slots 3x2 par mur x 2 murs = 12 slots, auto-fill |

**Stack :** `angular-three@^4.0.9`, `angular-three-soba@^4.0.9`, `three@^0.178.0`, `camera-controls@^2.9.0`

**Patterns etablis :**
- `extend()` pour enregistrer les classes THREE (`ngt-mesh`, `ngt-box-geometry`, etc.)
- `NgtArgs` pour args de geometrie : `*args="[w, h, d]"`
- `textureResource()` / `gltfResource()` pour chargement async
- `injectBeforeRender(({ clock }) => ...)` pour animations per-frame
- Angular signals (`signal()`, `input()`, `output()`, `computed()`)
- `CUSTOM_ELEMENTS_SCHEMA` obligatoire sur chaque composant ngt-*

### 2.2 Backend (Hono + Drizzle)

**Tables existantes pertinentes :**

| Table | Colonnes cles | Notes |
|---|---|---|
| `room` | `userId` (unique 1:1), `themeId` (text, nullable), `floor` (text, nullable) | themeId sans FK, pas de shareSlug |
| `room_item` | `positionX/Y/Z` (real), `rotationY` (real), `wall` (enum left/right) | Pas de scaleX/Y/Z |
| `decoration` | `modelUrl`, `thumbnailUrl`, `category`, `isPremium`, `priceTokens` | priceTokens existe mais jamais verifie |
| `user_decoration` | `userId` + `decorationId` + `acquiredAt` | Table inventaire |

**Routes existantes :**

| Endpoint | Description |
|---|---|
| `GET /api/rooms/me` | Room de l'user (auto-create), avec items + trophy + decoration |
| `GET /api/rooms/user/:id` | Room publique d'un autre user |
| `PATCH /api/rooms/me` | Update themeId/floor |
| `POST /api/rooms/items` | Placer un item (position + wall) |
| `PATCH /api/rooms/items/:id` | Deplacer un item |
| `DELETE /api/rooms/items/:id` | Retirer un item |
| `GET /api/decorations` | Catalogue pagine |
| `GET /api/decorations/inventory/me` | Inventaire user |
| `POST /api/decorations/:id/acquire` | Acquérir — **BUG: aucune verification de tokens** |

### 2.3 Bugs Existants

1. **CORS incomplet** — `index.ts` ligne 37 : `allowMethods: ["POST", "GET", "OPTIONS"]` manque `PATCH` et `DELETE`. Les requetes PATCH/DELETE depuis un navigateur echouent au preflight.
2. **Acquire sans tokens** — `decorations.routes.ts` : `POST /:id/acquire` insere directement dans `user_decoration` sans verifier le solde de tokens ni debiter. Toute decoration est gratuite.

---

## 3. Grille de Placement — 9x6 par Mur

### 3.1 Configuration

La room 6x6x3 a 2 murs visibles (left + back). Chaque mur a une grille **9 colonnes x 6 rangees = 54 slots**, soit **108 slots au total**.

```
Room dimensions: 6 (largeur) x 6 (profondeur) x 3 (hauteur)

Mur gauche (left wall) :      Mur du fond (back wall / "right" en DB) :
  9 colonnes sur l'axe Z        9 colonnes sur l'axe X
  6 rangees sur l'axe Y         6 rangees sur l'axe Y
  X fixe = -ROOM_WIDTH/2        Z fixe = -ROOM_DEPTH/2
```

### 3.2 Calcul des Positions

```typescript
// room-placement.ts — nouvelle grille 9x6
const ROOM_WIDTH = 6;
const ROOM_DEPTH = 6;
const ROOM_HEIGHT = 3;
const WALL_OFFSET = 0.16; // wall thickness/2 + gap

const COLUMNS = 9;
const ROWS = 6;
const SLOTS_PER_WALL = COLUMNS * ROWS; // 54

// Espacements
const MARGIN = 0.3; // marge depuis les bords du mur
const USABLE_WIDTH = ROOM_DEPTH - 2 * MARGIN;  // 5.4 unites utilisables
const USABLE_HEIGHT = ROOM_HEIGHT - 2 * MARGIN; // 2.4 unites utilisables

const COL_SPACING = USABLE_WIDTH / (COLUMNS - 1);  // ~0.675 unites entre colonnes
const ROW_SPACING = USABLE_HEIGHT / (ROWS - 1);    // ~0.48 unites entre rangees

// Y positions : de haut en bas (2.7 → 0.3)
const Y_POSITIONS = Array.from({ length: ROWS }, (_, i) =>
  ROOM_HEIGHT - MARGIN - i * ROW_SPACING
); // [2.7, 2.22, 1.74, 1.26, 0.78, 0.3]

// Z/X positions : de gauche a droite (-2.7 → 2.7)
const AXIS_POSITIONS = Array.from({ length: COLUMNS }, (_, i) =>
  -USABLE_WIDTH / 2 + i * COL_SPACING
); // [-2.7, -2.025, -1.35, -0.675, 0, 0.675, 1.35, 2.025, 2.7]
```

### 3.3 Visualisation

```
Mur gauche (vu de face, 54 slots) :

     Z -2.7  -2.0  -1.3  -0.7   0   0.7   1.3   2.0   2.7
Y 2.7  [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]
  2.2  [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]
  1.7  [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]
  1.3  [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]
  0.8  [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]
  0.3  [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]   [ ]

Meme disposition pour le mur du fond (54 slots)
Total : 108 slots pour trophees
+ placement libre sur le sol pour decorations 3D
```

### 3.4 Impact sur les Trophees

Avec une grille 9x6, chaque frame de trophee doit etre plus petite :
- `FRAME_HEIGHT` : reduire de `0.8` a `~0.4` pour tenir dans l'espacement vertical de 0.48
- `FRAME_WIDTH` : max ~0.55 pour tenir dans l'espacement horizontal de 0.675
- Alternative : taille dynamique qui s'adapte a la densite de la grille

---

## 4. Theme System

### 4.1 Type RoomTheme

```typescript
export interface RoomTheme {
  id: string;
  name: string;
  slug: string;
  floor: { color: string; roughness: number; texture?: string };
  leftWall: { color: string; roughness: number; texture?: string };
  backWall: { color: string; roughness: number; texture?: string };
  ambientLight: { intensity: number; color?: string };
  mainLight: { intensity: number; color?: string; position: [number, number, number] };
  accentLight: { intensity: number; color: string };
  background: string;
  isFree: boolean;
  priceTokens: number;
}
```

### 4.2 Themes Gratuits

| Slug | Nom | Floor | Left Wall | Back Wall | Vibe |
|---|---|---|---|---|---|
| `classic` | Warm Diorama | `#c9a87c` | `#faedcd` | `#fefae0` | Actuel, chaud |
| `dark-cave` | Dark Cave | `#2a2a2a` | `#1a1a2e` | `#16213e` | Dramatique |
| `alpine` | Alpine | `#e8e8e8` | `#f0f5f9` | `#dce4ec` | Clair, neigeux |

### 4.3 Implementation Frontend

Remplacer les constantes hardcodees dans `pain-cave-scene.component.ts` par un input signal `theme` :

```typescript
// pain-cave-scene.component.ts
theme = input<RoomTheme>(DEFAULT_THEME);

// Template — bind material properties au theme :
<ngt-mesh-standard-material
  [color]="theme().floor.color"
  [roughness]="theme().floor.roughness"
  [map]="floorTexture.value() ?? null"
/>
```

Le changement de theme est **instantane** (signal-driven, pas de rechargement).

### 4.4 Implementation Backend

Nouvelle table `theme` + `user_theme` (voir section 8.1).

---

## 5. UX/UI Design

### 5.1 Room Editor — Layout Restructure

**Avant :** 55% canvas / 45% panel fixe
**Apres :** ~80% canvas + context bar flottante + bottom sheets

```
+-------------------------------+
| [<-] Room Editor  [eye][palette][save] |  <- Toolbar
+-------------------------------+
|                               |
|         3D CANVAS             |
|       (80% viewport)         |
|                               |
+-------------------------------+
| [trash] [rotate] [+ Add]     |  <- Context bar (si item selectionne)
+-------------------------------+
```

### 5.2 Theme Selector — Bottom Sheet

`ion-modal` avec `breakpoints: [0, 0.45, 0.75]`, `initialBreakpoint: 0.45`

- Grille 4 colonnes de cartes 80x80px avec preview couleur
- Badge "FREE" (vert) ou prix en tokens (dore)
- Tap = live preview dans la scene 3D (meme si non achete — "try before you buy")
- Bouton "Apply" pour confirmer
- Si theme verrouille → confirmation inline "Unlock [Theme] for X Flames?"

### 5.3 Object Catalog — Bottom Sheet

`ion-modal` avec `breakpoints: [0, 0.5, 0.92]`, `initialBreakpoint: 0.92`

- `ion-segment` : "My Trophies" / "Objects" (decorations)
- Barre de solde tokens sticky : coin icon + balance + "[+] Get Tokens"
- `ion-chip` categories horizontales : All, Fitness, Sports, Outdoor, Fun, Premium
- Grille 2 colonnes de `ion-card` avec thumbnail, nom, badge prix/status
- Actions : "Place" (si possede) / "Buy" (confirmation inline → confetti → auto-Place)

### 5.4 Trophy Info — Tap Interaction

**Declencheur :** Tap sur un trophee dans la scene 3D (view mode et edit mode)

**Sequence :**
1. Camera zoom smooth vers le trophee (500ms ease-out-cubic)
2. Autres items dim a opacity 0.3
3. Bottom sheet slide up avec infos course

**Contenu du panel :**
- Icone type + nom de la course (titre)
- Localisation, date, sport
- Resultats : temps, classement, categorie
- CTA "View Full Details" → `/trophy/:id`
- Dismiss → camera retourne en position initiale (400ms)

### 5.5 Share Flow

**Bouton :** FAB bottom-right (room view) ou icon toolbar (edit)

**Flow :**
1. Screenshot 3D via `renderer.toDataURL('image/png')` + overlay logo WallOfMe
2. Bottom sheet avec preview, lien copiable, boutons quick-share (IG, X, More)
3. "Download Image" → sauvegarde camera roll

**Open Graph :** URL publique `/room/:slug` avec `og:title`, `og:image`, `og:description`

### 5.6 Touch Interactions

| Geste | Action |
|---|---|
| Tap item | Selectionner (glow dore + context bar) |
| Tap espace vide | Deselectionner |
| Tap "Move" → tap slot vide | Deplacer item (lerp 300ms) |
| Tap "Rotate" | Rotation 90deg (200ms) |
| Tap "Delete" | Alert confirmation → fade out (200ms) |
| Pinch | Zoom camera |
| 1 doigt drag | Orbit camera |
| Double tap | Reset camera isometrique |

### 5.7 State Machine de l'Editeur

```
IDLE
 |-- tap item ----------> SELECTED
 |-- tap "+" -----------> CATALOG_OPEN
 |-- tap palette -------> THEME_OPEN
 |-- tap share ---------> SHARE_OPEN

SELECTED
 |-- tap "Delete" ------> CONFIRM_DELETE → IDLE
 |-- tap "Rotate" ------> rotate 90deg → SELECTED
 |-- tap "Move" --------> SLOT_PICKING → IDLE
 |-- tap empty ---------> IDLE
 |-- tap other item ----> SELECTED (new)
 |-- long-press --------> TROPHY_INFO (si trophy)

CATALOG_OPEN
 |-- select item -------> SLOT_PICKING → IDLE
 |-- dismiss sheet -----> IDLE

SLOT_PICKING
 |-- tap slot vide -----> place + animate → IDLE
 |-- tap cancel --------> IDLE

THEME_OPEN
 |-- select theme ------> live preview 3D
 |-- tap "Apply" -------> apply + close → IDLE
 |-- dismiss -----------> revert preview → IDLE

TROPHY_INFO
 |-- dismiss sheet -----> camera restore → IDLE/SELECTED
 |-- tap "Full Details" -> navigate /trophy/:id
```

---

## 6. 3D Technical Implementation

### 6.1 Camera System

Le projet a deja `camera-controls@^2.9.0`. Utiliser `CameraControls.setLookAt()` pour les transitions smooth :

```typescript
// Mode inspection — zoom sur un trophee
controls.setLookAt(
  x + 1.5, y + 0.3, z + 1.5, // position camera (offset)
  x, y, z,                     // look-at target
  true                          // smooth transition
);

// Retour vue isometrique
controls.setLookAt(5, 5, 5, 0, 1, 0, true);
```

### 6.2 Slot Indicators (Visuels)

En mode placement, afficher les slots vides comme des PlaneGeometry translucides :

```html
@for (slot of emptySlots(); track slot.key) {
  <ngt-mesh
    [position]="slot.position"
    [rotation]="slot.rotation"
    (click)="slotClicked.emit(slot)"
    (pointerover)="hoveredSlot.set(slot.key)"
    (pointerout)="hoveredSlot.set(null)"
  >
    <ngt-plane-geometry *args="[0.5, 0.35]" />
    <ngt-mesh-standard-material
      [color]="'#ffffff'"
      [transparent]="true"
      [opacity]="hoveredSlot() === slot.key ? 0.4 : 0.15"
      [emissive]="'#4488ff'"
      [emissiveIntensity]="hoveredSlot() === slot.key ? 0.5 : 0.1"
    />
  </ngt-mesh>
}
```

angular-three gere les pointer events via raycasting automatique — `(click)`, `(pointerover)`, `(pointerout)` fonctionnent nativement sur `ngt-mesh`.

### 6.3 Screenshot Capture

```typescript
// Capturer la scene 3D en image
const gl = store.get('gl');
const scene = store.get('scene');
const camera = store.get('camera');

gl.setPixelRatio(3); // haute resolution
gl.render(scene, camera);
const dataUrl = gl.domElement.toDataURL('image/png');
gl.setPixelRatio(originalPixelRatio);
```

**Important :** Ajouter `preserveDrawingBuffer: true` au `NgtCanvas`, ou rendre un frame supplementaire avant `toDataURL()`.

Partage natif via `@capacitor/share` :
```typescript
await Share.share({ title: 'My Pain Cave', url: savedFileUri });
```

### 6.4 Floor Decoration Placement

Placement libre sur le sol (pas de grille) avec controles panel-based :
- `ion-range` pour positionX (-2.5 → 2.5)
- `ion-range` pour positionZ (-2.5 → 2.5)
- `ion-range` pour rotationY (0 → 2pi)

La scene 3D update en temps reel via signal bindings.

### 6.5 Performance Mobile

| Optimisation | Implementation |
|---|---|
| DPR cap | `<ngt-canvas [dpr]="[1, 2]" />` — cap a 2x meme sur ecrans 3x |
| On-demand rendering | `frameloop="demand"` sur room-view (pas d'edition) |
| Shadows | Shadow map 512x512 max |
| Textures | 1024x1024 max (deja gere par Sharp backend) |
| GLB compression | Draco via `gltf-transform` a build time |
| Preload | `preloadGltf()` des modeles inventaire quand l'editeur s'ouvre |

---

## 7. Monetisation

### 7.1 Monnaie Virtuelle : "Flames"

### 7.2 Plateforme de Paiement

| Critere | RevenueCat | Stripe | Polar |
|---|---|---|---|
| IAP Mobile | Plugin Capacitor officiel | Pas d'IAP natif | Pas de support |
| Virtual Currency | Support integre | Custom | Non |
| Prix | Gratuit < $2.5K MTR | 2.9% + $0.30 | 4% + $0.40 |
| Compliance Apple | Oui (natif StoreKit) | Partiel (US only) | Non applicable |

**Decision : RevenueCat** pour IAP mobile + **Stripe** pour achats web (+25% bonus Flames pour eviter 30% Apple).

### 7.3 Tiers d'Achat

| Tier | Prix | Flames | Bonus | Flames/$ |
|---|---|---|---|---|
| Starter | $0.99 | 100 | — | 101 |
| Popular | $4.99 | 550 | +10% | 110 |
| Best Value | $9.99 | 1,200 | +20% | 120 |
| Pro Pack | $19.99 | 2,600 | +30% | 130 |
| Ultimate | $49.99 | 7,000 | +40% | 140 |

### 7.4 Prix en Flames

**Themes :**

| Categorie | Prix | Exemples |
|---|---|---|
| Gratuits (3) | 0 | Classic, Dark Cave, Alpine |
| Premium | 300-500 | Olympian Gold, Night Runner Neon, Mountain Summit |
| Saisonniers/Limites | 500-800 | Christmas Lodge, Summer Games |

**Decorations :**

| Categorie | Prix | Exemples |
|---|---|---|
| Starter | 20-50 | Basic medal rack, bib frame, shoe shelf |
| Sport-Specific | 50-150 | Bicycle mount, running shoe display, kettlebell rack |
| Trophy Displays | 100-250 | Podium, medal wall, finisher tape arch |
| Animated/Premium | 200-400 | Spinning medal display, LED bib frame, fire pit |
| Rare/Legendary | 400-800 | Golden podium, Olympic torch, championship belt |

**Decorations deblocables gratuitement :**
- 10 courses → Bronze medal rack
- 25 trophees → Silver trophy case
- 1er marathon → Marathon finisher banner
- 5 partages → Social butterfly decoration

### 7.5 Rewarded Video (AdMob)

Plugin : `@capacitor-community/admob`

| Action | Flames | Cap/jour | Cooldown |
|---|---|---|---|
| Rewarded video | 15 | 5 | 20 min |
| Login quotidien | 5 | 1 | Reset minuit |
| Upload trophee | 10 | 3 | Par upload |
| Partage room | 20 | 2 | Par partage |

Max theorique gratuit : ~110 Flames/jour → 1 decoration mid-tier tous les 2-3 jours.

### 7.6 Projections Revenue

| Metrique | Month 3 | Month 6 | Month 12 |
|---|---|---|---|
| Total Users | 5,000 | 25,000 | 100,000 |
| DAU (20%) | 1,000 | 5,000 | 20,000 |
| IAP Revenue | $375 | $3,500 | $25,000 |
| Ad Revenue | $975 | $5,850 | $27,300 |
| Web Revenue | $50 | $500 | $3,000 |
| **Net Revenue** | **~$1,288** | **~$8,800** | **~$47,400** |

---

## 8. Backend — Nouvelles Tables & Endpoints

### 8.1 Schema Additions

#### Table `theme`

```typescript
export const theme = pgTable("theme", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  previewUrl: text("preview_url"),
  wallColor: text("wall_color"),
  floorColor: text("floor_color"),
  backgroundColor: text("background_color"),
  wallTexture: text("wall_texture"),
  floorTexture: text("floor_texture"),
  isFree: boolean("is_free").default(false).notNull(),
  priceTokens: integer("price_tokens").default(0).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

#### Table `user_theme`

```typescript
export const userTheme = pgTable("user_theme", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  themeId: uuid("theme_id").notNull().references(() => theme.id, { onDelete: "cascade" }),
  acquiredAt: timestamp("acquired_at").defaultNow().notNull(),
});
```

#### Table `token_transaction`

```typescript
export const tokenTransactionTypeEnum = pgEnum("token_transaction_type", [
  "purchase",
  "rewarded_video",
  "spend_decoration",
  "spend_theme",
  "refund",
  "bonus",
]);

export const tokenTransaction = pgTable("token_transaction", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  type: tokenTransactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull(),       // + pour gain, - pour depense
  balance: integer("balance").notNull(),     // solde APRES cette transaction
  referenceId: text("reference_id"),         // decorationId, themeId, ou ID paiement externe
  referenceType: text("reference_type"),     // "decoration", "theme", "iap", "ad_network"
  metadata: text("metadata"),               // JSON string pour data supplementaire
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 8.2 Schema Modifications

#### `user` — ajouter `tokenBalance`

```typescript
tokenBalance: integer("token_balance").default(0).notNull(),
```

#### `room` — ajouter `shareSlug`, changer type `themeId`

```typescript
shareSlug: text("share_slug").unique(),     // nanoid(8), ex: "xK9mP2qR"
themeId: uuid("theme_id").references(() => theme.id, { onDelete: "set null" }),
// Migration: text → uuid (necessite migration en 2 etapes si data existante)
```

#### `room_item` — ajouter scale

```typescript
scaleX: real("scale_x").default(1).notNull(),
scaleY: real("scale_y").default(1).notNull(),
scaleZ: real("scale_z").default(1).notNull(),
```

#### `decoration` — ajouter contraintes 3D

```typescript
defaultScale: real("default_scale").default(1).notNull(),
wallMountable: boolean("wall_mountable").default(false).notNull(),
floorOnly: boolean("floor_only").default(true).notNull(),
```

### 8.3 Nouveaux Endpoints

```
/api/tokens
  GET  /balance                → { balance: number }
  GET  /transactions           → paginated token_transaction[]
  POST /earn/rewarded-video    → { balance, earned }   (validation S2S)
  POST /purchase/verify        → { balance, purchased } (validation receipt)

/api/themes
  GET  /                       → theme[]  (catalogue public)
  GET  /:id                    → theme
  GET  /inventory/me           → user_theme[] avec theme details
  POST /:id/acquire            → user_theme (debite tokens si payant)

/api/rooms (modifications)
  PATCH /me                    → valide ownership du themeId avant application
  POST  /items                 → ajoute params scale
  PATCH /items/:id             → ajoute params scale
  POST  /me/share              → genere shareSlug (nanoid), retourne shareUrl
  GET   /share/:slug           → room publique par slug

/api/webhooks
  POST /revenuecat             → webhook RevenueCat (verification par secret header)

/api/callbacks
  GET  /admob                  → callback S2S AdMob pour rewarded video
```

### 8.4 Fix Acquire Decoration

L'endpoint `POST /api/decorations/:id/acquire` doit etre corrige :

1. Verifier si l'user possede deja → 409 Conflict
2. Si `decoration.isPremium` ou `priceTokens > 0` → verifier `user.tokenBalance >= priceTokens`
3. Dans une `db.transaction()` :
   - Debiter `user.tokenBalance`
   - Inserer `token_transaction` (type: `spend_decoration`, amount negatif)
   - Inserer `user_decoration`
4. Retourner la decoration acquise

### 8.5 Fix CORS

```typescript
// index.ts — ajouter PATCH et DELETE
allowMethods: ["POST", "GET", "PATCH", "DELETE", "OPTIONS"],
```

### 8.6 Migration Strategy

1. Modifier `schema.ts` avec toutes les additions
2. `bun run db:generate` → fichiers migration
3. Si `room.themeId` a des donnees existantes (text → uuid) : migration en 2 etapes (add new column, migrate data, drop old, rename)
4. `bun run db:migrate`
5. Seed des 3 themes gratuits

---

## 9. Nouveaux Fichiers a Creer

### 9.1 Frontend

**Composants :**

| Composant | Chemin | Role |
|---|---|---|
| `ThemeSelectorSheet` | `features/room/components/theme-selector/` | Bottom sheet browse/preview/achat themes |
| `ObjectCatalogSheet` | `features/room/components/object-catalog/` | Bottom sheet browse/achat/placement decorations |
| `TrophyInfoSheet` | `features/room/components/trophy-info/` | Bottom sheet zoom + infos course |
| `ShareRoomSheet` | `features/room/components/share-room/` | Screenshot + partage social |
| `EditorToolbar` | `features/room/components/editor-toolbar/` | Toolbar (back, preview, theme, save) |
| `ContextActionBar` | `features/room/components/context-action-bar/` | Barre actions (delete, rotate, move) |
| `SlotIndicator` | `features/room/components/slot-indicator/` | Marqueurs 3D translucides pour placement |
| `TokenBalance` | `shared/components/token-balance/` | Widget solde tokens reutilisable |

**Services :**

| Service | Role |
|---|---|
| `ThemeService` | Fetch themes, cache, apply, purchase |
| `DecorationService` | Catalogue, inventaire, achat |
| `TokenService` | Solde, transactions, earn/spend |
| `ShareService` | Screenshot capture, partage social, deep links |

### 9.2 Backend

**Fichiers :**

| Fichier | Role |
|---|---|
| `routes/tokens.routes.ts` | Endpoints economie tokens |
| `routes/themes.routes.ts` | Catalogue + achat themes |
| `routes/webhooks.routes.ts` | Handler webhook RevenueCat |
| `routes/callbacks.routes.ts` | Callbacks S2S ad networks |
| `validators/token.validator.ts` | Schemas Zod tokens |
| `validators/theme.validator.ts` | Schemas Zod themes |
| `validators/webhook.validator.ts` | Schemas Zod webhooks |
| `lib/revenuecat.ts` | Verification webhook RevenueCat |
| `lib/token-service.ts` | Operations balance (earn/spend dans db.transaction) |

---

## 10. Phases d'Implementation

### Phase 1 — Fondations (Semaines 1-2)

**Backend :**
- [ ] Fix CORS (ajouter PATCH/DELETE)
- [ ] Fix decoration acquire (verification tokens)
- [ ] Creer tables `theme`, `user_theme`, `token_transaction`
- [ ] Ajouter `tokenBalance` sur `user`
- [ ] Ajouter `shareSlug` sur `room`, `scaleX/Y/Z` sur `room_item`
- [ ] Creer routes `/api/tokens` et `/api/themes`
- [ ] Seed 3 themes gratuits

**Frontend :**
- [ ] Agrandir grille de 3x2 a 9x6 dans `room-placement.ts`
- [ ] Adapter taille des trophy frames pour la nouvelle grille
- [ ] Implementer theme system dans `pain-cave-scene.component.ts` (input signal)
- [ ] Creer `ThemeService` et `TokenService`

### Phase 2 — UX Editeur (Semaines 2-4)

- [ ] Restructurer `room-edit.page.ts` (80% canvas + context bar)
- [ ] Creer `EditorToolbar` et `ContextActionBar`
- [ ] Creer `ThemeSelectorSheet` (bottom sheet + live preview)
- [ ] Creer `ObjectCatalogSheet` (segment trophies/objects + grille)
- [ ] Creer `SlotIndicator` (slots visuels en mode placement)
- [ ] Creer `TokenBalance` widget

### Phase 3 — Interactions 3D (Semaines 4-5)

- [ ] Camera inspection mode (zoom sur trophee via `camera-controls`)
- [ ] Creer `TrophyInfoSheet` (infos course)
- [ ] Screenshot capture (`toDataURL` + overlay branding)
- [ ] Creer `ShareRoomSheet` (partage social via Capacitor)
- [ ] Share slug generation backend + OG meta tags
- [ ] Floor decoration placement (sliders position/rotation)

### Phase 4 — Monetisation (Semaines 5-7)

- [ ] Integrer RevenueCat (`@revenuecat/purchases-capacitor`)
- [ ] Configurer IAP tiers dans App Store Connect / Play Console
- [ ] Webhook handler RevenueCat backend
- [ ] Integrer AdMob rewarded video (`@capacitor-community/admob`)
- [ ] Callback S2S validation + credit tokens
- [ ] Rate limiting rewarded video (5/jour, cooldown 20min)
- [ ] Stripe web payments (optionnel, phase ulterieure)

### Phase 5 — Croissance (Semaines 7-10)

- [ ] Liens de partage room + deep linking
- [ ] Generation image OG pour previews sociaux
- [ ] Systeme de referral (Flames bonus)
- [ ] Decorations deblocables par achievements
- [ ] Login quotidien bonus
- [ ] Optimisations performance (DPR cap, demand rendering, Draco GLB)
