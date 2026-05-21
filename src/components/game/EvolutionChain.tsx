import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ANIMALS } from '../../data/animals';
import { COLORS } from '../../utils/constants';

interface Props {
  highestAnimalId: number;
  unlockedAnimals: Set<number>;
}

const EvolutionChain: React.FC<Props> = ({ highestAnimalId, unlockedAnimals }) => (
  <View style={styles.section}>
    <View style={styles.header}>
      <Text style={styles.title}>EVRİM ZİNCİRİ</Text>
      <Text style={styles.link}>Tümünü gör →</Text>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      {ANIMALS.map((animal, idx) => {
        const unlocked = unlockedAnimals.has(animal.id);
        const isCurrent = animal.id === highestAnimalId;
        return (
          <React.Fragment key={animal.id}>
            <View style={[styles.node]}>
              <View style={[styles.bubble, unlocked && styles.bubbleDone, isCurrent && styles.bubbleActive, !unlocked && styles.bubbleLocked]}>
                <Text style={[styles.emoji, !unlocked && styles.emojiLocked]}>{animal.emoji}</Text>
                {unlocked && !isCurrent && <View style={styles.check}><Text style={{ fontSize: 8, color: '#fff' }}>✓</Text></View>}
              </View>
              <Text style={[styles.lbl, unlocked && styles.lblUnlocked, isCurrent && styles.lblActive]}>
                {animal.name}
              </Text>
            </View>
            {idx < ANIMALS.length - 1 && (
              <Text style={styles.arrow}>›</Text>
            )}
          </React.Fragment>
        );
      })}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  section: { marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 10, fontWeight: '800', color: COLORS.textSecondary, letterSpacing: 1 },
  link: { fontSize: 10, fontWeight: '700', color: COLORS.accent },
  scroll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  node: { alignItems: 'center', minWidth: 48 },
  bubble: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4, position: 'relative',
  },
  bubbleDone: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
  },
  bubbleActive: {
    backgroundColor: 'rgba(139,92,246,0.3)',
    borderWidth: 2, borderColor: '#a78bfa',
    shadowColor: '#a78bfa', shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  bubbleLocked: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)',
  },
  emoji: { fontSize: 22 },
  emojiLocked: { opacity: 0.35 },
  check: {
    position: 'absolute', bottom: -2, right: -2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#0d0020',
  },
  lbl: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
  lblUnlocked: { color: 'rgba(255,255,255,0.7)' },
  lblActive: { color: COLORS.accent },
  arrow: { color: 'rgba(255,255,255,0.15)', fontSize: 14, marginTop: -14 },
});

export default React.memo(EvolutionChain);
