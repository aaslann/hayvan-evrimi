import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Cell as CellType } from '../../types/game.types';
import { getAnimal } from '../../data/animals';

interface Props {
  cell: CellType;
  size: number;
}

const CellComponent: React.FC<Props> = ({ cell, size }) => {
  const scale = useSharedValue(cell.isNew ? 0 : 1);
  const animal = getAnimal(cell.animalId);

  useEffect(() => {
    if (cell.isNew) {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    } else if (cell.isMerged) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 300 }),
        withSpring(1, { damping: 14, stiffness: 280 })
      );
    }
  }, [cell.isNew, cell.isMerged, cell.id]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!animal) return <View style={[styles.empty, { width: size, height: size, borderRadius: size * 0.22 }]} />;

  const borderRadius = size * 0.22;

  return (
    <Animated.View
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: animal.color.gradient[0],
          shadowColor: animal.color.glow,
        },
        animStyle,
      ]}
    >
      <Text style={[styles.emoji, { fontSize: size * 0.42 }]}>{animal.emoji}</Text>
      <Text style={[styles.name, { color: animal.color.text, fontSize: size * 0.14 }]}>
        {animal.name}
      </Text>
      {cell.isMerged && <View style={[styles.mergeGlow, { borderRadius, borderColor: 'rgba(255,255,255,0.7)' }]} />}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  empty: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emoji: {
    lineHeight: undefined,
  },
  name: {
    fontWeight: '800',
    marginTop: 2,
  },
  mergeGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderWidth: 2,
  },
});

export default React.memo(CellComponent, (prev, next) =>
  prev.cell.id === next.cell.id &&
  prev.cell.isMerged === next.cell.isMerged &&
  prev.cell.isNew === next.cell.isNew &&
  prev.size === next.size
);
