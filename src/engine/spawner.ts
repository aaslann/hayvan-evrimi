import { v4 as uuid } from 'uuid';
import { Cell, Grid } from '../types/game.types';
import { SPAWN_HIGH_CHANCE } from '../utils/constants';
import { getEmptyPositions } from './grid';

export const spawnCell = (row: number, col: number, animalId?: number): Cell => ({
  id: uuid(),
  animalId: animalId ?? (Math.random() < SPAWN_HIGH_CHANCE ? 2 : 1),
  row,
  col,
  isNew: true,
  isMerged: false,
});

export const addRandomCell = (grid: Grid): Grid => {
  const empty = getEmptyPositions(grid);
  if (empty.length === 0) return grid;
  const { row, col } = empty[Math.floor(Math.random() * empty.length)];
  const next = grid.map((r) => [...r]);
  next[row][col] = spawnCell(row, col);
  return next;
};
