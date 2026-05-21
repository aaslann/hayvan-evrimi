import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, Modal, SafeAreaView, ScrollView, StatusBar,
  StyleSheet, Text, TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useGameStore } from './src/store/gameStore';
import { getAnimal, ANIMALS } from './src/data/animals';
import { COLORS, GRID_SIZE } from './src/utils/constants';
import { Direction } from './src/types/game.types';

const GAP = 8;
const PADDING = 10;

const Cell = ({ cell, size }: { cell: any; size: number }) => {
  const animal = cell ? getAnimal(cell.animalId) : null;
  const scaleAnim = useRef(new Animated.Value(cell?.isNew ? 0 : 1)).current;
  useEffect(() => {
    if (cell?.isNew) Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 12 } as any).start();
    else if (cell?.isMerged) Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.2, useNativeDriver: true } as any),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true } as any),
    ]).start();
  }, [cell?.isNew, cell?.isMerged, cell?.id]);

  const br = size * 0.22;
  if (!animal) return <View style={[styles.emptyCell, { width: size, height: size, borderRadius: br }]} />;
  return (
    <Animated.View style={[styles.cell, { width: size, height: size, borderRadius: br, backgroundColor: animal.color.gradient[0], shadowColor: animal.color.glow, transform: [{ scale: scaleAnim }] }]}>
      <Text style={{ fontSize: size * 0.42 }}>{animal.emoji}</Text>
      <Text style={[styles.cellName, { color: animal.color.text, fontSize: size * 0.13 }]}>{animal.name}</Text>
    </Animated.View>
  );
};

const Grid = ({ grid }: { grid: any[][] }) => {
  const { width } = useWindowDimensions();
  const gridW = Math.min(width - 32, 400);
  const cellSize = Math.floor((gridW - PADDING * 2 - 2 - GAP * GRID_SIZE) / GRID_SIZE);
  return (
    <View style={[styles.gridWrap, { width: gridW }]}>
      <View style={styles.gridInner}>
        {grid.flat().map((cell, idx) => (
          <View key={`slot-${idx}`} style={{ width: cellSize, height: cellSize, margin: GAP / 2 }}>
            <Cell cell={cell} size={cellSize} />
          </View>
        ))}
      </View>
    </View>
  );
};

const SwipeHandler = ({ onSwipe, children }: { onSwipe: (d: Direction) => void; children: React.ReactNode }) => {
  const pan = Gesture.Pan().runOnJS(true).minDistance(40).onEnd((e) => {
    const { translationX: dx, translationY: dy } = e;
    if (Math.abs(dx) > Math.abs(dy)) onSwipe(dx > 0 ? 'right' : 'left');
    else onSwipe(dy > 0 ? 'down' : 'up');
  });
  return <GestureDetector gesture={pan}><View style={{ flex: 1 }}>{children}</View></GestureDetector>;
};

export default function App() {
  const { grid, score, bestScore, isGameOver, highestAnimalId, undoStack, unlockedAnimals, swipe, undo, resetGame, clearMergeFlags } = useGameStore();
  const [newAnimalId, setNewAnimalId] = useState<number | null>(null);
  const clearTimer = useRef<any>(null);

  const swipeRef = useRef(swipe);
  const clearMergeFlagsRef = useRef(clearMergeFlags);
  swipeRef.current = swipe;
  clearMergeFlagsRef.current = clearMergeFlags;

  const handleSwipe = (dir: Direction) => {
    const { newAnimals } = swipeRef.current(dir);
    if (newAnimals.length > 0) setNewAnimalId(newAnimals[0]);
    clearTimer.current && clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => clearMergeFlagsRef.current(), 350);
  };

  useEffect(() => {
    const map: Record<string, Direction> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    const handler = (e: KeyboardEvent) => { if (map[e.key]) { e.preventDefault(); handleSwipe(map[e.key]); } };
    window.removeEventListener('keydown', (window as any).__gameKeyHandler);
    (window as any).__gameKeyHandler = handler;
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const newAnimal = newAnimalId ? getAnimal(newAnimalId) : null;
  const nextAnimal = getAnimal(Math.min(highestAnimalId + 1, 9));
  const highestAnimal = getAnimal(highestAnimalId);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <SafeAreaView style={{ flex: 1 }}>
        <SwipeHandler onSwipe={handleSwipe}>
          <ScrollView contentContainerStyle={styles.screen} scrollEnabled={false}>
            <View style={styles.header}>
              <View>
                <View style={styles.badge}><Text style={styles.badgeText}>✦ SONSUZ MACERA</Text></View>
                <Text style={styles.title}>Hayvan Evrimi</Text>
                <Text style={styles.subtitle}>Tüm hayvanları topla!</Text>
              </View>
              <View style={styles.scores}>
                <View style={styles.scoreBox}><Text style={styles.scoreLabel}>PUAN</Text><Text style={styles.scoreVal}>{score.toLocaleString()}</Text></View>
                <View style={styles.scoreBox}><Text style={styles.scoreLabel}>REKOR</Text><Text style={[styles.scoreVal, { color: COLORS.gold }]}>{bestScore.toLocaleString()}</Text></View>
              </View>
            </View>

            <View style={styles.targetBar}>
              <Text style={{ fontSize: 32 }}>{nextAnimal?.emoji ?? '🦄'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.targetLabel}>HEDEF EVRİM</Text>
                <Text style={styles.targetName}>{nextAnimal?.name ?? 'Unicorn'} için oyna!</Text>
                <View style={styles.track}><View style={[styles.trackFill, { width: `${(highestAnimalId / 9) * 100}%` as any }]} /></View>
              </View>
              <View style={styles.starPill}><Text style={{ color: COLORS.gold, fontWeight: '900', fontSize: 13 }}>⭐ {Math.floor(score / 100)}</Text></View>
            </View>

            <Grid grid={grid} />

            <View style={styles.evoSection}>
              <Text style={styles.sectionTitle}>EVRİM ZİNCİRİ</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.evoScroll}>
                  {ANIMALS.map((animal, idx) => {
                    const unlocked = unlockedAnimals.includes(animal.id);
                    const isCurrent = animal.id === highestAnimalId;
                    return (
                      <React.Fragment key={animal.id}>
                        <View style={styles.evoNode}>
                          <View style={[styles.evoBubble, unlocked && styles.evoDone, isCurrent && styles.evoActive, !unlocked && styles.evoLocked]}>
                            <Text style={[{ fontSize: 20 }, !unlocked && { opacity: 0.3 }]}>{animal.emoji}</Text>
                            {unlocked && !isCurrent && <View style={styles.checkDot}><Text style={{ fontSize: 8, color: '#fff' }}>✓</Text></View>}
                          </View>
                          <Text style={[styles.evoLabel, unlocked && styles.evoLabelOn, isCurrent && styles.evoLabelActive]}>{animal.name}</Text>
                        </View>
                        {idx < ANIMALS.length - 1 && <Text style={styles.evoArrow}>›</Text>}
                      </React.Fragment>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btn, styles.btnUndo, undoStack.length === 0 && { opacity: 0.35 }]} onPress={() => undo()} disabled={undoStack.length === 0}>
                <Text style={styles.btnUndoText}>↩  Geri Al</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnBoost]} onPress={resetGame}>
                <Text style={styles.btnBoostText}>🔄  Yeni Oyun</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SwipeHandler>
      </SafeAreaView>

      <Modal visible={isGameOver} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Oyun Bitti!</Text>
            <Text style={{ fontSize: 64, marginVertical: 8 }}>{highestAnimal?.emoji}</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.accent }}>En yüksek: {highestAnimal?.name}</Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Puan: {score.toLocaleString()}</Text>
            {score > 0 && score >= bestScore && <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.gold }}>🎉 Yeni Rekor!</Text>}
            <TouchableOpacity style={[styles.btn, styles.btnBoost, { width: '100%' }]} onPress={resetGame}>
              <Text style={styles.btnBoostText}>🔄 Tekrar Oyna</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!newAnimalId} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.success }}>✨ Yeni Hayvan!</Text>
            <Text style={{ fontSize: 64, marginVertical: 8 }}>{newAnimal?.emoji}</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.accent }}>{newAnimal?.name}</Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 18 }}>{newAnimal?.funFact}</Text>
            <TouchableOpacity style={[styles.btn, styles.btnBoost, { width: '100%', marginTop: 8 }]} onPress={() => setNewAnimalId(null)}>
              <Text style={styles.btnBoostText}>Harika! Devam et</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badge: { backgroundColor: 'rgba(139,92,246,0.2)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 2 },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#c4b5fd', letterSpacing: 0.8 },
  title: { fontSize: 26, fontWeight: '900', color: COLORS.gold, letterSpacing: -0.5 },
  subtitle: { fontSize: 11, color: 'rgba(196,181,253,0.6)', fontWeight: '700' },
  scores: { flexDirection: 'row', gap: 8 },
  scoreBox: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 72 },
  scoreLabel: { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: 0.5 },
  scoreVal: { fontSize: 18, fontWeight: '900', color: '#fff', lineHeight: 22 },
  targetBar: { backgroundColor: 'rgba(139,92,246,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)', borderRadius: 20, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  targetLabel: { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: 0.5 },
  targetName: { fontSize: 13, fontWeight: '900', color: '#fff' },
  track: { height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, marginTop: 5, overflow: 'hidden' },
  trackFill: { height: '100%', backgroundColor: '#8b5cf6', borderRadius: 3 },
  starPill: { backgroundColor: 'rgba(251,191,36,0.15)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  gridWrap: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: PADDING, alignSelf: 'center' },
  gridInner: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 },
  emptyCell: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.08)' },
  cellName: { fontWeight: '800', marginTop: 2 },
  evoSection: { marginBottom: 4 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 8 },
  evoScroll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  evoNode: { alignItems: 'center', minWidth: 48 },
  evoBubble: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: 4, position: 'relative' },
  evoDone: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  evoActive: { backgroundColor: 'rgba(139,92,246,0.3)', borderWidth: 2, borderColor: '#a78bfa' },
  evoLocked: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' },
  checkDot: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.bg },
  evoLabel: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
  evoLabelOn: { color: 'rgba(255,255,255,0.7)' },
  evoLabelActive: { color: '#a78bfa' },
  evoArrow: { color: 'rgba(255,255,255,0.15)', fontSize: 14, marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, padding: 13, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  btnUndo: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  btnUndoText: { color: 'rgba(255,255,255,0.6)', fontWeight: '800', fontSize: 13 },
  btnBoost: { backgroundColor: '#7c3aed' },
  btnBoostText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  modalCard: { backgroundColor: '#1a0035', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)', padding: 24, width: '100%', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
});
