import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Grid as GridType } from '../../types/game.types';
import { GRID_SIZE } from '../../utils/constants';
import CellComponent from './Cell';

interface Props {
  grid: GridType;
}

const GAP = 8;
const PADDING = 10;

const GridComponent: React.FC<Props> = ({ grid }) => {
  const { width } = useWindowDimensions();
  const gridWidth = width - 32; // 16px yatay padding her iki taraf
  const cellSize = (gridWidth - PADDING * 2 - GAP * (GRID_SIZE - 1)) / GRID_SIZE;

  return (
    <View style={[styles.wrapper, { width: gridWidth, padding: PADDING }]}>
      <View style={[styles.grid, { gap: GAP }]}>
        {grid.flat().map((cell, idx) => {
          const row = Math.floor(idx / GRID_SIZE);
          const col = idx % GRID_SIZE;
          return (
            <View key={`slot-${row}-${col}`} style={{ width: cellSize, height: cellSize }}>
              {cell ? (
                <CellComponent cell={cell} size={cellSize} />
              ) : (
                <View
                  style={[
                    styles.empty,
                    { width: cellSize, height: cellSize, borderRadius: cellSize * 0.22 },
                  ]}
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignSelf: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  empty: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.08)',
  },
});

export default React.memo(GridComponent);
