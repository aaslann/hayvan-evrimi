export type Direction = 'up' | 'down' | 'left' | 'right';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'cosmic';

export interface AnimalColor {
  gradient: [string, string];
  glow: string;
  text: string;
}

export interface Animal {
  id: number;
  emoji: string;
  name: string;
  rarity: Rarity;
  color: AnimalColor;
  unlockMessage: string;
  funFact: string;
}

export interface Cell {
  id: string;
  animalId: number;
  row: number;
  col: number;
  isNew: boolean;
  isMerged: boolean;
}

export type Grid = (Cell | null)[][];

export interface MoveResult {
  grid: Grid;
  score: number;
  changed: boolean;
  mergedAnimalIds: number[];
  newAnimalIds: number[];
}

export interface GameState {
  grid: Grid;
  score: number;
  bestScore: number;
  moves: number;
  isGameOver: boolean;
  highestAnimalId: number;
  comboCount: number;
  undoStack: Grid[];
}
