export interface RoomTheme {
  id: string;
  name: string;
  slug: string;
  floor: { color: string; roughness: number; texture?: string };
  leftWall: { color: string; roughness: number; texture?: string };
  backWall: { color: string; roughness: number; texture?: string };
  hemisphereLight: { skyColor: string; groundColor: string; intensity: number };
  mainLight: { intensity: number; color?: string; position: [number, number, number] };
  spotLight: { intensity: number; color: string; position: [number, number, number]; angle: number; penumbra: number };
  fillLight?: { intensity: number; color: string; position: [number, number, number] };
  background: string;
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
  floor: { color: '#2a2a2a', roughness: 0.85 },
  leftWall: { color: '#1a1a2e', roughness: 0.9 },
  backWall: { color: '#16213e', roughness: 0.9 },
  hemisphereLight: { skyColor: '#1a1a3e', groundColor: '#0a0a0a', intensity: 0.3 },
  mainLight: { intensity: 1.0, color: '#8be9fd', position: [3, 10, 1] },
  spotLight: { intensity: 0.8, color: '#bd93f9', position: [0, 6, 0], angle: Math.PI / 4, penumbra: 0.6 },
  fillLight: { intensity: 0.15, color: '#6272a4', position: [2, 1.5, 2] },
  background: '#0a0a1a',
  isFree: true,
  priceTokens: 0,
};

export const ALPINE_THEME: RoomTheme = {
  id: 'alpine',
  name: 'Alpine Lodge',
  slug: 'alpine',
  floor: { color: '#e8e8e8', roughness: 0.7 },
  leftWall: { color: '#f0f5f9', roughness: 0.85 },
  backWall: { color: '#dce4ec', roughness: 0.85 },
  hemisphereLight: { skyColor: '#d4e8f7', groundColor: '#8a9bae', intensity: 0.7 },
  mainLight: { intensity: 2.2, color: '#ffffff', position: [3, 10, 1] },
  spotLight: { intensity: 1.2, color: '#e8f0ff', position: [0, 6, 0], angle: Math.PI / 4, penumbra: 0.4 },
  fillLight: { intensity: 0.35, color: '#cce5ff', position: [2, 1.5, 2] },
  background: '#e8eef4',
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
