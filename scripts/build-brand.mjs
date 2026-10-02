/**
 * Genera gli asset del brand in public/brand/ e docs/logo-alternative/.
 *
 * - logo.svg, logo-white.svg, logo-mark.svg, favicon.svg: SVG vettoriali
 *   costruiti in codice. La parola "assicurapp" è convertita in path a partire
 *   da Plus Jakarta Sans Bold (scripts/fonts/), così il file non dipende dal font.
 *   L'ultima "p" perde il discendente: al suo posto, sotto la linea di base,
 *   la sua asta diventa uno scudo verde con segno di spunta (il "mark").
 *   La penultima "p" resta intera, così la parola si legge come "pp".
 * - favicon-32.png, apple-touch-icon.png, og-image.png: rasterizzati con Chromium.
 *
 * Uso: `npm run brand:build`
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import { chromium } from 'playwright-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'brand');
const ALT = path.join(ROOT, 'docs', 'logo-alternative');
const FONT = path.join(__dirname, 'fonts', 'PlusJakartaSans-Bold.ttf');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(ALT, { recursive: true });

// Token (identici a src/styles/tokens.css)
const NAVY = '#1E3A8A';
const NAVY_900 = '#0F172A';
const GREEN = '#10B981';
const WHITE = '#FFFFFF';

const font = opentype.parse(fs.readFileSync(FONT).buffer);
const SIZE = 100; // unità logiche
const scale = SIZE / font.unitsPerEm;
const r = (n) => Math.round(n * 100) / 100;

/** Layout manuale glifo per glifo (con kerning), senza feature GSUB. */
function layout(text) {
  let x = 0;
  const glyphs = [];
  let prev = null;
  for (const ch of text) {
    const g = font.charToGlyph(ch);
    if (prev) x += font.getKerningValue(prev, g) * scale;
    glyphs.push({ ch, glyph: g, x });
    x += g.advanceWidth * scale;
    prev = g;
  }
  return { glyphs, width: x };
}

function pathData(glyph, x) {
  return glyph.getPath(x, 0, SIZE).toPathData(2);
}

// ---------------------------------------------------------------------------
// Geometria del wordmark
// ---------------------------------------------------------------------------
const { glyphs, width: wordWidth } = layout('assicurapp');
const [p1, p2] = glyphs.slice(-2);
const pGlyph = p1.glyph;

// Larghezza dell'asta della "p": punti del contorno nella zona del discendente
const pPath = pGlyph.getPath(0, 0, SIZE);
const descPts = [];
for (const c of pPath.commands) {
  if (c.x !== undefined && c.y > 6) descPts.push(c.x);
}
const stemL = Math.min(...descPts);
const stemR = Math.max(...descPts);
const stemW = stemR - stemL;

// Lo scudo prolunga l'asta della seconda "p": centrato sull'asta, largo il doppio,
// profondo poco più del discendente che sostituisce
const cx = p2.x + (stemL + stemR) / 2;
const shieldW = stemW * 2;
const shieldL = cx - shieldW / 2;
const shieldH = shieldW * 0.86;
const shieldTop = -0.1; // appena sopra la linea di base, per saldarsi all'asta

function shieldPath(L, T, W, H) {
  const R = L + W;
  const mid = T + H * 0.42;
  const bottom = T + H;
  const c = W / 2;
  const x = L + c;
  return [
    `M${r(L)} ${r(T)}`,
    `H${r(R)}`,
    `V${r(mid)}`,
    `C${r(R)} ${r(mid + H * 0.3)} ${r(x + c * 0.55)} ${r(bottom - H * 0.12)} ${r(x)} ${r(bottom)}`,
    `C${r(x - c * 0.55)} ${r(bottom - H * 0.12)} ${r(L)} ${r(mid + H * 0.3)} ${r(L)} ${r(mid)}`,
    'Z',
  ].join(' ');
}

function checkPoints(x, T, W, H) {
  const cy = T + H * 0.44;
  const s = W / 2;
  return `${r(x - s * 0.42)},${r(cy)} ${r(x - s * 0.1)},${r(cy + s * 0.32)} ${r(x + s * 0.46)},${r(cy - s * 0.3)}`;
}

const descenderDepth = -pGlyph.getBoundingBox().y1 * scale; // ≈ 20
const ascent = pGlyph.getBoundingBox().y2 * scale; // x-height ≈ 54
const wordTop = -Math.max(...glyphs.map((g) => g.glyph.getBoundingBox().y2 * scale));

// Path di "assicurap" + l'ultima "p" (clippata sopra la linea di base)
const wordPaths = glyphs.slice(0, -1).map((g) => pathData(g.glyph, g.x)).join(' ');
const ppPaths = pathData(p2.glyph, p2.x);

function wordmarkSvg({ wordColor, shieldColor, checkColor, id }) {
  const pad = 8;
  const top = wordTop - pad;
  const bottom = Math.max(shieldTop + shieldH, descenderDepth) + pad;
  const left = -pad;
  const right = wordWidth + pad;
  const w = right - left;
  const h = bottom - top;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r(left)} ${r(top)} ${r(w)} ${r(h)}" width="${r(w * 2)}" height="${r(h * 2)}" role="img" aria-labelledby="${id}-title">
  <title id="${id}-title">assicurapp</title>
  <defs>
    <clipPath id="${id}-clip"><rect x="${r(p2.x - 2)}" y="${r(wordTop - pad)}" width="${r(wordWidth - p2.x + pad)}" height="${r(-(wordTop - pad) + 0.01)}"/></clipPath>
  </defs>
  <path fill="${wordColor}" d="${wordPaths}"/>
  <g clip-path="url(#${id}-clip)"><path fill="${wordColor}" d="${ppPaths}"/></g>
  <path fill="${shieldColor}" d="${shieldPath(shieldL, shieldTop, shieldW, shieldH)}"/>
  <polyline fill="none" stroke="${checkColor}" stroke-width="${r(shieldW * 0.13)}" stroke-linecap="round" stroke-linejoin="round" points="${checkPoints(cx, shieldTop, shieldW, shieldH)}"/>
</svg>
`;
}

function markSvg({ shieldColor, checkColor, bg, size = 64, padding = 0.1 }) {
  // Scudo centrato in un quadrato
  const W = 100;
  const H = W * 0.86;
  const box = Math.max(W, H) * (1 + padding * 2);
  const L = (box - W) / 2;
  const T = (box - H) / 2;
  const x = box / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r(box)} ${r(box)}" width="${size}" height="${size}" role="img" aria-label="Assicurapp">
  ${bg ? `<rect width="${r(box)}" height="${r(box)}" rx="${r(box * 0.22)}" fill="${bg}"/>` : ''}
  <path fill="${shieldColor}" d="${shieldPath(L, T, W, H)}"/>
  <polyline fill="none" stroke="${checkColor}" stroke-width="${r(W * 0.11)}" stroke-linecap="round" stroke-linejoin="round" points="${checkPoints(x, T, W, H)}"/>
</svg>
`;
}

// Variante B (solo documentazione): monogramma "A" a scudo attraversato da una linea di percorso
function altSvg({ shieldColor, lineColor, bg }) {
  const box = 120;
  const W = 100;
  const H = 86;
  const L = 10;
  const T = 12;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}" width="120" height="120" role="img" aria-label="Assicurapp — variante B">
  ${bg ? `<rect width="${box}" height="${box}" rx="26" fill="${bg}"/>` : ''}
  <path fill="${shieldColor}" d="${shieldPath(L, T, W, H)}"/>
  <!-- "A" negativa: due gambe che si aprono verso il basso -->
  <path fill="none" stroke="${lineColor}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" d="M38 76 L60 30 L82 76"/>
  <!-- linea di percorso: entra da sinistra, attraversa la A come traversa, esce a destra con una spunta -->
  <path fill="none" stroke="${lineColor}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" d="M22 60 H56 L64 68 L78 52"/>
</svg>
`;
}

// ---------------------------------------------------------------------------
// Scrittura SVG
// ---------------------------------------------------------------------------
const files = {
  'logo.svg': wordmarkSvg({ wordColor: NAVY, shieldColor: GREEN, checkColor: WHITE, id: 'ap' }),
  'logo-white.svg': wordmarkSvg({ wordColor: WHITE, shieldColor: GREEN, checkColor: NAVY_900, id: 'apw' }),
  'logo-mark.svg': markSvg({ shieldColor: GREEN, checkColor: WHITE, size: 64, padding: 0.02 }),
  'favicon.svg': markSvg({ shieldColor: GREEN, checkColor: WHITE, size: 32, padding: 0.06 }),
};
for (const [name, svg] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, name), svg);
}
fs.writeFileSync(path.join(ALT, 'logo-b-mark.svg'), altSvg({ shieldColor: NAVY, lineColor: GREEN }));
fs.writeFileSync(path.join(ALT, 'logo-b-mark-white.svg'), altSvg({ shieldColor: WHITE, lineColor: GREEN, bg: NAVY_900 }));
fs.writeFileSync(
  path.join(ALT, 'README.md'),
  `# Logo — variante B (non usata nel sito)

Monogramma "A" a forma di scudo attraversato da una linea di percorso che si chiude in una spunta.
Colori: navy \`${NAVY}\`, verde \`${GREEN}\`, bianco. File: \`logo-b-mark.svg\`, \`logo-b-mark-white.svg\`.

Il sito usa la variante principale (wordmark + scudo) in \`public/brand/\`.
`
);

// Metriche utili per i componenti (proporzioni del logo)
const meta = {
  wordmark: { width: r(wordWidth + 16), height: r(Math.max(shieldTop + shieldH, descenderDepth) + 8 - (wordTop - 8)) },
  shield: { left: r(shieldL), width: r(shieldW), height: r(shieldH) },
  stemWidth: r(stemW),
  xHeight: r(ascent),
  descender: r(descenderDepth),
};
fs.writeFileSync(path.join(OUT, 'logo-meta.json'), JSON.stringify(meta, null, 2) + '\n');
console.log('SVG scritti', meta);

// ---------------------------------------------------------------------------
// PNG via Chromium
// ---------------------------------------------------------------------------
const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage();

async function shot({ html, width, height, file, omitBackground = false }) {
  await page.setViewportSize({ width, height });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: file, omitBackground, type: 'png' });
  console.log('PNG', path.relative(ROOT, file));
}

// data URL: da una pagina about:blank Chromium non carica i font file://
const fontUrl = 'data:font/ttf;base64,' + fs.readFileSync(FONT).toString('base64');
const base = `<style>
  @font-face { font-family: 'PJS'; src: url('${fontUrl}') format('truetype'); font-weight: 700; }
  * { margin: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body { display: grid; place-items: center; font-family: 'PJS', sans-serif; }
</style>`;

// favicon-32.png (trasparente)
await shot({
  html: `${base}<body style="background:transparent">${files['favicon.svg'].replace(/width="\d+" height="\d+"/, 'width="32" height="32"')}</body>`,
  width: 32,
  height: 32,
  file: path.join(OUT, 'favicon-32.png'),
  omitBackground: true,
});

// apple-touch-icon.png 180px (sfondo navy, scudo verde)
await shot({
  html: `${base}<body style="background:${NAVY_900}">${markSvg({ shieldColor: GREEN, checkColor: WHITE, size: 180, padding: 0.22 })}</body>`,
  width: 180,
  height: 180,
  file: path.join(OUT, 'apple-touch-icon.png'),
});

// og-image.png 1200×630: sfondo navy, logo bianco, claim sotto
const claim = 'Preventivi, polizze e provvigioni. Un accesso solo.';
const sub = 'La piattaforma web per agenzie e broker assicurativi';
await shot({
  html: `${base}<body style="background:${NAVY_900};color:${WHITE};position:relative;overflow:hidden">
    <div style="position:absolute;inset:0;background-image:linear-gradient(to right, rgba(255,255,255,.06) 1px, transparent 1px),linear-gradient(to bottom, rgba(255,255,255,.06) 1px, transparent 1px);background-size:60px 60px;-webkit-mask-image:radial-gradient(ellipse at 50% 50%, black 20%, transparent 75%)"></div>
    <div style="position:relative;text-align:center;padding:0 80px">
      <div style="display:flex;justify-content:center">${files['logo-white.svg'].replace(/width="[\d.]+" height="[\d.]+"/, 'width="560" height="auto"')}</div>
      <p style="margin-top:56px;font-size:44px;line-height:1.2;font-weight:700;letter-spacing:-0.02em">${claim}</p>
      <p style="margin-top:20px;font-size:26px;color:#94A3B8;font-weight:700">${sub}</p>
    </div>
  </body>`,
  width: 1200,
  height: 630,
  file: path.join(OUT, 'og-image.png'),
});

await browser.close();
