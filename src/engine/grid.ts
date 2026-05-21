import { Cell, Grid } from '../types/game.types';
import { GRID_SIZE } from '../utils/constants';
import { spawnCell } from './spawner';

export const createEmptyGrid = (): Grid =>
  Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

export const createInitialGrid = (): Grid => {
  const grid = createEmptyGrid();
  const positions = getEmptyPositions(grid);
  const shuffled = positions.sort(() => Math.random() - 0.5).slice(0, 2);
  shuffled.forEach(({ row, col }) => {
    grid[row][col] = spawnCell(row, col, 1);
  });
  return grid;
};

export const getEmptyPositions = (grid: Grid): { row: number; col: number }[] => {
  const positions: { row: number; col: number }[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) positions.push({ row: r, col: c });
    }
  }
  return positions;
};

export const cloneGrid = (grid: Grid): Grid =>
  grid.map((row) =>
    row.map((cell) => (cell ? { ...cell } : null))
  );

export const getHighestAnimalId = (grid: Grid): number => {
  let max = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell && cell.animalId > max) max = cell.animalId;
    }
  }
  return max;
};
