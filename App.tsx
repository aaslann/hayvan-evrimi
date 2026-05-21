import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, Modal, Platform, SafeAreaView, ScrollView, StatusBar,
  StyleSheet, Text, TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useGameStore } from './src/store/gameStore';
import { getAnimal, ANIMALS } from './src/data/animals';
import { COLORS, GRID_SIZE } from './src/utils/constants';
import { Direction } from './src/types/game.types';
import { hapticSwipe, hapticMerge, hapticUnlock, hapticGameOver } from './src/utils/haptics';
import { playSwipe, playMerge, playUnlock, playGameOver } from './src/utils/sounds';
import { initAds, showRewardedAd } from './src/utils/ads';
import { initPurchases, checkAdFreeStatus, purchaseRemoveAds, restorePurchases } from './src/utils/purchases';
import { BannerAdView } from './src/components/BannerAdView';
import { useMonetizationStore } from './src/store/monetizationStore';

const ND = Platform.OS !== 'web';
const GAP = 8;
const PADDING = 10;

// ─── Cell ────────────────────────────────────────────────────────────────────
const Cell = ({ cell, size }: { cell: any; size: number }) => {
  const animal    = cell ? getAnimal(cell.animalId) : null;
  const scaleAnim = useRef(new Animated.Value(cell?.isNew ? 0 : 1)).current;
  useEffect(() => {
    if (cell?.isNew) Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: ND, damping: 12 }).start();
    else if (cell?.isMerged) Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.2, useNativeDriver: ND }),
      Animated.spring(scaleAnim, { toValue: 1,   useNativeDriver: ND }),
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

// ─── FloatingScore ───────────────────────────────────────────────────────────
const FloatingScore = ({ value, onDone }: { value: number; onDone: () => void }) => {
  const y       = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(y,       { toValue: -56, duration: 900, useNativeDriver: ND }),
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: ND }),
      ]),
    ]).start(() => onDone());
  }, []);
  return (
    <Animated.Text style={[styles.floatingScore, { transform: [{ translateY: y }], opacity }]}>
      +{value}
    </Animated.Text>
  );
};

// ─── Grid ────────────────────────────────────────────────────────────────────
const Grid = ({ grid }: { grid: any[][] }) => {
  const { width } = useWindowDimensions();
  const gridW    = Math.min(width - 32, 400);
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

// ─── SwipeHandler ────────────────────────────────────────────────────────────
const SwipeHandler = ({ onSwipe, children }: { onSwipe: (d: Direction) => void; children: React.ReactNode }) => {
  const pan = Gesture.Pan().runOnJS(true).minDistance(40).onEnd((e) => {
    const { translationX: dx, translationY: dy } = e;
    if (Math.abs(dx) > Math.abs(dy)) onSwipe(dx > 0 ? 'right' : 'left');
    else onSwipe(dy > 0 ? 'down' : 'up');
  });
  return <GestureDetector gesture={pan}><View style={{ flex: 1 }}>{children}</View></GestureDetector>;
};

// ─── OnboardingModal ─────────────────────────────────────────────────────────
const ONBOARD_SLIDES = [
  {
    emoji: '👆',
    title: 'Nasıl Oynanır?',
    body: 'Ekranı yukarı, aşağı, sağa veya sola kaydır. Tüm hücreler o yöne kayar.',
    visual: '← ↑ ↓ →',
  },
  {
    emoji: '💥',
    title: 'Birleştir!',
    body: 'Aynı hayvanlar yan yana gelince birleşir ve evrimleşir.',
    visual: '🥚 + 🥚 = 🐥',
  },
  {
    emoji: '🌌',
    title: 'Sonsuz Evrim!',
    body: '15 farklı hayvanı keşfet. Efsanevi Galaksi\'ye ulaşmaya çalış!',
    visual: '🥚 › 🐥 › 🦁 › 🐉 › 🦄 › 🔥 › 🌌',
  },
];

const OnboardingModal = ({ visible, onDone }: { visible: boolean; onDone: () => void }) => {
  const [step, setStep] = useState(0);
  const isLast = step === ONBOARD_SLIDES.length - 1;
  const slide  = ONBOARD_SLIDES[step];
  const reset  = () => setStep(0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={{ fontSize: 48 }}>{slide.emoji}</Text>
          <Text style={styles.modalTitle}>{slide.title}</Text>
          <Text style={styles.onboardVisual}>{slide.visual}</Text>
          <Text style={styles.onboardBody}>{slide.body}</Text>

          {/* Nokta göstergesi */}
          <View style={styles.dots}>
            {ONBOARD_SLIDES.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.btn, styles.btnBoost, { width: '100%' }]}
            onPress={() => {
              if (isLast) { reset(); onDone(); }
              else setStep(s => s + 1);
            }}
          >
            <Text style={styles.btnBoostText}>{isLast ? '🎮 Oynamaya Başla!' : 'Devam →'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── DailyRewardModal ────────────────────────────────────────────────────────
const DailyRewardModal = ({ visible, streak, onClose }: { visible: boolean; streak: number; onClose: () => void }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <View style={styles.modalCard}>
        <Text style={{ fontSize: 48 }}>🎁</Text>
        <Text style={styles.modalTitle}>Günlük Ödül!</Text>

        {streak > 1 ? (
          <View style={styles.streakRow}>
            <Text style={{ fontSize: 28 }}>🔥</Text>
            <Text style={styles.streakNum}>{streak}</Text>
            <Text style={styles.streakLabel}>Günlük Seri</Text>
          </View>
        ) : (
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Hoş geldin! Seri başlıyor 🔥</Text>
        )}

        <View style={styles.rewardBox}>
          <Text style={{ fontSize: 32 }}>🥚</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '800', color: '#fff', fontSize: 14 }}>Bonus Yumurta</Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Tahtana ekstra bir hücre eklendi!</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.btn, styles.btnBoost, { width: '100%' }]} onPress={onClose}>
          <Text style={styles.btnBoostText}>Harika! Oyuna dön 🎮</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// ─── CollectionModal ─────────────────────────────────────────────────────────
const CollectionModal = ({
  visible, onClose, unlockedAnimals, bestScore, moves,
}: {
  visible: boolean; onClose: () => void;
  unlockedAnimals: number[]; bestScore: number; moves: number;
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <View style={[styles.modalCard, { maxHeight: '90%', width: '100%' }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Text style={styles.modalTitle}>🏆 Koleksiyon</Text>
          <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 22, color: 'rgba(255,255,255,0.5)' }}>✕</Text></TouchableOpacity>
        </View>

        {/* İstatistikler */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{unlockedAnimals.length}/{ANIMALS.length}</Text>
            <Text style={styles.statLabel}>Hayvan</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: COLORS.gold }]}>{bestScore.toLocaleString()}</Text>
            <Text style={styles.statLabel}>En Yüksek</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{moves}</Text>
            <Text style={styles.statLabel}>Hamle</Text>
          </View>
        </View>

        {/* Hayvan listesi */}
        <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
          {ANIMALS.map((animal) => {
            const unlocked = unlockedAnimals.includes(animal.id);
            return (
              <View key={animal.id} style={[styles.collectionRow, !unlocked && { opacity: 0.35 }]}>
                <Text style={{ fontSize: 36 }}>{unlocked ? animal.emoji : '🔒'}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontWeight: '900', color: '#fff', fontSize: 15 }}>
                      {unlocked ? animal.name : '???'}
                    </Text>
                    {unlocked && (
                      <View style={[styles.rarityBadge, { backgroundColor: rarityColor(animal.rarity) }]}>
                        <Text style={{ fontSize: 8, fontWeight: '800', color: '#fff' }}>{animal.rarity.toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2, lineHeight: 15 }}>
                    {unlocked ? animal.funFact : 'Birleştir ve keşfet!'}
                  </Text>
                </View>
              </View>
            );
          })}
          <View style={{ height: 16 }} />
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const rarityColor = (r: string) => ({
  common: '#6b7280', rare: '#3b82f6', epic: '#8b5cf6', legendary: '#f59e0b',
  mythic: '#f43f5e', cosmic: '#06b6d4',
}[r] ?? '#6b7280');

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const {
    grid, score, bestScore, isGameOver, highestAnimalId, undoStack,
    unlockedAnimals, streak, hasSeenOnboarding, lastClaimedDate, moves,
    swipe, undo, resetGame, clearMergeFlags, claimDailyReward, markOnboardingSeen,
  } = useGameStore();

  const { adFree, setAdFree } = useMonetizationStore();

  const [newAnimalId, setNewAnimalId]       = useState<number | null>(null);
  const [floatingScores, setFloatingScores] = useState<{ id: number; value: number }[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDaily, setShowDaily]           = useState(false);
  const [dailyStreak, setDailyStreak]       = useState(0);
  const [showCollection, setShowCollection] = useState(false);
  const [showShop, setShowShop]             = useState(false);
  const [adLoading, setAdLoading]           = useState(false);
  const [shopLoading, setShopLoading]       = useState(false);

  const clearTimer   = useRef<any>(null);
  const prevGameOver = useRef(false);
  const swipeRef             = useRef(swipe);
  const clearMergeFlagsRef   = useRef(clearMergeFlags);
  swipeRef.current           = swipe;
  clearMergeFlagsRef.current = clearMergeFlags;

  // İlk açılış: SDK başlatma + onboarding / günlük ödül
  useEffect(() => {
    // Monetizasyon SDK'larını başlat (fire-and-forget)
    initAds();
    initPurchases();
    checkAdFreeStatus().then((v) => { if (v) setAdFree(true); });

    // Onboarding / günlük ödül
    const today = new Date().toISOString().split('T')[0];
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    } else if (lastClaimedDate !== today) {
      const result = claimDailyReward();
      setDailyStreak(result.streak);
      setShowDaily(true);
    }
  }, []);

  const handleOnboardingDone = () => {
    markOnboardingSeen();
    setShowOnboarding(false);
    const today = new Date().toISOString().split('T')[0];
    if (lastClaimedDate !== today) {
      const result = claimDailyReward();
      setDailyStreak(result.streak);
      setShowDaily(true);
    }
  };

  const handleSwipe = (dir: Direction) => {
    const { newAnimals, earnedScore } = swipeRef.current(dir);

    if (newAnimals.length > 0)  { playUnlock(); hapticUnlock(); }
    else if (earnedScore > 0)   { playMerge();  hapticMerge();  }
    else                         { playSwipe();  hapticSwipe();  }

    if (earnedScore > 0) {
      const id = Date.now();
      setFloatingScores(p => [...p, { id, value: earnedScore }]);
    }
    if (newAnimals.length > 0) setNewAnimalId(newAnimals[0]);
    clearTimer.current && clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => clearMergeFlagsRef.current(), 350);
  };

  // Reklam izle → direkt undo uygula (orta oyun veya oyun sonu devam)
  const handleWatchAdForUndo = async () => {
    if (adLoading) return;
    setAdLoading(true);
    try {
      const earned = await showRewardedAd();
      if (earned) {
        undo();
        playUnlock();
        hapticUnlock();
      }
    } finally {
      setAdLoading(false);
    }
  };

  // Mağaza: Reklamsız satın al
  const handlePurchaseRemoveAds = async () => {
    if (shopLoading) return;
    setShopLoading(true);
    try {
      const ok = await purchaseRemoveAds();
      if (ok) setAdFree(true);
    } catch (e: any) {
      Alert.alert('Hata', e?.message ?? 'Satın alma başarısız oldu.');
    } finally {
      setShopLoading(false);
    }
  };

  // Mağaza: Önceki satın alımları geri yükle
  const handleRestorePurchases = async () => {
    if (shopLoading) return;
    setShopLoading(true);
    try {
      const ok = await restorePurchases();
      if (ok) { setAdFree(true); }
      else { Alert.alert('Bilgi', 'Geri yüklenecek satın alım bulunamadı.'); }
    } catch {
      Alert.alert('Hata', 'Satın alım geri yüklenemedi.');
    } finally {
      setShopLoading(false);
    }
  };

  useEffect(() => {
    if (isGameOver && !prevGameOver.current) { playGameOver(); hapticGameOver(); }
    prevGameOver.current = isGameOver;
  }, [isGameOver]);

  useEffect(() => {
    const map: Record<string, Direction> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    const handler = (e: KeyboardEvent) => { if (map[e.key]) { e.preventDefault(); handleSwipe(map[e.key]); } };
    window.removeEventListener('keydown', (window as any).__gameKeyHandler);
    (window as any).__gameKeyHandler = handler;
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const newAnimal     = newAnimalId ? getAnimal(newAnimalId) : null;
  const nextAnimal    = getAnimal(Math.min(highestAnimalId + 1, ANIMALS.length));
  const highestAnimal = getAnimal(highestAnimalId);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <SafeAreaView style={{ flex: 1 }}>
        <SwipeHandler onSwipe={handleSwipe}>
          <ScrollView contentContainerStyle={styles.screen} scrollEnabled={false}>

            {/* ─ Başlık ─ */}
            <View style={styles.header}>
              <View>
                <View style={styles.badge}><Text style={styles.badgeText}>✦ SONSUZ MACERA</Text></View>
                <Text style={styles.title}>Hayvan Evrimi</Text>
                <Text style={styles.subtitle}>Tüm hayvanları topla!</Text>
              </View>
              <View style={styles.scores}>
                {streak > 1 && (
                  <View style={styles.streakPill}>
                    <Text style={styles.streakPillText}>🔥 {streak}</Text>
                  </View>
                )}
                <View style={styles.scoreBox}><Text style={styles.scoreLabel}>PUAN</Text><Text style={styles.scoreVal}>{score.toLocaleString()}</Text></View>
                <View style={styles.scoreBox}><Text style={styles.scoreLabel}>REKOR</Text><Text style={[styles.scoreVal, { color: COLORS.gold }]}>{bestScore.toLocaleString()}</Text></View>
              </View>
            </View>

            {/* ─ Hedef bar ─ */}
            <View style={styles.targetBar}>
              <Text style={{ fontSize: 32 }}>{highestAnimalId < ANIMALS.length ? nextAnimal?.emoji : '🌌'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.targetLabel}>HEDEF EVRİM</Text>
                <Text style={styles.targetName}>{highestAnimalId < ANIMALS.length ? `${nextAnimal?.name} için oyna!` : '🌌 MAX — Galaksi Efendisi!'}</Text>
                <View style={styles.track}><View style={[styles.trackFill, { width: `${(highestAnimalId / ANIMALS.length) * 100}%` as any }]} /></View>
              </View>
              <View style={styles.starPill}><Text style={{ color: COLORS.gold, fontWeight: '900', fontSize: 13 }}>⭐ {Math.floor(score / 100)}</Text></View>
            </View>

            {/* ─ Grid + uçan skor ─ */}
            <View style={{ alignSelf: 'center' }}>
              <Grid grid={grid} />
              {floatingScores.map(f => (
                <FloatingScore key={f.id} value={f.value} onDone={() => setFloatingScores(p => p.filter(x => x.id !== f.id))} />
              ))}
            </View>

            {/* ─ Evrim zinciri ─ */}
            <View style={styles.evoSection}>
              <Text style={styles.sectionTitle}>EVRİM ZİNCİRİ</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.evoScroll}>
                  {ANIMALS.map((animal, idx) => {
                    const unlocked  = unlockedAnimals.includes(animal.id);
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

            {/* ─ Butonlar — satır 1 ─ */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnUndo, undoStack.length === 0 && { opacity: 0.35 }]}
                onPress={() => undo()}
                disabled={undoStack.length === 0}
              >
                <Text style={styles.btnUndoText}>↩  Geri Al</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnAd, (adLoading || undoStack.length === 0) && { opacity: 0.4 }]}
                onPress={handleWatchAdForUndo}
                disabled={adLoading || undoStack.length === 0}
              >
                <Text style={styles.btnAdText}>{adLoading ? '⏳ Yükleniyor…' : '📺  Undo Kazan'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnBoost]} onPress={resetGame}>
                <Text style={styles.btnBoostText}>🔄  Yeni</Text>
              </TouchableOpacity>
            </View>

            {/* ─ Butonlar — satır 2 ─ */}
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btn, styles.btnCollection]} onPress={() => setShowCollection(true)}>
                <Text style={styles.btnBoostText}>🏆  Koleksiyon</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnShop]} onPress={() => setShowShop(true)}>
                <Text style={styles.btnShopText}>🛒  Mağaza</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </SwipeHandler>
      </SafeAreaView>

      {/* ─ Modallar ─ */}
      <OnboardingModal visible={showOnboarding} onDone={handleOnboardingDone} />
      <DailyRewardModal visible={showDaily} streak={dailyStreak} onClose={() => setShowDaily(false)} />
      <CollectionModal visible={showCollection} onClose={() => setShowCollection(false)} unlockedAnimals={unlockedAnimals} bestScore={bestScore} moves={moves} />

      <Modal visible={isGameOver} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Oyun Bitti!</Text>
            <Text style={{ fontSize: 64, marginVertical: 8 }}>{highestAnimal?.emoji}</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.accent }}>En yüksek: {highestAnimal?.name}</Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Puan: {score.toLocaleString()}</Text>
            {score > 0 && score >= bestScore && <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.gold }}>🎉 Yeni Rekor!</Text>}

            {/* Devam et — reklam izle */}
            {undoStack.length > 0 && (
              <TouchableOpacity
                style={[styles.btn, styles.btnAd, { width: '100%' }, adLoading && { opacity: 0.5 }]}
                onPress={handleWatchAdForUndo}
                disabled={adLoading}
              >
                <Text style={styles.btnAdText}>{adLoading ? '⏳ Yükleniyor…' : '📺  Devam Et (Reklam İzle)'}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.btn, styles.btnBoost, { width: '100%' }]} onPress={resetGame}>
              <Text style={styles.btnBoostText}>🔄 Tekrar Oyna</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─ Mağaza Modal ─ */}
      <Modal visible={showShop} transparent animationType="fade" onRequestClose={() => setShowShop(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Text style={styles.modalTitle}>🛒 Mağaza</Text>
              <TouchableOpacity onPress={() => setShowShop(false)}>
                <Text style={{ fontSize: 22, color: 'rgba(255,255,255,0.5)' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {adFree ? (
              <View style={styles.adFreeActive}>
                <Text style={{ fontSize: 24 }}>✅</Text>
                <View>
                  <Text style={{ fontWeight: '900', color: '#4ade80', fontSize: 15 }}>Reklamsız Oyna Aktif</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Tüm reklamlar kapalı</Text>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.shopItem}>
                  <Text style={{ fontSize: 36 }}>🚫</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '900', color: '#fff', fontSize: 15 }}>Reklamsız Oyna</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Banner ve reklam videolarını kaldırır</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.btn, styles.btnBoost, { width: '100%' }, shopLoading && { opacity: 0.5 }]}
                  onPress={handlePurchaseRemoveAds}
                  disabled={shopLoading}
                >
                  <Text style={styles.btnBoostText}>{shopLoading ? '⏳ İşleniyor…' : '🛒  Satın Al'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnUndo, { width: '100%' }, shopLoading && { opacity: 0.5 }]}
                  onPress={handleRestorePurchases}
                  disabled={shopLoading}
                >
                  <Text style={styles.btnUndoText}>♻️  Satın Alımları Geri Yükle</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ─ Banner Reklam ─ */}
      <BannerAdView adFree={adFree} />

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

// ─── Styles ──────────────────────────────────────────────────────────────────
const PADDING_CONST = PADDING;
const styles = StyleSheet.create({
  screen:        { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8, gap: 12 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badge:         { backgroundColor: 'rgba(139,92,246,0.2)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 2 },
  badgeText:     { fontSize: 9, fontWeight: '800', color: '#c4b5fd', letterSpacing: 0.8 },
  title:         { fontSize: 26, fontWeight: '900', color: COLORS.gold, letterSpacing: -0.5 },
  subtitle:      { fontSize: 11, color: 'rgba(196,181,253,0.6)', fontWeight: '700' },
  scores:        { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  streakPill:    { backgroundColor: 'rgba(251,100,36,0.18)', borderWidth: 1, borderColor: 'rgba(251,100,36,0.4)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5, alignItems: 'center', justifyContent: 'center' },
  streakPillText:{ fontWeight: '900', color: '#fb6424', fontSize: 13 },
  scoreBox:      { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 72 },
  scoreLabel:    { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: 0.5 },
  scoreVal:      { fontSize: 18, fontWeight: '900', color: '#fff', lineHeight: 22 },
  targetBar:     { backgroundColor: 'rgba(139,92,246,0.12)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)', borderRadius: 20, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  targetLabel:   { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '700', letterSpacing: 0.5 },
  targetName:    { fontSize: 13, fontWeight: '900', color: '#fff' },
  track:         { height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, marginTop: 5, overflow: 'hidden' },
  trackFill:     { height: '100%', backgroundColor: '#8b5cf6', borderRadius: 3 },
  starPill:      { backgroundColor: 'rgba(251,191,36,0.15)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  gridWrap:      { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: PADDING_CONST, alignSelf: 'center' },
  gridInner:     { flexDirection: 'row', flexWrap: 'wrap' },
  cell:          { alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6 },
  emptyCell:     { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.08)' },
  cellName:      { fontWeight: '800', marginTop: 2 },
  floatingScore: { position: 'absolute', alignSelf: 'center', top: '38%', fontSize: 30, fontWeight: '900', color: COLORS.gold, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6, zIndex: 99 },
  evoSection:    { marginBottom: 4 },
  sectionTitle:  { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 8 },
  evoScroll:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  evoNode:       { alignItems: 'center', minWidth: 48 },
  evoBubble:     { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: 4, position: 'relative' },
  evoDone:       { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  evoActive:     { backgroundColor: 'rgba(139,92,246,0.3)', borderWidth: 2, borderColor: '#a78bfa' },
  evoLocked:     { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' },
  checkDot:      { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.bg },
  evoLabel:      { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
  evoLabelOn:    { color: 'rgba(255,255,255,0.7)' },
  evoLabelActive:{ color: '#a78bfa' },
  evoArrow:      { color: 'rgba(255,255,255,0.15)', fontSize: 14, marginBottom: 14 },
  actions:       { flexDirection: 'row', gap: 8 },
  btn:           { flex: 1, padding: 13, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  btnUndo:       { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  btnUndoText:   { color: 'rgba(255,255,255,0.6)', fontWeight: '800', fontSize: 13 },
  btnBoost:      { backgroundColor: '#7c3aed' },
  btnBoostText:  { color: '#fff', fontWeight: '800', fontSize: 13 },
  btnAd:         { backgroundColor: 'rgba(34,197,94,0.18)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.4)' },
  btnAdText:     { color: '#4ade80', fontWeight: '800', fontSize: 12 },
  btnCollection: { backgroundColor: 'rgba(251,191,36,0.15)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)', borderRadius: 18 },
  btnShop:       { backgroundColor: 'rgba(139,92,246,0.15)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)', borderRadius: 18 },
  btnShopText:   { color: '#c4b5fd', fontWeight: '800', fontSize: 13 },
  // Shop modal
  shopItem:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 12, width: '100%' },
  adFreeActive:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(74,222,128,0.1)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)', borderRadius: 16, padding: 14, width: '100%' },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  modalCard:     { backgroundColor: '#1a0035', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)', padding: 24, width: '100%', alignItems: 'center', gap: 8 },
  modalTitle:    { fontSize: 22, fontWeight: '900', color: '#fff' },
  // Onboarding
  onboardVisual: { fontSize: 22, color: COLORS.accent, fontWeight: '900', textAlign: 'center', letterSpacing: 2 },
  onboardBody:   { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 20 },
  dots:          { flexDirection: 'row', gap: 6, marginVertical: 4 },
  dot:           { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive:     { backgroundColor: COLORS.accent, width: 18 },
  // Daily reward
  streakRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(251,100,36,0.15)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8 },
  streakNum:     { fontSize: 28, fontWeight: '900', color: '#fb6424' },
  streakLabel:   { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
  rewardBox:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 12, width: '100%' },
  // Collection
  statsRow:      { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 4 },
  statBox:       { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 10, alignItems: 'center' },
  statVal:       { fontSize: 18, fontWeight: '900', color: '#fff' },
  statLabel:     { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginTop: 2 },
  collectionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rarityBadge:   { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
});
