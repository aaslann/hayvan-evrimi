import { Grid } from '../types/game.types';
import { GRID_SIZE } from '../utils/constants';

export const isGameOver = (grid: Grid): boolean => {
  // Boş hücre varsa oyun bitmez
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) return false;
    }
  }

  // Komşu eşleşme varsa oyun bitmez
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const id = grid[r][c]?.animalId;
      if (!id) continue;
      if (r + 1 < GRID_SIZE && grid[r + 1][c]?.animalId === id) return false;
      if (c + 1 < GRID_SIZE && grid[r][c + 1]?.animalId === id) return false;
    }
  }

  return true;
};
