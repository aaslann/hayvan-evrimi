#!/usr/bin/env node
/**
 * Hayvan Evrimi — App icon & splash screen generator
 * Tasarım: 2×2 oyun grid'i, alt-sağ hücre altın yıldızlı (legendary)
 *
 * Kullanım: node scripts/generate-assets.js
 */

const sharp = require('sharp');
const path  = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');

// ── 5-Pointed Star ────────────────────────────────────────────────────────────
// Dış yarıçap R, iç yarıçap R*0.382 ile standart 5 köşeli yıldız
const star5pts = (R) => {
  const r   = R * 0.382;
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const oa = Math.PI * (-0.5 + i * 0.4);
    const ia = oa + Math.PI * 0.2;
    pts.push(
      `${(R * Math.cos(oa)).toFixed(2)},${(R * Math.sin(oa)).toFixed(2)}`,
      `${(r * Math.cos(ia)).toFixed(2)},${(r * Math.sin(ia)).toFixed(2)}`,
    );
  }
  return pts.join(' ');
};

// ── Grid Hücreleri ────────────────────────────────────────────────────────────
// (cx, cy): grid merkezi, s: hücre boyutu, g: hücreler arası boşluk
const gridCells = (cx, cy, s, g) => [
  { x: cx - g / 2 - s, y: cy - g / 2 - s, i: 0 }, // TL - common
  { x: cx + g / 2,     y: cy - g / 2 - s, i: 1 }, // TR - rare
  { x: cx - g / 2 - s, y: cy + g / 2,     i: 2 }, // BL - epic
  { x: cx + g / 2,     y: cy + g / 2,     i: 3 }, // BR - legendary (GOLD)
];

const renderGrid = (cx, cy, s, g) => {
  const cells  = gridCells(cx, cy, s, g);
  const rx     = Math.round(s * 0.16);
  const dotR   = [s * 0.19, s * 0.235, s * 0.235];
  const starR  = s * 0.27;
  const brCx   = (cx + g / 2 + s / 2).toFixed(2);
  const brCy   = (cy + g / 2 + s / 2).toFixed(2);

  return `
    <!-- Gold ambient glow behind BR cell -->
    <circle cx="${brCx}" cy="${brCy}" r="${(s * 1.1).toFixed(2)}" fill="url(#goldGlow)"/>

    ${cells.map(({ x, y, i }) => {
      const ccx    = (x + s / 2).toFixed(2);
      const ccy    = (y + s / 2).toFixed(2);
      const isGold = i === 3;
      const fAlpha = isGold ? 'rgba(251,191,36,0.14)' : `rgba(139,92,246,${(0.17 + i * 0.02).toFixed(2)})`;
      const sColor = isGold ? 'url(#gold)' : `rgba(167,139,250,${(0.28 + i * 0.025).toFixed(2)})`;
      const sWidth = isGold ? 4 : 2.5;

      return `
        <rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${s}" height="${s}"
          rx="${rx}" fill="${fAlpha}" stroke="${sColor}" stroke-width="${sWidth}"
          ${isGold ? 'filter="url(#glow)"' : ''}/>
        ${isGold
          ? `<g transform="translate(${ccx},${ccy})" filter="url(#starGlow)">
               <polygon points="${star5pts(starR)}" fill="url(#gold)"/>
             </g>`
          : `<circle cx="${ccx}" cy="${ccy}" r="${(dotR[i] || s * 0.19).toFixed(2)}"
               fill="rgba(167,139,250,${(0.42 + i * 0.05).toFixed(2)})"/>`
        }`;
    }).join('')}`;
};

// ── Shared SVG Defs ───────────────────────────────────────────────────────────
const DEFS = `<defs>
  <radialGradient id="bg" cx="50%" cy="45%" r="65%">
    <stop offset="0%"   stop-color="#2e0060"/>
    <stop offset="100%" stop-color="#0d0020"/>
  </radialGradient>
  <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%"   stop-color="#fde68a"/>
    <stop offset="60%"  stop-color="#fbbf24"/>
    <stop offset="100%" stop-color="#d97706"/>
  </linearGradient>
  <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
    <stop offset="0%"   stop-color="#fbbf24" stop-opacity="0.28"/>
    <stop offset="100%" stop-color="#fbbf24" stop-opacity="0"/>
  </radialGradient>
  <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>`;

// ── Sparkle Dots ──────────────────────────────────────────────────────────────
const sparkles = (size) => `
  <circle cx="${(size*0.092).toFixed(1)}" cy="${(size*0.092).toFixed(1)}" r="${(size*0.009).toFixed(1)}" fill="#fbbf24" opacity="0.62"/>
  <circle cx="${(size*0.908).toFixed(1)}" cy="${(size*0.079).toFixed(1)}" r="${(size*0.007).toFixed(1)}" fill="#fbbf24" opacity="0.52"/>
  <circle cx="${(size*0.078).toFixed(1)}" cy="${(size*0.920).toFixed(1)}" r="${(size*0.007).toFixed(1)}" fill="#fbbf24" opacity="0.52"/>
  <circle cx="${(size*0.914).toFixed(1)}" cy="${(size*0.914).toFixed(1)}" r="${(size*0.010).toFixed(1)}" fill="#fbbf24" opacity="0.68"/>
  <circle cx="${(size*0.500).toFixed(1)}" cy="${(size*0.051).toFixed(1)}" r="${(size*0.005).toFixed(1)}" fill="rgba(255,255,255,0.28)"/>`;

// ── Icon SVG (app icon & adaptive icon) ──────────────────────────────────────
const makeIconSVG = (size, padding = 0) => {
  const avail = size - 2 * padding;
  const s = avail * 0.265;
  const g = avail * 0.032;
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    ${DEFS}
    <rect width="${size}" height="${size}" fill="url(#bg)"/>
    ${renderGrid(size / 2, size / 2, s, g)}
    ${sparkles(size)}
  </svg>`;
};

// ── Splash SVG ────────────────────────────────────────────────────────────────
const makeSplashSVG = (size) => {
  const s  = size * 0.265 * 0.70;
  const g  = size * 0.032 * 0.70;
  const cx = size / 2;
  const cy = size * 0.40;

  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    ${DEFS}
    <rect width="${size}" height="${size}" fill="url(#bg)"/>
    ${renderGrid(cx, cy, s, g)}
    ${sparkles(size)}
    <text x="${cx}" y="${(size * 0.725).toFixed(1)}"
      text-anchor="middle"
      font-size="${(size * 0.072).toFixed(1)}"
      font-weight="900"
      fill="#fbbf24"
      font-family="Arial Black, Arial, sans-serif"
      letter-spacing="${(size * 0.004).toFixed(1)}">HAYVAN EVRİMİ</text>
    <text x="${cx}" y="${(size * 0.820).toFixed(1)}"
      text-anchor="middle"
      font-size="${(size * 0.040).toFixed(1)}"
      fill="rgba(196,181,253,0.72)"
      font-family="Arial, sans-serif"
      letter-spacing="${(size * 0.003).toFixed(1)}">Evrimi tamamla!</text>
  </svg>`;
};

// ── Favicon SVG ───────────────────────────────────────────────────────────────
const makeFaviconSVG = (size) => {
  const s = size * 0.36;
  const g = size * 0.04;
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    ${DEFS}
    <rect width="${size}" height="${size}" fill="url(#bg)" rx="${(size * 0.15).toFixed(1)}"/>
    ${renderGrid(size / 2, size / 2, s, g)}
  </svg>`;
};

// ── Run ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🎨 Hayvan Evrimi — asset\'lar oluşturuluyor...\n');

  const tasks = [
    { file: 'icon.png',          svg: makeIconSVG(1024, 0),    desc: 'App icon (1024×1024)'          },
    { file: 'adaptive-icon.png', svg: makeIconSVG(1024, 80),   desc: 'Android adaptive (1024×1024)'  },
    { file: 'splash-icon.png',   svg: makeSplashSVG(1024),     desc: 'Splash screen (1024×1024)'     },
    { file: 'favicon.png',       svg: makeFaviconSVG(64),      desc: 'Web favicon (64×64)'           },
  ];

  for (const { file, svg, desc } of tasks) {
    await sharp(Buffer.from(svg)).png().toFile(path.join(ASSETS, file));
    console.log(`  ✓ ${file.padEnd(24)} ${desc}`);
  }

  console.log('\n✅ Tüm asset\'lar assets/ klasörüne kaydedildi.');
}

main().catch((err) => { console.error('❌', err.message); process.exit(1); });
