import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../utils/constants';

interface Props {
  score: number;
  bestScore: number;
}

const ScoreBox: React.FC<{ label: string; value: number; gold?: boolean }> = ({ label, value, gold }) => {
  const prev = useRef(value);
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (value !== prev.current) {
      prev.current = value;
      Animated.sequence([
        Animated.timing(anim, { toValue: 1.15, duration: 100, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [value]);

  return (
    <View style={styles.box}>
      <Text style={styles.label}>{label}</Text>
      <Animated.Text style={[styles.value, gold && styles.gold, { transform: [{ scale: anim }] }]}>
        {value.toLocaleString()}
      </Animated.Text>
    </View>
  );
};

const ScoreBoard: React.FC<Props> = ({ score, bestScore }) => (
  <View style={styles.row}>
    <ScoreBox label="PUAN" value={score} />
    <ScoreBox label="REKOR" value={bestScore} gold />
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  box: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 72,
  },
  label: { fontSize: 9, color: COLORS.textSecondary, fontWeight: '700', letterSpacing: 0.5 },
  value: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary, lineHeight: 22 },
  gold: { color: COLORS.gold },
});

export default ScoreBoard;
