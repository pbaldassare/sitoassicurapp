/**
 * Screenshot desktop (1280) e mobile (375) di ogni sezione della home,
 * più le pagine /privacy e /grazie. Output in docs/screenshots/.
 *
 * Richiede una build (`npm run build`) e avvia `astro preview` da solo.
 * Uso: `npm run screenshots`  (opzionale: BASE_URL=http://localhost:4321)
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let server;
let base = process.env.BASE_URL;
if (!base) {
  base = 'http://localhost:4321';
  server = spawn('npx', ['astro', 'preview', '--port', '4321', '--host', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 2500));
}

const sections = [
  ['hero', 'section[aria-labelledby="hero-title"]'],
  ['trust', 'section[aria-label="In sintesi"]'],
  ['problema-soluzione', 'section[aria-labelledby="problem-title"]'],
  ['funzionalita', '#funzionalita'],
  ['tariffe', '#tariffe'],
  ['collaborazioni', '#collaborazioni'],
  ['come-si-parte', '#come-si-parte'],
  ['faq', '#faq'],
  ['contatti', '#contatti'],
  ['footer', 'footer'],
];
const viewports = [
  ['desktop', { width: 1280, height: 1600 }],
  ['mobile', { width: 375, height: 1200 }],
];

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
try {
  for (const [vpName, vp] of viewports) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    // Blocca le richieste esterne (font Google): in locale il font è installato nel sistema.
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto(`${base}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    // Apre tutte le FAQ per lo screenshot
    await page.evaluate(() => document.querySelectorAll('#faq details').forEach((d) => (d.open = true)));

    await page.screenshot({ path: path.join(OUT, `home-${vpName}-full.png`), fullPage: true });
    // L'header sticky non deve coprire le sezioni negli screenshot per elemento
    await page.addStyleTag({ content: '.site-header{position:static!important}' });
    for (const [name, sel] of sections) {
      const el = page.locator(sel).first();
      await el.scrollIntoViewIfNeeded();
      await el.screenshot({ path: path.join(OUT, `${name}-${vpName}.png`) });
    }
    // Menu mobile aperto
    if (vpName === 'mobile') {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.click('[data-menu-toggle]');
      await page.screenshot({ path: path.join(OUT, `menu-mobile.png`) });
    }
    for (const p of ['privacy', 'grazie']) {
      await page.goto(`${base}/${p}`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(OUT, `${p}-${vpName}.png`), fullPage: true });
    }
    // Verifica scroll orizzontale
    await page.goto(`${base}/`, { waitUntil: 'networkidle' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    console.log(`${vpName}: overflow orizzontale = ${overflow}px`);
    await ctx.close();
  }
} finally {
  await browser.close();
  server?.kill();
}
console.log('Screenshot in', path.relative(ROOT, OUT));
