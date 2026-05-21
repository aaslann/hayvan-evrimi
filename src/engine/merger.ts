import { v4 as uuid } from 'uuid';
import { Cell } from '../types/game.types';
import { MAX_ANIMAL_ID } from '../data/animals';
import { MERGE_SCORE_MULTIPLIER } from '../utils/constants';

export interface MergeInfo {
  cell: Cell;
  points: number;
  newAnimalId: number | null; // null ise max seviye
}

export const mergeCells = (a: Cell, b: Cell): MergeInfo => {
  const newAnimalId = a.animalId < MAX_ANIMAL_ID ? a.animalId + 1 : null;
  const targetId = newAnimalId ?? a.animalId;
  const points = Math.pow(2, targetId) * MERGE_SCORE_MULTIPLIER;

  return {
    cell: {
      id: uuid(),
      animalId: targetId,
      row: b.row,
      col: b.col,
      isNew: false,
      isMerged: true,
    },
    points,
    newAnimalId,
  };
};
