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

export const DEFAULT_THEME: RoomTheme = {
  id: 'classic',
  name: 'Warm Diorama',
  slug: 'classic',
  floor: { color: '#c9a87c', roughness: 0.9 },
  leftWall: { color: '#faedcd', roughness: 0.95 },
  backWall: { color: '#fefae0', roughness: 0.95 },
  ambientLight: { intensity: 1.0 },
  mainLight: { intensity: 1.5, position: [5, 8, 5] },
  accentLight: { intensity: 0.5, color: '#fff5e6' },
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
  ambientLight: { intensity: 0.4, color: '#6272a4' },
  mainLight: { intensity: 0.8, color: '#8be9fd', position: [5, 8, 5] },
  accentLight: { intensity: 0.3, color: '#bd93f9' },
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
  ambientLight: { intensity: 1.2, color: '#e8f4fd' },
  mainLight: { intensity: 1.8, color: '#ffffff', position: [5, 8, 5] },
  accentLight: { intensity: 0.6, color: '#cce5ff' },
  background: '#e8eef4',
  isFree: true,
  priceTokens: 0,
};

export const BUILT_IN_THEMES: RoomTheme[] = [DEFAULT_THEME, DARK_CAVE_THEME, ALPINE_THEME];
