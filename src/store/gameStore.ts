import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Direction, GameState, Grid } from '../types/game.types';
import { createInitialGrid, cloneGrid, getHighestAnimalId } from '../engine/grid';
import { processMove } from '../engine/moves';
import { addRandomCell } from '../engine/spawner';
import { isGameOver } from '../engine/validator';
import { MAX_UNDO, COMBO_THRESHOLDS } from '../utils/constants';

// Use synchronous localStorage on web, AsyncStorage on native
const storage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  ? createJSONStorage(() => localStorage)
  : createJSONStorage(() => require('@react-native-async-storage/async-storage').default);

const todayStr = () => new Date().toISOString().split('T')[0];

interface GameStore extends GameState {
  unlockedAnimals: number[];
  streak: number;
  lastClaimedDate: string | null;
  hasSeenOnboarding: boolean;

  swipe: (direction: Direction) => { newAnimals: number[]; earnedScore: number };
  undo: () => boolean;
  resetGame: () => void;
  clearMergeFlags: () => void;
  claimDailyReward: () => { streak: number };
  markOnboardingSeen: () => void;
}

const initialState = (): Omit<GameStore,
  'swipe' | 'undo' | 'resetGame' | 'clearMergeFlags' |
  'claimDailyReward' | 'markOnboardingSeen' | 'unlockedAnimals'
> => ({
  grid: createInitialGrid(),
  score: 0,
  bestScore: 0,
  moves: 0,
  isGameOver: false,
  highestAnimalId: 1,
  comboCount: 0,
  undoStack: [],
  streak: 0,
  lastClaimedDate: null,
  hasSeenOnboarding: false,
});

export const useGameStore = create<GameStore>()(
  persist(
    immer((set, get) => ({
      ...initialState(),
      unlockedAnimals: [1],

      swipe: (direction: Direction) => {
        const state = get();
        if (state.isGameOver) return { newAnimals: [], earnedScore: 0 };

        const result = processMove(state.grid, direction);
        if (!result.changed) return { newAnimals: [], earnedScore: 0 };

        const comboMultiplier = COMBO_THRESHOLDS.find(
          (t) => result.mergedAnimalIds.length >= t.count
        )?.multiplier ?? 1;

        const earnedScore = Math.round(result.score * comboMultiplier);
        const highestId = getHighestAnimalId(result.grid);
        const newAnimals: number[] = [];

        set((s) => {
          s.undoStack.push(cloneGrid(state.grid));
          if (s.undoStack.length > MAX_UNDO) s.undoStack.shift();

          s.grid = result.grid;
          s.score += earnedScore;
          if (s.score > s.bestScore) s.bestScore = s.score;
          s.moves += 1;
          s.highestAnimalId = highestId;
          s.comboCount = result.mergedAnimalIds.length > 0 ? s.comboCount + 1 : 0;
          s.isGameOver = isGameOver(result.grid);

          result.newAnimalIds.forEach((id) => {
            if (!s.unlockedAnimals.includes(id)) {
              s.unlockedAnimals.push(id);
              newAnimals.push(id);
            }
          });
        });

        return { newAnimals, earnedScore };
      },

      undo: () => {
        const state = get();
        if (state.undoStack.length === 0) return false;
        set((s) => {
          s.grid = s.undoStack.pop()!;
          s.isGameOver = false;
          s.comboCount = 0;
        });
        return true;
      },

      resetGame: () => {
        set((s) => {
          const fresh = initialState();
          s.grid = fresh.grid;
          s.score = 0;
          s.moves = 0;
          s.isGameOver = false;
          s.highestAnimalId = 1;
          s.comboCount = 0;
          s.undoStack = [];
        });
      },

      clearMergeFlags: () => {
        set((s) => {
          s.grid = s.grid.map((row) =>
            row.map((cell) =>
              cell ? { ...cell, isNew: false, isMerged: false } : null
            )
          );
        });
      },

      claimDailyReward: () => {
        const { streak, lastClaimedDate } = get();
        const today = todayStr();

        // Seri hesapla: dün geldiyse devam eder, daha eskiyse sıfırlanır
        let newStreak = 1;
        if (lastClaimedDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (lastClaimedDate === yesterday.toISOString().split('T')[0]) {
            newStreak = streak + 1;
          }
        }

        // Mevcut grida bonus hücre ekle
        const bonusGrid = addRandomCell(get().grid);

        set((s) => {
          s.streak = newStreak;
          s.lastClaimedDate = today;
          s.grid = bonusGrid;
        });

        return { streak: newStreak };
      },

      markOnboardingSeen: () => {
        set((s) => { s.hasSeenOnboarding = true; });
      },
    })),
    {
      name: 'hayvan-evrimi-v1',
      storage,
      partialize: (s) => ({
        bestScore: s.bestScore,
        unlockedAnimals: s.unlockedAnimals,
        streak: s.streak,
        lastClaimedDate: s.lastClaimedDate,
        hasSeenOnboarding: s.hasSeenOnboarding,
      }),
    }
  )
);
