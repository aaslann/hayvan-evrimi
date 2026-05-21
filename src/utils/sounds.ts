// Web Audio API ile senkron ses üretimi — native'de expo-av ses dosyaları eklenince burası genişletilir
let _ctx: AudioContext | null = null;

const ctx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  try {
    if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  } catch {
    return null;
  }
};

const tone = (
  freq: number,
  start: number,
  duration: number,
  vol = 0.22,
  type: OscillatorType = 'sine',
) => {
  const c = ctx();
  if (!c) return;
  const osc  = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  osc.connect(gain);
  gain.connect(c.destination);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(vol, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.start(start);
  osc.stop(start + duration);
};

// İki hücre birleşince — C5→E5 hızlı arpej
export const playMerge = () => {
  const c = ctx(); if (!c) return;
  const t = c.currentTime;
  tone(523.25, t,        0.18);
  tone(659.25, t + 0.09, 0.22);
};

// Yeni hayvan kilidi açılınca — C5→E5→G5 fanfar
export const playUnlock = () => {
  const c = ctx(); if (!c) return;
  const t = c.currentTime;
  tone(523.25, t,        0.18);
  tone(659.25, t + 0.10, 0.18);
  tone(783.99, t + 0.20, 0.35, 0.28);
};

// Sadece kaydırma (merge yok) — yumuşak tık
export const playSwipe = () => {
  const c = ctx(); if (!c) return;
  tone(180, c.currentTime, 0.05, 0.07, 'triangle');
};

// Oyun bitti — G4→E4→C4 inen üçlü
export const playGameOver = () => {
  const c = ctx(); if (!c) return;
  const t = c.currentTime;
  tone(392.00, t,        0.35, 0.2);
  tone(329.63, t + 0.18, 0.35, 0.2);
  tone(261.63, t + 0.36, 0.55, 0.2);
};
