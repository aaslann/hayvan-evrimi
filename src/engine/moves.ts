import { Cell, Direction, Grid, MoveResult } from '../types/game.types';
import { GRID_SIZE } from '../utils/constants';
import { mergeCells } from './merger';
import { addRandomCell, spawnCell } from './spawner';

// Bir satır veya sütun listesini sola birleştirir (tüm yönler buna indirgenir)
const slideLeft = (line: (Cell | null)[], baseRow: number, baseCol: number, isRow: boolean): { cells: (Cell | null)[]; score: number; mergedIds: number[]; newIds: number[] } => {
  const filtered = line.filter(Boolean) as Cell[];
  const result: (Cell | null)[] = [];
  let score = 0;
  const mergedIds: number[] = [];
  const newIds: number[] = [];
  let i = 0;

  while (i < filtered.length) {
    const current = filtered[i];
    const next = filtered[i + 1];

    if (next && current.animalId === next.animalId && !current.isMerged && !next.isMerged) {
      const { cell, points, newAnimalId } = mergeCells(current, next);
      const pos = result.length;
      cell.row = isRow ? baseRow : baseRow + pos;
      cell.col = isRow ? baseCol + pos : baseCol;
      result.push(cell);
      score += points;
      mergedIds.push(cell.animalId);
      if (newAnimalId) newIds.push(newAnimalId);
      i += 2;
    } else {
      const updated: Cell = {
        ...current,
        row: isRow ? baseRow : baseRow + result.length,
        col: isRow ? baseCol + result.length : baseCol,
        isMerged: false,
      };
      result.push(updated);
      i++;
    }
  }

  while (result.length < GRID_SIZE) result.push(null);
  return { cells: result, score, mergedIds, newIds };
};

const processMove = (grid: Grid, direction: Direction): MoveResult => {
  let newGrid: Grid = grid.map((row) => [...row]);
  let totalScore = 0;
  let changed = false;
  const allMergedIds: number[] = [];
  const allNewIds: number[] = [];

  const rotateGrid = (g: Grid): Grid =>
    Array.from({ length: GRID_SIZE }, (_, c) =>
      Array.from({ length: GRID_SIZE }, (__, r) => g[r][c])
    );

  const flipGrid = (g: Grid): Grid =>
    g.map((row) => [...row].reverse());

  // Sola normalize et
  if (direction === 'right') newGrid = flipGrid(newGrid);
  if (direction === 'up') newGrid = rotateGrid(newGrid);
  if (direction === 'down') {
    newGrid = rotateGrid(newGrid);
    newGrid = flipGrid(newGrid);
  }

  // Her satırı sola işle
  const processed: Grid = newGrid.map((row, r) => {
    const { cells, score, mergedIds, newIds } = slideLeft(row, r, 0, true);
    cells.forEach((c, i) => { if (c) { c.row = r; c.col = i; } });
    totalScore += score;
    allMergedIds.push(...mergedIds);
    allNewIds.push(...newIds);

    const rowChanged = cells.some((c, i) => {
      const orig = row[i];
      if (!c && !orig) return false;
      if (!c || !orig) return true;
      return c.id !== orig.id || c.row !== orig.row || c.col !== orig.col;
    });
    if (rowChanged) changed = true;
    return cells;
  });

  // Orijinal yöne geri döndür
  let finalGrid = processed;
  if (direction === 'right') finalGrid = flipGrid(finalGrid);
  if (direction === 'up') {
    // rotate transpose geri al
    finalGrid = Array.from({ length: GRID_SIZE }, (_, r) =>
      Array.from({ length: GRID_SIZE }, (__, c) => {
        const cell = processed[c][r];
        if (cell) { cell.row = r; cell.col = c; }
        return cell;
      })
    );
  }
  if (direction === 'down') {
    finalGrid = flipGrid(finalGrid);
    finalGrid = Array.from({ length: GRID_SIZE }, (_, r) =>
      Array.from({ length: GRID_SIZE }, (__, c) => {
        const cell = finalGrid[c][r];
        if (cell) { cell.row = r; cell.col = c; }
        return cell;
      })
    );
  }

  if (changed) {
    finalGrid = addRandomCell(finalGrid);
  }

  return {
    grid: finalGrid,
    score: totalScore,
    changed,
    mergedAnimalIds: allMergedIds,
    newAnimalIds: allNewIds,
  };
};

export { processMove };
