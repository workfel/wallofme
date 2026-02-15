import {
  type MaterialOverrides,
  findFloorMaterial,
  findWallMaterial,
  findBackground,
} from './material-catalog';

export type { MaterialOverrides };

export interface RoomTheme {
  id: string;
  name: string;
  slug: string;
  floor: { color: string; roughness: number; texture?: string; textureRepeat?: [number, number] };
  leftWall: { color: string; roughness: number; texture?: string; textureRepeat?: [number, number] };
  backWall: { color: string; roughness: number; texture?: string; textureRepeat?: [number, number] };
  hemisphereLight: { skyColor: string; groundColor: string; intensity: number };
  mainLight: { intensity: number; color?: string; position: [number, number, number] };
  spotLight: { intensity: number; color: string; position: [number, number, number]; angle: number; penumbra: number };
  fillLight?: { intensity: number; color: string; position: [number, number, number] };
  background: string;
  environmentMap?: string;
  isFree: boolean;
  priceTokens: number;
}

export const DEFAULT_THEME: RoomTheme = {
  id: 'classic',
  name: 'Warm Diorama',
  slug: 'classic',
  floor: { color: '#c9a87c', roughness: 0.9, texture: 'assets/textures/TCom_Wood_Aged_header.jpg' },
  leftWall: { color: '#faedcd', roughness: 0.95, texture: 'assets/textures/TCom_ReclaimedWoodWall_header.jpg' },
  backWall: { color: '#fefae0', roughness: 0.95, texture: 'assets/textures/TCom_WoodPlywoodSpruce_header.jpg' },
  hemisphereLight: { skyColor: '#b1c8e0', groundColor: '#3d2b1f', intensity: 0.6 },
  mainLight: { intensity: 2.0, color: '#fff', position: [3, 10, 1] },
  spotLight: { intensity: 1.0, color: '#fff', position: [0, 2, 0], angle: Math.PI / 2, penumbra: 0.5 },
  fillLight: { intensity: 0.3, color: '#fff', position: [2, 1.5, 2] },
  background: '#f5f0e8',
  isFree: true,
  priceTokens: 0,
};

export const DARK_CAVE_THEME: RoomTheme = {
  id: 'dark-cave',
  name: 'Dark Cave',
  slug: 'dark-cave',
  floor: { color: '#1e1e28', roughness: 0.85 },
  leftWall: { color: '#14142a', roughness: 0.9 },
  backWall: { color: '#111130', roughness: 0.9 },
  hemisphereLight: { skyColor: '#1a1a3e', groundColor: '#050510', intensity: 0.25 },
  mainLight: { intensity: 0.8, color: '#6ec6ff', position: [3, 10, 1] },
  spotLight: { intensity: 1.0, color: '#a474e0', position: [0, 6, 0], angle: Math.PI / 4, penumbra: 0.7 },
  fillLight: { intensity: 0.12, color: '#4a5680', position: [2, 1.5, 2] },
  background: '#08081a',
  isFree: true,
  priceTokens: 0,
};

export const ALPINE_THEME: RoomTheme = {
  id: 'alpine',
  name: 'Alpine Lodge',
  slug: 'alpine',
  floor: { color: '#d8cfc2', roughness: 0.7 },
  leftWall: { color: '#e8e2d8', roughness: 0.85 },
  backWall: { color: '#ddd6ca', roughness: 0.85 },
  hemisphereLight: { skyColor: '#c8daea', groundColor: '#7a8a9a', intensity: 0.65 },
  mainLight: { intensity: 2.0, color: '#fff8f0', position: [3, 10, 1] },
  spotLight: { intensity: 1.0, color: '#f0e8d8', position: [0, 6, 0], angle: Math.PI / 4, penumbra: 0.45 },
  fillLight: { intensity: 0.3, color: '#b8d0e8', position: [2, 1.5, 2] },
  background: '#dce4ec',
  isFree: true,
  priceTokens: 0,
};

export const BUILT_IN_THEMES: RoomTheme[] = [DEFAULT_THEME, DARK_CAVE_THEME, ALPINE_THEME];

export interface CustomThemeColors {
  leftWallColor: string;
  backWallColor: string;
  floorColor: string;
  background: string;
}

export const CUSTOM_THEME_ID = 'custom';

export function buildCustomRoomTheme(colors: CustomThemeColors): RoomTheme {
  return {
    id: CUSTOM_THEME_ID,
    name: 'Custom',
    slug: 'custom',
    floor: { color: colors.floorColor, roughness: 0.85 },
    leftWall: { color: colors.leftWallColor, roughness: 0.9 },
    backWall: { color: colors.backWallColor, roughness: 0.9 },
    hemisphereLight: { skyColor: '#b1c8e0', groundColor: '#3d2b1f', intensity: 0.6 },
    mainLight: { intensity: 2.0, color: '#fff8f0', position: [3, 10, 1] },
    spotLight: { intensity: 1.0, color: '#ffe8cc', position: [0, 6, 0], angle: Math.PI / 4, penumbra: 0.5 },
    fillLight: { intensity: 0.3, color: '#e0e8ff', position: [2, 1.5, 2] },
    background: colors.background,
    isFree: true,
    priceTokens: 0,
  };
}

export function applyMaterialOverridesToTheme(
  theme: RoomTheme,
  overrides: MaterialOverrides,
): RoomTheme {
  let result = { ...theme };

  if (overrides.floorMaterialId) {
    const mat = findFloorMaterial(overrides.floorMaterialId);
    if (mat) {
      result = {
        ...result,
        floor: {
          color: mat.color,
          roughness: mat.roughness,
          texture: mat.texture,
          textureRepeat: mat.textureRepeat,
        },
      };
    }
  }

  if (overrides.wallMaterialId) {
    const mat = findWallMaterial(overrides.wallMaterialId);
    if (mat) {
      const wallSurface = {
        color: mat.color,
        roughness: mat.roughness,
        texture: mat.texture,
        textureRepeat: mat.textureRepeat,
      };
      result = {
        ...result,
        leftWall: wallSurface,
        backWall: wallSurface,
      };
    }
  }

  if (overrides.backgroundId) {
    const bg = findBackground(overrides.backgroundId);
    if (bg) {
      if (bg.type === 'solid' && bg.color) {
        result = { ...result, background: bg.color, environmentMap: undefined };
      } else if (bg.type === 'environment' && bg.environment) {
        result = { ...result, environmentMap: bg.environment };
      }
    }
  }

  return result;
}
