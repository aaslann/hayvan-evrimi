import { Animal } from '../types/game.types';

export const ANIMALS: Animal[] = [
  {
    id: 1,
    emoji: '🥚',
    name: 'Yumurta',
    rarity: 'common',
    color: { gradient: ['#fef9c3', '#fde047'], glow: 'rgba(253,224,71,0.4)', text: '#92400e' },
    unlockMessage: 'Her şey bir yumurtayla başlar!',
    funFact: 'Tavuk yumurtaları 21 günde çatlar.',
  },
  {
    id: 2,
    emoji: '🐥',
    name: 'Civciv',
    rarity: 'common',
    color: { gradient: ['#bbf7d0', '#4ade80'], glow: 'rgba(74,222,128,0.4)', text: '#14532d' },
    unlockMessage: 'İlk evrim! Civciv doğdu!',
    funFact: 'Civcivler doğar doğmaz yürüyebilir.',
  },
  {
    id: 3,
    emoji: '🐸',
    name: 'Kurbağa',
    rarity: 'common',
    color: { gradient: ['#bfdbfe', '#60a5fa'], glow: 'rgba(96,165,250,0.4)', text: '#1e3a8a' },
    unlockMessage: 'Hop hop! Kurbağan geldi!',
    funFact: 'Kurbağalar derileriyle nefes alır.',
  },
  {
    id: 4,
    emoji: '🦊',
    name: 'Tilki',
    rarity: 'rare',
    color: { gradient: ['#fecaca', '#f87171'], glow: 'rgba(248,113,113,0.4)', text: '#7f1d1d' },
    unlockMessage: 'Tilki gibi kurnaz!',
    funFact: 'Tilkiler 40 farklı ses çıkarabilir.',
  },
  {
    id: 5,
    emoji: '🦁',
    name: 'Aslan',
    rarity: 'rare',
    color: { gradient: ['#e9d5ff', '#a78bfa'], glow: 'rgba(167,139,250,0.5)', text: '#3b0764' },
    unlockMessage: 'Ormanın kralı uyandı!',
    funFact: 'Aslanlar günde 20 saat uyuyabilir.',
  },
  {
    id: 6,
    emoji: '🐯',
    name: 'Kaplan',
    rarity: 'epic',
    color: { gradient: ['#fed7aa', '#fb923c'], glow: 'rgba(251,146,60,0.5)', text: '#7c2d12' },
    unlockMessage: 'Güçlü Kaplan ortaya çıktı!',
    funFact: 'Kaplanlar mükemmel yüzücüdür.',
  },
  {
    id: 7,
    emoji: '🦅',
    name: 'Kartal',
    rarity: 'epic',
    color: { gradient: ['#a7f3d0', '#34d399'], glow: 'rgba(52,211,153,0.5)', text: '#064e3b' },
    unlockMessage: 'Gökyüzünün hâkimi!',
    funFact: 'Kartallar 3 km uzaktan av görebilir.',
  },
  {
    id: 8,
    emoji: '🐉',
    name: 'Ejderha',
    rarity: 'legendary',
    color: { gradient: ['#fef08a', '#facc15'], glow: 'rgba(251,191,36,0.6)', text: '#78350f' },
    unlockMessage: '🔥 Efsanevi Ejderha doğdu!',
    funFact: 'Ejderhalar hayal gücünün en güçlü yaratıklarıdır.',
  },
  {
    id: 9,
    emoji: '🦄',
    name: 'Unicorn',
    rarity: 'legendary',
    color: { gradient: ['#fbcfe8', '#f472b6'], glow: 'rgba(244,114,182,0.7)', text: '#831843' },
    unlockMessage: '✨ İnanılmaz! Unicorn sen misin?!',
    funFact: 'Unicornlar saf kalplerin simgesidir.',
  },
];

export const MAX_ANIMAL_ID = ANIMALS.length;

export const getAnimal = (id: number): Animal | undefined =>
  ANIMALS.find((a) => a.id === id);
