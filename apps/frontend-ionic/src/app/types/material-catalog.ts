export interface MaterialOption {
  id: string;
  nameKey: string;
  category: 'floor' | 'wall';
  thumbnail: string;
  texture?: string;
  color: string;
  roughness: number;
  textureRepeat?: [number, number];
}

export interface BackgroundOption {
  id: string;
  nameKey: string;
  type: 'solid' | 'environment';
  color?: string;
  environment?: string;
  thumbnail: string;
}

export interface MaterialOverrides {
  floorMaterialId?: string;
  wallMaterialId?: string;
  backgroundId?: string;
}

// ─── Floor Materials ────────────────────────────────────
export const FLOOR_MATERIALS: MaterialOption[] = [
  {
    id: 'floor-wood-aged',
    nameKey: 'materials.woodAged',
    category: 'floor',
    thumbnail: 'assets/textures/TCom_Wood_Aged_header.jpg',
    texture: 'assets/textures/TCom_Wood_Aged_header.jpg',
    color: '#c9a87c',
    roughness: 0.9,
    textureRepeat: [2, 2],
  },
  {
    id: 'floor-parquet',
    nameKey: 'materials.parquet',
    category: 'floor',
    thumbnail: 'assets/textures/TCom_Wood_ZebranoVeneer_header.jpg',
    texture: 'assets/textures/TCom_Wood_ZebranoVeneer_header.jpg',
    color: '#a0805c',
    roughness: 0.75,
    textureRepeat: [3, 3],
  },
  {
    id: 'floor-walnut',
    nameKey: 'materials.walnut',
    category: 'floor',
    thumbnail: 'assets/textures/TCom_Wood_WalnutVeneer_header.jpg',
    texture: 'assets/textures/TCom_Wood_WalnutVeneer_header.jpg',
    color: '#6b4c3b',
    roughness: 0.8,
    textureRepeat: [2, 2],
  },
  {
    id: 'floor-concrete',
    nameKey: 'materials.concrete',
    category: 'floor',
    thumbnail: 'assets/textures/Concrete042A_2K-JPG_Color.jpg',
    texture: 'assets/textures/Concrete042A_2K-JPG_Color.jpg',
    color: '#9a9a9a',
    roughness: 0.95,
    textureRepeat: [2, 2],
  },
  {
    id: 'floor-gym-mat',
    nameKey: 'materials.gymMat',
    category: 'floor',
    thumbnail: 'assets/textures/Carpet006_2K-JPG_Color.jpg',
    texture: 'assets/textures/Carpet006_2K-JPG_Color.jpg',
    color: '#3a3a3a',
    roughness: 0.95,
    textureRepeat: [2, 2],
  },
  {
    id: 'floor-pool-tile',
    nameKey: 'materials.poolTile',
    category: 'floor',
    thumbnail: 'assets/textures/Tiles002_2K-JPG_Color.jpg',
    texture: 'assets/textures/Tiles002_2K-JPG_Color.jpg',
    color: '#c8d8e4',
    roughness: 0.6,
    textureRepeat: [4, 4],
  },
  {
    id: 'floor-rubber',
    nameKey: 'materials.rubber',
    category: 'floor',
    thumbnail: 'assets/textures/Fabric069_2K-JPG_Color.jpg',
    texture: 'assets/textures/Fabric069_2K-JPG_Color.jpg',
    color: '#2d2d2d',
    roughness: 0.9,
    textureRepeat: [2, 2],
  },
];

// ─── Wall Materials ─────────────────────────────────────
export const WALL_MATERIALS: MaterialOption[] = [
  {
    id: 'wall-reclaimed-wood',
    nameKey: 'materials.reclaimedWood',
    category: 'wall',
    thumbnail: 'assets/textures/TCom_ReclaimedWoodWall_header.jpg',
    texture: 'assets/textures/TCom_ReclaimedWoodWall_header.jpg',
    color: '#a08060',
    roughness: 0.95,
    textureRepeat: [2, 1],
  },
  {
    id: 'wall-plywood',
    nameKey: 'materials.plywood',
    category: 'wall',
    thumbnail: 'assets/textures/TCom_WoodPlywoodSpruce_header.jpg',
    texture: 'assets/textures/TCom_WoodPlywoodSpruce_header.jpg',
    color: '#d4c4a8',
    roughness: 0.9,
    textureRepeat: [2, 1],
  },
  {
    id: 'wall-painted-brick',
    nameKey: 'materials.paintedBrick',
    category: 'wall',
    thumbnail: 'assets/textures/Bricks074_2K-JPG_Color.jpg',
    texture: 'assets/textures/Bricks074_2K-JPG_Color.jpg',
    color: '#d4c8b8',
    roughness: 0.95,
    textureRepeat: [2, 1],
  },
  {
    id: 'wall-red-brick',
    nameKey: 'materials.redBrick',
    category: 'wall',
    thumbnail: 'assets/textures/red_brick_diff_2k.jpg',
    texture: 'assets/textures/red_brick_diff_2k.jpg',
    color: '#8b4513',
    roughness: 0.95,
    textureRepeat: [2, 1],
  },
  {
    id: 'wall-industrial-brick',
    nameKey: 'materials.industrialBrick',
    category: 'wall',
    thumbnail: 'assets/textures/Bricks101_2K-JPG_Color.jpg',
    texture: 'assets/textures/Bricks101_2K-JPG_Color.jpg',
    color: '#7a6b5f',
    roughness: 0.95,
    textureRepeat: [2, 1],
  },
  {
    id: 'wall-raw-concrete',
    nameKey: 'materials.rawConcrete',
    category: 'wall',
    thumbnail: 'assets/textures/Concrete042A_2K-JPG_Color.jpg',
    texture: 'assets/textures/Concrete042A_2K-JPG_Color.jpg',
    color: '#9a9a9a',
    roughness: 0.95,
    textureRepeat: [2, 1],
  },
  {
    id: 'wall-grunge',
    nameKey: 'materials.grunge',
    category: 'wall',
    thumbnail: 'assets/textures/grunge-wall-texture.jpg',
    texture: 'assets/textures/grunge-wall-texture.jpg',
    color: '#6b6b6b',
    roughness: 0.95,
    textureRepeat: [2, 1],
  },
];

// ─── Background Options ─────────────────────────────────
export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  {
    id: 'bg-anthracite',
    nameKey: 'materials.anthracite',
    type: 'solid',
    color: '#2a2a2a',
    thumbnail: '',
  },
  {
    id: 'bg-navy-blue',
    nameKey: 'materials.navyBlue',
    type: 'solid',
    color: '#1a1a3e',
    thumbnail: '',
  },
  {
    id: 'bg-studio-white',
    nameKey: 'materials.studioWhite',
    type: 'solid',
    color: '#f0f0f0',
    thumbnail: '',
  },
  {
    id: 'bg-warm-beige',
    nameKey: 'materials.warmBeige',
    type: 'solid',
    color: '#f5f0e8',
    thumbnail: '',
  },
  {
    id: 'bg-forest-green',
    nameKey: 'materials.forestGreen',
    type: 'solid',
    color: '#1a3a2a',
    thumbnail: '',
  },
  {
    id: 'bg-daylight',
    nameKey: 'materials.daylight',
    type: 'environment',
    environment: 'assets/textures/environments/DayEnvironmentHDRI096_2K_HDR.exr',
    thumbnail: '',
  },
  {
    id: 'bg-sky',
    nameKey: 'materials.sky',
    type: 'environment',
    environment: 'assets/textures/environments/DaySkyHDRI057B_2K_HDR.exr',
    thumbnail: '',
  },
  {
    id: 'bg-moonlight',
    nameKey: 'materials.moonlight',
    type: 'environment',
    environment: 'assets/textures/environments/qwantani_moon_noon_puresky_2k.exr',
    thumbnail: '',
  },
];

// ─── Lookup Helpers ─────────────────────────────────────
export function findFloorMaterial(id: string): MaterialOption | undefined {
  return FLOOR_MATERIALS.find((m) => m.id === id);
}

export function findWallMaterial(id: string): MaterialOption | undefined {
  return WALL_MATERIALS.find((m) => m.id === id);
}

export function findBackground(id: string): BackgroundOption | undefined {
  return BACKGROUND_OPTIONS.find((b) => b.id === id);
}
